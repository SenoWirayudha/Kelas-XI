<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Brevo transactional email sender (/v3/smtp/email). Failures are logged
 * with the status code + response body, but never surfaced to the client —
 * callers keep their generic public responses.
 */
class BrevoMailer
{
    /**
     * @param string $toEmail   Recipient address.
     * @param string $subject   Email subject.
     * @param string $html      Rendered HTML body.
     * @param array  $logContext Extra key/values merged into the failure log.
     */
    public function send(string $toEmail, string $subject, string $html, array $logContext = []): void
    {
        $apiKey = (string) config('services.brevo.key');
        if ($apiKey === '') {
            Log::info('Brevo email not sent (BREVO_API_KEY not set)', array_merge([
                'email' => $toEmail,
                'subject' => $subject,
            ], $logContext));
            return;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'accept' => 'application/json',
            ])
                ->timeout(15)
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => [
                        'name' => config('services.brevo.from_name'),
                        'email' => config('services.brevo.from_email'),
                    ],
                    'to' => [['email' => $toEmail]],
                    'subject' => $subject,
                    'htmlContent' => $html,
                ]);

            if (!$response->successful()) {
                Log::error('Brevo send failed', [
                    'email' => $toEmail,
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 500),
                ] + $logContext);
            }
        } catch (\Throwable $e) {
            Log::error('Brevo send exception', ['email' => $toEmail, 'error' => $e->getMessage()]);
        }
    }
}
