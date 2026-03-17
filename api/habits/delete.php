<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');
$userId = requireAuth();

$input = getJsonInput();
$habitId = (int) ($input['id'] ?? $_GET['id'] ?? 0);

if ($habitId <= 0) {
    sendResponse(false, null, 'A valid habit id is required.', 400);
}

$pdo = getDB();
$stmt = $pdo->prepare('DELETE FROM habits WHERE id = :id AND user_id = :user_id');
$stmt->execute([
    'id' => $habitId,
    'user_id' => $userId,
]);

if ($stmt->rowCount() === 0) {
    sendResponse(false, null, 'Habit not found.', 404);
}

sendResponse(true, ['deleted' => true, 'id' => $habitId], null);
