import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';


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
        
     
        req.user = decoded; 

      
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
  
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Accès refusé. Profil utilisateur non identifié."
            });
        }

      
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Accès interdit. Le rôle '${req.user.role}' n'a pas les privilèges requis.`
            });
        }

       
        next();
    };
};


export { verifyToken, checkRole };