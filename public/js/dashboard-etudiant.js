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

let allStudents = [];
let allClasses = [];
let searchTerm = '';

async function loadClasses() {
  try {
    const result = await API.classes.getAll();
    allClasses = Array.isArray(result?.data)
      ? result.data
      : (Array.isArray(result) ? result : []);

    // Remplir le datalist (saisie libre)
    const datalist = document.getElementById('classeList');
    if (datalist) {
      datalist.innerHTML = allClasses
        .map(c => `<option value="${escapeHtml(c.nom)}"></option>`)
        .join('');
    }

    // Les classes peuvent aussi être créées automatiquement en saisissant un nouveau nom
    if (allClasses.length === 0) {
      console.info('[loadClasses] Aucune classe en base — vous pouvez en saisir une nouvelle à la main.');
    }
  } catch (error) {
    console.error('[loadClasses]', error);
    ShowAlert("Impossible de charger les classes : " + (error.message || 'erreur réseau'), 'error');
  }
}

function findClasseIdByName(classeName) {
  if (!classeName || !allClasses.length) return null;
  const normalized = String(classeName).trim().toLowerCase();
  const found = allClasses.find(c => (c.nom || '').trim().toLowerCase() === normalized);
  return found ? found.id : null;
}

function updateNiveauFromClasse() {
  const input = document.getElementById('studentClasse');
  const niveauInput = document.getElementById('studentNiveau');
  if (!input || !niveauInput) return;

  const classe = allClasses.find(c => (c.nom || '').trim().toLowerCase() === input.value.trim().toLowerCase());
  niveauInput.value = classe ? (classe.niveau || '') : '';
}

async function loadStudents() {
  try {
    const result = await API.students.getAll();
    allStudents = result.data || result || [];

    renderSubtitle();
    renderTable();
  } catch (error) {
    const tbody = document.getElementById('studensTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr class="table-state-row"><td colspan="5">Erreur : ${escapeHtml(error.message || 'Erreur serveur')}</td></tr>`;
    }
    ShowAlert("Impossible de charger les étudiants.", 'error');
  }
}

function getClasseName(classe_id) {
  if (!classe_id) return '-';
  const classe = allClasses.find(c => String(c.id) === String(classe_id));
  return classe ? classe.nom : '-';
}

function renderSubtitle() {
  const total = allStudents.length;
  const subtitle = document.getElementById('studuntSubtitle');
  if (subtitle) {
    subtitle.textContent = `${total} étudiant${total > 1 ? 's' : ''} inscrit${total > 1 ? 's' : ''}`;
  }
}

function getFilteredStudents() {
  if (!searchTerm) return allStudents;

  return allStudents.filter(s => {
    const currentClasseId = s.classe_id || s.class_id;
    const fullName = `${s.nom || ''} ${s.prenom || ''} ${s.matricule || ''} ${getClasseName(currentClasseId)}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
}

function renderTable() {
  const tbody = document.getElementById('studensTableBody');
  if (!tbody) return;

  const students = getFilteredStudents();

  if (students.length === 0) {
    tbody.innerHTML = `<tr class="table-state-row"><td colspan="5">Aucun étudiant ne correspond à cette recherche.</td></tr>`;
    if (typeof AuthGuard !== 'undefined') AuthGuard.applyUI();
    return;
  }

  tbody.innerHTML = students.map(s => {
    const classeId = s.classe_id || s.class_id;
    return `
      <tr>
        <td><strong>${escapeHtml(s.matricule || '-')}</strong></td>
        <td>${escapeHtml(s.nom || '')} ${escapeHtml(s.prenom || '')}</td>
        <td>${escapeHtml(getClasseName(classeId))}</td>
        <td>${escapeHtml(String(s.age ?? ''))}</td>
        <td data-perm="gerer_etudiants,modifier,supprimer">
          <button class="btn-edit" data-action="edit" data-id="${s.id}"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="btn-delete" data-action="delete" data-id="${s.id}"><i class="fa-regular fa-trash-can"></i></button>
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

const modal = () => document.getElementById('studentModal');

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nouvel étudiant';
  document.getElementById('modalSubtitle').textContent = 'Créer un étudiant et son compte de connexion.';
  document.getElementById('studentForm').reset();
  document.getElementById('studentId').value = '';

  const matInput = document.getElementById('studentMatricule');
  if (matInput) {
    matInput.value = '';
    matInput.readOnly = false;
  }

  document.getElementById('studentAccountGroup').style.display = 'block';
  document.getElementById('studentEmail').required = true;
  document.getElementById('studentPassword').required = true;
  document.getElementById('passwordHint').textContent = 'Requis à la création.';

  hideFormError();
  modal().classList.add('show');
}

function openEditModal(student) {
  document.getElementById('modalTitle').textContent = "Modifier l'étudiant";
  document.getElementById('modalSubtitle').textContent = `${student.nom || ''} ${student.prenom || ''} · ${student.matricule || ''}`;
  document.getElementById('studentId').value = student.id;

  const matInput = document.getElementById('studentMatricule');
  if (matInput) {
    matInput.value = student.matricule || '';
    matInput.readOnly = false;
  }

  document.getElementById('studentNom').value = student.nom || '';
  document.getElementById('studentPrenom').value = student.prenom || '';
  document.getElementById('studentAge').value = student.age || '';

  // Afficher le nom de la classe (saisie libre)
  const classeInput = document.getElementById('studentClasse');
  if (classeInput) {
    classeInput.value = getClasseName(student.classe_id || student.class_id);
    if (classeInput.value === '-') classeInput.value = '';
  }
  updateNiveauFromClasse();

  document.getElementById('studentAccountGroup').style.display = 'none';
  document.getElementById('studentEmail').required = false;
  document.getElementById('studentPassword').required = false;

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
  const btnNew = document.getElementById('btnNewStudent');
  const btnCancel = document.getElementById('btnCancelModal');
  const form = document.getElementById('studentForm');

  if (btnNew) btnNew.addEventListener('click', openCreateModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  const classeInput = document.getElementById('studentClasse');
  if (classeInput) {
    classeInput.addEventListener('change', updateNiveauFromClasse);
    classeInput.addEventListener('input', updateNiveauFromClasse);
  }

  if (modal()) {
    modal().addEventListener('click', (e) => {
      if (e.target === modal()) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormError();

      const id = document.getElementById('studentId').value;
      const matricule = document.getElementById('studentMatricule').value.trim();
      const nom = document.getElementById('studentNom').value.trim();
      const prenom = document.getElementById('studentPrenom').value.trim();
      const ageRaw = document.getElementById('studentAge').value;
      const age = ageRaw === '' ? null : Number(ageRaw);
      const classeName = document.getElementById('studentClasse').value.trim();

      if (!matricule) {
        showFormError('Le matricule est obligatoire.');
        return;
      }
      if (!nom || !prenom) {
        showFormError('Nom et prénom sont obligatoires.');
        return;
      }
      if (age === null || Number.isNaN(age) || age < 1) {
        showFormError('Veuillez indiquer un âge valide.');
        return;
      }
      if (!classeName) {
        showFormError('Veuillez indiquer une classe.');
        return;
      }

      // Nom libre : le backend trouve ou crée la classe si besoin
      const existingId = findClasseIdByName(classeName);
      const classePayload = { classe: classeName };
      if (existingId) classePayload.classe_id = existingId;

      const submitBtn = document.getElementById('btnSubmitModal');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enregistrement...';

      try {
        if (id) {
          await API.students.update(id, { matricule, nom, prenom, age, ...classePayload });
          ShowAlert('Étudiant modifié avec succès.');
        } else {
          const email = document.getElementById('studentEmail').value.trim();
          const mot_passe = document.getElementById('studentPassword').value;
          if (!email || !mot_passe) {
            showFormError('Email et mot de passe sont obligatoires à la création.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enregistrer';
            return;
          }
          await API.students.create({ matricule, nom, prenom, age, email, mot_passe, ...classePayload });
          ShowAlert('Étudiant créé avec succès.');
        }
        closeModal();
        await loadStudents();
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
  const tbody = document.getElementById('studensTableBody');
  if (!tbody) return;

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const student = allStudents.find(s => String(s.id) === String(id));
    if (!student) return;

    if (btn.dataset.action === 'edit') {
      openEditModal(student);
      return;
    }

    if (btn.dataset.action === 'delete') {
      if (!confirm(`Supprimer définitivement ${student.nom} ${student.prenom} ?`)) return;

      try {
        await API.students.delete(id);
        ShowAlert('Étudiant supprimé.');
        await loadStudents();
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
  await loadClasses();
  await loadStudents();
});