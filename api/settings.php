<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$settingsFile = '../settings.json';

// Handle GET request - load settings
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($settingsFile)) {
        $settings = json_decode(file_get_contents($settingsFile), true);
        echo json_encode(['success' => true, 'settings' => $settings]);
    } else {
        // Default settings (without system prompt)
        $defaultSettings = [
            'model' => 'hf.co/shishirahm3d/banglamind-8b-instruct-bnb-4bit-q4km-GGUF:latest',
            'apiUrl' => 'http://ai.shishirahmed.me:11435/',
            'temperature' => 0.8
        ];
        echo json_encode(['success' => true, 'settings' => $defaultSettings]);
    }
    exit;
}

// Handle POST request - save settings
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['model']) || !isset($input['apiUrl'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Required settings missing']);
        exit;
    }
    
    $settings = [
        'model' => $input['model'],
        'apiUrl' => $input['apiUrl'],
        'temperature' => floatval($input['temperature'])
    ];
    
    if (file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT)) !== false) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save settings']);
    }
    exit;
}

// Handle other methods
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
