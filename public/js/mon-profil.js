/**
 * mon-profil.js
 * Charge le profil selon le rôle :
 * - student  → API.students.getMyProfile() (+ classe_nom via JOIN backend)
 * - teacher  → API.teachers.getMyProfile()
 * - admin    → localStorage
 */
document.addEventListener('DOMContentLoaded', async () => {
  // ---------- Date ----------
  const dateEl = document.getElementById('topDateText');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ---------- Utilisateur local ----------
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (_) {
      return null;
    }
  })();

  if (!user) {
    window.location.href = '/login';
    return;
  }

  const role = (typeof AuthGuard !== 'undefined' && AuthGuard.normalizeRole)
    ? AuthGuard.normalizeRole(user.role)
    : String(user.role || '').toLowerCase();

  // ---------- Helpers UI ----------
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = (value != null && value !== '') ? value : '-';
  }

  function setInitials(fullName) {
    const initials = fullName
      ? fullName.split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?';
    setText('userAvatar', initials);
    setText('sidebarAvatar', initials[0] || 'A');
  }

  function fillUI({ fullName, roleLabel, email, matricule, nom, prenom, classe }) {
    setText('userName', fullName);
    setText('userRole', roleLabel);
    setText('userEmail', email);
    setText('userMatricule', matricule);
    setText('userNameDetail', nom);
    setText('userPrenomsDetail', prenom);
    setText('userClassDetail', classe);
    setText('userLastLogin', user.lastLogin || "Aujourd'hui");
    setText('sidebarUserName', fullName);
    setText('sidebarUserRole', roleLabel);
    setInitials(fullName);
  }

  function fallbackFromLocalStorage() {
    const fullName = user.name || 'Utilisateur';
    fillUI({
      fullName,
      roleLabel: role || 'Utilisateur',
      email: user.email || '-',
      matricule: user.matricule || '-',
      nom: user.nom || fullName.split(/\s+/)[0] || '-',
      prenom: user.prenoms || user.prenom || fullName.split(/\s+/).slice(1).join(' ') || '-',
      classe: user.classe || '-'
    });
  }

  // ---------- STUDENT ----------
  if (role === 'student') {
    try {
      const profile = await API.students.getMyProfile();
      const student = profile?.data || profile;

      if (student) {
        const fullName = `${student.nom || ''} ${student.prenom || ''}`.trim() || user.name || 'Étudiant';

        let className = student.classe_nom || student.classe || '';

        if (!className && student.classe_id) {
          try {
            const classesRes = await API.classes.getAll();
            const list = Array.isArray(classesRes?.data)
              ? classesRes.data
              : (Array.isArray(classesRes) ? classesRes : []);
            const found = list.find(c => String(c.id) === String(student.classe_id));
            if (found) className = found.nom;
          } catch (_) { /* ignore */ }
        }

        fillUI({
          fullName,
          roleLabel: 'Étudiant',
          email: user.email || '-',
          matricule: student.matricule || '-',
          nom: student.nom || '-',
          prenom: student.prenom || '-',
          classe: className || '-'
        });
      } else {
        fallbackFromLocalStorage();
      }
    } catch (error) {
      console.error('Erreur profil étudiant:', error);
      fallbackFromLocalStorage();
    }

  // ---------- TEACHER ----------
  } else if (role === 'teacher') {
    try {
      const profile = await API.teachers.getMyProfile();
      const teacher = profile?.data || profile;

      if (teacher) {
        const fullName = (teacher.nom || user.name || 'Professeur').trim();
        fillUI({
          fullName,
          roleLabel: 'Professeur',
          email: user.email || '-',
          matricule: teacher.matricule || '-',
          nom: teacher.nom || fullName,
          prenom: teacher.prenom || '-',
          classe: teacher.matiere || teacher.classe_nom || teacher.classe || '-'
        });

        const classEl = document.getElementById('userClassDetail');
        if (classEl) {
          const label = classEl.previousElementSibling;
          if (label && label.classList.contains('detail-label')) {
            label.textContent = 'Matière';
          }
        }
      } else {
        fallbackFromLocalStorage();
      }
    } catch (error) {
      console.error('Erreur profil professeur:', error);
      fallbackFromLocalStorage();
    }

  // ---------- ADMIN ----------
  } else {
    fallbackFromLocalStorage();
    setText('userRole', 'Administrateur');
    setText('sidebarUserRole', 'Administrateur');
  }

  const logoutBtn = document.querySelector('.logout-btn, .logout-icon');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
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
});