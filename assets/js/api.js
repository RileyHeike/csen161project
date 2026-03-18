const API_ROOT = '../api';

async function request(path, options = {}) {
    const config = {
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
        ...options,
    };

    if (config.body && !(config.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_ROOT}${path}`, config);
    const rawText = await response.text();
    let payload = null;

    try {
        payload = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
        payload = null;
    }

    if (!response.ok || !payload || payload.success !== true) {
        const message = payload?.error || rawText || 'Request failed.';
        throw new Error(message);
    }

    return payload.data;
}

export const api = {
    request,
    register: (body) => request('/auth/register.php', { method: 'POST', body }),
    login: (body) => request('/auth/login.php', { method: 'POST', body }),
    logout: () => request('/auth/logout.php', { method: 'POST', body: {} }),
    getHabits: () => request('/habits/list.php'),
    createHabit: (body) => request('/habits/create.php', { method: 'POST', body }),
    updateHabit: (body) => request('/habits/update.php', { method: 'POST', body }),
    deleteHabit: (id) => request('/habits/delete.php', { method: 'POST', body: { id } }),
    getLogs: (params = '') => request(`/logs/list.php${params}`),
    logHabit: (body) => request('/logs/log.php', { method: 'POST', body }),
    getStats: () => request('/analytics/stats.php'),
    getProfile: () => request('/profile/get.php'),
};
