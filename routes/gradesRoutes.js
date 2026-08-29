import express from 'express';
import {
  getNotes,
  getNoteParId,
  getNotesParEtudiant,
  getMoyenneEtudiant,
  ajouterNote,
  modifierNote,
  supprimerNote
} from '../controllers/gradesControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Spécifiques d'abord
router.get('/student/:student_id/average', checkRole(['admin', 'teacher', 'student']), getMoyenneEtudiant);
router.get('/student/:student_id', checkRole(['admin', 'teacher', 'student']), getNotesParEtudiant);

router.get('/', checkRole(['admin', 'teacher']), getNotes);
router.get('/:id', checkRole(['admin', 'teacher', 'student']), getNoteParId);

router.post('/', checkRole(['admin', 'teacher']), ajouterNote);
router.put('/:id', checkRole(['admin', 'teacher']), modifierNote);
router.delete('/:id', checkRole(['admin']), supprimerNote);

export default router;