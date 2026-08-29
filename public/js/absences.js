// Gestion de la page Absences

const ROLE_LABELS = {
  admin: 'Administrateur',
  teacher: 'Professeur',
  student: 'Étudiant'
};

let allAbsences = [];
let allStudents = [];
let searchTerm = '';
let editingAbsenceId = null; // Permet de savoir si on crée ou si on modifie une absence

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

async function loadStudents() {
  try {
    const res = await API.students.getAll();
    allStudents = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  } catch (e) {
    console.warn('[loadStudents]', e);
    allStudents = [];
  }
}

async function loadAbsences() {
  try {
    const absences = await API.absences.getAll();
    allAbsences = Array.isArray(absences) ? absences : [];
    renderStats();
    renderTable();
  } catch (error) {
    console.error('Erreur lors du chargement des absences:', error);
    const tbody = document.querySelector('.table-container tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5">Erreur de chargement: ${escapeHtml(error.message)}</td></tr>`;
    }
  }
}

function renderStats() {
  const total = allAbsences.length;
  const justified = allAbsences.filter(a => a.status === 'justifiée').length;
  const notJustified = allAbsences.filter(a => a.status === 'non justifiée').length;

  const neutralCard = document.querySelector('.card-icon.neutral + .card-content .card-value');
  const warningCard = document.querySelector('.card-icon.warning + .card-content .card-value');
  const successCard = document.querySelector('.card-icon.success + .card-content .card-value');
  const subtitle = document.querySelector('.subtitle');

  if (neutralCard) neutralCard.textContent = total;
  if (warningCard) warningCard.textContent = notJustified;
  if (successCard) successCard.textContent = justified;
  if (subtitle) subtitle.textContent = `${total} absences enregistrées · ${notJustified} non justifiées`;
}

function renderTable() {
  const tbody = document.querySelector('.table-container tbody');
  if (!tbody) return;

  const filteredAbsences = allAbsences.filter(a => {
    if (!searchTerm) return true;
    const haystack = `${a.student_name || ''} ${a.classe || ''} ${a.matiere || ''}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  if (filteredAbsences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Aucune absence trouvée.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredAbsences.map(a => {
    return `
      <tr>
        <td><strong>${escapeHtml(a.student_name || 'Inconnu')}</strong></td>
        <td>${escapeHtml(a.classe || a.classe_id || '-')}</td>
        <td>${escapeHtml(a.matiere || '-')}</td>
        <td>${escapeHtml(a.date || '-')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" data-id="${a.id}" title="Modifier">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-delete" data-id="${a.id}" title="Supprimer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
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

function ensureModal() {
  if (document.getElementById('absenceModal')) return;

  const modal = document.createElement('div');
  modal.id = 'absenceModal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2000;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;width:min(420px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.15);">
      <h2 id="modalTitle" style="margin:0 0 8px;font-size:1.25rem;">Signaler une absence</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:.9rem;">Renseignez les détails de l'absence.</p>
      <div id="absenceFormError" style="display:none;color:#dc2626;margin-bottom:12px;font-size:.9rem;"></div>
      
      <label style="display:block;margin-bottom:6px;font-weight:600;">Étudiant</label>
      <select id="absenceStudent" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;"></select>
      
      <label style="display:block;margin-bottom:6px;font-weight:600;">Date</label>
      <input type="date" id="absenceDate" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;" />
      
      <label style="display:block;margin-bottom:6px;font-weight:600;">Statut</label>
      <select id="absenceStatus" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;">
        <option value="non justifiée">Non justifiée</option>
        <option value="justifiée">Justifiée</option>
      </select>
      
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button type="button" id="btnCancelAbsence" style="padding:10px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;">Annuler</button>
        <button type="button" id="btnSubmitAbsence" style="padding:10px 16px;border-radius:8px;border:none;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;">Enregistrer</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAbsenceModal();
  });
  document.getElementById('btnCancelAbsence').addEventListener('click', closeAbsenceModal);
  document.getElementById('btnSubmitAbsence').addEventListener('click', submitAbsence);
}

function openAbsenceModal(absenceData = null) {
  ensureModal();
  
  const titleEl = document.getElementById('modalTitle');
  const select = document.getElementById('absenceStudent');
  
  select.innerHTML = '<option value="">Sélectionner un étudiant</option>' +
    allStudents.map(s => {
      const name = `${s.prenom || ''} ${s.nom || ''}`.trim() || s.name || `Étudiant #${s.id}`;
      return `<option value="${s.id}">${escapeHtml(name)}</option>`;
    }).join('');

  document.getElementById('absenceFormError').style.display = 'none';

  if (absenceData) {
    // Mode Édition
    editingAbsenceId = absenceData.id;
    if (titleEl) titleEl.textContent = 'Modifier l\'absence';
    
    select.value = absenceData.student_id || '';
    document.getElementById('absenceDate').value = absenceData.date ? absenceData.date.slice(0, 10) : '';
    document.getElementById('absenceStatus').value = absenceData.status || 'non justifiée';
  } else {
    // Mode Création
    editingAbsenceId = null;
    if (titleEl) titleEl.textContent = 'Signaler une absence';
    
    select.value = '';
    document.getElementById('absenceDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('absenceStatus').value = 'non justifiée';
  }

  const modal = document.getElementById('absenceModal');
  modal.style.display = 'flex';
}

function closeAbsenceModal() {
  const modal = document.getElementById('absenceModal');
  if (modal) modal.style.display = 'none';
}

async function submitAbsence() {
  const errEl = document.getElementById('absenceFormError');
  errEl.style.display = 'none';
  const student_id = Number(document.getElementById('absenceStudent').value);
  const date = document.getElementById('absenceDate').value;
  const status = document.getElementById('absenceStatus').value;

  if (!student_id || !date) {
    errEl.textContent = "L'étudiant et la date sont obligatoires.";
    errEl.style.display = 'block';
    return;
  }

  const payload = { student_id, date, status };

  const btn = document.getElementById('btnSubmitAbsence');
  btn.disabled = true;
  btn.textContent = 'Enregistrement...';
  
  try {
    if (editingAbsenceId) {
      await API.absences.update(editingAbsenceId, payload);
      showAlert('Absence mise à jour avec succès');
    } else {
      await API.absences.create(payload);
      showAlert('Absence enregistrée avec succès');
    }
    
    closeAbsenceModal();
    await loadAbsences();
  } catch (error) {
    errEl.textContent = error.message || 'Erreur lors de l\'enregistrement.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enregistrer';
  }
}

function setupTableActions() {
  const tbody = document.querySelector('.table-container tbody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const itemToEdit = allAbsences.find(a => String(a.id) === String(id));
      
      if (itemToEdit) {
        openAbsenceModal(itemToEdit);
      } else {
        showAlert('Impossible de trouver les données de cette absence', 'error');
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm('Supprimer cette absence ?')) return;

      try {
        await API.absences.delete(id);
        showAlert('Absence supprimée avec succès');
        await loadAbsences();
      } catch (error) {
        showAlert(`Erreur: ${error.message}`, 'error');
      }
    }
  });
}

function setupNewAbsenceButton() {
  const btn = document.querySelector('.page-header .btn-primary');
  if (btn) {
    btn.addEventListener('click', () => openAbsenceModal());
  }
}

function setupLogout() {
  const logoutIcon = document.querySelector('.logout-icon');
  if (logoutIcon) {
    logoutIcon.addEventListener('click', async () => {
      await API.auth.logout();
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  renderTodayDate();
  updateCurrentUserDisplay();
  setupTableActions();
  setupNewAbsenceButton();
  setupLogout();
  await loadStudents();
  await loadAbsences();
});