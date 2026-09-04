function showLoginError(msg) {
  const box = document.getElementById('error-box');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
  } else {
    alert(msg);
  }
}

function normalizeLoginRole(role) {
  if (!role) return '';
  const normalized = String(role)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const aliases = {
    admin: 'admin',
    administrateur: 'admin',
    teacher: 'teacher',
    professeur: 'teacher',
    prof: 'teacher',
    enseignant: 'teacher',
    student: 'student',
    etudiant: 'student',
    etudiante: 'student',
    eleve: 'student'
  };

  return aliases[normalized] || normalized;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const mot_passe = document.getElementById('password')?.value;
    const errorBox = document.getElementById('error-box');

    if (errorBox) errorBox.style.display = 'none';

    if (!email || !mot_passe) {
      showLoginError("L'email et le mot de passe sont requis.");
      return;
    }

    try {
      console.log('[LOGIN] Appel API en cours...');
      const result = await API.auth.login({ email, mot_passe });
      console.log('[LOGIN] Réponse API brute :', result);

      // ✅ ROBUSTESSE : gère les deux formes possibles de réponse
      // { success, token, user } ou { message: "..." } (échec 401 renvoyé par api.js)
      const token = result?.token;
      const userData = result?.user;

      if (token && userData) {
        const role = normalizeLoginRole(userData.role);
        console.log('[LOGIN] Rôle normalisé :', role);
        console.log('[LOGIN] User :', userData);

        const user = { ...userData, role };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('[LOGIN] localStorage rempli ✓ (token + user)');

        const redirectMap = {
          admin: '/dashboard-admin',
          teacher: '/dashboard-prof',
          student: '/mon-profil'
        };

        if (role && redirectMap[role]) {
          console.log('[LOGIN] Redirection vers :', redirectMap[role]);
          window.location.href = redirectMap[role];
        } else {
          showLoginError(`Rôle utilisateur inconnu : ${role || 'vide'}`);
        }
      } else {
        console.warn('[LOGIN] Réponse sans token ou sans user :', result);
        showLoginError(
          result?.message || result?.error || 'Échec de la connexion (identifiants incorrects ?).'
        );
      }
    } catch (error) {
      console.error('[LOGIN] Erreur catch :', error);
      showLoginError(error.message || 'Erreur réseau lors de la connexion.');
    }
  });
});
