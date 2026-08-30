const AuthGuard = {
  normalizeRole(role) {
    if (!role) return '';
    const normalized = String(role).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const aliases = {
      admin: 'admin',
      administrateur: 'admin',
      teacher: 'teacher',
      professeur: 'teacher',
      prof: 'teacher',
      enseignant: 'teacher',
      student: 'student',
      etudiant: 'student',
      etudiante: 'student',
      eleve: 'student'
    };
    return aliases[normalized] || normalized;
  },

  getUser() {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (!user) return null;
    return {
      ...user,
      role: this.normalizeRole(user.role)
    };
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  /*
   * ADMIN  : tout
   * PROF   : consulter étudiants, consulter matières, ajouter/modifier notes, absences limité
   * ÉLÈVE  : voir ses notes, ses absences, sa moyenne, son profil
   */
  permissions: {
    admin: [
      'gerer_utilisateurs',
      'gerer_etudiants',
      'gerer_professeurs',
      'gerer_matieres',
      'gerer_notes',
      'gerer_absences',
      'voir_statistiques',
      'consulter_etudiants',
      'consulter_matieres',
      'consulter_absences',
      'ajouter_notes',
      'modifier_notes',
      'ajouter',
      'modifier',
      'supprimer'
    ],
    teacher: [
      'consulter_etudiants',
      'consulter_matieres',
      'ajouter_notes',
      'modifier_notes',
      'gerer_notes',
      'consulter_absences',
      'gerer_absences'
    ],
    student: [
      'voir_ses_notes',
      'voir_ses_absences',
      'voir_sa_moyenne',
      'voir_profil'
    ]
  },

  menuAccess: {
    admin: [
      '/dashboard-admin',
      '/dashboard-etudiant',
      '/dashboard-prof',
      '/matieres',
      '/notes',
      '/absences',
      '/statistiques',
      '/mon-profil'
    ],
    teacher: [
      '/dashboard-prof',
      '/dashboard-etudiant',
      '/matieres',
      '/notes',
      '/absences',
      '/mon-profil'
    ],
    student: [
      '/dashboard-etudiant',
      '/notes',
      '/absences',
      '/mon-profil'
    ]
  },

  homePage: {
    admin: '/dashboard-admin',
    teacher: '/dashboard-prof',
    student: '/dashboard-etudiant'
  },

  can(permission) {
    const role = this.getRole();
    if (!role || !this.permissions[role]) return false;
    return this.permissions[role].includes(permission);
  },

  checkPageAccess() {
    const role = this.getRole();

    if (!role) {
      window.location.href = '/login';
      return false;
    }

    if (!localStorage.getItem('token')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
      return false;
    }

    const allowedRolesAttr = document.body.getAttribute('data-roles');
    if (allowedRolesAttr) {
      const allowedRoles = allowedRolesAttr.split(',').map(r => this.normalizeRole(r.trim()));
      if (!allowedRoles.includes(role)) {
        window.location.href = this.homePage[role] || '/login';
        return false;
      }
    }

    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const allowed = this.menuAccess[role] || [];
    const isAllowed = allowed.some(p => path === p || path.startsWith(p + '/'));
    if (!isAllowed && path !== '/login' && path !== '/') {
      window.location.href = this.homePage[role] || '/login';
      return false;
    }

    return true;
  },

  applyUI() {
    document.querySelectorAll('[data-perm]').forEach(element => {
      const requiredPerm = element.getAttribute('data-perm');
      if (!requiredPerm) return;
      const perms = requiredPerm.split(',').map(p => p.trim());
      const hasAccess = perms.some(p => this.can(p));
      element.style.display = hasAccess ? '' : 'none';
    });
  },

  applySidebar() {
    const role = this.getRole();
    if (!role || !this.menuAccess[role]) return;

    const allowed = this.menuAccess[role];

    document.querySelectorAll('.menu a, .menu .menu-item').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const cleanHref = href.split('?')[0].replace(/\/$/, '') || '/';
      const isAllowed = allowed.some(p => cleanHref === p || cleanHref.startsWith(p + '/'));
      link.style.display = isAllowed ? '' : 'none';
    });
  },

  roleLabels: {
    admin: 'Administrateur',
    teacher: 'Professeur',
    student: 'Étudiant'
  },

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?';
  },

  renderUserWidget() {
    const footer = document.querySelector('.user-profile, .sidebar-footer');
    if (!footer) return;

    const user = this.getUser();
    if (!user) return;

    const initials = this.getInitials(user.name);
    const roleLabel = this.roleLabels[user.role] || user.role;

    const nameEl = footer.querySelector('.user-name, .admin-name');
    const roleEl = footer.querySelector('.user-role, .admin-email');
    const avatarEl = footer.querySelector('.avatar-sidebar, .admin-avatar, .avatar');

    if (nameEl) nameEl.textContent = user.name || user.email || 'Utilisateur';
    if (roleEl) roleEl.textContent = roleLabel;
    if (avatarEl) avatarEl.textContent = initials;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (AuthGuard.checkPageAccess()) {
    AuthGuard.applySidebar();
    AuthGuard.applyUI();
    AuthGuard.renderUserWidget();
  }
});