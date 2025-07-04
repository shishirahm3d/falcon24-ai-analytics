<?php
// --- Robust Error Handling ---
ini_set('display_errors', 0);
error_reporting(E_ALL);
set_error_handler(function ($severity, $message, $file, $line) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => "Server Error: " . $message,
        'details' => "In " . $file . " on line " . $line
    ]);
    exit;
});

// --- CORS and Headers ---
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['task']) || !isset($input['data'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input - task or data not provided']);
    exit;
}

$task = $input['task'];
$data = $input['data'];
$model = $input['model'] ?? "hf.co/shishirahm3d/banglamind-8b-instruct-bnb-4bit-q4km-GGUF:latest";
$ollama_url = $input['apiUrl'] ?? "http://ai.shishirahmed.me:11435/";
$parameters = $input['parameters'] ?? [ 'temperature' => 0.8 ];
$system_prompt = "";
$user_prompt = "";

switch ($task) {
    case 'influencer_identification':
        $system_prompt = "You are an expert social media analyst. Your task is to identify potential social media influencers from provided comment and reaction data. Analyze the text to identify users and infer metrics like follower count, engagement, and activity. Output the result strictly as a JSON array of objects, where each object has 'name', 'followers' (e.g., '1M', '500K'), 'engagementRate' (e.g., '5.2'), and 'activity' (e.g., 'High', 'Frequent'). If no influencers are found, return an empty array. Do not include any other text or formatting outside the JSON. Also do it for every user in the data, not just influencers.";
        $user_prompt = "Analyze the following social media interactions:\n\n" . $data;
        break;

    case 'sentiment_analysis':
        $system_prompt = "You are an expert sentiment analysis model. Analyze the emotional tone of the given text. If the text contains multiple opinions, weigh them to determine a percentage breakdown. Output the result **strictly as a JSON object** with keys: 'positive_percent' (number), 'negative_percent' (number), 'neutral_percent' (number), 'overall_sentiment' (string: 'Positive', 'Negative', 'Mixed', or 'Neutral'), and 'explanation' (string, a brief summary of the reasons for the sentiment breakdown). The sum of percentages must be 100. **DO NOT include any introductory or concluding text, explanations, or any other formatting outside the JSON object.**";
        $user_prompt = "Analyze the sentiment of the following text and provide a percentage breakdown:\n\n" . $data;
        break;

    case 'predictive_situation':
        $system_prompt = "You are an advanced AI for predictive situation analysis. Analyze the provided multi-source data. Predict whether the upcoming date is likely to experience a 'Positive' (favorable), 'Negative' (unfavorable), or 'Neutral' situation. Output the result **strictly as a JSON object** with keys: 'outcome' (string: 'Positive', 'Negative', 'Neutral'), 'situations' (string), 'events' (string), and 'recommendations' (array of strings). **DO NOT include any introductory or concluding text, explanations, or any other formatting outside the JSON object.**";
        $user_prompt = "Analyze the following data for a prediction on the scheduled date {$data['date']}:\n\nNews/Reports:\n{$data['news']}\n\nYouTube Summaries/Links:\n{$data['youtube']}\n\n";
        break;

    case 'youtube_summary':
        $system_prompt = "You are an expert video content analyst. Analyze the provided YouTube video transcript and generate a comprehensive summary. For longer transcripts, ensuring that each section remains concise and informative. Provide a detailed analysis including key points, main topics, insights, and the overall sentiment for each section. Format your response with clear headings, bullet points, and structured text for easy reading. Ensure the summary is engaging, informative, and well-organized, highlighting the most important aspects of the video.";
        $user_prompt = "Please analyze and summarize the following YouTube video transcript. Read the transcript properly. Give the output based on the transcript.\n\n" . $data;
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown task specified.']);
        exit;
}

$messages = [['role' => 'system', 'content' => $system_prompt], ['role' => 'user', 'content' => $user_prompt]];
$requestData = ['model' => $model, 'messages' => $messages, 'temperature' => $parameters['temperature'], 'stream' => true];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $ollama_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'cURL error: ' . $error]);
    exit;
}
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['success' => false, 'error' => 'Ollama API HTTP error', 'details' => $response]);
    exit;
}

$lines = explode("\n", trim($response));
$fullResponse = '';
foreach ($lines as $line) {
    if (empty($line)) continue;
    $decodedLine = json_decode($line, true);
    if ($decodedLine && isset($decodedLine['message']['content'])) {
        $fullResponse .= $decodedLine['message']['content'];
    }
}

if (empty($fullResponse)) {
    echo json_encode(['success' => false, 'error' => 'No content received from AI model.']);
    exit;
}

echo json_encode(['success' => true, 'response' => $fullResponse]);
?>