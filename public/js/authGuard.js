const AuthGuard = {
  normalizeRole(role) {
    if (!role) return '';
    const normalized = String(role)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

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
      eleve: 'student',
      eleve: 'student',
      etudiant: 'student',
      student: 'student'
    };

    return aliases[normalized] || normalized;
  },

  getUser() {
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user) return null;

      return {
        ...user,
        role: this.normalizeRole(user.role)
      };
    } catch (error) {
      console.warn('[AuthGuard] Données utilisateur invalides, nettoyage local.', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  cleanPath(pathname = '') {
    let path = String(pathname || '').replace(/\/$/, '') || '/';
    path = path.replace(/\.html$/, '');
    return path;
  },

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
      '/notes',
      '/absences',
      '/mon-profil'
    ]
  },

  homePage: {
    admin: '/dashboard-admin',
    teacher: '/dashboard-prof',
    student: '/mon-profil'
  },

  can(permission) {
    const role = this.getRole();
    if (!role || !this.permissions[role]) return false;
    return this.permissions[role].includes(permission);
  },

  checkPageAccess() {
    const role = this.getRole();
    const path = this.cleanPath(window.location.pathname);

    console.log('[AuthGuard] checkPageAccess - Role:', role, 'Path:', path);

    if (!role) {
      console.log('[AuthGuard] No role found, redirecting to login');
      window.location.href = '/login';
      return false;
    }

    if (!localStorage.getItem('token')) {
      console.log('[AuthGuard] No token found, redirecting to login');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return false;
    }

    const body = document.body;
    const allowedRolesAttr = body ? body.getAttribute('data-roles') : null;

    if (allowedRolesAttr) {
      const allowedRoles = allowedRolesAttr
        .split(',')
        .map((r) => this.normalizeRole(r.trim()));

      const roleAllowed = allowedRoles.includes(role) || allowedRoles.includes('all');
      if (!roleAllowed) {
        console.log('[AuthGuard] Role not in allowed roles, redirecting to home page');
        window.location.href = this.homePage[role] || '/login';
        return false;
      }
    }

    const allowed = this.menuAccess[role] || [];
    const isAllowed = allowed.some((p) => path === p || path.startsWith(`${p}/`));

    if (!isAllowed && path !== '/login' && path !== '/') {
      console.log('[AuthGuard] Path not allowed, redirect to home page');
      window.location.href = this.homePage[role] || '/login';
      return false;
    }

    console.log('[AuthGuard] Access granted');
    return true;
  },

  applyUI() {
    document.querySelectorAll('[data-perm]').forEach((element) => {
      const requiredPerm = element.getAttribute('data-perm');
      if (!requiredPerm) return;

      const perms = requiredPerm.split(',').map((p) => p.trim());
      const hasAccess = perms.some((perm) => this.can(perm));
      element.style.display = hasAccess ? '' : 'none';
    });
  },

  applySidebar() {
    const role = this.getRole();
    if (!role || !this.menuAccess[role]) return;

    const allowed = this.menuAccess[role];

    document.querySelectorAll('.menu a, .menu .menu-item').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const cleanHref = this.cleanPath(href.split('?')[0]);
      const isAllowed = allowed.some((p) => cleanHref === p || cleanHref.startsWith(`${p}/`));
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
    const parts = String(name).trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
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
