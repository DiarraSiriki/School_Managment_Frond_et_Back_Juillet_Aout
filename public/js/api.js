const API_BASE_URL = 'http://localhost:3000/api';

const API = {
  // 1. Récupère le token JWT depuis le localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // 2. Client Fetch générique avec gestion d'en-tête et d'erreurs
  async request(endpoint, options = {}) {
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401 || response.status === 403) {
        console.warn("[API] Session expirée ou accès non autorisé.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erreur serveur (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error(`[ERREUR API] (${endpoint}):`, error.message);
      throw error;
    }
  },

  // 3. Méthodes Raccourcis HTTP
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // AUTHENTIFICATION
  auth: {
    login: (credentials) => API.post('/auth/login', credentials),
    me: () => API.get('/auth/me'),
    async logout() {
      try {
        await API.post('/auth/logout');
      } catch (error) {
        console.warn('[API] Déconnexion serveur échouée, nettoyage local quand même.', error.message);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
  },

  // UTILISATEURS / ADMIN
  admin: {
    getUsers: () => API.get('/users'),
    createUser: (userData) => API.post('/users', userData),
    updateUser: (id, userData) => API.put(`/users/${id}`, userData),
    deleteUser: (id) => API.delete(`/users/${id}`)
  },

  // ÉTUDIANTS
  students: {
    getAll: () => API.get('/students'),
    getById: (id) => API.get(`/students/${id}`),
    getByMatricule: (matricule) => API.get(`/students/matricule/${matricule}`),
    getMyProfile: () => API.get('/students/me'),
    create: (studentData) => API.post('/students', studentData),
    update: (id, studentData) => API.put(`/students/${id}`, studentData),
    delete: (id) => API.delete(`/students/${id}`)
  },

  // PROFESSEURS
  teachers: {
    getAll: () => API.get('/teachers'),
    getById: (id) => API.get(`/teachers/${id}`),
    getMyProfile: () => API.get('/teachers/me'),
    create: (teacherData) => API.post('/teachers', teacherData),
    update: (id, teacherData) => API.put(`/teachers/${id}`, teacherData),
    delete: (id) => API.delete(`/teachers/${id}`)
  },

  // CLASSES
  classes: {
    getAll: () => API.get('/classes'),
    getById: (id) => API.get(`/classes/${id}`),
    create: (classData) => API.post('/classes', classData),
    update: (id, classData) => API.put(`/classes/${id}`, classData),
    delete: (id) => API.delete(`/classes/${id}`)
  },

  // MATIÈRES
  subjects: {
    getAll: () => API.get('/subjects'),
    getById: (id) => API.get(`/subjects/${id}`),
    create: (subjectData) => API.post('/subjects', subjectData),
    update: (id, subjectData) => API.put(`/subjects/${id}`, subjectData),
    delete: (id) => API.delete(`/subjects/${id}`)
  },

  // NOTES
  grades: {
    getAll: () => API.get('/grades'),
    getByStudent: (studentId) => API.get(`/grades/student/${studentId}`),
    create: (gradeData) => API.post('/grades', gradeData),
    update: (id, gradeData) => API.put(`/grades/${id}`, gradeData),
    delete: (id) => API.delete(`/grades/${id}`)
  },

  // ABSENCES
  absences: {
    getAll: () => API.get('/absences'),
    getByStudent: (studentId) => API.get(`/absences/student/${studentId}`),
    create: (absenceData) => API.post('/absences', absenceData),
    update: (id, absenceData) => API.put(`/absences/${id}`, absenceData),
    delete: (id) => API.delete(`/absences/${id}`)
  }
};