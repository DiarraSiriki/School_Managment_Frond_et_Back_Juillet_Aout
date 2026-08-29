import database from '../db/database.js';

class User {
  static async create(name, role, email, mot_passe) {
    const result = await database.execute({
      sql: `INSERT INTO users (name, role, email, mot_passe) VALUES (?, ?, ?, ?)`,
      args: [name, role, email, mot_passe]
    });
    return {
      id: Number(result.lastInsertRowid),
      changes: result.rowsAffected
    };
  }

  static async getAll() {
    const { rows } = await database.execute(
      'SELECT id, name, role, email FROM users ORDER BY id ASC'
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({
      sql: 'SELECT id, name, role, email FROM users WHERE id = ?',
      args: [id]
    });
    return rows[0];
  }

  static async getByEmail(email) {
    const { rows } = await database.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    return rows[0];
  }

  static async update(id, name, role, email, mot_passe) {
    const result = await database.execute({
      sql: `UPDATE users SET name = ?, role = ?, email = ?, mot_passe = ? WHERE id = ?`,
      args: [name, role, email, mot_passe, id]
    });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id]
    });
    return { changes: result.rowsAffected };
  }
}

export default User;