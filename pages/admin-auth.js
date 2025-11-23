// Sistema de autenticación para administradores
const ADMIN_SESSION_KEY = 'admin_session';

const adminAuthSystem = {
    // Iniciar sesión como administrador
    async login(email, password) {
        try {
            const response = await fetch('../api/api.php?action=admin_login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setSession(data.admin, data.token);
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Error desconocido al iniciar sesión' };
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    },
    
    // Cerrar sesión
    logout() {
        const session = this.getSession();
        if (session && session.token) {
            // Notificar al servidor que se cierra la sesión
            fetch('../api/api.php?action=admin_logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: session.token })
            }).catch(err => console.error('Error al cerrar sesión en servidor:', err));
        }
        localStorage.removeItem(ADMIN_SESSION_KEY);
    },
    
    // Verificar si hay sesión activa
    isAuthenticated() {
        const session = this.getSession();
        return session !== null && session.token && session.admin;
    },
    
    // Obtener administrador actual
    getCurrentAdmin() {
        const session = this.getSession();
        return session ? session.admin : null;
    },
    
    // Obtener token de sesión
    getToken() {
        const session = this.getSession();
        return session ? session.token : null;
    },
    
    // Establecer sesión
    setSession(admin, token) {
        const sessionData = {
            token: token,
            admin: {
                id: admin.id,
                nombre: admin.nombre,
                email: admin.email,
                rol: admin.rol
            },
            fechaCreacion: new Date().toISOString()
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    },
    
    // Obtener sesión
    getSession() {
        const stored = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!stored) return null;
        
        try {
            const session = JSON.parse(stored);
            // Verificar que la sesión no esté expirada (24 horas)
            const fechaCreacion = new Date(session.fechaCreacion);
            const ahora = new Date();
            const horasTranscurridas = (ahora - fechaCreacion) / (1000 * 60 * 60);
            
            if (horasTranscurridas > 24) {
                this.logout();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Error al parsear sesión:', error);
            return null;
        }
    },
    
    // Requerir autenticación (redirigir si no está autenticado)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    }
};

// Exportar para uso global
window.adminAuthSystem = adminAuthSystem;

