import database from '../db/database.js';

class Absence {
  static async create(student_id, date, status) {
    const result = await database.execute({
      sql: 'INSERT INTO absences (student_id, date, status) VALUES (?, ?, ?)',
      args: [student_id, date, status]
    });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM absences');
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM absences WHERE id = ?', args: [id] });
    return rows[0];
  }

  static async getByStudent(student_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM absences WHERE student_id = ?', args: [student_id] });
    return rows;
  }

  static async updateStatus(id, status) {
    const result = await database.execute({ sql: 'UPDATE absences SET status = ? WHERE id = ?', args: [status, id] });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({ sql: 'DELETE FROM absences WHERE id = ?', args: [id] });
    return { changes: result.rowsAffected };
  }
}

export default Absence;
