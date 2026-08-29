import {
  addUser,
  removeUser,
  listUsers,
  updateUser,
  getUserById
} from '../services/userService.js';

const getUtilisateurs = async (req, res) => {
  try {
    const users = await listUsers();
    return res.json({ data: users });
  } catch (error) {
    console.error('[ERREUR GET UTILISATEURS]', error);
    return res.status(500).json({ error: 'Impossible de récupérer les utilisateurs.' });
  }
};

const getUtilisateurParId = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    return res.json(user);
  } catch (error) {
    console.error('[ERREUR GET UTILISATEUR]', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération.' });
  }
};

const ajouterUtilisateur = async (req, res) => {
  const { name, role, email, mot_passe, matricule, classe_id, classe, matiere, age, prenom, nom } = req.body;

  if (!name || !role || !email || !mot_passe) {
    return res.status(400).json({
      error: 'Tous les champs requis (name, role, email, mot_passe) doivent être remplis.'
    });
  }

  try {
    const extra = { matricule, classe_id, classe, matiere, age, prenom, nom };
    const newUser = await addUser(name, role, email, mot_passe, extra);
    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès !',
      id: newUser.id
    });
  } catch (error) {
    console.error('[ERREUR AJOUT UTILISATEUR]', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const modifierUtilisateur = async (req, res) => {
  const id = req.params.id;
  const { name, role, email, mot_passe, matricule, classe_id, classe, matiere, age, prenom, nom } = req.body;

  if (!name && !role && !email && !mot_passe && !matricule && !classe_id && !classe && !matiere) {
    return res.status(400).json({
      error: 'Au moins un champ doit être fourni pour la mise à jour.'
    });
  }

  try {
    const extra = { matricule, classe_id, classe, matiere, age, prenom, nom };
    const ok = await updateUser(id, name, role, email, mot_passe, extra);
    if (!ok) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    return res.json({ success: true, message: 'Utilisateur modifié avec succès.' });
  } catch (error) {
    console.error('[ERREUR MODIFICATION UTILISATEUR]', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const supprimerUtilisateur = async (req, res) => {
  const id = req.params.id;

  try {
    const ok = await removeUser(id);
    if (!ok) {
      return res.status(404).json({ error: 'Utilisateur introuvable ou déjà supprimé.' });
    }
    return res.json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('[ERREUR SUPPRESSION UTILISATEUR]', error);
    return res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur." });
  }
};

export {
  getUtilisateurs,
  getUtilisateurParId,
  ajouterUtilisateur,
  supprimerUtilisateur,
  modifierUtilisateur
};
