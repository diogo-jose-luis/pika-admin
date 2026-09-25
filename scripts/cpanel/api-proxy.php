<?php
declare(strict_types=1);

$upstreamBase = 'https://api-pika.altrad-prezioso.ao/api/';
$path = isset($_GET['proxy_path']) ? (string) $_GET['proxy_path'] : '';
$path = str_replace('\\', '/', $path);
$path = ltrim($path, '/');

if (str_contains($path, '..')) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Caminho inválido.']);
    exit;
}

$query = $_GET;
unset($query['proxy_path']);
$url = $upstreamBase . $path;
if ($query !== []) {
    $url .= '?' . http_build_query($query);
}

$headers = [
    'Accept: application/json',
    'User-Agent: PikaAdmin/1.0 (cpanel-static-proxy)',
    'X-Requested-With: XMLHttpRequest',
];

$authorization =
    $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? '';
if ($authorization !== '') {
    $headers[] = 'Authorization: ' . $authorization;
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if ($contentType !== '') {
    $headers[] = 'Content-Type: ' . $contentType;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$body = file_get_contents('php://input');

$ch = curl_init($url);
if ($ch === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Não foi possível iniciar o pedido à API.']);
    exit;
}

$options = [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_FOLLOWLOCATION => false,
];

if (!in_array($method, ['GET', 'HEAD'], true) && $body !== false && $body !== '') {
    $options[CURLOPT_POSTFIELDS] = $body;
}

curl_setopt_array($ch, $options);
$response = curl_exec($ch);
$error = curl_error($ch);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'message' => 'Não foi possível contactar a API online.',
        'detail' => $error,
    ]);
    exit;
}

$rawHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

foreach (explode("\r\n", $rawHeaders) as $line) {
    if (stripos($line, 'content-type:') === 0) {
        header($line);
    }
}

http_response_code($status > 0 ? $status : 502);
echo $responseBody;
