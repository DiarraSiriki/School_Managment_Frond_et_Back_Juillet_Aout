import Subjects from '../models/modelSubjects.js';
import logger from '../utils/logger.js';

export {
  addSubject,
  updateSubject,
  removeSubject,
  searchSubject,
  getSubjectById,
  listSubjects
};

async function addSubject(nom, classe_id, teacher_id = null) {
  const result = await Subjects.create(nom, classe_id, teacher_id);
  logger.info(`Matière ajoutée: ID=${result.lastInsertRowid}, Nom=${nom}, Classe ID=${classe_id}, Professeur ID=${teacher_id}`);
  return result.lastInsertRowid;
}

async function updateSubject(id, nom, classe_id, teacher_id = null) {
  const result = await Subjects.update(id, nom, classe_id, teacher_id);
  if (result.changes > 0) {
    logger.info(`Matière modifiée: ID=${id}, Nom=${nom}, Classe ID=${classe_id}, Professeur ID=${teacher_id}`);
  }
  return result.changes > 0;
}

async function removeSubject(id) {
  const result = await Subjects.delete(id);
  if (result.changes > 0) {
    logger.info(`Matière supprimée: ID=${id}`);
  }
  return result.changes > 0;
}

async function searchSubject(keyword) {
  const results = await Subjects.search(keyword);
  logger.info(`Recherche de matière: Mot-clé='${keyword}' (${results.length} résultats)`);
  return results;
}

async function getSubjectById(id) {
  const subject = await Subjects.getById(id);
  if (subject) {
    logger.info(`Matière trouvée par ID: ${id}`);
  }
  return subject;
}

async function listSubjects() {
  const subjects = await Subjects.getAll();
  logger.info(`Liste des matières consultée (${subjects.length} matières)`);
  return subjects;
}
