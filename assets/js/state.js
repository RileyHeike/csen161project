const listeners = new Set();

export const state = {
    user: null,
    habits: [],
    logs: [],
    stats: [],
    summary: null,
    selectedDate: new Date().toISOString().slice(0, 10),
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};

export function setState(partial) {
    Object.assign(state, partial);
    listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
    listeners.add(listener);
    listener(state);

    return () => listeners.delete(listener);
}
