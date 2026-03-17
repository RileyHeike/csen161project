import { api } from './api.js';
import { getFrequencyLabel, getLogForDate, isHabitDueOnDate } from './frequency.js';
import { state, setState } from './state.js';

const calendarTitle = document.getElementById('calendarTitle');
const weekdayRow = document.getElementById('weekdayRow');
const calendarGrid = document.getElementById('calendarGrid');
const previousMonthButton = document.getElementById('previousMonth');
const nextMonthButton = document.getElementById('nextMonth');
const logoutButton = document.getElementById('logoutButton');
const message = document.getElementById('calendarMessage');
const dayDialog = document.getElementById('dayDialog');
const closeDayDialogButton = document.getElementById('closeDayDialog');
const dayDialogTitle = document.getElementById('dayDialogTitle');
const dayDialogSubtitle = document.getElementById('dayDialogSubtitle');
const dayHabitList = document.getElementById('dayHabitList');

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
weekdayRow.innerHTML = weekdayLabels.map((label) => `<div class="weekday-cell">${label}</div>`).join('');

function showMessage(text) {
    message.textContent = text;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        message.textContent = '';
    }, 2400);
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function getMonthWindow(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
}

function getLogsForDate(dateString) {
    const dayLogs = state.logs.filter((log) => log.date === dateString);
    const completedHabitIds = new Set(dayLogs.filter((log) => log.completed).map((log) => log.habit_id));

    return state.habits
        .filter((habit) => isHabitDueOnDate(habit, dateString))
        .map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        description: habit.description,
        completed: completedHabitIds.has(habit.id),
    }));
}

function openDayDialog(dateString) {
    setState({ selectedDate: dateString });
    renderDayDialog();
    dayDialog.showModal();
}

function renderDayDialog() {
    const date = new Date(`${state.selectedDate}T00:00:00`);
    const dueHabits = state.habits.filter((habit) => isHabitDueOnDate(habit, state.selectedDate));

    dayDialogTitle.textContent = date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    dayDialogSubtitle.textContent = `${dueHabits.length} habit${dueHabits.length === 1 ? '' : 's'} due`;

    if (dueHabits.length === 0) {
        dayHabitList.innerHTML = '<article class="habit-card"><div><h3>Nothing scheduled</h3><p>No habits are due on this day.</p></div></article>';
        return;
    }

    dayHabitList.innerHTML = dueHabits.map((habit) => {
        const log = getLogForDate(habit, state.logs, state.selectedDate);
        const isCompleted = Boolean(log?.completed);

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
                    <p>Due ${getFrequencyLabel(habit, state.selectedDate)}</p>
                </div>
                <div class="habit-actions">
                    <button class="toggle-button ${isCompleted ? 'completed' : ''}" data-action="toggle-day" data-id="${habit.id}">
                        ${isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function renderCalendar() {
    const currentMonth = state.currentMonth;
    const { start, end } = getMonthWindow(currentMonth);
    const firstWeekday = start.getDay();
    const daysInMonth = end.getDate();
    const cells = [];
    const todayString = new Date().toISOString().slice(0, 10);

    calendarTitle.textContent = currentMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });

    for (let index = 0; index < firstWeekday; index += 1) {
        cells.push('<article class="calendar-cell muted"></article>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(cellDate);
        const logs = getLogsForDate(dateString);
        const dueCount = logs.length;
        const completedCount = logs.filter((log) => log.completed).length;

        cells.push(`
            <article class="calendar-cell ${dateString === todayString ? 'today' : ''}" data-date="${dateString}">
                <strong>${day}</strong>
                <span>${completedCount}/${dueCount} due</span>
                <div class="calendar-dot-list">
                    ${logs.map((log) => `<span class="calendar-dot ${log.completed ? 'completed' : ''}" title="${log.name}"></span>`).join('')}
                </div>
            </article>
        `);
    }

    calendarGrid.innerHTML = cells.join('');
}

async function refreshCalendar() {
    const { start, end } = getMonthWindow(state.currentMonth);
    const query = `?start_date=${formatDate(start)}&end_date=${formatDate(end)}`;

    try {
        const [habitData, logData] = await Promise.all([
            api.getHabits(),
            api.getLogs(query),
        ]);
        setState({
            habits: habitData.habits ?? [],
            logs: logData.logs ?? [],
        });
        renderCalendar();
    } catch (error) {
        if (error.message === 'Authentication required.') {
            window.location.href = './index.html';
            return;
        }
        showMessage(error.message);
    }
}

previousMonthButton.addEventListener('click', async () => {
    setState({
        currentMonth: new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1),
    });
    await refreshCalendar();
});

nextMonthButton.addEventListener('click', async () => {
    setState({
        currentMonth: new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1),
    });
    await refreshCalendar();
});

logoutButton.addEventListener('click', async () => {
    try {
        await api.logout();
    } finally {
        window.location.href = './index.html';
    }
});

calendarGrid.addEventListener('click', (event) => {
    const cell = event.target.closest('.calendar-cell[data-date]');
    if (!cell) {
        return;
    }

    openDayDialog(cell.dataset.date);
});

closeDayDialogButton.addEventListener('click', () => {
    dayDialog.close();
});

dayHabitList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="toggle-day"]');
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
        showMessage('Day updated.');
        await refreshCalendar();
        renderDayDialog();
    } catch (error) {
        showMessage(error.message);
    }
});

refreshCalendar();
