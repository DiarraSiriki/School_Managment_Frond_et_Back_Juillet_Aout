import {
  addStudent,
  updateStudent,
  removeStudent,
  searchStudent,
  listStudents,
  findStudentByMatricule,
  getStudentById,
  getStudentByUserId
} from '../services/studentService.js';

import logger from '../utils/logger.js';

const getEtudiants = async (req, res) => {
  try {
    const students = await listStudents();
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    logger.error(`[Student Controller] Erreur lecture: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEtudiantParId = async (req, res) => {
  try {
    const id = req.params.id;
    const student = await getStudentById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: `Étudiant ID ${id} introuvable.` });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEtudiantParMatricule = async (req, res) => {
  try {
    const matricule = req.params.matricule;
    const student = await findStudentByMatricule(matricule);
    if (!student) {
      return res.status(404).json({ success: false, message: `Matricule ${matricule} introuvable.` });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonProfilEtudiant = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await getStudentByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Profil introuvable.' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const chercherEtudiant = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    const results = await searchStudent(keyword);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ajouterEtudiant = async (req, res) => {
  try {
    const { matricule, nom, prenom, age, classe_id, classe, email, mot_passe } = req.body;

    const studentData = await addStudent(matricule, nom, prenom, age, classe_id, email, mot_passe, classe);

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      data: {
        id: studentData.id,
        matricule: studentData.matricule
      }
    });
  } catch (error) {
    logger.error(`[Student Controller] Erreur création: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
};

const modifierEtudiant = async (req, res) => {
  try {
    const id = req.params.id;
    const { matricule, nom, prenom, age, classe_id, classe, user_id } = req.body;

    const updated = await updateStudent(id, matricule, nom, prenom, age, classe_id, user_id, classe);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Étudiant ID ${id} introuvable.` });
    }
    res.status(200).json({ success: true, message: 'Étudiant mis à jour avec succès' });
  } catch (error) {
    logger.error(`[Student Controller] Erreur modification ID=${req.params.id}: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
};

const supprimerEtudiant = async (req, res) => {
  try {
    const id = req.params.id;
    const removed = await removeStudent(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: `Étudiant ID ${id} introuvable.` });
    }
    res.status(200).json({ success: true, message: 'Étudiant supprimé avec succès' });
  } catch (error) {
    logger.error(`[Student Controller] Erreur suppression ID=${req.params.id}: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
};

export {
  getEtudiants,
  getEtudiantParId,
  getEtudiantParMatricule,
  getMonProfilEtudiant,
  chercherEtudiant,
  ajouterEtudiant,
  modifierEtudiant,
  supprimerEtudiant
};
