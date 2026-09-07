const AuthGuard = {
  /**
   * Normalise le nom d'un rôle pour le rendre standard
   * Gère les accents, les fautes de frappe et les variantes
   */
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

  /**
   * Récupère les informations de l'utilisateur depuis le localStorage
   * Retourne null si les données sont invalides
   */
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

  /**
   * Récupère le rôle de l'utilisateur connecté
   */
  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  /**
   * Nettoie un chemin d'URL pour le normaliser
   * Supprime le slash final et l'extension .html
   */
  cleanPath(pathname = '') {
    let path = String(pathname || '').replace(/\/$/, '') || '/';
    path = path.replace(/\.html$/, '');
    return path;
  },

  // Définition des permissions par rôle
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

  // Définition des pages accessibles par rôle
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

  // Page d'accueil par rôle
  homePage: {
    admin: '/dashboard-admin',
    teacher: '/dashboard-prof',
    student: '/mon-profil'
  },

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  can(permission) {
    const role = this.getRole();
    if (!role || !this.permissions[role]) return false;
    return this.permissions[role].includes(permission);
  },

  /**
   * Vérifie si l'utilisateur a accès à la page actuelle
   * Redirige vers la page de connexion ou la page d'accueil si nécessaire
   */
  checkPageAccess() {
    const role = this.getRole();
    const path = this.cleanPath(window.location.pathname);

    console.log('[AuthGuard] checkPageAccess - Role:', role, 'Path:', path);

    // Vérification de la présence d'un rôle
    if (!role) {
      console.log('[AuthGuard] No role found, redirecting to login');
      window.location.href = '/login';
      return false;
    }

    // Vérification de la présence du token
    if (!localStorage.getItem('token')) {
      console.log('[AuthGuard] No token found, redirecting to login');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return false;
    }

    // Vérification des rôles autorisés pour la page
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

    // Vérification de l'accès au menu
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

  /**
   * Applique les permissions UI aux éléments avec l'attribut data-perm
   * Masque les éléments pour lesquels l'utilisateur n'a pas la permission
   */
  applyUI() {
    document.querySelectorAll('[data-perm]').forEach((element) => {
      const requiredPerm = element.getAttribute('data-perm');
      if (!requiredPerm) return;

      const perms = requiredPerm.split(',').map((p) => p.trim());
      const hasAccess = perms.some((perm) => this.can(perm));
      element.style.display = hasAccess ? '' : 'none';
    });
  },

  /**
   * Applique les restrictions d'accès au menu de navigation
   * Masque les liens de menu non autorisés pour le rôle de l'utilisateur
   */
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

  // Labels d'affichage des rôles
  roleLabels: {
    admin: 'Administrateur',
    teacher: 'Professeur',
    student: 'Étudiant'
  },

  /**
   * Génère les initiales à partir d'un nom
   * Ex: "Jean Dupont" -> "JD"
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
  },

  /**
   * Met à jour le widget utilisateur dans la sidebar
   * Affiche le nom, le rôle et les initiales de l'utilisateur
   */
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

// Initialisation de l'AuthGuard au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  if (AuthGuard.checkPageAccess()) {
    AuthGuard.applySidebar();
    AuthGuard.applyUI();
    AuthGuard.renderUserWidget();
  }
});
