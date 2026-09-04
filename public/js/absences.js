// Gestion de la page Absences — création + édition
// Champs : étudiant, classe, matière (subject), date, statut

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

/** Normalise une matière (API peut renvoyer nom / name / libelle) */
function normalizeSubject(s) {
  if (!s) return null;
  return {
    id: s.id ?? s.subject_id,
    nom: s.nom || s.name || s.libelle || s.title || ('Matière #' + s.id),
    classe_id: s.classe_id ?? s.class_id ?? null
  };
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
    const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    allSubjects = raw.map(normalizeSubject).filter(Boolean);
    console.log('[loadSubjects]', allSubjects.length, 'matières', allSubjects);
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

function getSubjectsForStudent(studentId) {
  if (!studentId || !allSubjects.length) return allSubjects;
  const s = getStudentById(studentId);
  if (!s || s.classe_id == null || s.classe_id === '') return allSubjects;
  const filtered = allSubjects.filter(
    (sub) => String(sub.classe_id) === String(s.classe_id)
  );
  return filtered.length > 0 ? filtered : allSubjects;
}

function resolveMatiereLabel(a) {
  let label = a.matiere || a.matiere_nom || a.subject_name || a.subject_nom || '';
  if (label) return label;
  const sid = a.subject_id ?? a.matiere_id;
  if (sid != null) {
    const sub = allSubjects.find((s) => String(s.id) === String(sid));
    if (sub) return sub.nom;
  }
  return '-';
}

async function loadAbsences() {
  try {
    const res = await API.absences.getAll();
    allAbsences = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    renderStats();
    renderTable();
  } catch (error) {
    console.error('Erreur chargement absences:', error);
    const tbody = document.querySelector('.table-container tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erreur: ${escapeHtml(error.message)}</td></tr>`;
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
    const hay = `${a.student_name || ''} ${a.classe || ''} ${a.matiere || ''} ${resolveMatiereLabel(a)}`.toLowerCase();
    return hay.includes(searchTerm);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucune absence trouvée.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((a) => {
      const statusLabel = a.status || '-';
      const statusClass = a.status === 'justifiée' ? 'badge-success' : 'badge-warning';
      const matiereLabel = resolveMatiereLabel(a);
      return `
      <tr>
        <td><strong>${escapeHtml(a.student_name || 'Inconnu')}</strong></td>
        <td>${escapeHtml(a.classe || '-')}</td>
        <td>${escapeHtml(matiereLabel)}</td>
        <td>${escapeHtml(a.date || '-')}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
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

function fillClassSelect(selectedClassId) {
  const classSelect = document.getElementById('absenceClasse');
  if (!classSelect) return;

  classSelect.innerHTML =
    '<option value="">Sélectionner une classe</option>' +
    allClasses
      .map((c) => {
        const label = c.nom || c.name || ('Classe #' + c.id);
        return `<option value="${c.id}">${escapeHtml(label)}</option>`;
      })
      .join('');

  if (selectedClassId != null && selectedClassId !== '') {
    classSelect.value = String(selectedClassId);
  }
}

function fillSubjectSelect(studentId, selectedSubjectId) {
  const subjectSelect = document.getElementById('absenceMatiere');
  if (!subjectSelect) {
    console.warn('[fillSubjectSelect] #absenceMatiere introuvable');
    return;
  }

  const list = studentId ? getSubjectsForStudent(studentId) : allSubjects;

  if (!allSubjects.length) {
    subjectSelect.innerHTML = '<option value="">Aucune matière — créez-en dans Matières</option>';
    return;
  }

  subjectSelect.innerHTML =
    '<option value="">Sélectionner une matière</option>' +
    list.map((s) => `<option value="${s.id}">${escapeHtml(s.nom)}</option>`).join('');

  if (selectedSubjectId != null && selectedSubjectId !== '') {
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
}

function fillSelects(selectedStudentId, selectedSubjectId, selectedClassId) {
  const studentSelect = document.getElementById('absenceStudent');
  if (!studentSelect) return;

  studentSelect.innerHTML =
    '<option value="">Sélectionner un étudiant</option>' +
    allStudents
      .map((s) => {
        const name =
          ((s.prenom || '') + ' ' + (s.nom || '')).trim() ||
          s.name ||
          ('Étudiant #' + s.id);
        return `<option value="${s.id}">${escapeHtml(name)}</option>`;
      })
      .join('');

  if (selectedStudentId != null && selectedStudentId !== '') {
    studentSelect.value = String(selectedStudentId);
  }

  let classId = selectedClassId;
  if (selectedStudentId) {
    const s = getStudentById(selectedStudentId);
    if (s && s.classe_id != null) classId = s.classe_id;
  }
  fillClassSelect(classId);
  fillSubjectSelect(selectedStudentId, selectedSubjectId);
}

async function openAbsenceModal(absence = null) {
  await Promise.all([loadSubjects(), loadClasses()]);
  if (!allStudents.length) await loadStudents();

  editingAbsenceId = absence ? absence.id : null;

  const errEl = document.getElementById('formError');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }

  const titleEl = document.getElementById('modalTitle');
  const subtitleEl = document.getElementById('modalSubtitle');

  if (absence) {
    if (titleEl) titleEl.textContent = "Modifier l'absence";
    if (subtitleEl) {
      subtitleEl.textContent =
        "Modifiez l'étudiant, la classe, la matière, la date ou le statut.";
    }
    const subjectId = absence.subject_id ?? absence.matiere_id ?? null;
    const classId = absence.classe_id ?? null;
    fillSelects(absence.student_id, subjectId, classId);
    const dateEl = document.getElementById('absenceDate');
    if (dateEl) dateEl.value = (absence.date || '').slice(0, 10);
    const statusEl = document.getElementById('absenceStatus');
    if (statusEl) {
      statusEl.value =
        absence.status === 'justifiée' ? 'justifiée' : 'non justifiée';
    }
  } else {
    if (titleEl) titleEl.textContent = 'Signaler une absence';
    if (subtitleEl) {
      subtitleEl.textContent = "Renseignez les informations de l'absence.";
    }
    fillSelects(null, null, null);
    const dateEl = document.getElementById('absenceDate');
    if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
    const statusEl = document.getElementById('absenceStatus');
    if (statusEl) statusEl.value = 'non justifiée';
  }

  const modal = document.getElementById('absenceModal');
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }
}

function closeAbsenceModal() {
  const modal = document.getElementById('absenceModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  editingAbsenceId = null;
}

async function submitAbsence(e) {
  if (e) e.preventDefault();

  const errEl = document.getElementById('formError');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }

  const studentEl = document.getElementById('absenceStudent');
  const dateEl = document.getElementById('absenceDate');
  const statusEl = document.getElementById('absenceStatus');
  const matiereEl = document.getElementById('absenceMatiere');
  const classeEl = document.getElementById('absenceClasse');

  const student_id = studentEl ? Number(studentEl.value) : 0;
  const date = dateEl ? dateEl.value : '';
  const status = statusEl ? statusEl.value : 'non justifiée';
  const subjectRaw = matiereEl ? matiereEl.value : '';
  const subject_id = subjectRaw ? Number(subjectRaw) : null;
  const classeRaw = classeEl ? classeEl.value : '';
  const classe_id = classeRaw ? Number(classeRaw) : null;

  if (!student_id || !date) {
    if (errEl) {
      errEl.textContent = "L'étudiant et la date sont obligatoires.";
      errEl.style.display = 'block';
    }
    return;
  }

  if (!subject_id) {
    if (errEl) {
      errEl.textContent =
        "Veuillez sélectionner la matière concernée par l'absence.";
      errEl.style.display = 'block';
    }
    return;
  }

  const btn = document.getElementById('btnSubmitModal');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enregistrement...';
  }

  const payload = { student_id, date, status, subject_id };
  if (classe_id) payload.classe_id = classe_id;

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
    if (errEl) {
      errEl.textContent =
        error.message || "Erreur lors de l'enregistrement.";
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Enregistrer';
    }
  }
}

function setupModalListeners() {
  const modal = document.getElementById('absenceModal');
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAbsenceModal();
  });

  const btnCancel = document.getElementById('btnCancelModal');
  if (btnCancel) btnCancel.addEventListener('click', closeAbsenceModal);

  const form = document.getElementById('absenceForm');
  if (form) form.addEventListener('submit', submitAbsence);

  const studentSelect = document.getElementById('absenceStudent');
  if (studentSelect) {
    studentSelect.addEventListener('change', () => {
      const sid = studentSelect.value;
      const s = getStudentById(sid);
      if (s && s.classe_id != null) {
        const classSelect = document.getElementById('absenceClasse');
        if (classSelect) classSelect.value = String(s.classe_id);
      }
      fillSubjectSelect(sid || null, null);
    });
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
        showAlert('Erreur: ' + error.message, 'error');
      }
    }
  });
}

function setupNewAbsenceButton() {
  const btn =
    document.getElementById('btnNewAbsence') ||
    document.querySelector('.page-header .btn-primary');
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
  setupModalListeners();
  setupLogout();

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const role = currentUser?.role;

  if (role === 'student') {
    const btn =
      document.getElementById('btnNewAbsence') ||
      document.querySelector('.page-header .btn-primary');
    if (btn) btn.style.display = 'none';
    try {
      const profile = await API.students.getMyProfile();
      const me = profile?.data || profile;
      if (me?.id) {
        allStudents = [me];
        const res = await API.absences.getByStudent(me.id);
        allAbsences = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      }
      await loadSubjects();
    } catch (e) {
      console.error('[absences student]', e);
      allAbsences = [];
    }
    renderStats();
    renderTable();
    return;
  }

  await Promise.all([loadStudents(), loadSubjects(), loadClasses()]);
  await loadAbsences();
});