// import Database from 'better-sqlite3';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';


// const localDb = new Database("./school.db", { readonly: true });

// // Connexion à Turso (les identifiants viennent de ton .env)
// const tursoDb = createClient({
//     url: process.env.TURSO_DATABASE_URL,
//     authToken: process.env.TURSO_AUTH_TOKEN,
// });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = dirname(__filename);
// const dbPath     = join(__dirname, 'database.db');

// const db = new Database(dbPath);
// db.pragma('journal_mode = WAL');
// db.pragma('synchronous = NORMAL');
// db.pragma('foreign_keys = ON');

// console.log(`Base de données connectée : ${dbPath}`);

// // 1. Table USERS — identifiants système uniquement (pas de matricule)
// db.exec(`
//   CREATE TABLE IF NOT EXISTS users (
//     id        INTEGER PRIMARY KEY AUTOINCREMENT,
//     name      TEXT    NOT NULL,
//     role      TEXT    NOT NULL, -- 'admin', 'teacher', 'student'
//     email     TEXT    NOT NULL UNIQUE,
//     mot_passe TEXT    NOT NULL
//   )
// `);

// db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

// // 2. Table CLASSES
// db.exec(`
//   CREATE TABLE IF NOT EXISTS classes (
//     id       INTEGER PRIMARY KEY AUTOINCREMENT,
//     nom      TEXT    NOT NULL UNIQUE,
//     niveau   TEXT    NOT NULL,
//     capacite INTEGER NOT NULL
//   )
// `);

// // 3. Table STUDENTS — le matricule appartient ici
// db.exec(`
//   CREATE TABLE IF NOT EXISTS students (
//     id        INTEGER PRIMARY KEY AUTOINCREMENT,
//     matricule TEXT    NOT NULL UNIQUE,
//     nom       TEXT    NOT NULL,
//     prenom    TEXT    NOT NULL,
//     age       INTEGER NOT NULL,
//     classe_id INTEGER,
//     user_id   INTEGER UNIQUE,
//     FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
//     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
//   )
// `);

// db.exec(`CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule)`);

// // --- Migration : ancienne colonne "classe" (TEXT NOT NULL) -> schéma moderne avec classe_id ---
// (function migrateStudentsSchema() {
//   try {
//     const cols = db.prepare(`PRAGMA table_info(students)`).all();
//     const hasOldClasse = cols.some(c => c.name === 'classe');
//     const hasClasseId = cols.some(c => c.name === 'classe_id');

//     if (!hasOldClasse) {
//       return; // déjà à jour
//     }

//     console.log('[Migration] Table students : colonne obsolète "classe" détectée — migration en cours...');

//     db.pragma('foreign_keys = OFF');
//     db.exec('BEGIN');

//     db.exec(`
//       CREATE TABLE students_new (
//         id        INTEGER PRIMARY KEY AUTOINCREMENT,
//         matricule TEXT    NOT NULL UNIQUE,
//         nom       TEXT    NOT NULL,
//         prenom    TEXT    NOT NULL,
//         age       INTEGER NOT NULL,
//         classe_id INTEGER,
//         user_id   INTEGER UNIQUE,
//         FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
//       )
//     `);

//     // Copier les données en résolvant classe_id si possible
//     const rows = db.prepare('SELECT * FROM students').all();
//     const insert = db.prepare(`
//       INSERT INTO students_new (id, matricule, nom, prenom, age, classe_id, user_id)
//       VALUES (@id, @matricule, @nom, @prenom, @age, @classe_id, @user_id)
//     `);

//     for (const row of rows) {
//       let classeId = row.classe_id != null ? row.classe_id : null;
//       // Si classe_id manquant, tenter de matcher via l'ancien champ texte "classe"
//       if (classeId == null && row.classe) {
//         const match = db.prepare(
//           `SELECT id FROM classes WHERE lower(trim(nom)) = lower(trim(?)) OR lower(trim(niveau)) = lower(trim(?))`
//         ).get(row.classe, row.classe);
//         if (match) classeId = match.id;
//       }
//       insert.run({
//         id: row.id,
//         matricule: row.matricule,
//         nom: row.nom,
//         prenom: row.prenom,
//         age: row.age,
//         classe_id: classeId,
//         user_id: row.user_id ?? null
//       });
//     }

//     db.exec(`DROP TABLE students`);
//     db.exec(`ALTER TABLE students_new RENAME TO students`);
//     db.exec(`CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule)`);

//     db.exec('COMMIT');
//     db.pragma('foreign_keys = ON');
//     console.log('[Migration] Table students migrée avec succès (colonne "classe" supprimée).');
//   } catch (err) {
//     try { db.exec('ROLLBACK'); } catch (_) {}
//     db.pragma('foreign_keys = ON');
//     console.error('[Migration] Échec migration students:', err.message);
//   }
// })();

// // 4. Table TEACHERS (modifiée)
// db.exec(`
//   CREATE TABLE IF NOT EXISTS teachers (
//     id        INTEGER PRIMARY KEY AUTOINCREMENT,
//     nom       TEXT    NOT NULL,
//     matiere   TEXT    NOT NULL,
//     classe_id INTEGER,
//     user_id   INTEGER UNIQUE,
//     FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
//     FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
//   )
// `);


// // 5. Table SUBJECTS
// db.exec(`
//   CREATE TABLE IF NOT EXISTS subjects (
//     id         INTEGER PRIMARY KEY AUTOINCREMENT,
//     nom        TEXT    NOT NULL,
//     classe_id  INTEGER,
//     teacher_id INTEGER,
//     FOREIGN KEY (classe_id)  REFERENCES classes(id) ON DELETE SET NULL,
//     FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
//   )
// `);

// // 6. Table GRADES
// db.exec(`
//   CREATE TABLE IF NOT EXISTS grades (
//     id         INTEGER PRIMARY KEY AUTOINCREMENT,
//     student_id INTEGER NOT NULL,
//     subject_id INTEGER NOT NULL,
//     note       REAL    NOT NULL,
//     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
//     FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
//   )
// `);

// // 7. Table ABSENCES
// db.exec(`
//   CREATE TABLE IF NOT EXISTS absences (
//     id         INTEGER PRIMARY KEY AUTOINCREMENT,
//     student_id INTEGER NOT NULL,
//     date       TEXT    NOT NULL,
//     status     TEXT    NOT NULL,
//     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
//   )
// `);

// export default db;

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith('libsql://')) {
  throw new Error('TURSO_DATABASE_URL manquant ou invalide dans .env');
}
if (!authToken) {
  throw new Error('TURSO_AUTH_TOKEN manquant dans .env');
}

const db = createClient({
  url,
  authToken
});

console.log(`  Base de données Turso connectée : ${url}`);

export default db;