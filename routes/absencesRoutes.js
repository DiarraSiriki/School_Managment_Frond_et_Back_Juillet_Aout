import express from 'express';
import {
  ajouterAbsence,
  modifierAbsence,
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

router.get('/', checkRole(['admin', 'teacher']), getHistoriqueAbsences);
router.get('/student/:student_id', checkRole(['admin', 'teacher', 'student']), getHistoriqueEtudiant);

router.post('/', checkRole(['admin', 'teacher']), ajouterAbsence);
router.put('/:id', checkRole(['admin', 'teacher']), modifierAbsence);
router.put('/:id/status', checkRole(['admin', 'teacher']), modifierStatutAbsence);
router.patch('/:id/justify', checkRole(['admin', 'teacher']), justifierAbsence);
router.patch('/:id/unjustify', checkRole(['admin', 'teacher']), injustifierAbsence);
router.delete('/:id', checkRole(['admin']), supprimerAbsence);

export default router;