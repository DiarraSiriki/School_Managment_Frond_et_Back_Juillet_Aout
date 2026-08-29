import Teacher from '../models/modelTeacher.js';
import User from '../models/modelUsers.js';
import database from '../db/database.js';
import logger from '../utils/logger.js';
import { addUser } from './userService.js';

export {
  addTeacher,
  updateTeacher,
  removeTeacher,
  searchTeacher,
  listTeachers,
  getTeacherById,
  getTeacherByUserId
};

async function addTeacher(nom, matiere, classe_id = null, email, password) {
  const userResult = await addUser(nom, 'teacher', email, password, { matiere });
  const userId = userResult?.id ?? userResult;

  const teacher = await Teacher.getByUserId(userId);
  const teacherId = teacher ? teacher.id : null;

  if (!teacherId) {
    logger.error(`Erreur: Fiche professeur non trouvée après création pour user_id=${userId}`);
    throw new Error('Erreur lors de la création de la fiche professeur');
  }

  if (classe_id) {
    await Teacher.update(teacherId, nom, matiere, classe_id, userId);
  }

  logger.info(`Professeur ajouté: ID=${teacherId}, Nom=${nom}, UserID=${userId}, ClasseID=${classe_id}`);
  return teacherId;
}

async function updateTeacher(id, nom, matiere, classe_id = null, email = null, password = null) {
  const teacher = await Teacher.getById(id);
  if (!teacher) {
    logger.error(`Professeur introuvable: ID=${id}`);
    return false;
  }

  let tableTeachersModifiee = false;
  let tableUsersModifiee = false;

  const resultTeacher = await Teacher.update(id, nom, matiere, classe_id, teacher.user_id);
  if (resultTeacher && resultTeacher.changes > 0) {
    tableTeachersModifiee = true;
  }

  if (teacher.user_id) {
    const updates = [];
    const values = [];

    if (nom) {
      updates.push('name = ?');
      values.push(nom);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('mot_passe = ?');
      values.push(password);
    }

    if (updates.length > 0) {
      values.push(teacher.user_id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      const resultUser = await database.execute({ sql: query, args: values });
      if (resultUser && resultUser.rowsAffected > 0) {
        tableUsersModifiee = true;
      }
    }
  }

  const modificationEffectuee = tableTeachersModifiee || tableUsersModifiee;

  if (modificationEffectuee) {
    logger.info(`Professeur modifié avec succès: ID=${id}`);
    return true;
  } else {
    logger.info(`Mise à jour demandée pour l'ID=${id} mais aucune donnée n'a changé.`);
    return true;
  }
}

async function removeTeacher(id) {
  const result = await Teacher.delete(id);
  if (result.changes > 0) {
    logger.info(`Professeur supprimé: ID=${id}`);
  }
  return result.changes > 0;
}

async function searchTeacher(keyword) {
  return Teacher.search(keyword);
}

async function listTeachers() {
  return Teacher.getAll();
}

async function getTeacherById(id) {
  return Teacher.getById(id);
}

async function getTeacherByUserId(user_id) {
  return Teacher.getByUserId(user_id);
}
