<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /** Max reset-link requests per email per hour. */
    private const MAX_ATTEMPTS_PER_EMAIL = 3;

    /**
     * POST /api/v1/forgot-password
     *
     * Always responds with a generic success message so the endpoint cannot be
     * used to enumerate registered emails.
     */
    public function forgot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        // Rate limit: max 3 requests per email per hour (anti spam/abuse).
        $key = 'password-reset:' . $email;
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS_PER_EMAIL)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = max(1, (int) ceil($seconds / 60));

            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak permintaan reset untuk email ini. Coba lagi dalam {$minutes} menit.",
            ], 429);
        }
        RateLimiter::hit($key, 3600);

        $user = User::where('email', $email)->first();

        if ($user) {
            if ($user->auth_provider === 'google') {
                // Google-only account: no password reset possible — send the
                // "use Google Sign-In" notice instead of a reset link.
                $this->sendGoogleNoticeEmail($user, $email);
            } else {
                // Invalidate any previous tokens for this email.
                PasswordResetToken::where('email', $email)->delete();

                $plainToken = Str::random(64);

                PasswordResetToken::create([
                    'email' => $email,
                    'token' => PasswordResetToken::hash($plainToken),
                    'expires_at' => now()->addMinutes(PasswordResetToken::TTL_MINUTES),
                    'created_at' => now(),
                ]);

                $this->sendResetEmail($user, $email, $plainToken);
            }
        }

        // Identical generic response in every case (registered or not,
        // Google-only or not) to prevent user enumeration.
        return response()->json([
            'success' => true,
            'message' => 'Jika email kamu terdaftar, link reset password sudah dikirim. Cek inbox atau folder spam.',
        ]);
    }

    /**
     * POST /api/v1/reset-password — called from the web reset page.
     * Validates the token (exists, unused, unexpired), updates the password,
     * then invalidates the token.
     */
    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $record = PasswordResetToken::where('token', PasswordResetToken::hash($request->input('token')))->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset tidak valid.',
            ], 422);
        }

        if ($record->isUsed()) {
            return response()->json([
                'success' => false,
                'message' => 'Token sudah pernah digunakan. Ajukan permintaan reset baru.',
            ], 422);
        }

        if ($record->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Token sudah kedaluwarsa. Ajukan permintaan reset baru.',
            ], 422);
        }

        $user = User::where('email', $record->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak ditemukan.',
            ], 422);
        }

        DB::transaction(function () use ($user, $record) {
            // `password` cast is `hashed`, so assigning plaintext is enough.
            $user->password = request()->input('password');
            $user->save();

            // Single-use: consume this token and drop any other pending ones.
            $record->used_at = now();
            $record->save();
            PasswordResetToken::where('email', $record->email)
                ->whereNull('used_at')
                ->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah. Kembali ke app dan login dengan password barumu.',
        ]);
    }

    /**
     * Tells a Google-only account holder to sign in with Google instead of
     * expecting a reset link (no link included).
     */
    private function sendGoogleNoticeEmail(User $user, string $email): void
    {
        $username = $user->username ?: 'there';

        $this->sendViaBrevo(
            $email,
            'Login dengan Google — Moview',
            view('emails.google-account-notice', compact('username'))->render()
        );
    }

    /**
     * Sends the reset link via the Brevo transactional email API. If
     * BREVO_API_KEY is not configured, the link is written to the log
     * instead so local testing still works end-to-end.
     */
    private function sendResetEmail(User $user, string $email, string $plainToken): void
    {
        $baseUrl = rtrim((string) config('services.forgot_password.reset_base_url'), '/');
        $link = $baseUrl . '/reset-password/' . $plainToken;
        $username = $user->username ?: 'there';
        $ttl = PasswordResetToken::TTL_MINUTES;

        $this->sendViaBrevo(
            $email,
            'Reset Password — Moview',
            view('emails.reset-password', compact('link', 'username', 'ttl'))->render(),
            ['link' => $link]
        );
    }

    /**
     * Brevo /v3/smtp/email sender shared by both email types. Failures are
     * logged but never surfaced to the client (the API response stays generic).
     */
    private function sendViaBrevo(string $toEmail, string $subject, string $html, array $logContext = []): void
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
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Brevo send exception', ['email' => $toEmail, 'error' => $e->getMessage()]);
        }
    }
}
