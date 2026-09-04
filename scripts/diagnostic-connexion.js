// Diagnostic : liste tous les utilisateurs de la base Turso EN PRODUCTION
// et indique pour chacun si son mot de passe est un hash bcrypt bloqué
// (impossible de se connecter avec la comparaison en clair actuelle) ou
// un mot de passe normal en clair (devrait fonctionner).
//
// Usage :
//   node scripts/diagnostic-connexion.js

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const isBcryptHash = (value) => /^\$2[aby]\$/.test(String(value || ''));

async function run() {
  const { rows } = await client.execute(
    'SELECT id, name, role, email, mot_passe FROM users ORDER BY role, id'
  );

  if (rows.length === 0) {
    console.log('Aucun utilisateur trouvé dans la base.');
    process.exit(0);
  }

  console.log(`\n${rows.length} utilisateur(s) trouvé(s) sur Turso :\n`);

  let bloques = 0;

  for (const u of rows) {
    const bloque = isBcryptHash(u.mot_passe);
    if (bloque) bloques++;

    const statut = bloque
      ? '❌ BLOQUÉ (hash bcrypt — mot de passe à réinitialiser)'
      : '✅ OK (mot de passe en clair, devrait fonctionner)';

    console.log(
      `[${u.role}] ${u.email}  —  ${statut}`
    );
  }

  console.log(`\nRésumé : ${bloques} compte(s) bloqué(s) sur ${rows.length}.`);
  if (bloques > 0) {
    console.log(
      "Pour débloquer un compte : node scripts/reset-password.js <email> <nouveauMotDePasse>"
    );
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Erreur lors du diagnostic :', err.message);
  process.exit(1);
});