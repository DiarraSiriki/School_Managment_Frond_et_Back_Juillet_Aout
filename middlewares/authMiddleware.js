import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';
const ROLE_ALIASES = {
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

const normalizeRole = (role) => {
    if (!role) return '';
    const normalized = String(role).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ROLE_ALIASES[normalized] || normalized;
};

const verifyToken = (req, res, next) => {
   
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "Accès refusé. Jeton d'authentification manquant ou mal formé."
        });
    }

  
    // On sépare "Bearer" du token avec split(' ') et on prend la partie [1]
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            ...decoded,
            role: normalizeRole(decoded?.role)
        };

        next();
    } catch (error) {
     
        return res.status(403).json({
            success: false,
            message: "Jeton invalide ou expiré. Veuillez vous reconnecter."
        });
    }
};


const checkRole = (allowedRoles) => {
    // checkRole retourne une fonction middleware (c'est un pattern de fonction qui retourne une fonction)
    return (req, res, next) => {
        const normalizedRole = normalizeRole(req.user?.role);

        if (!req.user || !normalizedRole) {
            return res.status(401).json({
                success: false,
                message: "Accès refusé. Profil utilisateur non identifié."
            });
        }

        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
        if (!normalizedAllowedRoles.includes(normalizedRole)) {
            return res.status(403).json({
                success: false,
                message: `Accès interdit. Le rôle '${normalizedRole}' n'a pas les privilèges requis.`
            });
        }

        req.user.role = normalizedRole;
        next();
    };
};


export { verifyToken, checkRole };