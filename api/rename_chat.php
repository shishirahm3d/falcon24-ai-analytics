<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['filename']) || !isset($input['newName'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Required parameters missing']);
    exit;
}

$filename = $input['filename'];
$newName = $input['newName'];
$oldFilepath = '../Intermediate-Chats/' . $filename;

// Security check - prevent directory traversal
if (strpos($filename, '../') !== false || strpos($filename, '/') !== false) {
    echo json_encode(['success' => false, 'error' => 'Invalid filename']);
    exit;
}

if (!file_exists($oldFilepath)) {
    echo json_encode(['success' => false, 'error' => 'Log file not found']);
    exit;
}

// Create a safe new filename
$newName = preg_replace('/[^a-zA-Z0-9\s]/', '', $newName); // Sanitize
$newName = trim($newName);
if (empty($newName)) {
    echo json_encode(['success' => false, 'error' => 'Invalid new name']);
    exit;
}

// Extract date part from original filename if it exists
$datePart = '';
if (preg_match('/_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.txt$/', $filename, $matches)) {
    $datePart = '_' . $matches[1];
}

$newFilename = $newName . $datePart . '.txt';
$newFilepath = '../Intermediate-Chats/' . $newFilename;

if (rename($oldFilepath, $newFilepath)) {
    echo json_encode(['success' => true, 'newFilename' => $newFilename]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to rename log file']);
}
?>