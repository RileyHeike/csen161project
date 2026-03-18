import { api } from './api.js';

const profileSummary = document.getElementById('profileSummary');
const profileInfo = document.getElementById('profileInfo');
const profileActivity = document.getElementById('profileActivity');
const logoutButton = document.getElementById('logoutButton');
const message = document.getElementById('profileMessage');

function showMessage(text) {
    message.textContent = text;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        message.textContent = '';
    }, 2400);
}

function formatDateTime(value) {
    if (!value) {
        return 'Not available';
    }

    return new Date(value.replace(' ', 'T')).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function renderSummary(profile) {
    const cards = [
        ['Username', profile.username],
        ['Email', profile.email],
        ['Habits', profile.habit_count],
        ['Completed logs', profile.completed_logs],
    ];

    profileSummary.innerHTML = cards.map(([label, value]) => `
        <article class="stat-card">
            <span class="eyebrow">${label}</span>
            <strong>${value}</strong>
        </article>
    `).join('');
}

function renderInfo(profile) {
    const rows = [
        ['Username', profile.username],
        ['Email', profile.email],
        ['Account created', formatDateTime(profile.account_created_at)],
        ['Joined', formatDateTime(profile.joined_at)],
        ['First habit created', formatDateTime(profile.first_habit_created_at)],
    ];

    profileInfo.innerHTML = rows.map(([label, value]) => `
        <article class="insight-row">
            <div>
                <h3>${label}</h3>
            </div>
            <div class="insight-metrics">
                <span>${value}</span>
            </div>
        </article>
    `).join('');
}

function renderActivity(profile) {
    const completionRate = profile.total_logs > 0
        ? `${Math.round((profile.completed_logs / profile.total_logs) * 100)}%`
        : '0%';

    const rows = [
        ['Tracked habits', `${profile.habit_count}`],
        ['Completed logs', `${profile.completed_logs}`],
        ['All logs', `${profile.total_logs}`],
        ['Completion rate', completionRate],
    ];

    profileActivity.innerHTML = rows.map(([label, value]) => `
        <article class="insight-row">
            <div>
                <h3>${label}</h3>
            </div>
            <div class="insight-metrics">
                <strong>${value}</strong>
            </div>
        </article>
    `).join('');
}

async function loadProfile() {
    try {
        const data = await api.getProfile();
        const profile = data.profile;
        renderSummary(profile);
        renderInfo(profile);
        renderActivity(profile);
    } catch (error) {
        if (error.message === 'Authentication required.') {
            window.location.href = './index.html';
            return;
        }
        showMessage(error.message);
    }
}

logoutButton.addEventListener('click', async () => {
    try {
        await api.logout();
    } finally {
        window.location.href = './index.html';
    }
});

loadProfile();
