<?php

// Test the profile photo endpoint
$url = "http://10.0.2.2:8000/api/v1/users/3/profile/photo/image?t=" . time();

echo "Testing URL: $url\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);

curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Content-Type: $contentType\n";
echo "Content-Length: $contentLength\n";

if ($httpCode == 200) {
    // Get just headers
    $headerSize = strpos($response, "\r\n\r\n");
    $headers = substr($response, 0, $headerSize);
    echo "\nHeaders:\n$headers\n";
    
    $bodySize = strlen($response) - $headerSize - 4;
    echo "\nActual body size: $bodySize bytes\n";
} else {
    echo "\nResponse:\n";
    echo $response;
}
