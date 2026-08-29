const ROLE_LABELS = {
  admin: 'Administrateur',
  teacher: 'Professeur',
  student: 'Étudiant'
};

const ROLE_BADGE_CLASS = {
  admin: 'badge-purple',
  teacher: 'badge-blue',
  student: 'badge-green'
};

const ROLE_AVATAR_CLASS = {
  admin: 'purple-bg',
  teacher: 'blue-bg',
  student: 'green-bg'
};

let allUsers = [];
let allClasses = [];
let currentFilter = 'all';
let searchTerm = '';

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

function getInitials(name) {
  if (typeof AuthGuard !== 'undefined' && AuthGuard.getInitials) {
    return AuthGuard.getInitials(name);
  }
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?';
}

function showAlert(message, type = 'success') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.textContent = message;
  box.className = `alert-box show alert-${type}`;
  clearTimeout(showAlert._timer);
  showAlert._timer = setTimeout(() => {
    box.classList.remove('show');
  }, 3500);
}

function updateRoleFields(role) {
  const studentGroup = document.getElementById('studentFieldsGroup');
  const teacherGroup = document.getElementById('teacherFieldsGroup');
  const fullNameGroup = document.getElementById('fullNameGroup');
  const userNameInput = document.getElementById('userName');

  const studentMatriculeInput = document.getElementById('studentMatriculeInput');
  const studentPrenomInput = document.getElementById('studentPrenomInput');
  const studentNomInput = document.getElementById('studentNomInput');
  const studentAgeInput = document.getElementById('studentAgeInput');
  const studentClasseInput = document.getElementById('studentClasseInput');
  const teacherMatiereInput = document.getElementById('teacherMatiereInput');
  const teacherClasseInput = document.getElementById('teacherClasseInput');

  if (studentGroup) studentGroup.style.display = 'none';
  if (teacherGroup) teacherGroup.style.display = 'none';

  if (studentMatriculeInput) studentMatriculeInput.required = false;
  if (studentPrenomInput) studentPrenomInput.required = false;
  if (studentNomInput) studentNomInput.required = false;
  if (studentAgeInput) studentAgeInput.required = false;
  if (studentClasseInput) studentClasseInput.required = false;
  if (teacherMatiereInput) teacherMatiereInput.required = false;
  if (teacherClasseInput) teacherClasseInput.required = false;
  if (userNameInput) userNameInput.required = false;

  if (role === 'student') {
    if (fullNameGroup) fullNameGroup.style.display = 'none';
    if (studentGroup) studentGroup.style.display = 'block';
    if (studentPrenomInput) studentPrenomInput.required = true;
    if (studentNomInput) studentNomInput.required = true;
    if (studentAgeInput) studentAgeInput.required = true;
    if (studentMatriculeInput) studentMatriculeInput.required = true;
    if (studentClasseInput) studentClasseInput.required = true;
  } else if (role === 'teacher') {
    if (fullNameGroup) fullNameGroup.style.display = 'block';
    if (userNameInput) userNameInput.required = true;
    if (teacherGroup) teacherGroup.style.display = 'block';
    if (teacherMatiereInput) teacherMatiereInput.required = true;
  } else {
    if (fullNameGroup) fullNameGroup.style.display = 'block';
    if (userNameInput) userNameInput.required = true;
  }
}

async function loadClasses() {
  try {
    const result = await API.classes.getAll();
    allClasses = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
    const datalist = document.getElementById('adminClasseList');
    if (datalist) {
      datalist.innerHTML = allClasses
        .map(c => `<option value="${(c.nom || '').replace(/"/g, '&quot;')}">`)
        .join('');
    }
  } catch (error) {
    console.error('[loadClasses]', error);
  }
}

function findClasseIdByName(classeName) {
  if (!classeName || !allClasses.length) return null;
  const normalized = classeName.trim().toLowerCase();
  const found = allClasses.find(c => (c.nom || '').trim().toLowerCase() === normalized);
  return found ? found.id : null;
}

async function loadUsers() {
  try {
    const result = await API.admin.getUsers();
    allUsers = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
    console.log('Utilisateurs chargés:', allUsers.length, allUsers);
    renderStats();
    renderTable();
  } catch (error) {
    document.getElementById('usersTableBody').innerHTML =
      `<tr class="table-state-row"><td colspan="4">Impossible de charger les utilisateurs. ${escapeHtml(error.message)}</td></tr>`;
    showAlert("Erreur lors du chargement des utilisateurs.", 'error');
  }
}

function renderStats() {
  const counts = { admin: 0, teacher: 0, student: 0 };
  allUsers.forEach(u => {
    if (counts[u.role] !== undefined) counts[u.role]++;
  });

  const statAdmin = document.getElementById('statAdmin');
  const statProf = document.getElementById('statProf');
  const statEtudiant = document.getElementById('statEtudiant');

  if (statAdmin) statAdmin.textContent = counts.admin;
  if (statProf) statProf.textContent = counts.teacher;
  if (statEtudiant) statEtudiant.textContent = counts.student;

  const total = allUsers.length;
  const subtitle = document.getElementById('userCountSubtitle');
  if (subtitle) {
    subtitle.textContent = `${total} compte${total > 1 ? 's' : ''} · ${counts.admin} admin, ${counts.teacher} prof, ${counts.student} étudiant${counts.student > 1 ? 's' : ''}`;
  }
}

function getFilteredUsers() {
  return allUsers.filter(u => {
    const matchesRole = currentFilter === 'all' || u.role === currentFilter;
    if (!matchesRole) return false;
    if (!searchTerm) return true;
    const haystack = `${u.name || ''} ${u.nom || ''} ${u.prenom || ''} ${u.email || ''}`.toLowerCase();
    return haystack.includes(searchTerm);
  });
}

function renderTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const users = getFilteredUsers();

  if (users.length === 0) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="4">Aucun utilisateur ne correspond à cette recherche.</td></tr>`;
    if (typeof AuthGuard !== 'undefined') AuthGuard.applyUI();
    return;
  }

  tbody.innerHTML = users.map(u => {
    const displayName = u.role === 'student'
      ? `${u.prenom || ''} ${u.nom || ''}`.trim() || u.name
      : u.role === 'teacher'
      ? u.nom || u.name
      : u.name;

    const initials = getInitials(displayName);
    const avatarClass = ROLE_AVATAR_CLASS[u.role] || 'blue-bg';
    const badgeClass = ROLE_BADGE_CLASS[u.role] || 'badge-blue';
    const roleLabel = ROLE_LABELS[u.role] || u.role;

    return `
      <tr>
        <td class="user-cell">
          <div class="circle-avatar ${avatarClass}">${escapeHtml(initials)}</div>
          <div>
            <strong>${escapeHtml(displayName)}</strong><br>
            <small>ID-${escapeHtml(String(u.id))}</small>
          </div>
        </td>
        <td>${escapeHtml(u.email || '')}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(roleLabel)}</span></td>
        <td data-perm="gerer_utilisateurs">
          <button class="btn-edit" data-action="edit" data-id="${u.id}" title="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="btn-delete" data-action="delete" data-id="${u.id}" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof AuthGuard !== 'undefined') AuthGuard.applyUI();
}

function setupSearch() {
  const filterButtons = document.getElementById('filterButtons');
  if (filterButtons) {
    filterButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-filter');
      if (!btn) return;
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.role;
      renderTable();
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderTable();
    });
  }
}

const modal = () => document.getElementById('userModal');

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nouvel utilisateur';
  document.getElementById('modalSubtitle').textContent = 'Créer un compte administrateur, professeur ou étudiant.';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userPassword').required = true;
  document.getElementById('passwordHint').textContent = 'Requis à la création.';

  // Remplir le select des classes pour les professeurs
  const teacherClasseInput = document.getElementById('teacherClasseInput');
  if (teacherClasseInput) {
    teacherClasseInput.innerHTML = '<option value="">Aucune classe assignée</option>' +
      allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');
  }

  const selectedRoleRadio = document.querySelector('input[name="userRole"]:checked') ||
                             document.querySelector('input[name="userRole"][value="student"]');

  if (selectedRoleRadio) {
    selectedRoleRadio.checked = true;
    updateRoleFields(selectedRoleRadio.value);
  } else {
    updateRoleFields('student');
  }

  hideFormError();
  modal().classList.add('show');
}

function openEditModal(user) {
  document.getElementById('modalTitle').textContent = 'Modifier l\'utilisateur';
  document.getElementById('modalSubtitle').textContent = `${user.name || ''} · ${ROLE_LABELS[user.role] || user.role}`;
  document.getElementById('userId').value = user.id;
  document.getElementById('userName').value = user.name || '';
  document.getElementById('userEmail').value = user.email || '';

  const roleToSet = user.role || 'student';
  const roleRadio = document.querySelector(`input[name="userRole"][value="${roleToSet}"]`);
  if (roleRadio) roleRadio.checked = true;

  updateRoleFields(roleToSet);

  if (roleToSet === 'student') {
    const prenomInput = document.getElementById('studentPrenomInput');
    const nomInput = document.getElementById('studentNomInput');
    const ageInput = document.getElementById('studentAgeInput');
    const matInput = document.getElementById('studentMatriculeInput');
    const classeInput = document.getElementById('studentClasseInput');

    if (prenomInput) prenomInput.value = user.prenom || '';
    if (nomInput) nomInput.value = user.nom || '';
    if (ageInput) ageInput.value = user.age != null ? user.age : '';
    if (matInput) matInput.value = user.matricule || '';

    if (classeInput) {
      const classe = allClasses.find(c => String(c.id) === String(user.classe_id));
      classeInput.value = classe ? classe.nom : '';
    }
  } else if (roleToSet === 'teacher') {
    const matieresInput = document.getElementById('teacherMatiereInput');
    const classeInput = document.getElementById('teacherClasseInput');
    
    if (matieresInput) matieresInput.value = user.matiere || '';
    
    // Remplir le select des classes
    if (classeInput) {
      classeInput.innerHTML = '<option value="">Aucune classe assignée</option>' +
        allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');
      classeInput.value = user.classe_id || '';
    }
  }

  document.getElementById('userPassword').value = '';
  document.getElementById('userPassword').required = false;
  document.getElementById('passwordHint').textContent = 'Laisser vide pour conserver le mot de passe actuel.';
  hideFormError();
  modal().classList.add('show');
}

function closeModal() {
  modal().classList.remove('show');
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
  const btnNewUser = document.getElementById('btnNewUser') || document.getElementById('btnNewStudent');
  if (btnNewUser) btnNewUser.addEventListener('click', openCreateModal);

  const btnCancel = document.getElementById('btnCancelModal');
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal()) {
    modal().addEventListener('click', (e) => {
      if (e.target === modal()) closeModal();
    });
  }

  document.querySelectorAll('input[name="userRole"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateRoleFields(e.target.value);
    });
  });

  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormError();

      const id = document.getElementById('userId').value;
      const email = document.getElementById('userEmail').value.trim();
      const roleRadio = document.querySelector('input[name="userRole"]:checked');
      const role = roleRadio ? roleRadio.value : '';
      const mot_passe = document.getElementById('userPassword').value;

      let name = document.getElementById('userName').value.trim();

      const payload = { email, role };
      if (mot_passe) payload.mot_passe = mot_passe;

      if (role === 'student') {
        const prenom = document.getElementById('studentPrenomInput')?.value.trim() || '';
        const nom = document.getElementById('studentNomInput')?.value.trim() || '';
        const age = document.getElementById('studentAgeInput')?.value;
        const matricule = document.getElementById('studentMatriculeInput')?.value.trim() || null;
        const classeName = document.getElementById('studentClasseInput')?.value.trim() || '';

        if (!prenom || !nom) {
          showFormError('Le prénom et le nom sont obligatoires pour un étudiant.');
          return;
        }
        if (!age) {
          showFormError('L\'âge est obligatoire pour un étudiant.');
          return;
        }
        if (!matricule) {
          showFormError('Le matricule est obligatoire pour un étudiant.');
          return;
        }
        if (!classeName) {
          showFormError('La classe est obligatoire pour un étudiant.');
          return;
        }

        // Nom libre : le backend trouve ou crée la classe automatiquement
        name = `${prenom} ${nom}`.trim();
        payload.name = name;
        payload.prenom = prenom;
        payload.nom = nom;
        payload.age = Number(age);
        payload.matricule = matricule;
        payload.classe = classeName;
        // Si la classe existe déjà, on envoie aussi l'id (optionnel)
        const existingId = findClasseIdByName(classeName);
        if (existingId) payload.classe_id = existingId;
      } else if (role === 'teacher') {
        if (!name) {
          showFormError('Le nom complet est obligatoire.');
          return;
        }
        payload.name = name;
        payload.matiere = document.getElementById('teacherMatiereInput')?.value.trim() || null;
        const classeId = document.getElementById('teacherClasseInput')?.value;
        if (classeId) payload.classe_id = Number(classeId);
      } else {
        if (!name) {
          showFormError('Le nom complet est obligatoire.');
          return;
        }
        payload.name = name;
      }

      const submitBtn = document.getElementById('btnSubmitModal');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enregistrement...';

      try {
        if (id) {
          await API.admin.updateUser(id, payload);
          showAlert('Utilisateur modifié avec succès.');
        } else {
          await API.admin.createUser(payload);
          showAlert('Utilisateur créé avec succès.');
        }
        closeModal();
        await loadUsers();
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
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const user = allUsers.find(u => String(u.id) === String(id));
    if (!user) return;

    if (btn.dataset.action === 'edit') {
      openEditModal(user);
      return;
    }

    if (btn.dataset.action === 'delete') {
      const currentUser = (typeof AuthGuard !== 'undefined') ? AuthGuard.getUser() : null;
      if (currentUser && String(currentUser.id) === String(user.id)) {
        showAlert("Vous ne pouvez pas supprimer votre propre compte.", 'error');
        return;
      }

      if (!confirm(`Supprimer définitivement ${user.name} ?`)) return;

      try {
        await API.admin.deleteUser(id);
        showAlert('Utilisateur supprimé.');
        await loadUsers();
      } catch (error) {
        showAlert(`Échec de la suppression : ${error.message}`, 'error');
      }
    }
  });
}

function renderTodayDate() {
  const el = document.getElementById('topDateText');
  if (!el) return;
  const formatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  renderTodayDate();
  updateCurrentUserDisplay();
  setupSearch();
  setupModal();
  setupTableActions();

  await loadClasses();
  await loadUsers();

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await API.auth.logout();
    });
  }
});