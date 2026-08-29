import express from 'express';
import {
  ajouterAbsence,
  getHistoriqueAbsences,
  getHistoriqueEtudiant,
  modifierStatutAbsence,
  justifierAbsence,
  injustifierAbsence,
  supprimerAbsence
} from '../controllers/absencesControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Consultation
router.get('/', checkRole(['admin', 'teacher']), getHistoriqueAbsences);
router.get('/student/:student_id', checkRole(['admin', 'teacher', 'student']), getHistoriqueEtudiant);

// Gestion → admin + teacher
router.post('/', checkRole(['admin', 'teacher']), ajouterAbsence);
router.put('/:id/status', checkRole(['admin', 'teacher']), modifierStatutAbsence);
router.patch('/:id/justify', checkRole(['admin', 'teacher']), justifierAbsence);
router.patch('/:id/unjustify', checkRole(['admin', 'teacher']), injustifierAbsence);
router.delete('/:id', checkRole(['admin']), supprimerAbsence);

export default router;