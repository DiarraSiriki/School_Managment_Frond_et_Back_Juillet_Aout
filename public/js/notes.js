document.addEventListener('DOMContentLoaded', async () => {
  const topDateText = document.getElementById('topDateText');
  const gradeSubtitle = document.getElementById('gradeSubtitle');
  const tableBody = document.getElementById('gradesTableBody');
  const btnNewGrade = document.getElementById('btnNewGrade');

  const modal = document.getElementById('gradeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const formError = document.getElementById('formError');
  const gradeForm = document.getElementById('gradeForm');

  const inputId = document.getElementById('gradeId');
  const selectStudent = document.getElementById('gradeStudent');
  const selectSubject = document.getElementById('gradeSubject');
  const inputValeur = document.getElementById('gradeValue');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const btnSubmitModal = document.getElementById('btnSubmitModal');

  let allGrades = [];
  let allStudents = [];
  let allSubjects = [];
  let allClasses = [];

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

  function currentRole() {
    try {
      return (typeof AuthGuard !== 'undefined' && AuthGuard.getRole)
        ? AuthGuard.getRole()
        : (JSON.parse(localStorage.getItem('user') || 'null')?.role || null);
    } catch (_) {
      return null;
    }
  }

  function resolveClassName(student, subject, grade) {
    // 1. Nom déjà fourni par le backend (JOIN)
    if (student?.classe_nom) return student.classe_nom;
    if (student?.classe) return student.classe;

    // 2. Recherche dans la liste des classes
    if (student?.classe_id && allClasses.length) {
      const found = allClasses.find(c => String(c.id) === String(student.classe_id));
      if (found?.nom) return found.nom;
    }
    if (subject?.classe_id && allClasses.length) {
      const found = allClasses.find(c => String(c.id) === String(subject.classe_id));
      if (found?.nom) return found.nom;
    }

    return grade?.classe || '-';
  }

  async function loadData() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      const role = currentUser?.role;

      // ========== ÉTUDIANT : uniquement SES notes ==========
      if (role === 'student') {
        if (btnNewGrade) btnNewGrade.style.display = 'none';

        const profile = await API.students.getMyProfile();
        const me = profile?.data || profile;
        const studentId = me?.id;
        if (!studentId) {
          throw new Error('Profil étudiant introuvable.');
        }

        const gradesRes = await API.grades.getByStudent(studentId);
        allGrades = Array.isArray(gradesRes?.data)
          ? gradesRes.data
          : (Array.isArray(gradesRes) ? gradesRes : []);

        // Profil contient classe_nom (JOIN backend) + classe_id
        allStudents = [me];

        try {
          const subjectsRes = await API.subjects.getAll();
          allSubjects = Array.isArray(subjectsRes?.data)
            ? subjectsRes.data
            : (Array.isArray(subjectsRes) ? subjectsRes : []);
        } catch (_) {
          allSubjects = [];
        }

        // Classes : autorisé maintenant pour les étudiants (lecture seule)
        try {
          const classesRes = await API.classes.getAll();
          allClasses = Array.isArray(classesRes?.data)
            ? classesRes.data
            : (Array.isArray(classesRes) ? classesRes : []);
        } catch (_) {
          // Fallback : construire à partir du profil
          allClasses = [];
          if (me.classe_id) {
            allClasses = [{
              id: me.classe_id,
              nom: me.classe_nom || me.classe || '-'
            }];
          }
        }

        populateSelects();
        renderTable();
        return;
      }

      // ========== ADMIN / PROF ==========
      const [gradesRes, studentsRes, subjectsRes, classesRes] = await Promise.all([
        API.grades.getAll(),
        API.students.getAll(),
        API.subjects.getAll(),
        API.classes.getAll()
      ]);

      allGrades = Array.isArray(gradesRes?.data) ? gradesRes.data : (Array.isArray(gradesRes) ? gradesRes : []);
      allStudents = Array.isArray(studentsRes?.data) ? studentsRes.data : (Array.isArray(studentsRes) ? studentsRes : []);
      allSubjects = Array.isArray(subjectsRes?.data) ? subjectsRes.data : (Array.isArray(subjectsRes) ? subjectsRes : []);
      allClasses = Array.isArray(classesRes?.data) ? classesRes.data : (Array.isArray(classesRes) ? classesRes : []);

      populateSelects();
      renderTable();
    } catch (err) {
      console.error('[loadData]', err);
      if (tableBody) {
        tableBody.innerHTML = `<tr class="table-state-row"><td colspan="5" style="text-align:center; color:#dc2626;">Erreur lors du chargement des données.</td></tr>`;
      }
    }
  }

  function populateSelects() {
    if (selectStudent) {
      selectStudent.innerHTML = '<option value="">Sélectionner un étudiant</option>' +
        allStudents.map(s => {
          const name = s.nom ? `${s.nom} ${s.prenom || ''}`.trim() : (s.name || `Étudiant #${s.id}`);
          return `<option value="${s.id}">${escapeHtml(name)}</option>`;
        }).join('');
    }

    if (selectSubject) {
      selectSubject.innerHTML = '<option value="">Sélectionner une matière</option>' +
        allSubjects.map(s => `<option value="${s.id}">${escapeHtml(s.nom)}</option>`).join('');
    }
  }

  function renderTable() {
    const role = currentRole();
    const canEdit = role === 'admin' || role === 'teacher';
    const canDelete = role === 'admin';

    let subtitle = `${allGrades.length} note${allGrades.length > 1 ? 's' : ''} enregistrée${allGrades.length > 1 ? 's' : ''}`;
    if (role === 'student' && allGrades.length > 0) {
      const vals = allGrades.map(g => Number(g.valeur ?? g.note ?? 0)).filter(n => !Number.isNaN(n));
      if (vals.length) {
        const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
        subtitle += ` · Moyenne : ${moy.toFixed(2)}/20`;
      }
    }
    if (gradeSubtitle) gradeSubtitle.textContent = subtitle;

    if (!tableBody) return;

    if (allGrades.length === 0) {
      tableBody.innerHTML = `<tr class="table-state-row"><td colspan="5" style="text-align:center;">Aucune note enregistrée.</td></tr>`;
      return;
    }

    tableBody.innerHTML = allGrades.map(g => {
      const student = allStudents.find(s => String(s.id) === String(g.student_id));
      const studentName = student
        ? `${student.nom || ''} ${student.prenom || ''}`.trim()
        : (g.student_nom || 'Étudiant inconnu');

      const subject = allSubjects.find(s => String(s.id) === String(g.subject_id));
      const subjectName = subject ? subject.nom : (g.subject_nom || '-');

      const className = resolveClassName(student, subject, g);

      const val = Number(g.valeur ?? g.note ?? 0);
      let gradeClass = 'grade-medium';
      if (val >= 14) gradeClass = 'grade-high';
      else if (val < 10) gradeClass = 'grade-low';

      let actions = '';
      if (canEdit || canDelete) {
        actions = '<div class="action-buttons">';
        if (canEdit) actions += `<button class="btn-edit" data-action="edit" data-id="${g.id}"><i class="fa-solid fa-pen"></i></button>`;
        if (canDelete) actions += `<button class="btn-delete" data-action="delete" data-id="${g.id}"><i class="fa-solid fa-trash"></i></button>`;
        actions += '</div>';
      } else {
        actions = '<span style="color:#94a3b8;">—</span>';
      }

      return `
        <tr>
          <td><strong>${escapeHtml(studentName)}</strong></td>
          <td>${escapeHtml(className)}</td>
          <td>${escapeHtml(subjectName)}</td>
          <td><span class="grade ${gradeClass}">${val}/20</span></td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');
  }

  function openModal(grade = null) {
    if (!gradeForm) return;
    gradeForm.reset();
    if (formError) formError.style.display = 'none';

    if (grade) {
      if (modalTitle) modalTitle.textContent = 'Modifier la note';
      if (modalSubtitle) modalSubtitle.textContent = "Ajustement de la note de l'élève";
      if (inputId) inputId.value = grade.id;
      if (selectStudent) selectStudent.value = grade.student_id || '';
      if (selectSubject) selectSubject.value = grade.subject_id || '';
      if (inputValeur) inputValeur.value = grade.valeur ?? grade.note ?? '';
    } else {
      if (modalTitle) modalTitle.textContent = 'Saisir une note';
      if (modalSubtitle) modalSubtitle.textContent = "Renseignez les détails de la note de l'élève.";
      if (inputId) inputId.value = '';
    }

    if (modal) modal.classList.add('show');
  }

  function closeModal() {
    if (modal) modal.classList.remove('show');
  }

  if (btnNewGrade) btnNewGrade.addEventListener('click', () => openModal());
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (tableBody) {
    tableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const id = btn.dataset.id;
      const grade = allGrades.find(g => String(g.id) === String(id));

      if (btn.dataset.action === 'edit' && grade) {
        openModal(grade);
      } else if (btn.dataset.action === 'delete' && grade) {
        if (confirm('Voulez-vous vraiment supprimer cette note ?')) {
          try {
            await API.grades.delete(id);
            showAlert('Note supprimée avec succès.');
            await loadData();
          } catch (err) {
            showAlert(err.message || 'Erreur lors de la suppression.', 'error');
          }
        }
      }
    });
  }

  if (gradeForm) {
    gradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (formError) formError.style.display = 'none';

      const id = inputId?.value;
      const payload = {
        student_id: Number(selectStudent?.value),
        subject_id: Number(selectSubject?.value),
        note: Number(inputValeur?.value),
        valeur: Number(inputValeur?.value)
      };

      if (btnSubmitModal) {
        btnSubmitModal.disabled = true;
        btnSubmitModal.textContent = 'Enregistrement...';
      }

      try {
        if (id) {
          await API.grades.update(id, payload);
          showAlert('Note modifiée avec succès.');
        } else {
          await API.grades.create(payload);
          showAlert('Note ajoutée avec succès.');
        }

        closeModal();
        await loadData();
      } catch (err) {
        if (formError) {
          formError.textContent = err.message || 'Une erreur est survenue.';
          formError.style.display = 'block';
        }
      } finally {
        if (btnSubmitModal) {
          btnSubmitModal.disabled = false;
          btnSubmitModal.textContent = 'Enregistrer';
        }
      }
    });
  }

  function setupLogout() {
    const logoutIcon = document.querySelector('.logout-icon, .logout-btn');
    if (logoutIcon) {
      logoutIcon.addEventListener('click', async () => {
        try {
          await API.auth.logout();
        } catch (error) {
          console.error('Erreur de déconnexion:', error);
        } finally {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      });
    }
  }

  renderDate();
  setupLogout();
  await loadData();
});