import {
    addSubject,
    updateSubject,
    removeSubject,
    searchSubject,
    getSubjectById,
    listSubjects
} from '../services/matiereService.js';

// GET /api/matieres — liste des matières
const getMatieres = async (req, res) => {
    try {
        const subjects = await listSubjects();
        return res.json(subjects);
    } catch (error) {
        console.error("[ERREUR GET MATIERES]", error);
        return res.status(500).json({ error: "Impossible de récupérer la liste des matières." });
    }
};

// GET /api/matieres/:id — une matière par ID
const getMatiereParId = async (req, res) => {
    const id = req.params.id;

    try {
        const subject = await getSubjectById(id);
        if (!subject) {
            return res.status(404).json({ error: "Matière introuvable." });
        }
        return res.json(subject);
    } catch (error) {
        console.error("[ERREUR GET MATIERE BY ID]", error);
        return res.status(500).json({ error: "Erreur lors de la récupération de la matière." });
    }
};

// GET /api/matieres/search?q=... — recherche
const chercherMatiere = async (req, res) => {
    const { q } = req.query;

    if (!q || !q.trim()) {
        return res.status(400).json({ error: "Le paramètre de recherche 'q' est requis." });
    }

    try {
        const resultats = await searchSubject(q.trim());
        return res.json(resultats);
    } catch (error) {
        console.error("[ERREUR RECHERCHE MATIERE]", error);
        return res.status(500).json({ error: "Erreur lors de la recherche de la matière." });
    }
};

// POST /api/matieres — ajout d'une matière
const ajouterMatiere = async (req, res) => {
    const nom        = typeof req.body.nom === 'string' ? req.body.nom.trim() : '';
    const classe_id  = req.body.classe_id ?? req.body.classe;
    const teacher_id = req.body.teacher_id ?? null;

    if (!nom || !classe_id) {
        return res.status(400).json({ error: "Le nom de la matière et la classe sont requis." });
    }

    const classeIdNum = Number(classe_id);
    if (!Number.isInteger(classeIdNum) || classeIdNum <= 0) {
        return res.status(400).json({ error: "'classe_id' doit être un identifiant de classe valide (nombre)." });
    }

    try {
        const subjectId = await addSubject(nom, classeIdNum, teacher_id);
        return res.status(201).json({
            success: true,
            message: "Matière ajoutée avec succès !",
            id: subjectId
        });
    } catch (error) {
        console.error("[ERREUR AJOUT MATIERE]", error);

        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({
                error: "La classe (ou le professeur) spécifié(e) n'existe pas."
            });
        }

        return res.status(500).json({ error: "Erreur lors de l'ajout de la matière." });
    }
};

// PUT /api/matieres/:id — modification
const modifierMatiere = async (req, res) => {
    const { id } = req.params;
    const nom        = typeof req.body.nom === 'string' ? req.body.nom.trim() : '';
    const classe_id  = req.body.classe_id ?? req.body.classe;
    const teacher_id = req.body.teacher_id ?? null;

    if (!nom || !classe_id) {
        return res.status(400).json({ error: "Le nom et la classe sont requis pour la mise à jour." });
    }

    const classeIdNum = Number(classe_id);
    if (!Number.isInteger(classeIdNum) || classeIdNum <= 0) {
        return res.status(400).json({ error: "'classe_id' doit être un identifiant de classe valide (nombre)." });
    }

    try {
        const estModifie = await updateSubject(id, nom, classeIdNum, teacher_id);

        if (!estModifie) {
            return res.status(404).json({ error: "Matière introuvable ou aucune modification effectuée." });
        }

        return res.json({ success: true, message: "Matière mise à jour avec succès." });
    } catch (error) {
        console.error("[ERREUR MODIFICATION MATIERE]", error);

        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({
                error: "La classe (ou le professeur) spécifié(e) n'existe pas."
            });
        }

        return res.status(500).json({ error: "Erreur lors de la modification de la matière." });
    }
};

// DELETE /api/matieres/:id — suppression
const supprimerMatiere = async (req, res) => {
    const id = req.params.id;

    try {
        const estSupprime = await removeSubject(id);

        if (!estSupprime) {
            return res.status(404).json({ error: "Matière introuvable ou déjà supprimée." });
        }

        return res.json({ success: true, message: "Matière supprimée avec succès." });
    } catch (error) {
        console.error("[ERREUR SUPPRESSION MATIERE]", error);
        return res.status(500).json({ error: "Erreur lors de la suppression de la matière." });
    }
};

export {
    getMatieres,
    getMatiereParId,
    chercherMatiere,
    ajouterMatiere,
    modifierMatiere,
    supprimerMatiere
};
