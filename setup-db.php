<?php

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';

$databaseDirectory = dirname(DB_PATH);
if (!is_dir($databaseDirectory)) {
    mkdir($databaseDirectory, 0775, true);
}

chmod($databaseDirectory, 0775);

$pdo = new PDO('sqlite:' . DB_PATH);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');

$schema = file_get_contents(__DIR__ . '/database/schema.sql');
if ($schema === false) {
    fwrite(STDERR, "Unable to read schema file.\n");
    exit(1);
}

$pdo->exec($schema);
chmod(DB_PATH, 0666);

echo "SQLite database initialized at: " . DB_PATH . PHP_EOL;
