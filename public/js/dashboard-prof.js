function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function ShowAlert(message, type = 'success') {
  const box = document.getElementById('alertBox');
  if (!box) return;

  box.textContent = message;
  box.className = `alert-box alert-${type} show`;

  clearTimeout(ShowAlert._timer);
  ShowAlert._timer = setTimeout(() => box.classList.remove('show'), 3500);
}

function renderTodayDate() {
  const ladate = document.getElementById('TopDateText');
  if (!ladate) return;

  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  ladate.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

let allTeachers = [];
let allSubjects = [];
let allUsers = [];
let allClasses = [];
let searchTerm = '';

async function loadSubjects() {
  try {
    const result = await API.subjects.getAll();
    allSubjects = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error('[loadSubjects]', error);
    allSubjects = [];
  }
}

async function loadUsers() {
  try {
    const result = await API.admin.getUsers();
    allUsers = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error('[loadUsers]', error);
    allUsers = [];
  }
}

async function loadClasses() {
  try {
    const result = await API.classes.getAll();
    allClasses = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error('[loadClasses]', error);
    allClasses = [];
  }
}

async function loadTeachers() {
  try {
    const result = await API.teachers.getAll();
    allTeachers = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);

    await loadClasses();
    renderSubtitle();
    renderTable();
  } catch (error) {
    const tbody = document.getElementById('teachersTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="4">Erreur : ${escapeHtml(error.message || 'Erreur serveur')}</td></tr>`;
    }
    ShowAlert("Impossible de charger les professeurs.", 'error');
  }
}

function getClassesForTeacher(teacherId) {
  const teacher = allTeachers.find(t => String(t.id) === String(teacherId));
  const classes = [];

  // Classe principale du professeur
  if (teacher && teacher.classe_id) {
    const classe = allClasses.find(c => String(c.id) === String(teacher.classe_id));
    if (classe) classes.push(classe.nom);
  }

  // Classes via les matières enseignées
  const subjectClasses = allSubjects
    .filter(s => String(s.teacher_id) === String(teacherId) && s.classe_id)
    .map(s => {
      const classe = allClasses.find(c => String(c.id) === String(s.classe_id));
      return classe ? classe.nom : null;
    })
    .filter(Boolean);

  classes.push(...subjectClasses);

  return [...new Set(classes)];
}

function getEmailForTeacher(userId) {
  if (!userId) return '';
  const user = allUsers.find(u => String(u.id) === String(userId));
  return user ? (user.email || '') : '';
}

function getInitial(nom) {
  const trimmed = (nom || '').trim();
  const parts = trimmed.split(' ').filter(Boolean);
  const lastPart = parts[parts.length - 1] || trimmed;
  return (lastPart.charAt(0) || '?').toUpperCase();
}

function renderSubtitle() {
  const total = allTeachers.length;
  const subtitle = document.getElementById('profSubtitle');
  if (subtitle) {
    subtitle.textContent = `${total} enseignant${total > 1 ? 's' : ''}`;
  }
}

function getFilteredTeachers() {
  if (!searchTerm) return allTeachers;

  return allTeachers.filter(t => {
    const classes = getClassesForTeacher(t.id).join(' ');
    const haystack = `${t.nom || ''} ${t.matiere || ''} ${classes}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });
}

function renderTable() {
  const tbody = document.getElementById('teachersTableBody');
  if (!tbody) return;

  const teachers = getFilteredTeachers();

  if (teachers.length === 0) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="4">Aucun professeur ne correspond à cette recherche.</td></tr>`;
    if (typeof AuthGuard !== 'undefined') AuthGuard.applyUI();
    return;
  }

  tbody.innerHTML = teachers.map(t => {
    const classes = getClassesForTeacher(t.id);
    const classesText = classes.length > 0 ? classes.join(', ') : '-';

    return `
      <tr>
        <td class="user-cell">
          <div class="circle-avatar light-blue-bg">${escapeHtml(getInitial(t.nom))}</div>
          <strong>${escapeHtml(t.nom || '')}</strong>
        </td>
        <td><span class="badge badge-light-blue">${escapeHtml(t.matiere || '-')}</span></td>
        <td><strong class="classes-text">${escapeHtml(classesText)}</strong></td>
        <td data-perm="gerer_professeurs,modifier,supprimer">
          <button class="btn-edit" data-action="edit" data-id="${t.id}"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="btn-delete" data-action="delete" data-id="${t.id}"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof AuthGuard !== 'undefined') AuthGuard.applyUI();
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderTable();
  });
}

const modal = () => document.getElementById('teacherModal');

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nouveau professeur';
  document.getElementById('modalSubtitle').textContent = 'Créer un professeur et son compte de connexion.';
  document.getElementById('teacherForm').reset();
  document.getElementById('teacherId').value = '';

  // Remplir le select des classes
  const classeSelect = document.getElementById('teacherClasse');
  classeSelect.innerHTML = '<option value="">Aucune classe assignée</option>' +
    allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');

  document.getElementById('teacherAccountGroup').style.display = 'block';
  document.getElementById('teacherEmail').required = true;
  document.getElementById('teacherPassword').required = true;
  document.getElementById('passwordHint').textContent = 'Requis à la création.';

  hideFormError();
  modal().classList.add('show');
}

function openEditModal(teacher) {
  document.getElementById('modalTitle').textContent = "Modifier le professeur";
  document.getElementById('modalSubtitle').textContent = `${teacher.nom || ''} · ${teacher.matiere || ''}`;
  document.getElementById('teacherId').value = teacher.id;

  document.getElementById('teacherNom').value = teacher.nom || '';
  document.getElementById('teacherMatiere').value = teacher.matiere || '';

  // Remplir le select des classes
  const classeSelect = document.getElementById('teacherClasse');
  classeSelect.innerHTML = '<option value="">Aucune classe assignée</option>' +
    allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');
  classeSelect.value = teacher.classe_id || '';

  document.getElementById('teacherEmail').value = getEmailForTeacher(teacher.user_id);
  document.getElementById('teacherPassword').value = '';

  document.getElementById('teacherAccountGroup').style.display = 'block';
  document.getElementById('teacherEmail').required = false;
  document.getElementById('teacherPassword').required = false;
  document.getElementById('passwordHint').textContent = 'Laisser vide pour ne pas changer le mot de passe.';

  hideFormError();
  modal().classList.add('show');
}

function closeModal() {
  if (modal()) modal().classList.remove('show');
}

function showFormError(message) {
  const box = document.getElementById('formError');
  if (!box) return;
  box.textContent = message;
  box.classList.add('show');
}

function hideFormError() {
  const box = document.getElementById('formError');
  if (!box) return;
  box.textContent = '';
  box.classList.remove('show');
}

function setupModal() {
  const btnNew = document.getElementById('btnNewTeacher');
  const btnCancel = document.getElementById('btnCancelModal');
  const form = document.getElementById('teacherForm');

  if (btnNew) btnNew.addEventListener('click', openCreateModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal()) {
    modal().addEventListener('click', (e) => {
      if (e.target === modal()) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormError();

      const id = document.getElementById('teacherId').value;
      const nom = document.getElementById('teacherNom').value.trim();
      const matiere = document.getElementById('teacherMatiere').value.trim();
      const classe_id = document.getElementById('teacherClasse').value ? Number(document.getElementById('teacherClasse').value) : null;
      const email = document.getElementById('teacherEmail').value.trim();
      const password = document.getElementById('teacherPassword').value;

      if (!nom) {
        showFormError('Le nom est obligatoire.');
        return;
      }
      if (!matiere) {
        showFormError('La discipline est obligatoire.');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitModal');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enregistrement...';

      try {
        if (id) {
          const payload = { nom, matiere, classe_id };
          if (email) payload.email = email;
          if (password) payload.password = password;

          await API.teachers.update(id, payload);
          ShowAlert('Professeur modifié avec succès.');
        } else {
          if (!email || !password) {
            showFormError('Email et mot de passe sont obligatoires à la création.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enregistrer';
            return;
          }
          await API.teachers.create({ nom, matiere, classe_id, email, password });
          ShowAlert('Professeur créé avec succès.');
        }
        closeModal();
        await Promise.all([loadUsers(), loadSubjects()]);
        await loadTeachers();
      } catch (error) {
        showFormError(error.message || "Une erreur est survenue.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
      }
    });
  }
}

function setupTableActions() {
  const tbody = document.getElementById('teachersTableBody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const teacher = allTeachers.find(t => String(t.id) === String(id));
    if (!teacher) return;

    if (btn.dataset.action === 'edit') {
      openEditModal(teacher);
      return;
    }

    if (btn.dataset.action === 'delete') {
      if (!confirm(`Supprimer définitivement ${teacher.nom} ?`)) return;

      try {
        await API.teachers.delete(id);
        ShowAlert('Professeur supprimé.');
        await loadTeachers();
      } catch (error) {
        ShowAlert(`Échec de la suppression : ${error.message}`, 'error');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  renderTodayDate();
  setupSearch();
  setupModal();
  setupTableActions();
  await Promise.all([loadSubjects(), loadUsers()]);
  await loadTeachers();
});