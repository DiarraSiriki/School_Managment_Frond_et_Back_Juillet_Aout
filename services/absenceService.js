import Absence from '../models/modelAbsence.js';
import Student from '../models/modelStudent.js';
import logger from '../utils/logger.js';

export {
  recordAbsence,
  updateAbsenceStatus,
  markAsJustified,
  markAsUnjustified,
  removeAbsence,
  getHistory,
  getStudentHistory
};

const STATUS = {
  JUSTIFIEE: 'justifiée',
  NON_JUSTIFIEE: 'non justifiée'
};

async function recordAbsence(student_id, date, status = STATUS.NON_JUSTIFIEE) {
  const normalizedStatus =
    status.toLowerCase() === STATUS.JUSTIFIEE
      ? STATUS.JUSTIFIEE
      : STATUS.NON_JUSTIFIEE;
  const result = await Absence.create(student_id, date, normalizedStatus);
  logger.info(`Absence enregistrée: ID=${result.lastInsertRowid}, Étudiant ID=${student_id}, Date=${date}, Statut=${normalizedStatus}`);
  return result.lastInsertRowid;
}

async function updateAbsenceStatus(id, status) {
  const normalizedStatus =
    status.toLowerCase() === STATUS.JUSTIFIEE
      ? STATUS.JUSTIFIEE
      : STATUS.NON_JUSTIFIEE;
  const result = await Absence.updateStatus(id, normalizedStatus);
  if (result.changes > 0) {
    logger.info(`Statut d'absence modifié: ID=${id}, Nouveau statut=${normalizedStatus}`);
  }
  return result.changes > 0;
}

async function markAsJustified(id) {
  return updateAbsenceStatus(id, STATUS.JUSTIFIEE);
}

async function markAsUnjustified(id) {
  return updateAbsenceStatus(id, STATUS.NON_JUSTIFIEE);
}

async function removeAbsence(id) {
  const result = await Absence.delete(id);
  if (result.changes > 0) {
    logger.info(`Absence supprimée: ID=${id}`);
  }
  return result.changes > 0;
}

async function getHistory() {
  const absences = await Absence.getAll();
  const absencesWithStudentInfo = await Promise.all(absences.map(async absence => {
    const student = await Student.getById(absence.student_id);
    return {
      ...absence,
      student_name: student ? `${student.prenom} ${student.nom}` : 'Inconnu',
      student_matricule: student ? student.matricule : null,
      classe_id: student ? student.classe_id : null
    };
  }));
  logger.info(`Historique des absences consulté (${absencesWithStudentInfo.length} absences)`);
  return absencesWithStudentInfo;
}

async function getStudentHistory(student_id) {
  const absences = await Absence.getByStudent(student_id);
  const student = await Student.getById(student_id);
  const absencesWithStudentInfo = absences.map(absence => ({
    ...absence,
    student_name: student ? `${student.prenom} ${student.nom}` : 'Inconnu',
    student_matricule: student ? student.matricule : null,
    classe_id: student ? student.classe_id : null
  }));
  logger.info(`Historique des absences consulté pour l'étudiant ID=${student_id} (${absencesWithStudentInfo.length} absences)`);
  return absencesWithStudentInfo;
}
