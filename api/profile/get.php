<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('GET');
$userId = requireAuth();

$pdo = getDB();

$userStmt = $pdo->prepare(
    'SELECT id, username, email, created_at
     FROM users
     WHERE id = :id
     LIMIT 1'
);
$userStmt->execute(['id' => $userId]);
$user = $userStmt->fetch();

if (!$user) {
    sendResponse(false, null, 'User not found.', 404);
}

$summaryStmt = $pdo->prepare(
    'SELECT
        MIN(created_at) AS first_habit_created_at,
        COUNT(*) AS habit_count
     FROM habits
     WHERE user_id = :user_id'
);
$summaryStmt->execute(['user_id' => $userId]);
$habitSummary = $summaryStmt->fetch() ?: [];

$logStmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total_logs,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed_logs
     FROM habit_logs
     WHERE user_id = :user_id'
);
$logStmt->execute(['user_id' => $userId]);
$logSummary = $logStmt->fetch() ?: [];

$joinedAt = $habitSummary['first_habit_created_at'] ?: $user['created_at'];

sendResponse(true, [
    'profile' => [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'account_created_at' => $user['created_at'],
        'joined_at' => $joinedAt,
        'first_habit_created_at' => $habitSummary['first_habit_created_at'] ?: null,
        'habit_count' => (int) ($habitSummary['habit_count'] ?? 0),
        'completed_logs' => (int) ($logSummary['completed_logs'] ?? 0),
        'total_logs' => (int) ($logSummary['total_logs'] ?? 0),
    ],
], null);
