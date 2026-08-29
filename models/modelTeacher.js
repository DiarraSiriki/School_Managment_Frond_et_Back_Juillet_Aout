import database from '../db/database.js';

class Teacher {
  static async create(nom, matiere, classe_id = null, user_id = null) {
    const result = await database.execute({
      sql: `INSERT INTO teachers (nom, matiere, classe_id, user_id) VALUES (?, ?, ?, ?)`,
      args: [nom, matiere, classe_id, user_id]
    });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM teachers');
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM teachers WHERE id = ?', args: [id] });
    return rows[0];
  }

  static async getByUserId(user_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM teachers WHERE user_id = ?', args: [user_id] });
    return rows[0];
  }

  static async search(keyword) {
    const k = `%${keyword}%`;
    const { rows } = await database.execute({
      sql: `SELECT * FROM teachers WHERE nom LIKE ? OR matiere LIKE ?`,
      args: [k, k]
    });
    return rows;
  }

  static async update(id, nom, matiere, classe_id = null, user_id = null) {
    const result = await database.execute({
      sql: `UPDATE teachers SET nom = ?, matiere = ?, classe_id = ?, user_id = ? WHERE id = ?`,
      args: [nom, matiere, classe_id, user_id, id]
    });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({ sql: 'DELETE FROM teachers WHERE id = ?', args: [id] });
    return { changes: result.rowsAffected };
  }
}

export default Teacher;
