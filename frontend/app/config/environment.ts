export const environment = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    apiEndpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register'
        }
    }
}; 