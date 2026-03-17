<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

requireMethod('POST');

$input = getJsonInput();
$username = trim((string) ($input['username'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$password = (string) ($input['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
    sendResponse(false, null, 'Username, email, and password are required.', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, null, 'A valid email address is required.', 400);
}

if (strlen($password) < 8) {
    sendResponse(false, null, 'Password must be at least 8 characters.', 400);
}

$pdo = getDB();

$checkStmt = $pdo->prepare('SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1');
$checkStmt->execute([
    'username' => $username,
    'email' => $email,
]);

if ($checkStmt->fetch()) {
    sendResponse(false, null, 'Username or email already exists.', 409);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$insertStmt = $pdo->prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)'
);
$insertStmt->execute([
    'username' => $username,
    'email' => $email,
    'password_hash' => $passwordHash,
]);

$userId = (int) $pdo->lastInsertId();
$_SESSION['user_id'] = $userId;

sendResponse(true, [
    'user' => [
        'id' => $userId,
        'username' => $username,
        'email' => $email,
    ],
], null, 201);
