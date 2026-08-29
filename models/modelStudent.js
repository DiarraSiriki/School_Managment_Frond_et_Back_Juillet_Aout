import database from '../db/database.js';
import logger from '../utils/logger.js';

class Student {

  static async create(matricule, nom, prenom, age, classe_id, user_id = null) {
    try {
      if (!matricule || !String(matricule).trim()) {
        throw new Error('Le matricule est obligatoire.');
      }

      const finalMatricule = String(matricule).trim();

      const result = await database.execute({
        sql: `INSERT INTO students (matricule, nom, prenom, age, classe_id, user_id)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [finalMatricule, nom, prenom, age, classe_id, user_id]
      });

      logger.info(`[Student Model] Insertion réussie: student_id=${result.lastInsertRowid}, matricule=${finalMatricule}, user_id=${user_id}`);

      return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.rowsAffected,
        matricule: finalMatricule
      };
    } catch (err) {
      logger.error(`Erreur lors de l'insertion d'un étudiant: ${err.message}`);
      throw err;
    }
  }

  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM students');
    return rows;
  }

  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [id] });
    return rows[0];
  }

  static async getByMatricule(matricule) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM students WHERE matricule = ?', args: [matricule] });
    return rows[0];
  }

  static async getByUserId(user_id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM students WHERE user_id = ?', args: [user_id] });
    return rows[0];
  }

  static async search(keyword) {
    const k = `%${keyword}%`;
    const { rows } = await database.execute({
      sql: `SELECT * FROM students
            WHERE nom LIKE ? OR prenom LIKE ? OR matricule LIKE ?
               OR CAST(classe_id AS TEXT) LIKE ?`,
      args: [k, k, k, k]
    });
    return rows;
  }

  static async update(id, matricule, nom, prenom, age, classe_id, user_id = null) {
    const result = await database.execute({
      sql: `UPDATE students
            SET matricule = ?, nom = ?, prenom = ?, age = ?, classe_id = ?, user_id = ?
            WHERE id = ?`,
      args: [matricule, nom, prenom, age, classe_id, user_id, id]
    });
    return { changes: result.rowsAffected };
  }

  static async delete(id) {
    const result = await database.execute({ sql: 'DELETE FROM students WHERE id = ?', args: [id] });
    return { changes: result.rowsAffected };
  }
}

export default Student;
