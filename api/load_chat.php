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

if (!file_exists($filepath)) {
    echo json_encode(['success' => false, 'error' => 'Log file not found']);
    exit;
}

$content = file_get_contents($filepath);
if ($content === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to read log file']);
    exit;
}

$lines = explode("\n", $content);
$messages = []; // This will now hold input/output logs

foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    
    $parts = explode(': ', $line, 2);
    if (count($parts) === 2) {
        $role = $parts[0];
        $content = str_replace("\\n", "\n", $parts[1]); // Handle newline escape
        $messages[] = ['role' => $role, 'content' => $content];
    }
}

echo json_encode(['success' => true, 'messages' => $messages]);
?>