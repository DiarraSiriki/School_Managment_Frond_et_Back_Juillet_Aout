/**
 * Affiche un message d'erreur dans la boîte d'erreur de connexion
 * Utilise une alerte si la boîte d'erreur n'existe pas
 */
function showLoginError(msg) {
  const box = document.getElementById('error-box');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
  } else {
    alert(msg);
  }
}

/**
 * Normalise le nom d'un rôle pour le rendre standard
 * Gère les accents, les fautes de frappe et les variantes
 */
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

// Initialisation du formulaire de connexion au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const mot_passe = document.getElementById('password')?.value;
    const errorBox = document.getElementById('error-box');

    // Masquer la boîte d'erreur avant de tenter la connexion
    if (errorBox) errorBox.style.display = 'none';

    // Validation des champs
    if (!email || !mot_passe) {
      showLoginError("L'email et le mot de passe sont requis.");
      return;
    }

    try {
      console.log('[LOGIN] Appel API en cours...');
      const result = await API.auth.login({ email, mot_passe });
      console.log('[LOGIN] Réponse API brute :', result);

      // Extraction du token et des données utilisateur
      const token = result?.token;
      const userData = result?.user;

      if (token && userData) {
        // Normalisation du rôle
        const role = normalizeLoginRole(userData.role);
        console.log('[LOGIN] Rôle normalisé :', role);
        console.log('[LOGIN] User :', userData);

        const user = { ...userData, role };

        // Stockage du token et des utilisateur dans le localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('[LOGIN] localStorage rempli ✓ (token + user)');

        // Redirection selon le rôle de l'utilisateur
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
