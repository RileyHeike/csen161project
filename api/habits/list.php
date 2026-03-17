<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('GET');
$userId = requireAuth();

$pdo = getDB();
$stmt = $pdo->prepare(
    'SELECT id, user_id, name, description, frequency, created_at, updated_at
     FROM habits
     WHERE user_id = :user_id
     ORDER BY created_at DESC'
);
$stmt->execute(['user_id' => $userId]);
$habits = $stmt->fetchAll();

foreach ($habits as &$habit) {
    $habit['id'] = (int) $habit['id'];
    $habit['user_id'] = (int) $habit['user_id'];
}

sendResponse(true, ['habits' => $habits], null);
