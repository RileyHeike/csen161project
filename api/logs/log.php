<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');
$userId = requireAuth();

$input = getJsonInput();
$habitId = (int) ($input['habit_id'] ?? 0);
$logDate = trim((string) ($input['date'] ?? ''));
$completed = filter_var($input['completed'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

if ($habitId <= 0 || $logDate === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $logDate)) {
    sendResponse(false, null, 'A valid habit_id and date are required.', 400);
}

if ($completed === null) {
    sendResponse(false, null, 'Completed must be a boolean.', 400);
}

$pdo = getDB();

$habitStmt = $pdo->prepare('SELECT id FROM habits WHERE id = :id AND user_id = :user_id LIMIT 1');
$habitStmt->execute([
    'id' => $habitId,
    'user_id' => $userId,
]);

if (!$habitStmt->fetch()) {
    sendResponse(false, null, 'Habit not found.', 404);
}

$stmt = $pdo->prepare(
    'INSERT INTO habit_logs (habit_id, user_id, log_date, completed)
     VALUES (:habit_id, :user_id, :log_date, :completed)
     ON CONFLICT(habit_id, log_date) DO UPDATE SET
         completed = excluded.completed,
         updated_at = CURRENT_TIMESTAMP'
);
$stmt->execute([
    'habit_id' => $habitId,
    'user_id' => $userId,
    'log_date' => $logDate,
    'completed' => $completed ? 1 : 0,
]);

sendResponse(true, [
    'log' => [
        'habit_id' => $habitId,
        'user_id' => $userId,
        'date' => $logDate,
        'completed' => $completed,
    ],
], null);
