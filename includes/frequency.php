<?php

declare(strict_types=1);

function normalizeDateString(string $date): string
{
    return (new DateTimeImmutable($date))->format('Y-m-d');
}

function getLastDayOfMonth(DateTimeImmutable $date): int
{
    return (int) $date->format('t');
}

function isHabitDueOnDate(array $habit, string $date): bool
{
    $targetDate = new DateTimeImmutable($date);
    $createdDate = new DateTimeImmutable(substr((string) $habit['created_at'], 0, 10));

    if ($targetDate < $createdDate) {
        return false;
    }

    $frequency = $habit['frequency'] ?? 'daily';

    if ($frequency === 'daily') {
        return true;
    }

    if ($frequency === 'weekly') {
        return $targetDate->format('w') === $createdDate->format('w');
    }

    $createdDay = (int) $createdDate->format('j');
    $targetDay = min($createdDay, getLastDayOfMonth($targetDate));
    return (int) $targetDate->format('j') === $targetDay;
}

function getDueDatesUntil(array $habit, DateTimeImmutable $endDate): array
{
    $createdDate = new DateTimeImmutable(substr((string) $habit['created_at'], 0, 10));
    if ($endDate < $createdDate) {
        return [];
    }

    $dueDates = [];
    $frequency = $habit['frequency'] ?? 'daily';

    if ($frequency === 'daily') {
        for ($cursor = $createdDate; $cursor <= $endDate; $cursor = $cursor->modify('+1 day')) {
            $dueDates[] = $cursor->format('Y-m-d');
        }
        return $dueDates;
    }

    if ($frequency === 'weekly') {
        for ($cursor = $createdDate; $cursor <= $endDate; $cursor = $cursor->modify('+1 week')) {
            $dueDates[] = $cursor->format('Y-m-d');
        }
        return $dueDates;
    }

    $createdDay = (int) $createdDate->format('j');
    $cursor = $createdDate->modify('first day of this month');

    while ($cursor <= $endDate) {
        $day = min($createdDay, getLastDayOfMonth($cursor));
        $dueDate = $cursor->setDate(
            (int) $cursor->format('Y'),
            (int) $cursor->format('n'),
            $day
        );

        if ($dueDate >= $createdDate && $dueDate <= $endDate) {
            $dueDates[] = $dueDate->format('Y-m-d');
        }

        $cursor = $cursor->modify('first day of next month');
    }

    return $dueDates;
}
