import express from 'express';
import {
  getEtudiants,
  getEtudiantParId,
  getEtudiantParMatricule,
  getMonProfilEtudiant,
  chercherEtudiant,
  ajouterEtudiant,
  modifierEtudiant,
  supprimerEtudiant
} from '../controllers/studentControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Routes spécifiques EN PREMIER
router.get('/search', checkRole(['admin', 'teacher']), chercherEtudiant);
router.get('/me', checkRole(['student', 'admin']), getMonProfilEtudiant);
router.get('/matricule/:matricule', checkRole(['admin', 'teacher']), getEtudiantParMatricule);

// Routes générales
router.get('/', checkRole(['admin', 'teacher']), getEtudiants);
router.get('/:id', checkRole(['admin', 'teacher']), getEtudiantParId);

router.post('/', checkRole(['admin']), ajouterEtudiant);
router.put('/:id', checkRole(['admin']), modifierEtudiant);
router.delete('/:id', checkRole(['admin']), supprimerEtudiant);

export default router;