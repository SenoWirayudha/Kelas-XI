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
     * Sends the reset link via the Resend HTTP API. If RESEND_API_KEY is not
     * configured, the link is written to the log instead so local testing
     * still works end-to-end.
     */
    private function sendResetEmail(User $user, string $email, string $plainToken): void
    {
        $baseUrl = rtrim((string) config('services.forgot_password.reset_base_url'), '/');
        $link = $baseUrl . '/reset-password/' . $plainToken;
        $username = $user->username ?: 'there';
        $ttl = PasswordResetToken::TTL_MINUTES;

        $apiKey = (string) config('services.resend.key');
        if ($apiKey === '') {
            Log::info('Password reset link (RESEND_API_KEY not set, not sending email)', [
                'email' => $email,
                'link' => $link,
            ]);
            return;
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(15)
                ->post('https://api.resend.com/emails', [
                    'from' => config('services.resend.from_name') . ' <' . config('services.resend.from_email') . '>',
                    'to' => [$email],
                    'subject' => 'Reset Password — Moview',
                    'html' => view('emails.reset-password', compact('link', 'username', 'ttl'))->render(),
                ]);

            if (!$response->successful()) {
                Log::error('Resend send failed', [
                    'email' => $email,
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 500),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Resend send exception', ['email' => $email, 'error' => $e->getMessage()]);
        }
    }
}
