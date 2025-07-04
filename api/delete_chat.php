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

if (!$input || !isset($input['filename'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Filename not provided']);
    exit;
}

$filename = $input['filename'];
$filepath = '../Falcon24-Chats/' . $filename;

// Security check - prevent directory traversal
if (strpos($filename, '../') !== false || strpos($filename, '/') !== false) {
    echo json_encode(['success' => false, 'error' => 'Invalid filename']);
    exit;
}

if (!file_exists($filepath)) {
    echo json_encode(['success' => false, 'error' => 'Log file not found']);
    exit;
}

if (unlink($filepath)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to delete log file']);
}
?>