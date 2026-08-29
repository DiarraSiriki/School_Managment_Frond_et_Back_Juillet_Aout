import User from '../models/modelUsers.js';
import Student from '../models/modelStudent.js';
import Teacher from '../models/modelTeacher.js';
import Classe from '../models/modelClass.js';
import { resolveClasseId } from './classeService.js';
import logger from '../utils/logger.js';

export {
  addUser,
  authenticate,
  removeUser,
  listUsers,
  getUserById,
  updateUser
};

/**
 * Découpe un nom complet en (prenom, nom).
 */
function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: '', nom: '' };
  if (parts.length === 1) return { prenom: '', nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

async function addUser(name, role, email, mot_passe, extra = {}) {
  const emailToSave = (email || '').toLowerCase().trim();
  const passwordToSave = mot_passe;

  if (!passwordToSave) {
    logger.error(`Tentative d'ajout de l'utilisateur ${name} sans mot de passe.`);
    throw new Error('Le mot de passe ne peut pas être vide.');
  }

  if (!name || !role || !emailToSave) {
    throw new Error('name, role et email sont requis.');
  }

  const allowedRoles = ['admin', 'teacher', 'student'];
  if (!allowedRoles.includes(role)) {
    throw new Error(`Rôle invalide. Valeurs autorisées : ${allowedRoles.join(', ')}`);
  }

  const existingUser = await User.getByEmail(emailToSave);
  if (existingUser) {
    logger.error(`Email déjà utilisé : ${emailToSave}`);
    throw new Error('Cet email est déjà utilisé.');
  }

  if (role === 'teacher') {
    if (!extra.matiere || !String(extra.matiere).trim()) {
      throw new Error('La matière est obligatoire pour un professeur.');
    }
  }

  if (role === 'student') {
    if (!extra.matricule || !String(extra.matricule).trim()) {
      throw new Error('Le matricule est obligatoire pour un étudiant.');
    }
    const resolvedId = await resolveClasseId({
      classe_id: extra.classe_id,
      classe: extra.classe || extra.nom_classe
    });
    extra.classe_id = resolvedId;
    const existingMat = await Student.getByMatricule(String(extra.matricule).trim());
    if (existingMat) {
      throw new Error(`Le matricule '${String(extra.matricule).trim()}' appartient déjà à un étudiant.`);
    }
  }

  const result = await User.create(name, role, emailToSave, passwordToSave);
  const userId = result.id;

  logger.info(`Utilisateur ajouté: ID=${userId}, Nom=${name}, Rôle=${role}`);

  try {
    if (role === 'teacher') {
      const matiere = String(extra.matiere).trim();
      const classe_id = extra.classe_id || null;
      await Teacher.create(name, matiere, classe_id, userId);
      logger.info(`Fiche professeur créée pour user_id=${userId}, matière=${matiere}, classe_id=${classe_id}`);
    } else if (role === 'student') {
      const split = splitFullName(name);
      const prenom = (extra.prenom && String(extra.prenom).trim()) || split.prenom;
      const nom = (extra.nom && String(extra.nom).trim()) || split.nom || name;
      const matricule = String(extra.matricule).trim();
      const age = extra.age != null && extra.age !== '' ? Number(extra.age) : 18;
      await Student.create(matricule, nom, prenom, age, extra.classe_id, userId);
      logger.info(`Fiche étudiant créée pour user_id=${userId}, matricule=${matricule}`);
    }
  } catch (err) {
    logger.error(`Échec création fiche liée pour user ${userId}: ${err.message}`);
    try { await User.delete(userId); } catch (_) {}
    throw err;
  }

  return { id: userId };
}

async function getUserById(id) {
  return User.getById(id);
}

async function authenticate(email, mot_passe) {
  const emailToVerify = (email || '').toLowerCase().trim();
  if (!emailToVerify || !mot_passe) return null;

  const user = await User.getByEmail(emailToVerify);
  if (!user || !user.mot_passe) return null;

  return mot_passe === user.mot_passe ? user : null;
}

async function removeUser(id) {
  // Gérer les IDs orphelins (student-123, teacher-456)
  if (typeof id === 'string' && id.includes('-')) {
    const [type, realId] = id.split('-');
    const numericId = Number(realId);

    if (type === 'student') {
      const result = await Student.delete(numericId);
      if (result.changes > 0) {
        logger.info(`Étudiant orphelin supprimé: ID=${numericId}`);
        return true;
      }
      return false;
    } else if (type === 'teacher') {
      const result = await Teacher.delete(numericId);
      if (result.changes > 0) {
        logger.info(`Professeur orphelin supprimé: ID=${numericId}`);
        return true;
      }
      return false;
    }
  }

  // Suppression normale pour les utilisateurs avec user_id valide
  try {
    const teacher = await Teacher.getByUserId(id);
    if (teacher) await Teacher.delete(teacher.id);
  } catch (e) {
    logger.warn(`Suppression teacher liée user ${id}: ${e.message}`);
  }
  try {
    const student = await Student.getByUserId(id);
    if (student) await Student.delete(student.id);
  } catch (e) {
    logger.warn(`Suppression student liée user ${id}: ${e.message}`);
  }

  const result = await User.delete(id);
  if (result.changes > 0) {
    logger.info(`Utilisateur supprimé: ID=${id}`);
    return true;
  }
  return false;
}

async function listUsers() {
  const users = await User.getAll();

  const usersWithDetails = await Promise.all(users.map(async user => {
    let details = {};

    if (user.role === 'student') {
      const student = await Student.getByUserId(user.id);
      if (student) {
        details = {
          matricule: student.matricule,
          nom: student.nom,
          prenom: student.prenom,
          age: student.age,
          classe_id: student.classe_id
        };
      }
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.getByUserId(user.id);
      if (teacher) {
        details = {
          nom: teacher.nom,
          matiere: teacher.matiere,
          classe_id: teacher.classe_id
        };
      }
    }

    return {
      ...user,
      ...details
    };
  }));

  const linkedStudentUserIds = new Set(
    users.filter(u => u.role === 'student').map(u => u.id)
  );
  const linkedTeacherUserIds = new Set(
    users.filter(u => u.role === 'teacher').map(u => u.id)
  );

  const allStudents = await Student.getAll();
  const orphanStudents = allStudents
    .filter(s => !s.user_id || !linkedStudentUserIds.has(s.user_id))
    .map(s => ({
      id: `student-${s.id}`,
      name: `${s.prenom || ''} ${s.nom || ''}`.trim() || s.nom,
      role: 'student',
      email: null,
      matricule: s.matricule,
      nom: s.nom,
      prenom: s.prenom,
      age: s.age,
      classe_id: s.classe_id,
      _orphan: true
    }));

  const allTeachers = await Teacher.getAll();
  const orphanTeachers = allTeachers
    .filter(t => !t.user_id || !linkedTeacherUserIds.has(t.user_id))
    .map(t => ({
      id: `teacher-${t.id}`,
      name: t.nom,
      role: 'teacher',
      email: null,
      nom: t.nom,
      matiere: t.matiere,
      classe_id: t.classe_id,
      _orphan: true
    }));

  const all = [...usersWithDetails, ...orphanStudents, ...orphanTeachers];
  logger.info(`Liste des utilisateurs consultée (${all.length} entrées)`);
  return all;
}

async function updateUser(id, name, role, email, mot_passe, extra = {}) {
  const currentUser = await User.getById(id);
  if (!currentUser) return false;

  let passwordToSave = mot_passe;
  if (!passwordToSave) {
    const fullUser = await User.getByEmail(currentUser.email);
    passwordToSave = fullUser?.mot_passe;
  }

  const emailToSave = email ? email.toLowerCase().trim() : currentUser.email;
  const nameToSave = name || currentUser.name;
  const roleToSave = role || currentUser.role;

  const result = await User.update(id, nameToSave, roleToSave, emailToSave, passwordToSave);

  try {
    if (roleToSave === 'teacher') {
      let teacher = await Teacher.getByUserId(id);
      const matiere = (extra.matiere != null && String(extra.matiere).trim())
        ? String(extra.matiere).trim()
        : (teacher ? teacher.matiere : 'Non spécifiée');
      const classe_id = extra.classe_id != null ? extra.classe_id : (teacher ? teacher.classe_id : null);

      if (teacher) {
        await Teacher.update(teacher.id, nameToSave, matiere, classe_id, id);
      } else {
        await Teacher.create(nameToSave, matiere, classe_id, id);
      }
    } else if (roleToSave === 'student') {
      let student = await Student.getByUserId(id);
      const { prenom, nom } = splitFullName(nameToSave);

      if (student) {
        const matricule = (extra.matricule && String(extra.matricule).trim())
          ? String(extra.matricule).trim()
          : student.matricule;
        let classe_id = student.classe_id;
        if ((extra.classe && String(extra.classe).trim()) || (extra.classe_id != null && extra.classe_id !== '')) {
          classe_id = await resolveClasseId({
            classe_id: extra.classe_id,
            classe: extra.classe || extra.nom_classe
          });
        }
        const age = (extra.age != null && extra.age !== '')
          ? Number(extra.age)
          : student.age;

        await Student.update(student.id, matricule, nom || nameToSave, prenom, age, classe_id, id);
      } else {
        if (!extra.matricule) {
          logger.warn(`Impossible de créer la fiche étudiant pour user ${id}: matricule manquant`);
        } else {
          try {
            const resolvedId = await resolveClasseId({
              classe_id: extra.classe_id,
              classe: extra.classe || extra.nom_classe
            });
            const age = extra.age != null && extra.age !== '' ? Number(extra.age) : 18;
            await Student.create(String(extra.matricule).trim(), nom || nameToSave, prenom, age, resolvedId, id);
          } catch (e) {
            logger.warn(`Impossible de créer la fiche étudiant pour user ${id}: ${e.message}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`Erreur mise à jour fiche liée user ${id}: ${err.message}`);
  }

  if (result.changes > 0) {
    logger.info(`Utilisateur modifié: ID=${id}, Nom=${nameToSave}, Rôle=${roleToSave}`);
    return true;
  }
  return true;
}
