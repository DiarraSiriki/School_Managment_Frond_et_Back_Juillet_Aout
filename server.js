import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Import des routes API
import classRoutes from './routes/classeRoute.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import matieresRoutes from './routes/matieresRoutes.js';
import gradesRoutes from './routes/gradesRoutes.js';
import absenceRoutes from './routes/absencesRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration des middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier public
app.use(express.static(join(__dirname, 'public')));

// Mapping des routes vers les fichiers HTML
const pagesMap = {
    '/': 'index.html',
    '/login': 'login.html',
    '/dashboard-admin': 'html/dashboard-admin.html',
    '/dashboard-etudiant': 'html/dashboard-etudiant.html',
    '/dashboard-prof': 'html/dashboard-prof.html',
    '/absences': 'html/absences.html',
    '/matieres': 'html/matieres.html',
    '/notes': 'html/notes.html',
    '/statistiques': 'html/statistiques.html',
    '/mon-profil': 'html/mon-profil.html'
};

// Création des routes pour chaque page HTML
for (const [route, file] of Object.entries(pagesMap)) {
    app.get(route, (req, res) => {
        res.sendFile(join(__dirname, 'public', file), (err) => {
            if (err) {
                console.error(`[PAGE INTROUVABLE] ${file}`);
                res.status(404).send(`Page introuvable : ${file}`);
            }
        });
    });
}

// Redirection pour les anciennes URLs avec /html/
app.get(['/HTML/:page', '/html/:page'], (req, res) => {
    const page = (req.params.page || '').toLowerCase();
    const redirectUrl = pagesMap[`/${page}`] || '/';
    res.redirect(redirectUrl);
});

// Configuration des routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', matieresRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/stats', statsRoutes);

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API School Management fonctionnelle' });
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
    res.status(404).json({ error: `Route non trouvée : ${req.originalUrl}` });
});

// Gestionnaire d'erreurs global (500)
app.use((err, req, res, next) => {
    console.error('[ERREUR SERVER]', err.stack);
    res.status(500).json({
        error: "Une erreur interne s'est produite sur le serveur.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log('=================================');
    console.log('Serveur School Management lancé !');
    console.log(`Port : ${PORT}`);
    console.log('=================================');
});
