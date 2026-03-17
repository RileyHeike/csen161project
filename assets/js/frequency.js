function toDateOnly(value) {
    return new Date(`${value}T00:00:00`);
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function getMonthlyDueDay(createdDate, targetDate) {
    const createdDay = createdDate.getDate();
    const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    return Math.min(createdDay, lastDayOfMonth);
}

export function isHabitDueOnDate(habit, dateString) {
    const targetDate = toDateOnly(dateString);
    const createdDate = toDateOnly((habit.created_at || dateString).slice(0, 10));

    if (targetDate < createdDate) {
        return false;
    }

    if (habit.frequency === 'daily') {
        return true;
    }

    if (habit.frequency === 'weekly') {
        return targetDate.getDay() === createdDate.getDay();
    }

    return targetDate.getDate() === getMonthlyDueDay(createdDate, targetDate);
}

export function getFrequencyLabel(habit, dateString) {
    const targetDate = toDateOnly(dateString);
    const createdDate = toDateOnly((habit.created_at || dateString).slice(0, 10));

    if (habit.frequency === 'daily') {
        return 'today';
    }

    if (habit.frequency === 'weekly') {
        return `on ${createdDate.toLocaleDateString(undefined, { weekday: 'long' })}`;
    }

    const dueDay = getMonthlyDueDay(createdDate, targetDate);
    return `on day ${dueDay} of the month`;
}

export function getLogForDate(habit, logs, dateString) {
    return logs.find((log) => log.habit_id === habit.id && log.date === dateString);
}
