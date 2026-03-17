<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/frequency.php';

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
    $completedDates = $logsByHabit[$habitId] ?? [];
    $dateSet = array_fill_keys($completedDates, true);
    $dueDates = getDueDatesUntil($habit, $today);
    $overallCompleted += count($completedDates);

    $currentStreak = 0;
    for ($index = count($dueDates) - 1; $index >= 0; $index -= 1) {
        $dueDate = $dueDates[$index];
        if (isset($dateSet[$dueDate])) {
            $currentStreak++;
            continue;
        }
        break;
    }

    $longestStreak = 0;
    $runningStreak = 0;
    foreach ($dueDates as $dueDate) {
        if (isset($dateSet[$dueDate])) {
            $runningStreak++;
        } else {
            $runningStreak = 0;
        }

        $longestStreak = max($longestStreak, $runningStreak);
    }

    $expectedCount = max(count($dueDates), 1);
    $completionRate = round((count($completedDates) / $expectedCount) * 100, 2);
    $aggregateRate += $completionRate;

    $stats[] = [
        'habit_id' => $habitId,
        'name' => $habit['name'],
        'frequency' => $habit['frequency'],
        'current_streak' => $currentStreak,
        'longest_streak' => $longestStreak,
        'completion_rate' => $completionRate,
        'completed_logs' => count($completedDates),
        'due_count' => count($dueDates),
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
