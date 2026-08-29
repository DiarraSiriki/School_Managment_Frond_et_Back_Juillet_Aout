// Gestion de la page Absences

const ROLE_LABELS = {
  admin: 'Administrateur',
  teacher: 'Professeur',
  student: 'Étudiant'
};

let allAbsences = [];
let allStudents = [];
let allClasses = [];
let allSubjects = [];
let searchTerm = '';

// --- Utils ---
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
    z-index: 10000;
    font-weight: 600;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3500);
}

function renderTodayDate() {
  const dateEl = document.querySelector('.top-date');
  if (!dateEl) return;
  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
  dateEl.innerHTML = `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} <span class="status-dot"></span>`;
}

// --- Chargement des données ---
async function loadAbsences() {
  try {
    const absences = await API.absences.getAll();
    allAbsences = Array.isArray(absences) ? absences : (Array.isArray(absences?.data) ? absences.data : []);
    renderStats();
    renderTable();
  } catch (error) {
    console.error('Erreur lors du chargement des absences:', error);
    const tbody = document.querySelector('.table-container tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6">Erreur de chargement: ${escapeHtml(error.message)}</td></tr>`;
    }
  }
}

async function loadStudents() {
  try {
    const res = await API.students.getAll();
    allStudents = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    populateStudentSelect();
  } catch (err) {
    console.error('Erreur chargement étudiants:', err);
  }
}

async function loadClassesAndSubjects() {
  try {
    const [classesRes, subjectsRes] = await Promise.all([
      API.classes.getAll(),
      API.subjects.getAll()
    ]);

    allClasses = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);
    allSubjects = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);

    populateClasseSelect();
    populateMatiereSelect();
  } catch (err) {
    console.error('Erreur chargement classes/matières:', err);
  }
}

function populateStudentSelect() {
  const select = document.getElementById('absenceStudent');
  if (!select) return;
  select.innerHTML = '<option value="">Sélectionner un étudiant</option>' +
    allStudents.map(s => {
      const name = s.nom ? `${s.nom} ${s.prenom || ''}`.trim() : (s.name || `Étudiant #${s.id}`);
      return `<option value="${s.id}">${escapeHtml(name)}</option>`;
    }).join('');
}

function populateClasseSelect() {
  const select = document.getElementById('absenceClasse');
  if (!select) return;
  select.innerHTML = '<option value="">Sélectionner une classe</option>' +
    allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');
}

function populateMatiereSelect() {
  const select = document.getElementById('absenceMatiere');
  if (!select) return;
  select.innerHTML = '<option value="">Sélectionner une matière</option>' +
    allSubjects.map(s => `<option value="${s.id}">${escapeHtml(s.nom)}</option>`).join('');
}

// --- Stats & tableau ---
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

function getClasseName(absence) {
  if (absence.classe) return absence.classe;
  const classeId = absence.classe_id;
  if (classeId) {
    const c = allClasses.find(cl => String(cl.id) === String(classeId));
    if (c) return c.nom;
  }
  const student = allStudents.find(s => String(s.id) === String(absence.student_id));
  if (student?.classe_id) {
    const c = allClasses.find(cl => String(cl.id) === String(student.classe_id));
    if (c) return c.nom;
  }
  return '-';
}

function getMatiereName(absence) {
  if (absence.matiere) return absence.matiere;
  if (absence.subject_id) {
    const s = allSubjects.find(sub => String(sub.id) === String(absence.subject_id));
    if (s) return s.nom;
  }
  return '-';
}

function renderTable() {
  const tbody = document.querySelector('.table-container tbody');
  if (!tbody) return;

  const filteredAbsences = allAbsences.filter(a => {
    if (!searchTerm) return true;
    const haystack = `${a.student_name || ''} ${getClasseName(a)} ${getMatiereName(a)}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  if (filteredAbsences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucune absence trouvée.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredAbsences.map(a => {
    const statusClass = a.status === 'justifiée' ? 'badge-success' : 'badge-warning';
    const statusLabel = a.status || 'non justifiée';

    return `
      <tr>
        <td><strong>${escapeHtml(a.student_name || 'Inconnu')}</strong></td>
        <td>${escapeHtml(getClasseName(a))}</td>
        <td>${escapeHtml(getMatiereName(a))}</td>
        <td>${escapeHtml(a.date || '-')}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" data-id="${a.id}" data-status="${a.status || ''}" title="Changer le statut">
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

// --- Modale ---
function openModal() {
  const modal = document.getElementById('absenceModal');
  const form = document.getElementById('absenceForm');
  const formError = document.getElementById('formError');
  const dateInput = document.getElementById('absenceDate');

  if (form) form.reset();
  if (formError) formError.style.display = 'none';

  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  if (modal) modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('absenceModal');
  if (modal) modal.classList.remove('show');
}

function setupModal() {
  const btnNew = document.getElementById('btnNewAbsence');
  const btnCancel = document.getElementById('btnCancelModal');
  const modal = document.getElementById('absenceModal');
  const form = document.getElementById('absenceForm');
  const btnSubmit = document.getElementById('btnSubmitModal');
  const formError = document.getElementById('formError');
  const studentSelect = document.getElementById('absenceStudent');

  if (btnNew) btnNew.addEventListener('click', openModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Préremplir la classe selon l'étudiant choisi
  if (studentSelect) {
    studentSelect.addEventListener('change', (e) => {
      const student = allStudents.find(s => String(s.id) === String(e.target.value));
      const classeSelect = document.getElementById('absenceClasse');
      if (!classeSelect) return;
      classeSelect.value = student?.classe_id ? String(student.classe_id) : '';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (formError) formError.style.display = 'none';

      const student_id = Number(document.getElementById('absenceStudent').value);
      const date = document.getElementById('absenceDate').value;
      const status = document.getElementById('absenceStatus').value;

      // Classe et matière sont en UI seulement (non stockés par l'API actuelle)
      // const classe_id = document.getElementById('absenceClasse').value;
      // const subject_id = document.getElementById('absenceMatiere').value;

      if (!student_id || !date) {
        if (formError) {
          formError.textContent = "L'étudiant et la date sont obligatoires.";
          formError.style.display = 'block';
        }
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enregistrement...';
      }

      try {
        await API.absences.create({ student_id, date, status });
        showAlert('Absence enregistrée avec succès');
        closeModal();
        await loadAbsences();
      } catch (err) {
        if (formError) {
          formError.textContent = err.message || "Erreur lors de l'enregistrement.";
          formError.style.display = 'block';
        } else {
          showAlert(err.message || 'Erreur', 'error');
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Enregistrer';
        }
      }
    });
  }
}

// --- Actions tableau ---
function setupTableActions() {
  const tbody = document.querySelector('.table-container tbody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const currentStatus = editBtn.dataset.status;
      const newStatus = currentStatus === 'justifiée' ? 'non justifiée' : 'justifiée';

      try {
        await API.absences.update(id, { status: newStatus });
        showAlert(`Absence ${newStatus === 'justifiée' ? 'justifiée' : 'marquée non justifiée'} avec succès`);
        await loadAbsences();
      } catch (error) {
        showAlert(`Erreur: ${error.message}`, 'error');
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

function setupLogout() {
  const logoutIcon = document.querySelector('.logout-icon');
  if (logoutIcon) {
    logoutIcon.addEventListener('click', async () => {
      await API.auth.logout();
    });
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  renderTodayDate();
  updateCurrentUserDisplay();
  setupTableActions();
  setupLogout();
  setupModal();
  await Promise.all([
    loadAbsences(),
    loadStudents(),
    loadClassesAndSubjects()
  ]);
});