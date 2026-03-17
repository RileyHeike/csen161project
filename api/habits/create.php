<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');
$userId = requireAuth();

$input = getJsonInput();
$name = trim((string) ($input['name'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$frequency = strtolower(trim((string) ($input['frequency'] ?? 'daily')));
$allowedFrequencies = ['daily', 'weekly', 'monthly'];

if ($name === '') {
    sendResponse(false, null, 'Habit name is required.', 400);
}

if (!in_array($frequency, $allowedFrequencies, true)) {
    sendResponse(false, null, 'Frequency must be daily, weekly, or monthly.', 400);
}

$pdo = getDB();
$stmt = $pdo->prepare(
    'INSERT INTO habits (user_id, name, description, frequency) VALUES (:user_id, :name, :description, :frequency)'
);
$stmt->execute([
    'user_id' => $userId,
    'name' => $name,
    'description' => $description === '' ? null : $description,
    'frequency' => $frequency,
]);

$habitId = (int) $pdo->lastInsertId();

sendResponse(true, [
    'habit' => [
        'id' => $habitId,
        'user_id' => $userId,
        'name' => $name,
        'description' => $description,
        'frequency' => $frequency,
    ],
], null, 201);
