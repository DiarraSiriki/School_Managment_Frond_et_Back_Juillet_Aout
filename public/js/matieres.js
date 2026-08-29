document.addEventListener('DOMContentLoaded', async () => {
  // --- 1. ÉLÉMENTS DU DOM ---
  const topDateText = document.getElementById('topDateText');
  const subjectSubtitle = document.getElementById('subjectSubtitle');
  const tableBody = document.getElementById('subjectsTableBody');
  const btnNewSubject = document.getElementById('btnNewSubject');
  
  const modal = document.getElementById('subjectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const formError = document.getElementById('formError');
  const subjectForm = document.getElementById('subjectForm');
  
  const inputId = document.getElementById('subjectId');
  const inputNom = document.getElementById('subjectNom');
  const selectClasse = document.getElementById('subjectClasse');
  const selectTeacher = document.getElementById('subjectTeacher');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const btnSubmitModal = document.getElementById('btnSubmitModal');

  let allSubjects = [];
  let allClasses = [];
  let allTeachers = [];

  // --- 2. FONCTIONS UTILITAIRES ---
  function showAlert(message, type = 'success') {
    const box = document.getElementById('alertBox');
    if (!box) return;
    box.textContent = message;
    box.className = `alert-box alert-${type} show`;
    clearTimeout(showAlert._timer);
    showAlert._timer = setTimeout(() => box.classList.remove('show'), 3500);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function renderDate() {
    if (!topDateText) return;
    const formatted = new Date().toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    topDateText.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // --- 3. CHARGEMENT DES DONNÉES ---
  async function loadData() {
    try {
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        API.subjects.getAll(),
        API.classes.getAll(),
        API.teachers.getAll()
      ]);

      allSubjects = Array.isArray(subjectsRes?.data) ? subjectsRes.data : (Array.isArray(subjectsRes) ? subjectsRes : []);
      allClasses = Array.isArray(classesRes?.data) ? classesRes.data : (Array.isArray(classesRes) ? classesRes : []);
      allTeachers = Array.isArray(teachersRes?.data) ? teachersRes.data : (Array.isArray(teachersRes) ? teachersRes : []);

      populateSelects();
      renderTable();
    } catch (err) {
      console.error('[loadData]', err);
      if (tableBody) {
        tableBody.innerHTML = `<tr class="table-state-row"><td colspan="4" style="text-align:center; color:red;">Erreur lors du chargement des données.</td></tr>`;
      }
    }
  }

  function populateSelects() {
    if (selectClasse) {
      selectClasse.innerHTML = '<option value="">Sélectionner une classe</option>' +
        allClasses.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');
    }

    if (selectTeacher) {
      selectTeacher.innerHTML = '<option value="">Aucun professeur attribué</option>' +
        allTeachers.map(t => `<option value="${t.id}">${escapeHtml(t.nom)}</option>`).join('');
    }
  }

  // --- 4. AFFICHAGE DU TABLEAU ---
  function renderTable() {
    if (subjectSubtitle) {
      subjectSubtitle.textContent = `${allSubjects.length} matière${allSubjects.length > 1 ? 's' : ''} au programme`;
    }

    if (allSubjects.length === 0) {
      tableBody.innerHTML = `<tr class="table-state-row"><td colspan="4" style="text-align:center;">Aucune matière enregistrée.</td></tr>`;
      return;
    }

    tableBody.innerHTML = allSubjects.map(s => {
      const className = allClasses.find(c => String(c.id) === String(s.classe_id))?.nom || '-';
      const teacherName = allTeachers.find(t => String(t.id) === String(s.teacher_id))?.nom || 'Non attribué';

      return `
        <tr>
          <td><strong>${escapeHtml(s.nom)}</strong></td>
          <td>${escapeHtml(className)}</td>
          <td>${escapeHtml(teacherName)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" data-action="edit" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-delete" data-action="delete" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- 5. GESTION DE LA MODALE ---
  function openModal(subject = null) {
    subjectForm.reset();
    formError.style.display = 'none';

    if (subject) {
      modalTitle.textContent = 'Modifier la matière';
      modalSubtitle.textContent = `Édition de : ${subject.nom}`;
      inputId.value = subject.id;
      inputNom.value = subject.nom || '';
      selectClasse.value = subject.classe_id || '';
      selectTeacher.value = subject.teacher_id || '';
    } else {
      modalTitle.textContent = 'Nouvelle matière';
      modalSubtitle.textContent = 'Renseignez les détails de la matière.';
      inputId.value = '';
    }

    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  // --- 6. ÉVÉNEMENTS & SOUMISSION ---
  if (btnNewSubject) btnNewSubject.addEventListener('click', () => openModal());
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const subject = allSubjects.find(s => String(s.id) === String(id));

    if (btn.dataset.action === 'edit' && subject) {
      openModal(subject);
    } else if (btn.dataset.action === 'delete' && subject) {
      if (confirm(`Voulez-vous vraiment supprimer la matière "${subject.nom}" ?`)) {
        try {
          await API.subjects.delete(id);
          showAlert('Matière supprimée avec succès.');
          await loadData();
        } catch (err) {
          showAlert(err.message || 'Erreur lors de la suppression.', 'error');
        }
      }
    }
  });

  subjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';

    const id = inputId.value;
    const payload = {
      nom: inputNom.value.trim(),
      classe_id: selectClasse.value ? Number(selectClasse.value) : null,
      teacher_id: selectTeacher.value ? Number(selectTeacher.value) : null
    };

    btnSubmitModal.disabled = true;
    btnSubmitModal.textContent = 'Enregistrement...';

    try {
      if (id) {
        await API.subjects.update(id, payload);
        showAlert('Matière modifiée avec succès.');
      } else {
        await API.subjects.create(payload);
        showAlert('Matière créée avec succès.');
      }

      closeModal();
      await loadData();
    } catch (err) {
      formError.textContent = err.message || 'Une erreur est survenue.';
      formError.style.display = 'block';
    } finally {
      btnSubmitModal.disabled = false;
      btnSubmitModal.textContent = 'Enregistrer';
    }
  });

  // --- 7. INITIALISATION ---
  renderDate();
  await loadData();
});