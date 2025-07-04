<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$chatDir = '../Falcon24-Chats'; // This directory stores the logs

if (!is_dir($chatDir)) {
    echo json_encode(['success' => true, 'chats' => []]);
    exit;
}

$files = scandir($chatDir);
$chats = [];

foreach ($files as $file) {
    if ($file === '.' || $file === '..' || !str_ends_with($file, '.txt')) {
        continue;
    }
    
    $filepath = $chatDir . '/' . $file;
    $title = str_replace('.txt', '', $file);
    // Remove the date part for display, but keep it in filename for uniqueness
    $title = preg_replace('/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/', '', $title);
    
    $chats[] = [
        'filename' => $file,
        'title' => $title,
        'modified' => filemtime($filepath)
    ];
}

// Sort by modification time (newest first)
usort($chats, function($a, $b) {
    return $b['modified'] - $a['modified'];
});

echo json_encode(['success' => true, 'chats' => $chats]);
?>