import express from 'express';
import {
  getUtilisateurs,
  getUtilisateurParId,
  ajouterUtilisateur,
  supprimerUtilisateur,
  modifierUtilisateur
} from '../controllers/usersControllers.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', checkRole(['admin']), getUtilisateurs);
router.get('/:id', checkRole(['admin']), getUtilisateurParId);
router.post('/', checkRole(['admin']), ajouterUtilisateur);
router.put('/:id', checkRole(['admin']), modifierUtilisateur);
router.delete('/:id', checkRole(['admin']), supprimerUtilisateur);

export default router;