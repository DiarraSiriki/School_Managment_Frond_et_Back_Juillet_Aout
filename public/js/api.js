// URL dynamique : utilise la variable d'environnement de Vite en production, sinon l'adresse locale par défaut[cite: 2]
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const API = {
  // 1. Récupère le token JWT depuis le localStorage[cite: 2]
  getToken() {
    return localStorage.getItem('token'); //[cite: 2]
  },

  // 2. Client Fetch générique avec gestion d'en-tête et d'erreurs[cite: 2]
  async request(endpoint, options = {}) {
    const token = this.getToken(); //[cite: 2]

    const headers = {
      'Content-Type': 'application/json', //[cite: 2]
      ...(token && { 'Authorization': `Bearer ${token}` }), //[cite: 2]
      ...options.headers //[cite: 2]
    };

    const config = {
      ...options, //[cite: 2]
      headers //[cite: 2]
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config); //[cite: 2]

      if (response.status === 401 || response.status === 403) { //[cite: 2]
        console.warn("[API] Session expirée ou accès non autorisé."); //[cite: 2]
        localStorage.removeItem('token'); //[cite: 2]
        localStorage.removeItem('user'); //[cite: 2]
        window.location.href = '/'; //[cite: 2]
        return; //[cite: 2]
      }

      const data = await response.json(); //[cite: 2]

      if (!response.ok) { //[cite: 2]
        throw new Error(data.message || data.error || `Erreur serveur (${response.status})`); //[cite: 2]
      }

      return data; //[cite: 2]
    } catch (error) {
      console.error(`[ERREUR API] (${endpoint}):`, error.message); //[cite: 2]
      throw error; //[cite: 2]
    }
  },

  // 3. Méthodes Raccourcis HTTP[cite: 2]
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' }); //[cite: 2]
  },

  post(endpoint, body) {
    return this.request(endpoint, { //[cite: 2]
      method: 'POST', //[cite: 2]
      body: JSON.stringify(body) //[cite: 2]
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, { //[cite: 2]
      method: 'PUT', //[cite: 2]
      body: JSON.stringify(body) //[cite: 2]
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' }); //[cite: 2]
  },

  // AUTHENTIFICATION[cite: 2]
  auth: {
    login: (credentials) => API.post('/auth/login', credentials), //[cite: 2]
    me: () => API.get('/auth/me'), //[cite: 2]
    async logout() {
      try {
        await API.post('/auth/logout'); //[cite: 2]
      } catch (error) {
        console.warn('[API] Déconnexion serveur échouée, nettoyage local quand même.', error.message); //[cite: 2]
      } finally {
        localStorage.removeItem('token'); //[cite: 2]
        localStorage.removeItem('user'); //[cite: 2]
        window.location.href = '/'; //[cite: 2]
      }
    }
  },

  // UTILISATEURS / ADMIN[cite: 2]
  admin: {
    getUsers: () => API.get('/users'), //[cite: 2]
    createUser: (userData) => API.post('/users', userData), //[cite: 2]
    updateUser: (id, userData) => API.put(`/users/${id}`, userData), //[cite: 2]
    deleteUser: (id) => API.delete(`/users/${id}`) //[cite: 2]
  },

  // ÉTUDIANTS[cite: 2]
  students: {
    getAll: () => API.get('/students'), //[cite: 2]
    getById: (id) => API.get(`/students/${id}`), //[cite: 2]
    getByMatricule: (matricule) => API.get(`/students/matricule/${matricule}`), //[cite: 2]
    getMyProfile: () => API.get('/students/me'), //[cite: 2]
    create: (studentData) => API.post('/students', studentData), //[cite: 2]
    update: (id, studentData) => API.put(`/students/${id}`, studentData), //[cite: 2]
    delete: (id) => API.delete(`/students/${id}`) //[cite: 2]
  },

  // PROFESSEURS[cite: 2]
  teachers: {
    getAll: () => API.get('/teachers'), //[cite: 2]
    getById: (id) => API.get(`/teachers/${id}`), //[cite: 2]
    getMyProfile: () => API.get('/teachers/me'), //[cite: 2]
    create: (teacherData) => API.post('/teachers', teacherData), //[cite: 2]
    update: (id, teacherData) => API.put(`/teachers/${id}`, teacherData), //[cite: 2]
    delete: (id) => API.delete(`/teachers/${id}`) //[cite: 2]
  },

  // CLASSES[cite: 2]
  classes: {
    getAll: () => API.get('/classes'), //[cite: 2]
    getById: (id) => API.get(`/classes/${id}`), //[cite: 2]
    create: (classData) => API.post('/classes', classData), //[cite: 2]
    update: (id, classData) => API.put(`/classes/${id}`, classData), //[cite: 2]
    delete: (id) => API.delete(`/classes/${id}`) //[cite: 2]
  },

  // MATIÈRES[cite: 2]
  subjects: {
    getAll: () => API.get('/subjects'), //[cite: 2]
    getById: (id) => API.get(`/subjects/${id}`), //[cite: 2]
    create: (subjectData) => API.post('/subjects', subjectData), //[cite: 2]
    update: (id, subjectData) => API.put(`/subjects/${id}`, subjectData), //[cite: 2]
    delete: (id) => API.delete(`/subjects/${id}`) //[cite: 2]
  },

  // NOTES[cite: 2]
  grades: {
    getAll: () => API.get('/grades'), //[cite: 2]
    getByStudent: (studentId) => API.get(`/grades/student/${studentId}`), //[cite: 2]
    create: (gradeData) => API.post('/grades', gradeData), //[cite: 2]
    update: (id, gradeData) => API.put(`/grades/${id}`, gradeData), //[cite: 2]
    delete: (id) => API.delete(`/grades/${id}`) //[cite: 2]
  },

  // ABSENCES[cite: 2]
  absences: {
    getAll: () => API.get('/absences'), //[cite: 2]
    getByStudent: (studentId) => API.get(`/absences/student/${studentId}`), //[cite: 2]
    create: (absenceData) => API.post('/absences', absenceData), //[cite: 2]
    update: (id, absenceData) => API.put(`/absences/${id}`, absenceData), //[cite: 2]
    delete: (id) => API.delete(`/absences/${id}`) //[cite: 2]
  }
};

export default API;