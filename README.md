# Système de Gestion d'École (Web Application)

## Description du Projet
Application web complète pour la gestion scolaire. Développée en JavaScript (Node.js) avec Express.js, elle permet de gérer les utilisateurs, étudiants, professeurs, matières, notes, absences et de générer des statistiques globales via une interface web moderne.

L'accent est mis sur une architecture MVC propre, une API RESTful, l'authentification JWT, une base de données relationnelle locale et un système de journalisation (logging).

---

##  Fonctionnalités Principales

### Gestion des Utilisateurs
- Création de comptes administratifs
- Authentification par email et mot de passe
- Gestion des rôles (admin, teacher, student)

### Gestion des Étudiants
- Ajout, modification, suppression d'étudiants
- Recherche par matricule, nom ou classe
- Création automatique du compte utilisateur associé

### Gestion des Professeurs
- Ajout, modification, suppression de professeurs
- Assignation de matière principale
- Création automatique du compte utilisateur associé

### Gestion des Matières
- Création et modification de matières
- Assignation à des classes et professeurs
- Consultation des matières par classe

### Gestion des Notes
- Ajout, modification, suppression de notes
- Calcul des moyennes par étudiant
- Consultation des notes par étudiant

### Gestion des Absences
- Enregistrement des absences
- Modification du statut (justifiée/non justifiée)
- Historique des absences par étudiant

### Statistiques
- Calcul de la moyenne générale de l'établissement
- Classement des étudiants
- Profil statistique d'un étudiant (moyenne & absences)
- Identification du meilleur étudiant (major)

---

## Technologies Utilisées

- **Langage :** JavaScript / Node.js
- **Framework Backend :** Express.js
- **Base de données :** SQLite via le package `better-sqlite3`
- **Authentification :** JWT (JSON Web Tokens)
- **Frontend :** HTML5, CSS, JavaScript
- **Sécurité :** CORS, bcryptjs pour le hachage des mots de passe
- **Gestionnaire de version :** Git

---

## Structure du Projet

```text
School_Managment_Final_juillet/
├── server.js
├── package.json
├── .env                       # Variables d'environnement (optionnel)
├── .gitignore
├── db/
│   ├── database.js
│   └── database.db            # Si généré
├── models/
│   ├── modelUsers.js
│   ├── modelStudent.js
│   ├── modelTeacher.js
│   ├── modelSubjects.js
│   ├── modelGrade.js
│   └── modelAbsence.js
├── services/
│   ├── absenceService.js
│   ├── gradeService.js
│   ├── matiereService.js
│   ├── statsService.js
│   ├── studentService.js
│   ├── teacherService.js
│   └── userService.js
├── controllers/
│   ├── absencesControllers.js
│   ├── authController.js
│   ├── gradesControllers.js
│   ├── matieresControllers.js
│   ├── statsControllers.js
│   ├── studentControllers.js
│   ├── teacherControllers.js
│   └── usersControllers.js
├── routes/
│   ├── absencesRoutes.js
│   ├── authRoutes.js
│   ├── gradesRoutes.js
│   ├── matieresRoutes.js
│   ├── statsRoutes.js
│   ├── studentRoutes.js
│   ├── teacherRoutes.js
│   └── usersRoutes.js
├── middlewares/
│   └── authMiddleware.js
├── public/
│   ├── index.html
│   ├── login.html
│   ├── html/
│   │   ├── absences.html
│   │   ├── dashboard-admin.html
│   │   ├── dashboard-etudiant.html
│   │   ├── dashboard-prof.html
│   │   ├── matieres.html
│   │   ├── notes.html
│   │   ├── statistiques.html
│   │   └── mon-profil.html
│   ├── css/
│   │   ├── absences.css
│   │   ├── dashboard-admin.css
│   │   ├── dashboard-etudiant.css
│   │   ├── dashboard-prof.css
│   │   ├── login.css
│   │   ├── matieres.css
│   │   ├── notes.css
│   │   └── statistiques.css
│   └── js/
│       ├── absences.js
│       ├── api.js
│       ├── authGuard.js
│       ├── dashboard-admin.js
│       ├── dashboard-etudiant.js
│       ├── dashboard-prof.js
│       ├── login.js
│       ├── matieres.js
│       ├── notes.js
│       └── statistiques.js
├── utils/
│   └── logger.js
└── logs/
```
---

## Installation

1. Cloner le dépôt :

```bash
git clone <url-du-dépôt>
cd School_Managment_Final_juillet
```

2. Installer les dépendances :

```bash
npm install
```

3. Configurer les variables d'environnement (optionnel) :

Créer un fichier `.env` à la racine du projet :

```env
PORT=3000
JWT_SECRET=votre_clé_secrète_super_securisée
NODE_ENV=development
```

4. Initialiser la base de données (optionnel) :

Si vous souhaitez peupler la base de données avec des données de test :

```bash
node scripts/seed.js
```

Cela créera un compte admin par défaut :
- Email : `admin@school.com`
- Mot de passe : `Admin123!`

Et des comptes de test :
- Professeur : `marie.kouassi@school.com` / `Prof123!`
- Étudiant : `siriki.diarra@school.com` / `Etu123!`

---

## Utilisation

### Lancer le serveur

**Mode développement** (avec auto-reload) :
```bash
npm run dev
```

**Mode production** :
```bash
npm start
```

Le serveur sera accessible à l'adresse : `http://localhost:3000`

### Accéder à l'application

1. Ouvrir un navigateur et aller à `http://localhost:3000`
2. Se connecter avec un compte existant ou créer un compte admin
3. Naviguer selon le rôle :
   - **Admin** : Dashboard administrateur
   - **Professeur** : Dashboard professeur
   - **Étudiant** : Dashboard étudiant

### Rôles et Accès

- **Admin :** Accès complet à toutes les fonctionnalités (gestion utilisateurs, étudiants, professeurs, matières, notes, absences, statistiques)
- **Professeur :** Gestion des notes, consultation des étudiants et matières, consultation des absences
- **Étudiant :** Consultation de ses notes, absences et moyenne

---

## Architecture

Le projet suit une architecture **MVC (Model-View-Controller)** avec séparation des responsabilités :

### Flux de données

```
Frontend (public/js/) → API (routes/) → Controllers → Services → Models → Base de données (SQLite)
```

### Couches de l'application

1. **Frontend** (`public/`) :
   - Pages HTML pour l'interface utilisateur
   - CSS pour le style
   - JavaScript vanilla pour la logique frontend et appels API

2. **Routes** (`routes/`) :
   - Définition des endpoints API
   - Application des middlewares d'authentification
   - Routage vers les contrôleurs appropriés

3. **Controllers** (`controllers/`) :
   - Traitement des requêtes HTTP
   - Validation des données
   - Appel des services
   - Retour des réponses JSON

4. **Services** (`services/`) :
   - Logique métier
   - Traitement des données
   - Appel des modèles

5. **Models** (`models/`) :
   - Interaction avec la base de données
   - Requêtes SQL
   - Validation des contraintes

6. **Middleware** (`middleware/`) :
   - Authentification JWT
   - Vérification des rôles
   - Gestion des erreurs

---

## Sécurité

- **Authentification JWT** : Tokens stateless pour l'authentification
- **Rôles et permissions** : Contrôle d'accès basé sur les rôles (admin, teacher, student)
- **CORS** : Configuration pour autoriser les requêtes cross-origin
- **Validation** : Validation des données côté serveur
- **Hachage des mots de passe** : Utilisation de bcryptjs (optionnel)

---

## Développement

### Scripts disponibles

- `npm run dev` : Lance le serveur avec nodemon (auto-reload)
- `npm start` : Lance le serveur en mode production
- `npm test` : Lance les tests (à implémenter)

### Journalisation

Le système de journalisation enregistre les événements dans le fichier `logs/app.log` avec les niveaux suivants :
- **INFO** : Connexions réussies, déconnexions, consultations de données
- **WARN** : Connexions échouées, données manquantes
- **ERROR** : Erreurs serveur, échecs d'API

Les logs incluent :
- Tentatives de connexion et déconnexion avec email et rôle
- Actions sur les données (création, modification, suppression)
- Erreurs serveur et exceptions
- Informations de débogage pour le dashboard étudiant

---

