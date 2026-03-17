<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');

$input = getJsonInput();
$identifier = trim((string) ($input['identifier'] ?? $input['email'] ?? $input['username'] ?? ''));
$password = (string) ($input['password'] ?? '');

if ($identifier === '' || $password === '') {
    sendResponse(false, null, 'Credentials are required.', 400);
}

$pdo = getDB();
$stmt = $pdo->prepare(
    'SELECT id, username, email, password_hash FROM users WHERE email = :identifier OR username = :identifier LIMIT 1'
);
$stmt->execute(['identifier' => $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    sendResponse(false, null, 'Invalid credentials.', 401);
}

$_SESSION['user_id'] = (int) $user['id'];

sendResponse(true, [
    'user' => [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
    ],
], null);
