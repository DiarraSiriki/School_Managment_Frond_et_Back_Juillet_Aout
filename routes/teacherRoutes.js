import express from 'express';
import {
  getProfesseurs,
  getProfesseurParId,
  getMonProfilProfesseur,
  chercherProfesseur,
  ajouterProfesseur,
  modifierProfesseur,
  supprimerProfesseur
} from '../controllers/teacherControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Spécifiques d'abord
router.get('/search', checkRole(['admin']), chercherProfesseur);
router.get('/me', checkRole(['teacher', 'admin']), getMonProfilProfesseur);

router.get('/', checkRole(['admin']), getProfesseurs);
router.get('/:id', checkRole(['admin']), getProfesseurParId);

router.post('/', checkRole(['admin']), ajouterProfesseur);
router.put('/:id', checkRole(['admin']), modifierProfesseur);
router.delete('/:id', checkRole(['admin']), supprimerProfesseur);

export default router;