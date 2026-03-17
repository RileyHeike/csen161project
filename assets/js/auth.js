import { api } from './api.js';

const tabs = document.querySelectorAll('.tab-button');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const message = document.getElementById('authMessage');

function showTab(tabName) {
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    loginForm.classList.toggle('hidden', tabName !== 'login');
    registerForm.classList.toggle('hidden', tabName !== 'register');
    message.textContent = '';
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Logging in...';

    try {
        const formData = new FormData(loginForm);
        await api.login({
            identifier: formData.get('identifier'),
            password: formData.get('password'),
        });
        window.location.href = './dashboard.html';
    } catch (error) {
        message.textContent = error.message;
    }
});

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Creating your account...';

    try {
        const formData = new FormData(registerForm);
        await api.register({
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
        });
        window.location.href = './dashboard.html';
    } catch (error) {
        message.textContent = error.message;
    }
});
