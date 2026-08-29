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

const client = createClient({
  url,
  authToken
});

console.log(`Base de données Turso connectée : ${url}`);


const database = {
  async execute(query) {
    const result = await client.execute(query);
    return {
      rows: result.rows || [],
      rowsAffected: result.rowsAffected ?? 0,
      lastInsertRowid:
        result.lastInsertRowid != null ? Number(result.lastInsertRowid) : 0
    };
  },

  async batch(statements, mode = 'write') {
    const results = await client.batch(statements, mode);
    return results.map((result) => ({
      rows: result.rows || [],
      rowsAffected: result.rowsAffected ?? 0,
      lastInsertRowid:
        result.lastInsertRowid != null ? Number(result.lastInsertRowid) : 0
    }));
  },

  client
};

export default database;