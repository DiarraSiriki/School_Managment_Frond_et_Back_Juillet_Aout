import database from '../db/database.js';

class Subjects {
  static async create(nom, classe_id, teacher_id = null) {
    const result = await database.execute({
      sql: `INSERT INTO subjects (nom, classe_id, teacher_id) VALUES (?, ?, ?)`,
      args: [nom, classe_id, teacher_id]
    });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM subjects');
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM subjects WHERE id = ?', args: [id] });
    return rows[0];
  }

  static async getByTeacher(teacher_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM subjects WHERE teacher_id = ?', args: [teacher_id] });
    return rows;
  }

  static async getByClasse(classe_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM subjects WHERE classe_id = ?', args: [classe_id] });
    return rows;
  }

  static async search(keyword) {
    const k = `%${keyword}%`;
    const { rows } = await database.execute({ sql: 'SELECT * FROM subjects WHERE nom LIKE ?', args: [k] });
    return rows;
  }

  static async update(id, nom, classe_id, teacher_id = null) {
    const result = await database.execute({
      sql: `UPDATE subjects SET nom = ?, classe_id = ?, teacher_id = ? WHERE id = ?`,
      args: [nom, classe_id, teacher_id, id]
    });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({ sql: 'DELETE FROM subjects WHERE id = ?', args: [id] });
    return { changes: result.rowsAffected };
  }
}

export default Subjects;
