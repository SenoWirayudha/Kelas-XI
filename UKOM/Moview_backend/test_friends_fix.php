<?php

echo "Testing Friends Activity API for User 5\n";
echo "==========================================\n\n";

$url = 'http://localhost:8000/api/v1/users/5/friends-activity';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if ($data && isset($data['data'])) {
    echo "✓ API call successful\n";
    echo "Activity count: " . count($data['data']) . "\n\n";
    
    if (count($data['data']) > 0) {
        echo "Activities:\n";
        foreach ($data['data'] as $activity) {
            echo "- User: " . $activity['user']['username'] . " (ID: " . $activity['user']['id'] . ")\n";
            echo "  Type: " . $activity['activity_type'] . "\n";
            echo "  Movie: " . $activity['movie']['title'] . "\n";
            echo "  Rating: " . $activity['rating'] . " stars\n";
            echo "  Rewatched: " . ($activity['is_rewatched'] ? 'Yes' : 'No') . "\n";
            echo "  Review ID: " . $activity['review_id'] . "\n";
            echo "  Diary ID: " . $activity['diary_id'] . "\n\n";
        }
    } else {
        echo "No activities found\n";
    }
} else {
    echo "✗ API call failed\n";
    echo "Response: " . $response . "\n";
}
