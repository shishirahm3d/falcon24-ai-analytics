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

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$videoUrl = $input['url'] ?? '';

if (empty($videoUrl)) {
    echo json_encode(['success' => false, 'error' => 'YouTube URL is required']);
    exit;
}

try {
    // Call the external transcript API
    $apiUrl = 'http://yt.shishirahmed.me:5000/transcript';
    
    $postData = json_encode([
        'url' => $videoUrl
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception("Network error: {$curlError}");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("API request failed with HTTP code: {$httpCode}");
    }
    
    if (empty($response)) {
        throw new Exception("Empty response from transcript API");
    }
    
    $apiData = json_decode($response, true);
    
    if (!$apiData) {
        throw new Exception("Invalid JSON response from transcript API");
    }
    
    if ($apiData['status'] !== 'success') {
        throw new Exception($apiData['message'] ?? 'Failed to extract subtitles from API');
    }
    
    // Return the data in the format expected by the frontend
    echo json_encode([
        'success' => true,
        'subtitles' => $apiData['data']
        // 'language' => $apiData['language'] ?? 'English'
        // 'message' => $apiData['message'] ?? null
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>