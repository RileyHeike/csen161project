<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('GET');
$userId = requireAuth();

$pdo = getDB();

$habitsStmt = $pdo->prepare(
    'SELECT id, name, frequency, created_at
     FROM habits
     WHERE user_id = :user_id
     ORDER BY name ASC'
);
$habitsStmt->execute(['user_id' => $userId]);
$habits = $habitsStmt->fetchAll();

$logsStmt = $pdo->prepare(
    'SELECT habit_id, log_date, completed
     FROM habit_logs
     WHERE user_id = :user_id
     ORDER BY habit_id ASC, log_date ASC'
);
$logsStmt->execute(['user_id' => $userId]);
$rows = $logsStmt->fetchAll();

$logsByHabit = [];
foreach ($rows as $row) {
    $habitId = (int) $row['habit_id'];
    if (!isset($logsByHabit[$habitId])) {
        $logsByHabit[$habitId] = [];
    }
    if ((int) $row['completed'] === 1) {
        $logsByHabit[$habitId][] = $row['log_date'];
    }
}

$today = new DateTimeImmutable('today');
$stats = [];
$overallCompleted = 0;
$aggregateRate = 0.0;

foreach ($habits as $habit) {
    $habitId = (int) $habit['id'];
    $dates = $logsByHabit[$habitId] ?? [];
    $overallCompleted += count($dates);

    $dateSet = array_fill_keys($dates, true);
    $currentStreak = 0;
    $cursor = $today;

    while (isset($dateSet[$cursor->format('Y-m-d')])) {
        $currentStreak++;
        $cursor = $cursor->modify('-1 day');
    }

    $longestStreak = 0;
    $runningStreak = 0;
    $previousDate = null;

    foreach ($dates as $date) {
        $currentDate = new DateTimeImmutable($date);

        if ($previousDate === null || $previousDate->modify('+1 day')->format('Y-m-d') === $currentDate->format('Y-m-d')) {
            $runningStreak++;
        } else {
            $runningStreak = 1;
        }

        $longestStreak = max($longestStreak, $runningStreak);
        $previousDate = $currentDate;
    }

    $createdDate = new DateTimeImmutable(substr((string) $habit['created_at'], 0, 10));
    $daysTracked = max((int) $createdDate->diff($today)->format('%a') + 1, 1);
    $expectedCount = $daysTracked;

    if ($habit['frequency'] === 'weekly') {
        $expectedCount = max((int) ceil($daysTracked / 7), 1);
    } elseif ($habit['frequency'] === 'monthly') {
        $expectedCount = max(
            ((int) $today->format('Y') - (int) $createdDate->format('Y')) * 12
            + ((int) $today->format('n') - (int) $createdDate->format('n'))
            + 1,
            1
        );
    }

    $completionRate = round((count($dates) / $expectedCount) * 100, 2);
    $aggregateRate += $completionRate;

    $stats[] = [
        'habit_id' => $habitId,
        'name' => $habit['name'],
        'frequency' => $habit['frequency'],
        'current_streak' => $currentStreak,
        'longest_streak' => $longestStreak,
        'completion_rate' => $completionRate,
        'completed_logs' => count($dates),
    ];
}

sendResponse(true, [
    'stats' => $stats,
    'summary' => [
        'habit_count' => count($habits),
        'completed_logs' => $overallCompleted,
        'completion_rate' => count($habits) > 0 ? round($aggregateRate / count($habits), 2) : 0,
    ],
], null);
