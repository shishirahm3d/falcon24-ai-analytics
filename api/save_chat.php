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

if (!$input || !isset($input['messages']) || empty($input['messages'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No messages to save']);
    exit;
}

$messages = $input['messages'];
$customTitle = $input['customTitle'] ?? null; // Get custom title if provided

// Create chat directory if it doesn't exist
$chatDir = '../Falcon24-Chats';
if (!is_dir($chatDir)) {
    mkdir($chatDir, 0755, true);
}

// Generate a summary for the filename, prioritizing custom title
$summary = '';
if ($customTitle) {
    $summary = substr($customTitle, 0, 50); // Use part of custom title
    $summary = preg_replace('/[^a-zA-Z0-9\s]/', '', $summary); // Sanitize
    $summary = trim($summary);
}

// Fallback to a generic name if custom title is empty or not provided
if (empty($summary)) {
    $summary = 'PredictionLog';
}

$filename = $summary . '_' . date('Y-m-d_H-i-s') . '.txt';
$filepath = $chatDir . '/' . $filename;

// Save the log content
$logContent = '';
foreach ($messages as $message) {
    $content = str_replace("\n", "\\n", $message['content']); // Escape newlines
    $logContent .= $message['role'] . ': ' . $content . "\n";
}

if (file_put_contents($filepath, $logContent) !== false) {
    echo json_encode(['success' => true, 'filename' => $filename]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save log']);
}
?>