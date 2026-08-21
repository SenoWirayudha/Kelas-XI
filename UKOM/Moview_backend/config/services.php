<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'brevo' => [
        'key' => env('BREVO_API_KEY'),
        'from_email' => env('BREVO_FROM_EMAIL'),
        'from_name' => env('BREVO_FROM_NAME', 'Moview'),
    ],

    'forgot_password' => [
        // Base URL used in reset emails. Must be reachable from wherever the
        // email is opened (phone browser via `adb reverse tcp:8000` → 127.0.0.1).
        'reset_base_url' => env('RESET_PASSWORD_BASE_URL', config('app.url')),
    ],

    // Static hero images on the auth pages — credits are looked up from these ids.
    'auth_hero' => [
        'login_movie_id' => env('LOGIN_HERO_MOVIE_ID'),
        'register_movie_id' => env('REGISTER_HERO_MOVIE_ID'),
        'forgot_movie_id' => env('FORGOT_HERO_MOVIE_ID'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
    ],

    'booking' => [
        'service_fee' => env('BOOKING_SERVICE_FEE', 4000),
        'pending_timeout_minutes' => env('BOOKING_PENDING_TIMEOUT_MINUTES', 7),
    ],

];
