<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\AccountVerificationException;
use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\PasswordResetToken;
use App\Services\BrevoMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Account maintenance for signed-in users:
 *  - change password (OTP-gated, password + code in ONE request)
 *  - delete account (OTP for email/password accounts, fresh google_id for
 *    Google accounts)
 *
 * OTPs reuse the hashed `email_otps` table but are purpose-bound through the
 * payload JSON: only codes issued with the matching purpose are accepted, so
 * a register OTP can never be replayed here (and vice versa).
 */
class AccountController extends Controller
{
    private const PURPOSE_CHANGE_PASSWORD = EmailOtp::PURPOSE_CHANGE_PASSWORD;
    private const PURPOSE_DELETE_ACCOUNT = EmailOtp::PURPOSE_DELETE_ACCOUNT;

    /** Seconds before the same account may request another code. */
    private const RESEND_COOLDOWN_SECONDS = 45;

    /**
     * POST /api/v1/change-password/request-otp
     * Emails a 6-digit code bound to the change-password purpose.
     */
    public function requestChangePasswordOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $user = DB::table('users')->where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email tersebut tidak ditemukan.',
            ], 422);
        }

        if ($user->auth_provider === 'google') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Google tidak memakai password. Silakan login dengan Google.',
            ], 422);
        }

        if (($user->status ?? 'active') !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akun kamu sedang tidak aktif.',
            ], 403);
        }

        $cooldownKey = 'change-password:' . $email;
        $limited = $this->resendCooldownResponse($cooldownKey);
        if ($limited !== null) {
            return $limited;
        }

        try {
            $sent = $this->issueActionOtp(
                $email,
                $user,
                self::PURPOSE_CHANGE_PASSWORD,
                'Kode Ganti Password — Moview',
                'Ganti Password',
                'gunakan kode di bawah ini untuk mengganti password akun Moview-mu.',
                'Kalau kamu tidak meminta ganti password, abaikan email ini — password kamu tidak berubah.'
            );

            if (! $sent) {
                RateLimiter::clear($cooldownKey);

                return response()->json([
                    'success' => false,
                    'message' => 'Kode OTP gagal dikirim ke emailmu. Periksa alamat email akunmu lalu coba lagi.',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP sudah dikirim ke emailmu.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim kode OTP: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/change-password
     * Verifies the purpose-bound OTP (expiry + max 3 attempts) and replaces
     * the password in the same request. The password is never stored or
     * transmitted before this call.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|regex:/^\d{6}$/',
            'password' => 'required|string|min:6',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'code.required' => 'Kode OTP wajib diisi.',
            'code.regex' => 'Kode OTP harus 6 digit angka.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $user = DB::table('users')->where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email tersebut tidak ditemukan.',
            ], 422);
        }

        if ($user->auth_provider === 'google') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Google tidak memakai password.',
            ], 422);
        }

        $verification = $this->consumeActionOtp(
            $email,
            self::PURPOSE_CHANGE_PASSWORD,
            (string) $request->input('code'),
            (int) $user->id
        );

        if ($verification !== null) {
            return $verification;
        }

        try {
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    // `password` is handled manually here; stored as a bcrypt hash.
                    'password' => Hash::make((string) $request->input('password')),
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah.',
                'data' => [
                    'email' => $email,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah password: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/delete-account/request-otp
     * Emails a 6-digit code bound to the delete-account purpose.
     */
    public function requestDeleteAccountOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $user = DB::table('users')->where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email tersebut tidak ditemukan.',
            ], 422);
        }

        if (($user->status ?? 'active') !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akun kamu sedang tidak aktif.',
            ], 403);
        }

        $cooldownKey = 'delete-account:' . $email;
        $limited = $this->resendCooldownResponse($cooldownKey);
        if ($limited !== null) {
            return $limited;
        }

        try {
            $sent = $this->issueActionOtp(
                $email,
                $user,
                self::PURPOSE_DELETE_ACCOUNT,
                'Kode Hapus Akun — Moview',
                'Hapus Akun',
                'gunakan kode di bawah ini untuk mengonfirmasi penghapusan akun Moview-mu. Tindakan ini permanen.',
                'Kalau kamu tidak meminta penghapusan akun, abaikan email ini dan segera ganti password.'
            );

            if (! $sent) {
                // Nothing was delivered — do not lock the user out for 45s on
                // top of a failed send.
                RateLimiter::clear($cooldownKey);

                return response()->json([
                    'success' => false,
                    'message' => 'Kode OTP gagal dikirim ke emailmu. Periksa alamat email akunmu lalu coba lagi.',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP sudah dikirim ke emailmu.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim kode OTP: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/delete-account
     * Verifies ownership (OTP for manual accounts, matching google_id for
     * Google accounts) and permanently removes the account. Related rows are
     * removed by the FKs' cascade rules (orders keep their history via
     * nullOnDelete).
     */
    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => ['nullable', 'string', 'regex:/^\d{6}$/'],
            'google_id' => ['nullable', 'string'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'code.regex' => 'Kode OTP harus 6 digit angka.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $code = $request->input('code');
        $googleId = $request->input('google_id');

        if (empty($code) && empty($googleId)) {
            return response()->json([
                'success' => false,
                'message' => 'Verifikasi diperlukan untuk menghapus akun.',
            ], 422);
        }

        $user = DB::table('users')->where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email tersebut tidak ditemukan.',
            ], 422);
        }

        if (!empty($googleId)) {
            // Google accounts prove ownership with a fresh Sign-In id.
            if ($user->auth_provider !== 'google'
                || empty($user->google_id)
                || !hash_equals((string) $user->google_id, (string) $googleId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verifikasi akun Google gagal.',
                ], 422);
            }
        }

        try {
            DB::transaction(function () use ($user, $email, $code) {
                // The OTP is checked AND consumed inside the transaction: if the
                // delete fails, the rollback keeps the code usable instead of
                // burning it (which used to leave the user stuck on the OTP
                // screen with a code the server no longer knew).
                if (empty($code) === false) {
                    $verification = $this->consumeActionOtp(
                        $email,
                        self::PURPOSE_DELETE_ACCOUNT,
                        (string) $code,
                        (int) $user->id
                    );

                    if ($verification !== null) {
                        throw new AccountVerificationException($verification);
                    }
                }

                $this->detachUserReferences((int) $user->id, $email);

                $deleted = DB::table('users')->where('id', $user->id)->delete();

                if ($deleted !== 1) {
                    throw new \RuntimeException('User row was not deleted.');
                }

                // Housekeeping: no pending codes for an account that no longer exists.
                EmailOtp::where('email', $email)->delete();
                PasswordResetToken::where('email', $email)->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil dihapus.',
                'data' => [
                    'email' => $email,
                ],
            ]);
        } catch (AccountVerificationException $e) {
            return $e->response;
        } catch (\Throwable $e) {
            // Never leak SQL internals to the app — the user gets an actionable
            // message, the details land in the log.
            Log::error('delete-account failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus akun. Coba lagi sebentar lagi atau hubungi admin.',
            ], 500);
        }
    }

    /**
     * Clears every row that could hold the account back from being deleted.
     *
     * The core user tables cascade from `users`, but optional / legacy tables
     * reference the account WITHOUT a constraint (film lists, promos) or via a
     * column added by an older schema. Rows there are cleaned explicitly first
     * so the delete can never fail on an implicit reference.
     */
    private function detachUserReferences(int $userId, string $email): void
    {
        // Film lists: items + comments first (no FK), then the lists.
        if (Schema::hasTable('film_lists')) {
            $listIds = DB::table('film_lists')->where('user_id', $userId)->pluck('id');

            if ($listIds->isNotEmpty()) {
                if (Schema::hasTable('film_list_comments')) {
                    DB::table('film_list_comments')->whereIn('film_list_id', $listIds)->delete();
                    DB::table('film_list_comments')->where('user_id', $userId)->delete();
                }

                if (Schema::hasTable('film_list_items')) {
                    DB::table('film_list_items')->whereIn('film_list_id', $listIds)->delete();
                }

                DB::table('film_lists')->whereIn('id', $listIds)->delete();
            }
        }

        // Promo redemptions (no FK to users).
        if (Schema::hasTable('promo_usages')) {
            DB::table('promo_usages')->where('user_id', $userId)->delete();
        }

        // Orders are the money trail: they are kept but no longer owned by the
        // account (user_id is nullable by design).
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'user_id')) {
            DB::table('orders')->where('user_id', $userId)->update(['user_id' => null]);
        }

        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->where('user_id', $userId)->delete();
        }
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    /**
     * Issues a hashed, purpose-bound OTP for a signed-in account action and
     * emails the plaintext code. Replaces any pending OTP for that email.
     *
     * @return bool false when the mail provider did not accept the message
     *              (the stored row is removed again in that case).
     */
    private function issueActionOtp(
        string $email,
        object $user,
        string $purpose,
        string $subject,
        string $heading,
        string $intro,
        string $footer
    ): bool {
        // Replace only this purpose's pending code (register / other action
        // codes for the same email stay valid).
        EmailOtp::purgePurpose($email, $purpose);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $record = EmailOtp::create([
            'email' => $email,
            'code' => EmailOtp::hash($code),
            'expires_at' => now()->addMinutes(EmailOtp::TTL_MINUTES),
            'attempts' => 0,
            'payload' => [
                'purpose' => $purpose,
                'user_id' => (int) ($user->id ?? 0),
            ],
            'created_at' => now(),
        ]);

        $username = $user->username ?: 'there';
        $ttl = EmailOtp::TTL_MINUTES;

        $sent = app(BrevoMailer::class)->send(
            $email,
            $subject,
            view('emails.otp-action', compact('username', 'code', 'ttl', 'heading', 'intro', 'footer'))->render()
        );

        if (! $sent) {
            // Local dev without Brevo configured: keep the row and write the
            // code to the log so the flow stays testable (never in production).
            if (app()->environment('local')) {
                Log::warning('OTP dev fallback (email not sent)', [
                    'email' => $email,
                    'purpose' => $purpose,
                    'code' => $code,
                ]);

                return true;
            }

            // No code can ever arrive: drop the row so the next attempt is
            // clean instead of "kode sudah dikirim" for an email that does
            // not exist.
            $record->delete();

            return false;
        }

        return true;
    }

    /**
     * Validates a purpose-bound OTP (exists, right purpose, unexpired, under
     * the attempt cap, correct code) and consumes it on success.
     *
     * Returns a JsonResponse on failure, or null when the code is accepted.
     */
    private function consumeActionOtp(
        string $email,
        string $purpose,
        string $code,
        int $userId
    ): ?\Illuminate\Http\JsonResponse {
        $record = EmailOtp::pending($email, $purpose);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak ditemukan. Minta kode baru.',
            ], 422);
        }

        $payloadPurpose = (string) (($record->payload['purpose'] ?? '') ?: '');
        $payloadUserId = (int) ($record->payload['user_id'] ?? 0);

        if ($payloadPurpose !== $purpose || ($payloadUserId !== 0 && $payloadUserId !== $userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak berlaku untuk tindakan ini. Minta kode baru.',
            ], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kedaluwarsa. Minta kode baru lewat tombol Kirim ulang.',
            ], 422);
        }

        if ($record->isMaxedOut()) {
            $record->delete();
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak percobaan. Minta kode baru lewat tombol Kirim ulang.',
            ], 422);
        }

        if (!hash_equals($record->code, EmailOtp::hash($code))) {
            $record->attempts++;
            $remaining = EmailOtp::MAX_ATTEMPTS - $record->attempts;

            if ($remaining <= 0) {
                $record->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Kode OTP salah. Terlalu banyak percobaan — minta kode baru lewat tombol Kirim ulang.',
                ], 422);
            }

            $record->save();

            return response()->json([
                'success' => false,
                'message' => "Kode OTP salah. Sisa percobaan: {$remaining}.",
            ], 422);
        }

        // Single-use: consume before touching the account.
        $record->delete();

        return null;
    }

    /**
     * Server-side anti-spam cooldown (the UI countdown is only a hint).
     */
    private function resendCooldownResponse(string $key): ?\Illuminate\Http\JsonResponse
    {
        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = max(1, RateLimiter::availableIn($key));
            return response()->json([
                'success' => false,
                'message' => "Tunggu {$seconds} detik sebelum meminta kode baru.",
            ], 429);
        }

        RateLimiter::hit($key, self::RESEND_COOLDOWN_SECONDS);

        return null;
    }
}
