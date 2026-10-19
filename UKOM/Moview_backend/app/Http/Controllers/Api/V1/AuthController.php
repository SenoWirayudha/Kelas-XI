<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Services\BrevoMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Login user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find user by email
            $user = DB::table('users')
                ->where('email', $request->email)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Block admin account from Android app login
            if (($user->role ?? null) === 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin account can only login from web admin.'
                ], 403);
            }

            // Check if user is active
            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been ' . $user->status
                ], 403);
            }

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Generate simple token (in production, use Laravel Sanctum or JWT)
            $token = base64_encode($user->id . '|' . time() . '|' . uniqid());

            // Update remember_token
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'remember_token' => $token,
                    'updated_at' => now()
                ]);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'joined_at' => $user->joined_at
                    ],
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register new user — step 1: send a 6-digit OTP to the email.
     *
     * The account is NOT created yet; the registration data (username +
     * hashed password) is staged in email_otps until the OTP is verified
     * via verifyOtp(). Google Sign-In does not go through this flow.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|min:3|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = strtolower(trim($request->input('email')));

            // Check if email already exists
            $existingUser = DB::table('users')
                ->where('email', $email)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already registered'
                ], 409);
            }

            // Check if username already exists
            $existingUsername = DB::table('users')
                ->where('username', $request->username)
                ->first();

            if ($existingUsername) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username already taken'
                ], 409);
            }

            $this->issueOtp($email, [
                'username' => $request->username,
                // Stored hashed — plaintext never leaves this request.
                'password' => Hash::make($request->password),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP sudah dikirim ke emailmu. Masukkan kode untuk menyelesaikan pendaftaran.',
                'data' => [
                    'email' => $email,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/v1/register/verify-otp — step 2: verify the 6-digit code.
     * On success the staged account is created and the session token returned
     * (same response shape as login). Max 3 wrong attempts, then the code is
     * invalidated and a new one must be requested.
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|regex:/^\d{6}$/',
        ], [
            'code.required' => 'Kode OTP wajib diisi.',
            'code.regex' => 'Kode OTP harus 6 digit angka.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        $record = EmailOtp::where('email', $email)->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak ditemukan. Daftar ulang untuk mendapatkan kode baru.',
            ], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kedaluwarsa. Mint kode baru lewat tombol Kirim ulang.',
            ], 422);
        }

        if ($record->isMaxedOut()) {
            $record->delete();
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak percobaan. Mint kode baru lewat tombol Kirim ulang.',
            ], 422);
        }

        if (!hash_equals($record->code, EmailOtp::hash($request->input('code')))) {
            $record->attempts++;
            $remaining = EmailOtp::MAX_ATTEMPTS - $record->attempts;

            if ($remaining <= 0) {
                $record->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Kode OTP salah. Terlalu banyak percobaan — mint kode baru lewat tombol Kirim ulang.',
                ], 422);
            }

            $record->save();

            return response()->json([
                'success' => false,
                'message' => "Kode OTP salah. Sisa percobaan: {$remaining}.",
            ], 422);
        }

        try {
            $payload = $record->payload;
            $username = (string) ($payload['username'] ?? '');
            $passwordHash = (string) ($payload['password'] ?? '');

            if ($username === '' || $passwordHash === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pendaftaran tidak lengkap. Daftar ulang.',
                ], 422);
            }

            // Email may have been registered in the meantime (race with a
            // completed account or Google Sign-In).
            if (DB::table('users')->where('email', $email)->exists()) {
                $record->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Email already registered'
                ], 409);
            }

            $token = base64_encode($email . '|' . time() . '|' . uniqid());

            $userId = DB::table('users')->insertGetId([
                'username' => $username,
                'email' => $email,
                'password' => $passwordHash,
                'role' => 'user',
                'status' => 'active',
                'remember_token' => $token,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::table('user_profiles')->insert([
                'user_id' => $userId,
                'display_name' => $username,
                'profile_photo' => null,
                'backdrop_path' => null,
                'bio' => null,
                'location' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Verified — consume the OTP (single-use).
            $record->delete();

            $user = DB::table('users')->where('id', $userId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil. Selamat datang di Moview!',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'joined_at' => $user->joined_at
                    ],
                    'token' => $token
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/v1/register/resend-otp — request a fresh OTP for a pending
     * registration. 60-second cooldown per email; resets the attempt counter.
     */
    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        $key = 'otp-resend:' . $email;
        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => "Tunggu {$seconds} detik sebelum meminta kode baru.",
            ], 429);
        }

        $record = EmailOtp::where('email', $email)->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada pendaftaran aktif untuk email ini. Daftar ulang.',
            ], 422);
        }

        RateLimiter::hit($key, 60);

        try {
            $this->issueOtp($email, $record->payload, $record);

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP baru sudah dikirim ke emailmu.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim ulang kode: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Creates (or replaces) the pending OTP row for an email and emails the
     * 6-digit code. The stored code is sha256-hashed; attempts reset to 0.
     */
    private function issueOtp(string $email, array $payload, ?EmailOtp $existing = null): void
    {
        EmailOtp::where('email', $email)->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $record = EmailOtp::create([
            'email' => $email,
            'code' => EmailOtp::hash($code),
            'expires_at' => now()->addMinutes(EmailOtp::TTL_MINUTES),
            'attempts' => 0,
            'payload' => $payload,
            'created_at' => now(),
        ]);

        $username = (string) ($payload['username'] ?? '');
        $ttl = EmailOtp::TTL_MINUTES;

        app(BrevoMailer::class)->send(
            $email,
            'Kode Verifikasi — Moview',
            view('emails.otp-register', compact('username', 'code', 'ttl'))->render()
        );
    }

    /**
     * Logout user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->header('Authorization');
            
            if ($token) {
                // Remove 'Bearer ' prefix if present
                $token = str_replace('Bearer ', '', $token);
                
                // Clear token
                DB::table('users')
                    ->where('remember_token', $token)
                    ->update([
                        'remember_token' => null,
                        'updated_at' => now()
                    ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user info
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        try {
            $token = $request->header('Authorization');
            
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Remove 'Bearer ' prefix if present
            $token = str_replace('Bearer ', '', $token);
            
            $user = DB::table('users')
                ->where('remember_token', $token)
                ->where('status', 'active')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            if (($user->role ?? null) === 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin account is not allowed in Android app.'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'joined_at' => $user->joined_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user info: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Google Sign-In
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'display_name' => 'required|string|max:255',
            'google_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::table('users')
                ->where('email', $request->email)
                ->first();

            $token = base64_encode($request->email . '|' . time() . '|' . uniqid());

            if ($user) {
                // Existing user – check status
                if ($user->status !== 'active') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your account has been ' . $user->status
                    ], 403);
                }

                if (($user->role ?? null) === 'admin') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Admin account can only login from web admin.'
                    ], 403);
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'remember_token' => $token,
                        // Backfill the id but keep the original auth_provider:
                        // an existing account may have a real manual password.
                        'google_id' => $user->google_id ?? $request->google_id,
                        'updated_at' => now()
                    ]);
            } else {
                // New user – create account
                $username = preg_replace('/[^a-zA-Z0-9_]/', '', $request->display_name);
                if (empty($username)) {
                    $username = 'user';
                }

                // Ensure unique username
                $baseUsername = substr($username, 0, 15);
                $finalUsername = $baseUsername;
                $counter = 1;
                while (DB::table('users')->where('username', $finalUsername)->exists()) {
                    $finalUsername = $baseUsername . $counter;
                    $counter++;
                }

                $userId = DB::table('users')->insertGetId([
                    'username' => $finalUsername,
                    'email' => $request->email,
                    'password' => Hash::make(uniqid() . time()),
                    'google_id' => $request->google_id,
                    'auth_provider' => 'google',
                    'role' => 'user',
                    'status' => 'active',
                    'remember_token' => $token,
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                DB::table('user_profiles')->insert([
                    'user_id' => $userId,
                    'display_name' => $request->display_name,
                    'profile_photo' => null,
                    'backdrop_path' => null,
                    'bio' => null,
                    'location' => null,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $user = DB::table('users')->where('id', $userId)->first();
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'joined_at' => $user->joined_at
                    ],
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google login failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
