import Absence from '../models/modelAbsence.js';
import Student from '../models/modelStudent.js';
import database from '../db/database.js';
import logger from '../utils/logger.js';

export {
  recordAbsence,
  updateAbsence,
  updateAbsenceStatus,
  markAsJustified,
  markAsUnjustified,
  removeAbsence,
  getHistory,
  getStudentHistory,
  ensureAbsenceSchema
};

const STATUS = {
  JUSTIFIEE: 'justifiée',
  NON_JUSTIFIEE: 'non justifiée'
};

function normalizeStatus(status) {
  if (!status) return STATUS.NON_JUSTIFIEE;
  return String(status).toLowerCase() === STATUS.JUSTIFIEE
    ? STATUS.JUSTIFIEE
    : STATUS.NON_JUSTIFIEE;
}

async function ensureAbsenceSchema() {
  try {
    const { rows } = await database.execute(`PRAGMA table_info(absences)`);
    const hasSubject = (rows || []).some((c) => c.name === 'subject_id');
    if (!hasSubject) {
      await database.execute(`ALTER TABLE absences ADD COLUMN subject_id INTEGER`);
      logger.info('[Absence] Colonne subject_id ajoutée à la table absences');
    }
  } catch (err) {
    try {
      await database.execute(`ALTER TABLE absences ADD COLUMN subject_id INTEGER`);
      logger.info('[Absence] Colonne subject_id ajoutée (fallback)');
    } catch (e) {
      if (!String(e.message || '').toLowerCase().includes('duplicate')) {
        logger.warn(`[Absence] ensureAbsenceSchema: ${e.message}`);
      }
    }
  }
}

function mapAbsenceRow(a) {
  const studentName = a.student_prenom || a.student_nom
    ? `${a.student_prenom || ''} ${a.student_nom || ''}`.trim()
    : a.student_name || 'Inconnu';
  return {
    id: a.id,
    student_id: a.student_id,
    date: a.date,
    status: a.status,
    subject_id: a.subject_id ?? null,
    student_name: studentName,
    student_matricule: a.student_matricule || null,
    classe_id: a.classe_id ?? null,
    classe: a.classe_nom || a.classe || '-',
    matiere: a.matiere_nom || a.matiere || '-'
  };
}

async function recordAbsence(student_id, date, status = STATUS.NON_JUSTIFIEE, subject_id = null) {
  await ensureAbsenceSchema();
  const normalizedStatus = normalizeStatus(status);
  const sid = subject_id != null && subject_id !== '' ? Number(subject_id) : null;
  try {
    const result = await Absence.create(student_id, date, normalizedStatus, sid);
    logger.info(
      `Absence enregistrée: ID=${result.lastInsertRowid}, Étudiant=${student_id}, Date=${date}, Statut=${normalizedStatus}, Matière=${sid}`
    );
    return result.lastInsertRowid;
  } catch (err) {
    logger.warn(`[Absence] create avec subject_id échoué: ${err.message}`);
    const result = await database.execute({
      sql: 'INSERT INTO absences (student_id, date, status) VALUES (?, ?, ?)',
      args: [student_id, date, normalizedStatus]
    });
    const id = Number(result.lastInsertRowid);
    if (sid != null) {
      try {
        await database.execute({
          sql: 'UPDATE absences SET subject_id = ? WHERE id = ?',
          args: [sid, id]
        });
      } catch (_) {}
    }
    return id;
  }
}

async function updateAbsence(id, { student_id, date, status, subject_id }) {
  await ensureAbsenceSchema();
  const existing = await Absence.getById(id);
  if (!existing) return false;

  const newStudentId = student_id != null && student_id !== '' ? Number(student_id) : existing.student_id;
  const newDate = date != null && date !== '' ? date : existing.date;
  const newStatus = status != null && status !== '' ? normalizeStatus(status) : existing.status;
  const newSubjectId =
    subject_id === null || subject_id === ''
      ? null
      : subject_id !== undefined
        ? Number(subject_id)
        : existing.subject_id ?? null;

  const result = await Absence.update(id, newStudentId, newDate, newStatus, newSubjectId);
  if (result.changes > 0) {
    logger.info(`Absence modifiée: ID=${id}, student=${newStudentId}, date=${newDate}, status=${newStatus}, subject=${newSubjectId}`);
  }
  return result.changes > 0;
}

async function updateAbsenceStatus(id, status) {
  const normalizedStatus = normalizeStatus(status);
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
  await ensureAbsenceSchema();
  const absences = await Absence.getAll();
  const mapped = absences.map(mapAbsenceRow);
  logger.info(`Historique des absences consulté (${mapped.length} absences)`);
  return mapped;
}

async function getStudentHistory(student_id) {
  await ensureAbsenceSchema();
  const absences = await Absence.getByStudent(student_id);
  return absences.map(mapAbsenceRow);
}