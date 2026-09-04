

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//  Vérification des credentials Turso 
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_URL.startsWith('libsql://')) {
  console.error(' TURSO_DATABASE_URL manquant ou invalide dans .env');
  console.error('   Exemple : TURSO_DATABASE_URL=libsql://school-xxxxx.turso.io');
  process.exit(1);
}
if (!TURSO_TOKEN) {
  console.error(' TURSO_AUTH_TOKEN manquant dans .env');
  process.exit(1);
}

//  Connexion locale (better-sqlite3) 
const localPath = join(__dirname, 'db', 'database.db')
const local = new Database(localPath, { readonly: true });
console.log(` Base locale : ${localPath}`);

//  Connexion Turso 
const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});
console.log(`  Turso : ${TURSO_URL}`);

//  Schéma propre (aligné sur ton app) 
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  role      TEXT    NOT NULL,
  email     TEXT    NOT NULL UNIQUE,
  mot_passe TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS classes (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nom      TEXT    NOT NULL UNIQUE,
  niveau   TEXT    NOT NULL,
  capacite INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  matricule TEXT    NOT NULL UNIQUE,
  nom       TEXT    NOT NULL,
  prenom    TEXT    NOT NULL,
  age       INTEGER NOT NULL,
  classe_id INTEGER,
  user_id   INTEGER UNIQUE,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(matricule);

CREATE TABLE IF NOT EXISTS teachers (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nom       TEXT    NOT NULL,
  matiere   TEXT    NOT NULL,
  classe_id INTEGER,
  user_id   INTEGER UNIQUE,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nom        TEXT    NOT NULL,
  classe_id  INTEGER,
  teacher_id INTEGER,
  FOREIGN KEY (classe_id)  REFERENCES classes(id)  ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grades (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  note       REAL    NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS absences (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  date       TEXT    NOT NULL,
  status     TEXT    NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
`;

async function run() {
  console.log('\n1️  Création des tables sur Turso...');
  for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) {
    await turso.execute(stmt);
  }
  console.log('    Tables créées');

  //  Users 
  console.log('\n2️  Migration users...');
  const users = local.prepare(`
    SELECT id, name, role, email, mot_passe FROM users ORDER BY id
  `).all();

  // On vide d'abord pour éviter les doublons si on relance
  await turso.execute('DELETE FROM grades');
  await turso.execute('DELETE FROM absences');
  await turso.execute('DELETE FROM subjects');
  await turso.execute('DELETE FROM teachers');
  await turso.execute('DELETE FROM students');
  await turso.execute('DELETE FROM classes');
  await turso.execute('DELETE FROM users');

  for (const u of users) {
    await turso.execute({
      sql: `INSERT INTO users (id, name, role, email, mot_passe) VALUES (?, ?, ?, ?, ?)`,
      args: [u.id, u.name, u.role, u.email, u.mot_passe]
    });
  }
  console.log(`  ${users.length} users`);

  // Classes
  console.log('\n3️  Migration classes...');
  const classes = local.prepare(`SELECT id, nom, niveau, capacite FROM classes ORDER BY id`).all();
  for (const c of classes) {
    await turso.execute({
      sql: `INSERT INTO classes (id, nom, niveau, capacite) VALUES (?, ?, ?, ?)`,
      args: [c.id, c.nom, c.niveau, c.capacite]
    });
  }
  console.log(`    ${classes.length} classes`);

  // Students
  console.log('\n4️  Migration students...');
  const students = local.prepare(`
    SELECT id, matricule, nom, prenom, age, classe_id, user_id FROM students ORDER BY id
  `).all();
  for (const s of students) {
    await turso.execute({
      sql: `INSERT INTO students (id, matricule, nom, prenom, age, classe_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.matricule, s.nom, s.prenom, s.age, s.classe_id ?? null, s.user_id ?? null]
    });
  }
  console.log(`    ${students.length} students`);

  // Teachers
  console.log('\n5️  Migration teachers...');
  const teachers = local.prepare(`
    SELECT id, nom, matiere, classe_id, user_id FROM teachers ORDER BY id
  `).all();
  for (const t of teachers) {
    await turso.execute({
      sql: `INSERT INTO teachers (id, nom, matiere, classe_id, user_id) VALUES (?, ?, ?, ?, ?)`,
      args: [t.id, t.nom, t.matiere, t.classe_id ?? null, t.user_id ?? null]
    });
  }
  console.log(`    ${teachers.length} teachers`);

  // Subjects 
  console.log('\n6️  Migration subjects...');
  const subjects = local.prepare(`
    SELECT id, nom, classe_id, teacher_id FROM subjects ORDER BY id
  `).all();
  for (const s of subjects) {
    await turso.execute({
      sql: `INSERT INTO subjects (id, nom, classe_id, teacher_id) VALUES (?, ?, ?, ?)`,
      args: [s.id, s.nom, s.classe_id ?? null, s.teacher_id ?? null]
    });
  }
  console.log(`    ${subjects.length} subjects`);

  //  Grades
  console.log('\n7️  Migration grades...');
  const grades = local.prepare(`
    SELECT id, student_id, subject_id, note FROM grades ORDER BY id
  `).all();
  for (const g of grades) {
    await turso.execute({
      sql: `INSERT INTO grades (id, student_id, subject_id, note) VALUES (?, ?, ?, ?)`,
      args: [g.id, g.student_id, g.subject_id, g.note]
    });
  }
  console.log(`    ${grades.length} grades`);

  //  Absences 
  console.log('\n8️  Migration absences...');
  const absences = local.prepare(`
    SELECT id, student_id, date, status FROM absences ORDER BY id
  `).all();
  for (const a of absences) {
    await turso.execute({
      sql: `INSERT INTO absences (id, student_id, date, status) VALUES (?, ?, ?, ?)`,
      args: [a.id, a.student_id, a.date, a.status]
    });
  }
  console.log(`    ${absences.length} absences`);

  //  Reset des séquences AUTOINCREMENT
  console.log('\n9️  Mise à jour des séquences...');
  const maxIds = {
    users: users.reduce((m, r) => Math.max(m, r.id), 0),
    classes: classes.reduce((m, r) => Math.max(m, r.id), 0),
    students: students.reduce((m, r) => Math.max(m, r.id), 0),
    teachers: teachers.reduce((m, r) => Math.max(m, r.id), 0),
    subjects: subjects.reduce((m, r) => Math.max(m, r.id), 0),
    grades: grades.reduce((m, r) => Math.max(m, r.id), 0),
    absences: absences.reduce((m, r) => Math.max(m, r.id), 0)
  };

  for (const [table, maxId] of Object.entries(maxIds)) {
    if (maxId > 0) {
      try {
        await turso.execute({
          sql: `DELETE FROM sqlite_sequence WHERE name = ?`,
          args: [table]
        });
        await turso.execute({
          sql: `INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)`,
          args: [table, maxId]
        });
      } catch (_) {
        // ignore si sqlite_sequence n'existe pas encore
      }
    }
  }
  console.log('    Séquences OK');

  //  Vérification finale 
  console.log('\n Vérification sur Turso...');
  for (const table of ['users', 'classes', 'students', 'teachers', 'subjects', 'grades', 'absences']) {
    const { rows } = await turso.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    console.log(`      ${table}: ${rows[0].n} ligne(s)`);
  }

  console.log('\n Migration terminée avec succès !');
  local.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('\nErreur de migration :', err.message);
  console.error(err);
  process.exit(1);
});