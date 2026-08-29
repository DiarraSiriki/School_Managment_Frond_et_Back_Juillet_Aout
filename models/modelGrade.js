import database from '../db/database.js';

class Grade {
  static async create(student_id, subject_id, note) {
    const result = await database.execute({
      sql: 'INSERT INTO grades (student_id, subject_id, note) VALUES (?, ?, ?)',
      args: [student_id, subject_id, note]
    });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM grades');
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM grades WHERE id = ?', args: [id] });
    return rows[0];
  }

  static async getByStudent(student_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM grades WHERE student_id = ?', args: [student_id] });
    return rows;
  }

  static async update(id, note) {
    const result = await database.execute({ sql: 'UPDATE grades SET note = ? WHERE id = ?', args: [note, id] });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({ sql: 'DELETE FROM grades WHERE id = ?', args: [id] });
    return { changes: result.rowsAffected };
  }

  static async getAverageByStudent(student_id) {
    const { rows } = await database.execute({ sql: 'SELECT AVG(note) as average FROM grades WHERE student_id = ?', args: [student_id] });
    const result = rows[0];
    return result && result.average !== null ? result.average : null;
  }
}

export default Grade;
