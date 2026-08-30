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
  const n = String(role).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  return aliases[n] || n;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const mot_passe = document.getElementById('password').value;
  const errorBox = document.getElementById('error-box');
  if (errorBox) errorBox.style.display = 'none';

  if (!email || !mot_passe) {
    showLoginError("L'email et le mot de passe sont requis.");
    return;
  }

  try {
    const result = await API.auth.login({ email, mot_passe });

    if (result.success || result.token) {
      const role = normalizeLoginRole(result.user?.role);
      const user = { ...result.user, role };

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(user));

      const redirectMap = {
        admin: '/dashboard-admin',
        teacher: '/dashboard-prof',
        student: '/dashboard-etudiant'
      };

      if (role && redirectMap[role]) {
        window.location.href = redirectMap[role];
      } else {
        showLoginError('Rôle utilisateur inconnu : ' + (role || 'vide'));
      }
    } else {
      showLoginError(result.message || result.error || 'Échec de la connexion.');
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    showLoginError(error.message || 'Erreur réseau lors de la connexion.');
  }
});