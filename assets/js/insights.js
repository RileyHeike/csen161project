import { api } from './api.js';

const insightSummary = document.getElementById('insightSummary');
const highlightCards = document.getElementById('highlightCards');
const streakLeaders = document.getElementById('streakLeaders');
const habitInsightList = document.getElementById('habitInsightList');
const logoutButton = document.getElementById('logoutButton');
const message = document.getElementById('insightsMessage');

function showMessage(text) {
    message.textContent = text;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        message.textContent = '';
    }, 2400);
}

function getHabitMap(habits) {
    return new Map(habits.map((habit) => [habit.id, habit]));
}

function withHabitDetails(stats, habits) {
    const habitMap = getHabitMap(habits);
    return stats.map((entry) => ({
        ...entry,
        description: habitMap.get(entry.habit_id)?.description || '',
    }));
}

function formatRate(value) {
    return `${Math.round(value)}%`;
}

function renderSummary(stats, summary) {
    const longestStreak = stats.reduce((best, habit) => Math.max(best, habit.longest_streak), 0);
    const currentBest = stats.reduce((best, habit) => Math.max(best, habit.current_streak), 0);
    const mostConsistent = stats.reduce((best, habit) => {
        if (!best || habit.completion_rate > best.completion_rate) {
            return habit;
        }
        return best;
    }, null);

    const cards = [
        ['Habits tracked', summary?.habit_count ?? stats.length],
        ['Total completions', summary?.completed_logs ?? 0],
        ['Longest streak', `${longestStreak}`],
        ['Best rate', mostConsistent ? formatRate(mostConsistent.completion_rate) : '0%'],
        ['Best current streak', `${currentBest}`],
        ['Average rate', formatRate(summary?.completion_rate ?? 0)],
    ];

    insightSummary.innerHTML = cards.map(([label, value]) => `
        <article class="stat-card">
            <span class="eyebrow">${label}</span>
            <strong>${value}</strong>
        </article>
    `).join('');
}

function renderHighlights(stats) {
    if (stats.length === 0) {
        highlightCards.innerHTML = '<article class="habit-card"><div><h3>No insights yet</h3><p>Create a few habits to start seeing trends.</p></div></article>';
        return;
    }

    const bestCompletion = [...stats].sort((left, right) => right.completion_rate - left.completion_rate)[0];
    const lowestCompletion = [...stats].sort((left, right) => left.completion_rate - right.completion_rate)[0];
    const longestStreak = [...stats].sort((left, right) => right.longest_streak - left.longest_streak)[0];

    const cards = [
        ['Highest completion', bestCompletion, 'Most consistent habit so far.'],
        ['Needs attention', lowestCompletion, 'Lowest completion rate at the moment.'],
        ['Longest streak', longestStreak, 'Best run across all due dates.'],
    ];

    highlightCards.innerHTML = cards.map(([label, habit, copy]) => `
        <article class="habit-card">
            <div>
                <span class="eyebrow">${label}</span>
                <h3>${habit.name}</h3>
                <p>${copy}</p>
                <p>${habit.description || 'No description provided.'}</p>
            </div>
            <div class="habit-actions">
                <span class="pill">${habit.frequency}</span>
                <strong>${label === 'Longest streak' ? `${habit.longest_streak} days` : formatRate(habit.completion_rate)}</strong>
            </div>
        </article>
    `).join('');
}

function renderStreakLeaders(stats) {
    const leaders = [...stats]
        .sort((left, right) => {
            if (right.current_streak !== left.current_streak) {
                return right.current_streak - left.current_streak;
            }
            return right.longest_streak - left.longest_streak;
        })
        .slice(0, 5);

    streakLeaders.innerHTML = leaders.map((habit) => `
        <article class="insight-row">
            <div>
                <h3>${habit.name}</h3>
                <p>${habit.frequency} habit</p>
            </div>
            <div class="insight-metrics">
                <strong>${habit.current_streak}</strong>
                <span>current streak</span>
            </div>
        </article>
    `).join('');
}

function renderHabitBreakdown(stats) {
    const ordered = [...stats].sort((left, right) => right.completion_rate - left.completion_rate);

    habitInsightList.innerHTML = ordered.map((habit) => `
        <article class="insight-row">
            <div class="insight-copy">
                <h3>${habit.name}</h3>
                <p>${habit.description || 'No description provided.'}</p>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${Math.min(habit.completion_rate, 100)}%"></div>
                </div>
            </div>
            <div class="insight-metrics insight-metrics-wide">
                <span><strong>${formatRate(habit.completion_rate)}</strong> completion</span>
                <span><strong>${habit.current_streak}</strong> current streak</span>
                <span><strong>${habit.longest_streak}</strong> longest streak</span>
                <span><strong>${habit.completed_logs}/${habit.due_count}</strong> completed</span>
            </div>
        </article>
    `).join('');
}

async function loadInsights() {
    try {
        const [habitData, statsData] = await Promise.all([
            api.getHabits(),
            api.getStats(),
        ]);

        const stats = withHabitDetails(statsData.stats ?? [], habitData.habits ?? []);
        renderSummary(stats, statsData.summary ?? null);
        renderHighlights(stats);
        renderStreakLeaders(stats);
        renderHabitBreakdown(stats);
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

loadInsights();
