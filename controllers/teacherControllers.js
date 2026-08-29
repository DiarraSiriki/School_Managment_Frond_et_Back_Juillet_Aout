import {
  addTeacher,
  updateTeacher,
  removeTeacher,
  searchTeacher,
  listTeachers,
  getTeacherById,
  getTeacherByUserId
} from '../services/teacherService.js';

const getMonProfilProfesseur = async (req, res) => {
  const user_id = req.user.id;

  try {
    const teacher = await getTeacherByUserId(user_id);
    if (!teacher) {
      return res.status(404).json({ error: "Aucune fiche professeur associée à ce compte." });
    }
    return res.json(teacher);
  } catch (error) {
    console.error("[ERREUR GET MON PROFIL PROFESSEUR]", error);
    return res.status(500).json({ error: "Erreur lors de la récupération de votre profil." });
  }
};

const getProfesseurs = async (req, res) => {
  try {
    const teachers = await listTeachers();
    return res.json(teachers);
  } catch (error) {
    console.error("[ERREUR GET PROFESSEURS]", error);
    return res.status(500).json({ error: "Impossible de récupérer la liste des professeurs." });
  }
};

const getProfesseurParId = async (req, res) => {
  const id = req.params.id;

  try {
    const teacher = await getTeacherById(id);
    if (!teacher) {
      return res.status(404).json({ error: "Professeur introuvable." });
    }
    return res.json(teacher);
  } catch (error) {
    console.error("[ERREUR GET PROFESSEUR BY ID]", error);
    return res.status(500).json({ error: "Erreur lors de la récupération du professeur." });
  }
};

const chercherProfesseur = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Le paramètre de recherche 'q' est requis." });
  }

  try {
    const resultat = await searchTeacher(q);
    return res.json(resultat);
  } catch (error) {
    console.error("[ERREUR RECHERCHE PROFESSEUR]", error);
    return res.status(500).json({ error: "Erreur lors de la recherche." });
  }
};

const ajouterProfesseur = async (req, res) => {
  const { nom, matiere, classe_id, email, password } = req.body;

  if (!nom || !matiere || !email || !password) {
    return res.status(400).json({ error: "Tous les champs (nom, matiere, email, password) sont requis." });
  }

  try {
    const teacherId = await addTeacher(nom, matiere, classe_id, email, password);
    return res.status(201).json({
      success: true,
      message: "Professeur créé avec succès !",
      id: teacherId
    });
  } catch (error) {
    console.error("[ERREUR AJOUT PROFESSEUR]", error.message);
    return res.status(400).json({ error: error.message });
  }
};

const modifierProfesseur = async (req, res) => {
  const id = req.params.id;
  const { nom, matiere, classe_id, email, password } = req.body;

  if (!nom && !matiere && !classe_id && !email && !password) {
    return res.status(400).json({ error: "Au moins un champ doit être fourni pour la mise à jour." });
  }

  try {
    const succes = await updateTeacher(id, nom, matiere, classe_id, email, password);

    if (!succes) {
      return res.status(404).json({ error: "Professeur introuvable ou échec de la mise à jour." });
    }

    return res.json({ success: true, message: "Informations du professeur mises à jour avec succès." });
  } catch (error) {
    console.error("[ERREUR MODIFICATION PROFESSEUR]", error.message);
    return res.status(400).json({ error: error.message });
  }
};

const supprimerProfesseur = async (req, res) => {
  const id = req.params.id;

  try {
    const estSupprime = await removeTeacher(id);

    if (!estSupprime) {
      return res.status(404).json({ error: "Professeur introuvable ou déjà supprimé." });
    }

    return res.json({ success: true, message: "Professeur supprimé avec succès." });
  } catch (error) {
    console.error("[ERREUR SUPPRESSION PROFESSEUR]", error);
    return res.status(500).json({ error: "Erreur lors de la suppression du professeur." });
  }
};

export {
  getProfesseurs,
  getProfesseurParId,
  getMonProfilProfesseur,
  chercherProfesseur,
  ajouterProfesseur,
  modifierProfesseur,
  supprimerProfesseur
};
