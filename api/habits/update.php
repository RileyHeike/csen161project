<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');
$userId = requireAuth();

$input = getJsonInput();
$habitId = (int) ($input['id'] ?? 0);
$name = trim((string) ($input['name'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$frequency = strtolower(trim((string) ($input['frequency'] ?? 'daily')));
$allowedFrequencies = ['daily', 'weekly', 'monthly'];

if ($habitId <= 0 || $name === '') {
    sendResponse(false, null, 'Habit id and name are required.', 400);
}

if (!in_array($frequency, $allowedFrequencies, true)) {
    sendResponse(false, null, 'Frequency must be daily, weekly, or monthly.', 400);
}

$pdo = getDB();
$stmt = $pdo->prepare(
    'UPDATE habits
     SET name = :name, description = :description, frequency = :frequency
     WHERE id = :id AND user_id = :user_id'
);
$stmt->execute([
    'id' => $habitId,
    'user_id' => $userId,
    'name' => $name,
    'description' => $description === '' ? null : $description,
    'frequency' => $frequency,
]);

if ($stmt->rowCount() === 0) {
    sendResponse(false, null, 'Habit not found or unchanged.', 404);
}

sendResponse(true, [
    'habit' => [
        'id' => $habitId,
        'user_id' => $userId,
        'name' => $name,
        'description' => $description,
        'frequency' => $frequency,
    ],
], null);
