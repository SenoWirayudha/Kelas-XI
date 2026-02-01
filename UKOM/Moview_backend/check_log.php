<?php

$logFile = __DIR__ . '/storage/logs/laravel.log';

if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $lines = explode("\n", $content);
    
    // Get last 100 lines
    $lastLines = array_slice($lines, -100);
    
    echo "=== LAST 100 LINES OF LOG ===\n";
    echo implode("\n", $lastLines);
} else {
    echo "Log file not found at: $logFile\n";
}
