import {
    addGrade,updateGrade,
    removeGrade,listGrades,
    getGradeById,getStudentGrades,
    calculateAverage } from '../services/gradeService.js';
import { getTeacherByUserId } from '../services/teacherService.js';
import { getSubjectById } from '../services/matiereService.js';
import { getStudentByUserId } from '../services/studentService.js';

// Récupère la liste de toutes les notes
const getNotes = async (req, res) => {
    try {
        const grades = await listGrades();
        return res.json(grades);
    } catch (error) {
        console.error("[ERREUR GET NOTES]", error);
        return res.status(500).json({ error: "Impossible de récupérer la liste des notes." });
    }
};

// Récupère une note spécifique par son ID
const getNoteParId = async (req, res) => {
    const { id } = req.params;

    try {
        const grade = await getGradeById(id);
        if (!grade) {
            return res.status(404).json({ error: "Note introuvable." });
        }

        if (req.user.role === 'student') {
            const me = await getStudentByUserId(req.user.id);

            if (!me || String(me.id) !== String(grade.student_id)) {
                return res.status(403).json({ error: "Vous ne pouvez voir que vos propres notes." });
            }
        }

        return res.json(grade);
    } catch (error) {
        console.error("[ERREUR GET NOTE BY ID]", error);
        return res.status(500).json({ error: "Erreur lors de la récupération de la note." });
    }
};

// Récupère toutes les notes d'un étudiant spécifique
const getNotesParEtudiant = async (req, res) => {
    const { student_id } = req.params;

    if (req.user.role === 'student') {
        const me = await getStudentByUserId(req.user.id);
        if (!me || String(me.id) !== String(student_id)) {
            return res.status(403).json({ error: 'Vous ne pouvez voir que vos propres notes.' });
        }
    }

    try {
        const grades = await getStudentGrades(student_id);
        return res.json(grades);
    } catch (error) {
        console.error("[ERREUR GET NOTES ETUDIANT]", error);
        return res.status(500).json({ error: "Impossible de récupérer les notes de cet étudiant." });
    }
};

// Calcule la moyenne des notes d'un étudiant spécifique
const getMoyenneEtudiant = async (req, res) => {
    const { student_id } = req.params;

    if (req.user.role === 'student') {
        const me = await getStudentByUserId(req.user.id);
        if (!me || String(me.id) !== String(student_id)) {
            return res.status(403).json({ error: 'Vous ne pouvez voir que votre propre moyenne.' });
        }
    }

    try {
        const average = await calculateAverage(student_id);
        return res.json({
            success: true,
            student_id: Number(student_id),
            moyenne: average ?? 0
        });
    } catch (error) {
        console.error("[ERREUR CALCUL MOYENNE ETUDIANT]", error);
        return res.status(500).json({ error: "Impossible de calculer la moyenne de cet étudiant." });
    }
};

// Ajoute une nouvelle note à un étudiant
const ajouterNote = async (req, res) => {
    const { student_id, subject_id, note } = req.body;

    if (student_id === undefined || subject_id === undefined || note === undefined) {
        return res.status(400).json({
            error: "Tous les champs (student_id, subject_id, note) sont requis."
        });
    }

    if (typeof note !== 'number' || note < 0 || note > 20) {
        return res.status(400).json({ error: "La note doit être un nombre compris entre 0 et 20." });
    }

    if (req.user.role === 'teacher') {
        const monProfil = await getTeacherByUserId(req.user.id);
        const matiere = await getSubjectById(subject_id);

        if (!monProfil || !matiere || String(matiere.teacher_id) !== String(monProfil.id)) {
            return res.status(403).json({ error: "Vous ne pouvez ajouter des notes que pour vos propres matières." });
        }
    }

    try {
        const gradeId = await addGrade(student_id, subject_id, note);
        return res.status(201).json({
            success: true,
            message: "Note ajoutée avec succès !",
            id: gradeId
        });
    } catch (error) {
        console.error("[ERREUR AJOUT NOTE]", error);
        return res.status(500).json({ error: "Erreur lors de l'ajout de la note." });
    }
};

// Mettre à jour une note existante
const modifierNote = async (req, res) => {
    const id = req.params.id;
    const { note } = req.body;

    if (note === undefined) {
        return res.status(400).json({ error: "La nouvelle valeur de la note est requise." });
    }

    if (req.user.role === 'teacher') {
        const noteExistante = await getGradeById(id);
        if (!noteExistante) {
            return res.status(404).json({ error: "Note introuvable." });
        }
        const monProfil = await getTeacherByUserId(req.user.id);
        const matiere = await getSubjectById(noteExistante.subject_id);
        if (!monProfil || !matiere || matiere.teacher_id !== monProfil.id) {
            return res.status(403).json({ error: "Vous ne pouvez modifier que les notes de vos propres matières." });
        }
    }

    if (note < 0 || note > 20) {
        return res.status(400).json({ error: "La note doit être comprise entre 0 et 20." });
    }

    try {
        const estModifie = await updateGrade(id, note);

        if (!estModifie) {
            return res.status(404).json({ error: "Note introuvable ou aucune modification effectuée." });
        }

        return res.json({ success: true, message: "Note mise à jour avec succès." });
    } catch (error) {
        console.error("[ERREUR MODIFICATION NOTE]", error);
        return res.status(500).json({ error: "Erreur lors de la modification de la note." });
    }
};

// Supprime une note par son ID
const supprimerNote = async (req, res) => {
    const id = req.params.id;

    try {
        const estSupprime = await removeGrade(id);

        if (!estSupprime) {
            return res.status(404).json({ error: "Note introuvable ou déjà supprimée." });
        }

        return res.json({ success: true, message: "Note supprimée avec succès." });
    } catch (error) {
        console.error("[ERREUR SUPPRESSION NOTE]", error);
        return res.status(500).json({ error: "Erreur lors de la suppression de la note." });
    }
};

export {
    getNotes,
    getNoteParId,
    getNotesParEtudiant,
    getMoyenneEtudiant,
    ajouterNote,
    modifierNote,
    supprimerNote
};
