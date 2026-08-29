import {
    getGeneralAverage, getBestStudent,
     getRankings,countAbsencesByStudent,
    countAllAbsences, getAllStats
} from '../services/statsService.js';
import { getStudentByUserId } from '../services/studentService.js';

// Récupère la moyenne générale de l'établissement
const getMoyenneGenerale = async (req, res) => {
    try {
        const moyenne = await getGeneralAverage();
        return res.json({
            success: true,
            moyenne_generale: moyenne
        });
    } catch (error) {
        console.error("[ERREUR GET MOYENNE GENERALE]", error);
        return res.status(500).json({ error: "Impossible de calculer la moyenne générale." });
    }
};

// Récupère le classement général des étudiants par moyenne
const getClassement = async (req, res) => {
    try {
        const rankings = await getRankings();
        return res.json(rankings);
    } catch (error) {
        console.error("[ERREUR GET CLASSEMENT]", error);
        return res.status(500).json({ error: "Impossible de récupérer le classement des étudiants." });
    }
};

// Récupère le meilleur étudiant de l'établissement
const getMeilleurEtudiant = async (req, res) => {
    try {
        const bestStudent = await getBestStudent();
        if (!bestStudent) {
            return res.status(404).json({ error: "Aucun étudiant ou aucune note enregistrée." });
        }
        return res.json(bestStudent);
    } catch (error) {
        console.error("[ERREUR GET MEILLEUR ETUDIANT]", error);
        return res.status(500).json({ error: "Impossible de déterminer le meilleur étudiant." });
    }
};

// Récupère le total des absences globales (justifiées vs non justifiées)
const getStatsAbsencesGlobales = async (req, res) => {
    try {
        const stats = await countAllAbsences();
        return res.json({
            success: true,
            absences: stats
        });
    } catch (error) {
        console.error("[ERREUR GET ABSENCES GLOBALES]", error);
        return res.status(500).json({ error: "Impossible de calculer les statistiques des absences." });
    }
};

// Récupère le bilan des absences pour un étudiant spécifique
const getStatsAbsencesParEtudiant = async (req, res) => {
    const student_id = req.params.student_id;

    if (req.user.role === 'student') {
        const me = await getStudentByUserId(req.user.id);
        if (!me || String(me.id) !== String(student_id)) {
            return res.status(403).json({ error: "Vous ne pouvez voir que vos propres statistiques d'absences." });
        }
    }

    try {
        const stats = await countAbsencesByStudent(student_id);
        return res.json({
            success: true,
            student_id: Number(student_id),
            absences: stats
        });
    } catch (error) {
        console.error("[ERREUR GET ABSENCES ETUDIANT]", error);
        return res.status(500).json({ error: "Impossible de récupérer les absences de cet étudiant." });
    }
};

// Récupère toutes les statistiques globales (étudiants, professeurs, matières, etc.)
const getStats = async (req, res) => {
    try {
        const stats = await getAllStats();
        return res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error("[ERREUR GET STATS GLOBALES]", error);
        return res.status(500).json({ error: "Impossible de récupérer les statistiques globales." });
    }
};

export {
    getMoyenneGenerale,
    getClassement,
    getMeilleurEtudiant,
    getStatsAbsencesGlobales,
    getStatsAbsencesParEtudiant,
    getStats
};
