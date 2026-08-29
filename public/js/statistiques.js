// Gestion de la page Statistiques

const ROLE_LABELS = {
  admin: 'Administrateur',
  teacher: 'Professeur',
  student: 'Étudiant'
};

let statsData = null;

// Mettre à jour le nom de l'utilisateur connecté
function updateCurrentUserDisplay() {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  if (currentUser) {
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.email || '';
    if (userRoleEl) userRoleEl.textContent = ROLE_LABELS[currentUser.role] || '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#dcfce7' : '#fef2f2'};
    color: ${type === 'success' ? '#15803d' : '#ef4444'};
    z-index: 1000;
    font-weight: 600;
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3500);
}

// Chargement des statistiques
async function loadStats() {
  try {
    // Charger les statistiques principales
    const response = await API.get('/stats');
    statsData = response.stats || response; // Gérer les deux formats possibles
    renderCards();
    renderTable();
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    const tbody = document.querySelector('.table-container tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5">Erreur de chargement: ${escapeHtml(error.message)}</td></tr>`;
    }
  }
}

function renderCards() {
  if (!statsData) return;

  // Carte Moyenne Maximale
  const maxAvgCard = document.querySelector('.card .card-val');
  const maxAvgName = document.querySelector('.card .card-sub');
  if (maxAvgCard && statsData.bestStudent) {
    maxAvgCard.textContent = `${statsData.bestStudent.moyenne || '-'}/20`;
    if (maxAvgName) maxAvgName.textContent = `${statsData.bestStudent.prenom || ''} ${statsData.bestStudent.nom || ''}`.trim() || '-';
  }

  // Carte Absences Totales
  const absencesCard = document.querySelector('.card-red .card-val');
  const absencesSub = document.querySelector('.card-red .card-sub');
  if (absencesCard && statsData.absences) {
    const total = statsData.absences.total || 0;
    const notJustified = statsData.absences.non_justifiees || 0;
    absencesCard.textContent = total;
    if (absencesSub) absencesSub.textContent = `${notJustified} non justifiées`;
  }
}

function renderTable() {
  const tbody = document.querySelector('.table-container tbody');
  if (!tbody || !statsData || !statsData.rankings) return;

  const rankings = statsData.rankings || [];

  if (rankings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Aucune donnée disponible.</td></tr>`;
    return;
  }

  tbody.innerHTML = rankings.map(student => {
    // Calculer les absences pour cet étudiant
    const studentAbsences = statsData.absencesByStudent?.[student.id] || { 
      justifiees: 0, 
      non_justifiees: 0 
    };
    const totalAbsences = studentAbsences.justifiees + studentAbsences.non_justifiees;

    return `
      <tr>
        <td class="font-bold">${escapeHtml(`${student.prenom || ''} ${student.nom || ''}`.trim() || 'Inconnu')}</td>
        <td class="font-bold text-blue">${escapeHtml(String(student.moyenne || '-'))}</td>
        <td class="font-bold text-green">${escapeHtml(String(studentAbsences.justifiees || 0))}</td>
        <td class="font-bold text-red">${escapeHtml(String(studentAbsences.non_justifiees || 0))}</td>
        <td class="font-bold">${escapeHtml(String(totalAbsences || 0))}</td>
      </tr>
    `;
  }).join('');
}

function renderTodayDate() {
  const dateEl = document.querySelector('.top-date');
  if (!dateEl) return;
  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
  dateEl.innerHTML = `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} <span class="status-dot"></span>`;
}

// Gestion de la déconnexion
function setupLogout() {
  const logoutIcon = document.querySelector('.logout-icon');
  if (logoutIcon) {
    logoutIcon.addEventListener('click', async () => {
      await API.auth.logout();
    });
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  renderTodayDate();
  updateCurrentUserDisplay();
  setupLogout();
  loadStats();
});
