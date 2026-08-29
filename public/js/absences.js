// Gestion de la page Absences — création + édition (étudiant, classe, matière, date, statut)

const ROLE_LABELS = {
  admin: 'Administrateur',
  teacher: 'Professeur',
  student: 'Étudiant'
};

let allAbsences = [];
let allStudents = [];
let allSubjects = [];
let allClasses = [];
let searchTerm = '';
let editingAbsenceId = null;

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
    position: fixed; top: 20px; right: 20px; padding: 12px 20px;
    border-radius: 8px; z-index: 3000; font-weight: 600;
    background: ${type === 'success' ? '#dcfce7' : '#fef2f2'};
    color: ${type === 'success' ? '#15803d' : '#ef4444'};
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

async function loadSubjects() {
  try {
    const res = await API.subjects.getAll();
    allSubjects = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    console.log('[loadSubjects] matières chargées:', allSubjects.length, allSubjects);
  } catch (e) {
    console.error('[loadSubjects] ERREUR:', e);
    allSubjects = [];
  }
}

async function loadClasses() {
  try {
    const res = await API.classes.getAll();
    allClasses = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  } catch (e) {
    console.warn('[loadClasses]', e);
    allClasses = [];
  }
}

function getStudentById(studentId) {
  return allStudents.find((x) => String(x.id) === String(studentId)) || null;
}

function getStudentClassName(studentId) {
  const s = getStudentById(studentId);
  if (!s) return '-';
  const c = allClasses.find((x) => String(x.id) === String(s.classe_id));
  return c ? c.nom : (s.classe || '-');
}

function getSubjectsForStudent(studentId) {
  const s = getStudentById(studentId);
  if (!s || s.classe_id == null || s.classe_id === '') {
    return allSubjects;
  }
  const filtered = allSubjects.filter(
    (sub) => String(sub.classe_id) === String(s.classe_id)
  );
  return filtered.length > 0 ? filtered : allSubjects;
}

async function loadAbsences() {
  try {
    const absences = await API.absences.getAll();
    allAbsences = Array.isArray(absences) ? absences : [];
    renderStats();
    renderTable();
  } catch (error) {
    console.error('Erreur chargement absences:', error);
    const tbody = document.querySelector('.table-container tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5">Erreur: ${escapeHtml(error.message)}</td></tr>`;
    }
  }
}

function renderStats() {
  const total = allAbsences.length;
  const justified = allAbsences.filter((a) => a.status === 'justifiée').length;
  const notJustified = allAbsences.filter((a) => a.status === 'non justifiée').length;

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

  const filtered = allAbsences.filter((a) => {
    if (!searchTerm) return true;
    const hay = `${a.student_name || ''} ${a.classe || ''} ${a.matiere || ''}`.toLowerCase();
    return hay.includes(searchTerm);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Aucune absence trouvée.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((a) => {
      const statusLabel = a.status || '-';
      const statusClass = a.status === 'justifiée' ? 'badge-success' : 'badge-warning';
      let matiereLabel = a.matiere || a.matiere_nom || '-';
      if ((!matiereLabel || matiereLabel === '-') && a.subject_id) {
        const sub = allSubjects.find((s) => String(s.id) === String(a.subject_id));
        if (sub) matiereLabel = sub.nom;
      }
      return `
      <tr>
        <td><strong>${escapeHtml(a.student_name || 'Inconnu')}</strong></td>
        <td>${escapeHtml(a.classe || '-')}</td>
        <td>${escapeHtml(matiereLabel)}</td>
        <td>${escapeHtml(a.date || '-')}</td>
        <td>
          <div class="action-buttons">
            <span class="badge ${statusClass}" style="margin-right:8px;font-size:12px;">${escapeHtml(statusLabel)}</span>
            <button class="btn-edit" data-id="${a.id}" title="Modifier">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-delete" data-id="${a.id}" title="Supprimer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function renderTodayDate() {
  const dateEl = document.querySelector('.top-date');
  if (!dateEl) return;
  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  dateEl.innerHTML = `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} <span class="status-dot"></span>`;
}

function ensureModal() {
  if (document.getElementById('absenceModal')) return;

  const modal = document.createElement('div');
  modal.id = 'absenceModal';
  modal.style.cssText =
    'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;width:min(460px,94vw);box-shadow:0 12px 40px rgba(0,0,0,.18);max-height:90vh;overflow:auto;">
      <h2 id="absenceModalTitle" style="margin:0 0 8px;font-size:1.25rem;">Signaler une absence</h2>
      <p id="absenceModalSubtitle" style="margin:0 0 16px;color:#64748b;font-size:.9rem;">Renseignez les informations de l'absence.</p>
      <div id="absenceFormError" style="display:none;color:#dc2626;margin-bottom:12px;font-size:.9rem;"></div>

      <label style="display:block;margin-bottom:6px;font-weight:600;">Étudiant *</label>
      <select id="absenceStudent" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;"></select>

      <label style="display:block;margin-bottom:6px;font-weight:600;">Classe (auto)</label>
      <input type="text" id="absenceClasse" readonly placeholder="—"
        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#f8fafc;color:#64748b;" />

      <label style="display:block;margin-bottom:6px;font-weight:600;">Matière *</label>
      <select id="absenceSubject" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:4px;"></select>
      <p id="absenceSubjectHint" style="margin:0 0 12px;font-size:12px;color:#94a3b8;"></p>

      <label style="display:block;margin-bottom:6px;font-weight:600;">Date *</label>
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

  document.getElementById('absenceStudent').addEventListener('change', () => {
    const sid = document.getElementById('absenceStudent').value;
    document.getElementById('absenceClasse').value = sid ? getStudentClassName(sid) : '';
    fillSubjectSelect(sid, null);
  });
}

function fillSubjectSelect(studentId, selectedSubjectId) {
  const subjectSelect = document.getElementById('absenceSubject');
  const hint = document.getElementById('absenceSubjectHint');
  if (!subjectSelect) return;

  const list = studentId ? getSubjectsForStudent(studentId) : allSubjects;

  if (!allSubjects.length) {
    subjectSelect.innerHTML = '<option value="">Aucune matière en base — créez-en dans Matières</option>';
    if (hint) {
      hint.textContent = 'Allez dans le menu Matières pour en ajouter, puis rechargez cette page.';
      hint.style.color = '#dc2626';
    }
    return;
  }

  subjectSelect.innerHTML =
    '<option value="">Sélectionner une matière</option>' +
    list.map((s) => `<option value="${s.id}">${escapeHtml(s.nom)}</option>`).join('');

  if (selectedSubjectId) {
    subjectSelect.value = String(selectedSubjectId);
    if (subjectSelect.value !== String(selectedSubjectId)) {
      const sub = allSubjects.find((s) => String(s.id) === String(selectedSubjectId));
      if (sub) {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.nom;
        opt.selected = true;
        subjectSelect.appendChild(opt);
      }
    }
  }

  if (hint) {
    const s = getStudentById(studentId);
    if (s && s.classe_id != null) {
      const filtered = allSubjects.filter((sub) => String(sub.classe_id) === String(s.classe_id));
      if (filtered.length > 0) {
        hint.textContent = `${list.length} matière(s) pour la classe de cet étudiant.`;
        hint.style.color = '#94a3b8';
      } else {
        hint.textContent = 'Aucune matière liée à cette classe : liste complète affichée.';
        hint.style.color = '#ca8a04';
      }
    } else {
      hint.textContent = `${allSubjects.length} matière(s) disponible(s).`;
      hint.style.color = '#94a3b8';
    }
  }
}

function fillSelects(selectedStudentId, selectedSubjectId) {
  const studentSelect = document.getElementById('absenceStudent');

  studentSelect.innerHTML =
    '<option value="">Sélectionner un étudiant</option>' +
    allStudents
      .map((s) => {
        const name = `${s.prenom || ''} ${s.nom || ''}`.trim() || s.name || `Étudiant #${s.id}`;
        return `<option value="${s.id}">${escapeHtml(name)}</option>`;
      })
      .join('');

  if (selectedStudentId) studentSelect.value = String(selectedStudentId);
  document.getElementById('absenceClasse').value = selectedStudentId
    ? getStudentClassName(selectedStudentId)
    : '';

  fillSubjectSelect(selectedStudentId, selectedSubjectId);
}

async function openAbsenceModal(absence = null) {
  ensureModal();
  await loadSubjects();

  editingAbsenceId = absence ? absence.id : null;
  document.getElementById('absenceFormError').style.display = 'none';

  if (absence) {
    document.getElementById('absenceModalTitle').textContent = "Modifier l'absence";
    document.getElementById('absenceModalSubtitle').textContent =
      "Modifiez l'étudiant, la date, la matière ou le statut.";
    fillSelects(absence.student_id, absence.subject_id);
    document.getElementById('absenceDate').value = (absence.date || '').slice(0, 10);
    document.getElementById('absenceStatus').value =
      absence.status === 'justifiée' ? 'justifiée' : 'non justifiée';
  } else {
    document.getElementById('absenceModalTitle').textContent = 'Signaler une absence';
    document.getElementById('absenceModalSubtitle').textContent =
      "Renseignez les informations de l'absence.";
    fillSelects(null, null);
    document.getElementById('absenceDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('absenceStatus').value = 'non justifiée';
  }

  document.getElementById('absenceModal').style.display = 'flex';
}

function closeAbsenceModal() {
  const modal = document.getElementById('absenceModal');
  if (modal) modal.style.display = 'none';
  editingAbsenceId = null;
}

async function submitAbsence() {
  const errEl = document.getElementById('absenceFormError');
  errEl.style.display = 'none';

  const student_id = Number(document.getElementById('absenceStudent').value);
  const date = document.getElementById('absenceDate').value;
  const status = document.getElementById('absenceStatus').value;
  const subjectRaw = document.getElementById('absenceSubject').value;
  const subject_id = subjectRaw ? Number(subjectRaw) : null;

  if (!student_id || !date) {
    errEl.textContent = "L'étudiant et la date sont obligatoires.";
    errEl.style.display = 'block';
    return;
  }

  if (!subject_id) {
    errEl.textContent = "Veuillez sélectionner la matière concernée par l'absence.";
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('btnSubmitAbsence');
  btn.disabled = true;
  btn.textContent = 'Enregistrement...';

  const payload = { student_id, date, status, subject_id };

  try {
    if (editingAbsenceId) {
      await API.absences.update(editingAbsenceId, payload);
      showAlert('Absence modifiée avec succès');
    } else {
      await API.absences.create(payload);
      showAlert('Absence enregistrée avec succès');
    }
    closeAbsenceModal();
    await loadAbsences();
  } catch (error) {
    errEl.textContent = error.message || "Erreur lors de l'enregistrement.";
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
      const absence = allAbsences.find((a) => String(a.id) === String(id));
      if (absence) openAbsenceModal(absence);
      return;
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
  if (btn) btn.addEventListener('click', () => openAbsenceModal());
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
  await Promise.all([loadStudents(), loadSubjects(), loadClasses()]);
  await loadAbsences();
});