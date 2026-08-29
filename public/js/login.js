document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const mot_passe = document.getElementById('password').value;

    try {
        const result = await API.auth.login({ email, mot_passe });

        if (result.success || result.token) {
           
            const role = result.user?.role;

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            const redirectMap = {
                admin: '/dashboard-admin',
                teacher: '/dashboard-prof',
                student: '/dashboard-etudiant'
            };

            if (role && redirectMap[role]) {
                window.location.href = redirectMap[role];
            } else {
                alert("Rôle utilisateur inconnu.");
            }
        } else {
            alert(result.message || result.error || "Échec de la connexion.");
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert(error.message || "Erreur réseau lors de la connexion.");
    }
});