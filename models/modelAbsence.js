import database from '../db/database.js';

class Absence {
  static async create(student_id, date, status, subject_id = null) {
    const result = await database.execute({
      sql: 'INSERT INTO absences (student_id, date, status, subject_id) VALUES (?, ?, ?, ?)',
      args: [student_id, date, status, subject_id]
    });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  static async getAll() {
    const { rows } = await database.execute(`
      SELECT a.*,
             s.nom AS student_nom,
             s.prenom AS student_prenom,
             s.matricule AS student_matricule,
             s.classe_id,
             c.nom AS classe_nom,
             sub.nom AS matiere_nom
      FROM absences a
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN classes c ON c.id = s.classe_id
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      ORDER BY a.date DESC, a.id DESC
    `);
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({
      sql: `
        SELECT a.*,
               s.nom AS student_nom,
               s.prenom AS student_prenom,
               s.matricule AS student_matricule,
               s.classe_id,
               c.nom AS classe_nom,
               sub.nom AS matiere_nom
        FROM absences a
        LEFT JOIN students s ON s.id = a.student_id
        LEFT JOIN classes c ON c.id = s.classe_id
        LEFT JOIN subjects sub ON sub.id = a.subject_id
        WHERE a.id = ?
      `,
      args: [id]
    });
    return rows[0];
  }

  static async getByStudent(student_id) {
    const { rows } = await database.execute({
      sql: `
        SELECT a.*,
               s.nom AS student_nom,
               s.prenom AS student_prenom,
               s.matricule AS student_matricule,
               s.classe_id,
               c.nom AS classe_nom,
               sub.nom AS matiere_nom
        FROM absences a
        LEFT JOIN students s ON s.id = a.student_id
        LEFT JOIN classes c ON c.id = s.classe_id
        LEFT JOIN subjects sub ON sub.id = a.subject_id
        WHERE a.student_id = ?
        ORDER BY a.date DESC
      `,
      args: [student_id]
    });
    return rows;
  }

  static async update(id, student_id, date, status, subject_id = null) {
    const result = await database.execute({
      sql: `UPDATE absences
            SET student_id = ?, date = ?, status = ?, subject_id = ?
            WHERE id = ?`,
      args: [student_id, date, status, subject_id, id]
    });
    return { changes: result.rowsAffected };
  }

  static async updateStatus(id, status) {
    const result = await database.execute({
      sql: 'UPDATE absences SET status = ? WHERE id = ?',
      args: [status, id]
    });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({
      sql: 'DELETE FROM absences WHERE id = ?',
      args: [id]
    });
    return { changes: result.rowsAffected };
  }
}

export default Absence;