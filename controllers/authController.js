import { authenticate, getUserById } from '../services/userService.js';
import jwt from 'jsonwebtoken';
import { logToFile } from '../utils/logger.js';

// Clé secrète pour signer les tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee';

/**
 * Gère la connexion d'un utilisateur
 * Vérifie les identifiants et génère un token JWT
 */
const login = async (req, res) => {
  const { email, mot_passe } = req.body;

  logToFile('INFO', `Tentative de connexion: ${email}`);

  // Vérification que les champs sont remplis
  if (!email || !mot_passe) {
    logToFile('WARN', `Connexion échouée (champs manquants): ${email}`);
    return res.status(400).json({
      success: false,
      message: "L'email et le mot de passe sont requis."
    });
  }

  try {
    // Authentification de l'utilisateur
    const user = await authenticate(email, mot_passe);

    if (!user) {
      logToFile('WARN', `Connexion échouée (identifiants incorrects): ${email}`);
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect."
      });
    }

    // Vérification que le profil est complet
    if (!user.id || !user.role) {
      logToFile('ERROR', `Connexion refusée (profil incomplet): ${email}`);
      return res.status(401).json({
        success: false,
        message: "Compte invalide. Contactez l'administrateur."
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logToFile('INFO', `Connexion réussie: ${email} (role: ${user.role})`);

    return res.json({
      success: true,
      message: "Connexion réussie !",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error("[ERREUR LOGIN]", error);
    logToFile('ERROR', `Erreur lors de la connexion: ${email} - ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la connexion.",
      message: "Erreur lors de la connexion."
    });
  }
};

/**
 * Récupère le profil de l'utilisateur connecté
 */
const getMonProfil = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profil introuvable."
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("[ERREUR GET MON PROFIL]", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil."
    });
  }
};

/**
 * Gère la déconnexion d'un utilisateur
 * Note: Le token JWT reste valide côté client jusqu'à son expiration
 */
const logout = (req, res) => {
  const user = req.user;
  logToFile('INFO', `Déconnexion: ${user?.email} (role: ${user?.role})`);

  return res.json({
    success: true,
    message: "Déconnexion réussie !"
  });
};

export { login, logout, getMonProfil };