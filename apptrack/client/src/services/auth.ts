const API_URL = import.meta.env.VITE_API_URL;

export const authApi = {
    checkAuthStatus: async () => {
        const response = await fetch(`${API_URL}/api/auth/user`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        return response.json();
    },

    logout: async () => {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Logout failed');
        return response.json();
    }
};