import express from 'express';
import {
  getMatieres,
  getMatiereParId,
  chercherMatiere,
  ajouterMatiere,
  modifierMatiere,
  supprimerMatiere
} from '../controllers/matieresControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/search', checkRole(['admin', 'teacher']), chercherMatiere);
router.get('/', checkRole(['admin', 'teacher']), getMatieres);
router.get('/:id', checkRole(['admin', 'teacher']), getMatiereParId);

router.post('/', checkRole(['admin']), ajouterMatiere);
router.put('/:id', checkRole(['admin']), modifierMatiere);
router.delete('/:id', checkRole(['admin']), supprimerMatiere);

export default router;