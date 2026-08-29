import database from '../db/database.js';
import logger from '../utils/logger.js';

class Classe {
  /**
   * Créer une nouvelle classe
   */
  static async create(nom, niveau, capacite) {
    try {
      const result = await database.execute({
        sql: `INSERT INTO classes (nom, niveau, capacite) VALUES (?, ?, ?)`,
        args: [nom, niveau, capacite]
      });
      logger.info(`[Classe Model] Création réussie: class_id=${result.lastInsertRowid}, nom=${nom}`);
      return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
    } catch (err) {
      logger.error(`[Classe Model] Erreur création: ${err.message}`);
      throw err;
    }
  }

  /**
   * Récupérer toutes les classes
   */
  static async getAll() {
    const { rows } = await database.execute('SELECT * FROM classes ORDER BY nom ASC');
    return rows;
  }

  /**
   * Récupérer une classe par son ID
   */
  static async getById(id) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM classes WHERE id = ?', args: [id] });
    return rows[0];
  }

  /**
   * Récupérer une classe par son nom
   */
  static async getByNom(nom) {
    const { rows } = await database.execute({ sql: 'SELECT * FROM classes WHERE nom = ?', args: [nom] });
    return rows[0];
  }

  /**
   * Rechercher des classes par nom ou niveau
   */
  static async search(keyword) {
    const k = `%${keyword}%`;
    const { rows } = await database.execute({
      sql: `SELECT * FROM classes WHERE nom LIKE ? OR niveau LIKE ? ORDER BY nom ASC`,
      args: [k, k]
    });
    return rows;
  }

  /**
   * Mettre à jour une classe
   */
  static async update(id, nom, niveau, capacite) {
    try {
      const result = await database.execute({
        sql: `UPDATE classes SET nom = ?, niveau = ?, capacite = ? WHERE id = ?`,
        args: [nom, niveau, capacite, id]
      });
      logger.info(`[Classe Model] Mise à jour réussie: class_id=${id}`);
      return { changes: result.rowsAffected };
    } catch (err) {
      logger.error(`[Classe Model] Erreur mise à jour ID=${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Supprimer une classe et réinitialiser les étudiants rattachés (SET NULL)
   */
  static async delete(id) {
    try {
      const results = await database.batch(
        [
          { sql: 'UPDATE students SET classe_id = NULL WHERE classe_id = ?', args: [id] },
          { sql: 'UPDATE subjects SET classe_id = NULL WHERE classe_id = ?', args: [id] },
          { sql: 'DELETE FROM classes WHERE id = ?', args: [id] }
        ],
        'write'
      );
      logger.info(`[Classe Model] Suppression réussie: class_id=${id}`);
      const deleteResult = results[results.length - 1];
      return { changes: deleteResult.rowsAffected };
    } catch (err) {
      logger.error(`[Classe Model] Erreur suppression ID=${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Compter le nombre d'étudiants dans une classe
   */
  static async countStudents(class_id) {
    const { rows } = await database.execute({
      sql: `SELECT COUNT(*) AS total FROM students WHERE classe_id = ?`,
      args: [class_id]
    });
    return rows[0] ? rows[0].total : 0;
  }

  /**
   * Récupérer les étudiants d'une classe
   */
  static async getStudents(class_id) {
    const { rows } = await database.execute({
      sql: `SELECT id, matricule, nom, prenom, age, user_id
            FROM students WHERE classe_id = ?
            ORDER BY nom ASC, prenom ASC`,
      args: [class_id]
    });
    return rows;
  }

  /**
   * Récupérer les matières associées à une classe
   */
  static async getSubjects(class_id) {
    const { rows } = await database.execute({
      sql: `SELECT s.id, s.nom, t.nom AS teacher_nom
            FROM subjects s
            LEFT JOIN teachers t ON s.teacher_id = t.id
            WHERE s.classe_id = ?
            ORDER BY s.nom ASC`,
      args: [class_id]
    });
    return rows;
  }
}

export default Classe;
