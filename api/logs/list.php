<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('GET');
$userId = requireAuth();

$startDate = trim((string) ($_GET['start_date'] ?? ''));
$endDate = trim((string) ($_GET['end_date'] ?? ''));

$sql = 'SELECT id, habit_id, user_id, log_date, completed, created_at, updated_at
        FROM habit_logs
        WHERE user_id = :user_id';
$params = ['user_id' => $userId];

if ($startDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
    $sql .= ' AND log_date >= :start_date';
    $params['start_date'] = $startDate;
}

if ($endDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
    $sql .= ' AND log_date <= :end_date';
    $params['end_date'] = $endDate;
}

$sql .= ' ORDER BY log_date DESC, id DESC';

$pdo = getDB();
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll();

foreach ($logs as &$log) {
    $log['id'] = (int) $log['id'];
    $log['habit_id'] = (int) $log['habit_id'];
    $log['user_id'] = (int) $log['user_id'];
    $log['completed'] = (bool) $log['completed'];
    $log['date'] = $log['log_date'];
}

sendResponse(true, ['logs' => $logs], null);
