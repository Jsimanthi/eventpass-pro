import { login } from './api.js';

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await login(email, password);
        // Handle successful login, e.g., redirect to a dashboard
        console.log('Login successful:', response);
        window.location.href = '/';
    } catch (error) {
        // Handle login error
        console.error('Login failed:', error.message);
    }
});