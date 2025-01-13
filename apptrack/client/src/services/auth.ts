import { api } from './api';  // Import the axios instance you already have

export const authApi = {
    checkAuthStatus: async () => {
        const response = await api.get('/api/auth/user');
        return response.data;
    },

    logout: async () => {
        await api.post('/api/auth/logout');
        // After successful logout, update app state
        window.location.href = '/login';  // Force a full page reload to clear state
    }
};