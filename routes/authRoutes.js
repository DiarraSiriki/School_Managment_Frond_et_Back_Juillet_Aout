import express from 'express';
import { login, logout, getMonProfil } from '../controllers/authController.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/login', login);

// Route de déconnexion (nécessite un token)
router.post('/logout', verifyToken, logout);

router.get('/me', verifyToken, getMonProfil);

export default router;