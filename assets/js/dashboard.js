import { api } from './api.js';
import { getFrequencyLabel, getLogForDate, isHabitDueOnDate } from './frequency.js';
import { state, setState, subscribe } from './state.js';

const habitList = document.getElementById('habitList');
const statsGrid = document.getElementById('statsGrid');
const message = document.getElementById('dashboardMessage');
const dialog = document.getElementById('habitDialog');
const openDialogButton = document.getElementById('openHabitModal');
const cancelDialogButton = document.getElementById('cancelHabitDialog');
const habitForm = document.getElementById('habitForm');
const logoutButton = document.getElementById('logoutButton');
const habitFormTitle = document.getElementById('habitFormTitle');

function showMessage(text) {
    message.textContent = text;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        message.textContent = '';
    }, 2400);
}

function renderStats(appState) {
    const cards = [
        ['Habits', appState.summary?.habit_count ?? appState.habits.length],
        ['Logs', appState.summary?.completed_logs ?? 0],
        ['Rate', `${Math.round(appState.summary?.completion_rate ?? 0)}%`],
        ['Date', appState.selectedDate],
    ];

    statsGrid.innerHTML = cards.map(([label, value]) => `
        <article class="stat-card">
            <span class="eyebrow">${label}</span>
            <strong>${value}</strong>
        </article>
    `).join('');
}

function renderHabits(appState) {
    if (appState.habits.length === 0) {
        habitList.innerHTML = '<article class="habit-card"><div><h3>No habits yet</h3><p>Create your first habit to start tracking.</p></div></article>';
        return;
    }

    habitList.innerHTML = appState.habits.map((habit) => {
        const habitLog = getLogForDate(habit, appState.logs, appState.selectedDate);
        const isCompleted = Boolean(habitLog?.completed);
        const isDueToday = isHabitDueOnDate(habit, appState.selectedDate);
        const stat = appState.stats.find((entry) => entry.habit_id === habit.id);

        return `
            <article class="habit-card">
                <div>
                    <div class="section-heading">
                        <div>
                            <h3>${habit.name}</h3>
                            <p>${habit.description || 'No description yet.'}</p>
                        </div>
                        <span class="pill">${habit.frequency}</span>
                    </div>
                    <p>Current streak: <strong>${stat?.current_streak ?? 0}</strong> | Longest streak: <strong>${stat?.longest_streak ?? 0}</strong></p>
                    <p>${isDueToday ? `Due ${getFrequencyLabel(habit, appState.selectedDate)}` : `Not due ${getFrequencyLabel(habit, appState.selectedDate)}`}</p>
                </div>
                <div class="habit-actions">
                    <button class="toggle-button ${isCompleted ? 'completed' : ''}" data-action="toggle" data-id="${habit.id}" ${isDueToday ? '' : 'disabled'}>
                        ${isCompleted ? 'Completed' : (isDueToday ? 'Mark complete' : 'Not due')}
                    </button>
                    <button class="ghost-button" data-action="edit" data-id="${habit.id}">Edit</button>
                    <button class="ghost-button" data-action="delete" data-id="${habit.id}">Delete</button>
                </div>
            </article>
        `;
    }).join('');
}

function openCreateDialog() {
    habitForm.reset();
    habitForm.elements.id.value = '';
    habitFormTitle.textContent = 'Create Habit';
    dialog.showModal();
}

function openEditDialog(habitId) {
    const habit = state.habits.find((entry) => entry.id === habitId);
    if (!habit) {
        return;
    }

    habitFormTitle.textContent = 'Edit Habit';
    habitForm.elements.id.value = habit.id;
    habitForm.elements.name.value = habit.name;
    habitForm.elements.description.value = habit.description || '';
    habitForm.elements.frequency.value = habit.frequency;
    dialog.showModal();
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

openDialogButton.addEventListener('click', openCreateDialog);
cancelDialogButton.addEventListener('click', () => dialog.close());

habitForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(habitForm);
    const payload = {
        id: Number(formData.get('id') || 0),
        name: formData.get('name'),
        description: formData.get('description'),
        frequency: formData.get('frequency'),
    };

    try {
        if (payload.id > 0) {
            await api.updateHabit(payload);
            showMessage('Habit updated.');
        } else {
            await api.createHabit(payload);
            showMessage('Habit created.');
        }
        dialog.close();
        await refreshDashboard();
    } catch (error) {
        showMessage(error.message);
    }
});

habitList.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (!actionButton) {
        return;
    }

    const habitId = Number(actionButton.dataset.id);
    const action = actionButton.dataset.action;

    try {
        if (action === 'edit') {
            openEditDialog(habitId);
            return;
        }

        if (action === 'delete') {
            await api.deleteHabit(habitId);
            showMessage('Habit deleted.');
        }

        if (action === 'toggle') {
            const habit = state.habits.find((entry) => entry.id === habitId);
            if (!habit || !isHabitDueOnDate(habit, state.selectedDate)) {
                showMessage('This habit is not due today.');
                return;
            }

            const existing = getLogForDate(habit, state.logs, state.selectedDate);
            await api.logHabit({
                habit_id: habitId,
                date: state.selectedDate,
                completed: !(existing?.completed ?? false),
            });
            showMessage('Progress updated.');
        }

        await refreshDashboard();
    } catch (error) {
        showMessage(error.message);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await api.logout();
    } finally {
        window.location.href = './index.html';
    }
});

subscribe((appState) => {
    renderStats(appState);
    renderHabits(appState);
});

refreshDashboard();
