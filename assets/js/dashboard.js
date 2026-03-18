import { api } from './api.js';
import { getFrequencyLabel, getLogForDate, isHabitDueOnDate } from './frequency.js';
import { state, setState, subscribe } from './state.js';

const todayHabitList = document.getElementById('todayHabitList');
const statsGrid = document.getElementById('statsGrid');
const graph = document.getElementById('dashboardGraph');
const message = document.getElementById('dashboardMessage');
const logoutButton = document.getElementById('logoutButton');

function showMessage(text) {
    if (!message) {
        return;
    }

    message.textContent = text;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        message.textContent = '';
    }, 2400);
}

function renderStats(appState) {
    if (!statsGrid) {
        return;
    }

    const dueToday = appState.habits.filter((habit) => isHabitDueOnDate(habit, appState.selectedDate)).length;
    const completedToday = appState.habits.filter((habit) => {
        if (!isHabitDueOnDate(habit, appState.selectedDate)) {
            return false;
        }
        return Boolean(getLogForDate(habit, appState.logs, appState.selectedDate)?.completed);
    }).length;

    const cards = [
        ['Due today', dueToday],
        ['Completed today', completedToday],
        ['Overall rate', `${Math.round(appState.summary?.completion_rate ?? 0)}%`],
        ['Tracked habits', appState.summary?.habit_count ?? appState.habits.length],
    ];

    statsGrid.innerHTML = cards.map(([label, value]) => `
        <article class="stat-card">
            <span class="eyebrow">${label}</span>
            <strong>${value}</strong>
        </article>
    `).join('');
}

function renderTodayHabits(appState) {
    if (!todayHabitList) {
        return;
    }

    const dueHabits = appState.habits.filter((habit) => isHabitDueOnDate(habit, appState.selectedDate));

    if (dueHabits.length === 0) {
        todayHabitList.innerHTML = '<article class="habit-card"><div><h3>No habits due today</h3><p>Enjoy the lighter day, or head to Habits to plan ahead.</p></div></article>';
        return;
    }

    todayHabitList.innerHTML = dueHabits.map((habit) => {
        const log = getLogForDate(habit, appState.logs, appState.selectedDate);
        const stat = appState.stats.find((entry) => entry.habit_id === habit.id);
        const completed = Boolean(log?.completed);

        return `
            <article class="habit-card habit-card-compact">
                <div>
                    <h3>${habit.name}</h3>
                    <p>${getFrequencyLabel(habit, appState.selectedDate)} | Current streak: <strong>${stat?.current_streak ?? 0}</strong></p>
                </div>
                <div class="habit-actions">
                    <button class="toggle-button ${completed ? 'completed' : ''}" data-id="${habit.id}">
                        ${completed ? 'Set incomplete' : 'Set complete'}
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function getDailyBuckets(appState) {
    const buckets = [];
    const today = new Date(`${appState.selectedDate}T00:00:00`);

    for (let offset = 6; offset >= 0; offset -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - offset);
        const dateString = day.toISOString().slice(0, 10);

        let due = 0;
        let completed = 0;

        appState.habits.forEach((habit) => {
            if (!isHabitDueOnDate(habit, dateString)) {
                return;
            }

            due += 1;
            if (getLogForDate(habit, appState.logs, dateString)?.completed) {
                completed += 1;
            }
        });

        buckets.push({
            label: day.toLocaleDateString(undefined, { weekday: 'short' }),
            rate: due > 0 ? Math.round((completed / due) * 100) : 0,
        });
    }

    return buckets;
}

function renderGraph(appState) {
    if (!graph) {
        return;
    }

    const buckets = getDailyBuckets(appState);

    graph.innerHTML = `
        <div class="chart-bars">
            ${buckets.map((bucket) => `
                <div class="chart-bar-group">
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="height: ${Math.max(bucket.rate, 6)}%"></div>
                    </div>
                    <strong>${bucket.rate}%</strong>
                    <span>${bucket.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

async function refreshDashboard() {
    try {
        const [habitData, logData, statsData] = await Promise.all([
            api.getHabits(),
            api.getLogs(),
            api.getStats(),
        ]);

        setState({
            habits: habitData.habits ?? [],
            logs: logData.logs ?? [],
            stats: statsData.stats ?? [],
            summary: statsData.summary ?? null,
        });
    } catch (error) {
        if (error.message === 'Authentication required.') {
            window.location.href = './index.html';
            return;
        }
        showMessage(error.message);
    }
}

if (todayHabitList) {
    todayHabitList.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-id]');
        if (!button) {
            return;
        }

        const habitId = Number(button.dataset.id);
        const habit = state.habits.find((entry) => entry.id === habitId);
        if (!habit) {
            return;
        }

        const existing = getLogForDate(habit, state.logs, state.selectedDate);

        try {
            await api.logHabit({
                habit_id: habitId,
                date: state.selectedDate,
                completed: !(existing?.completed ?? false),
            });
            showMessage('Today updated.');
            await refreshDashboard();
        } catch (error) {
            showMessage(error.message);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await api.logout();
        } finally {
            window.location.href = './index.html';
        }
    });
}

subscribe((appState) => {
    renderStats(appState);
    renderTodayHabits(appState);
    renderGraph(appState);
});

refreshDashboard();
