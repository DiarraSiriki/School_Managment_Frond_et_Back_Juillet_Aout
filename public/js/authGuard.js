const AuthGuard = {

  getUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
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
      'ajouter',
      'modifier',
      'supprimer'
    ],
    teacher: [
      'consulter_etudiants',
      'consulter_matieres',
      'gerer_notes',
      'gerer_absences',
      'voir_statistiques',
      'ajouter_notes',
      'modifier_notes'
    ],
    student: [
      'voir_ses_notes',
      'voir_ses_absences',
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
      '/mon-profil',
      '/profil'
    ],
    teacher: [
      '/dashboard-etudiant',
      '/matieres',
      '/notes',
      '/absences',
      '/statistiques',
      '/mon-profil',
      '/profil'
    ],
    student: [
      '/notes',
      '/absences',
      '/mon-profil',
      '/profil'
    ]
  },

  homePage: {
    admin: '/dashboard-admin',
    teacher: '/notes',
    student: '/notes'
  },

  can(permission) {
    const role = this.getRole();
    if (!role || !this.permissions[role]) return false;
    return this.permissions[role].includes(permission);
  },

  checkPageAccess() {
    const role = this.getRole();

    if (!role) {
      window.location.href = '/';
      return false;
    }

    const allowedRolesAttr = document.body.getAttribute('data-roles');
    if (allowedRolesAttr) {
      const allowedRoles = allowedRolesAttr.split(',').map(r => r.trim());
      if (!allowedRoles.includes(role)) {
        window.location.href = this.homePage[role] || '/';
        return false;
      }
    }

    return true;
  },

  applyUI() {
    document.querySelectorAll('[data-perm]').forEach(element => {
      const requiredPerm = element.getAttribute('data-perm');
      if (!requiredPerm) return;
      const perms = requiredPerm.split(',').map(p => p.trim());
      const hasAccess = perms.some(p => this.can(p));
      if (!hasAccess) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });
  },

  applySidebar() {
    const role = this.getRole();
    if (!role || !this.menuAccess[role]) return;

    const allowed = this.menuAccess[role];

    document.querySelectorAll('.menu a, .menu .menu-item').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const cleanHref = href.split('?')[0];
      const isAllowed = allowed.some(p => cleanHref === p || cleanHref.startsWith(p + '/'));

      if (!isAllowed) {
        link.style.display = 'none';
      } else {
        link.style.display = '';
      }
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