<?php

declare(strict_types=1);

require_once __DIR__ . '/response.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function requireAuth(): int
{
    if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
        sendResponse(false, null, 'Authentication required.', 401);
    }

    return (int) $_SESSION['user_id'];
}

function getAuthenticatedUserId(): ?int
{
    if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
        return null;
    }

    return (int) $_SESSION['user_id'];
}
