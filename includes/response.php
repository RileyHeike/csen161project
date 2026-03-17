<?php

declare(strict_types=1);

function sendResponse(bool $success, $data = null, ?string $error = null, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');

    echo json_encode([
        'success' => $success,
        'data' => $data,
        'error' => $error,
    ]);

    exit;
}

function requireMethod(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        sendResponse(false, null, 'Method not allowed.', 405);
    }
}

function getJsonInput(): array
{
    $rawInput = file_get_contents('php://input');

    if ($rawInput === false || trim($rawInput) === '') {
        return [];
    }

    $decoded = json_decode($rawInput, true);

    if (!is_array($decoded)) {
        sendResponse(false, null, 'Invalid JSON payload.', 400);
    }

    return $decoded;
}
