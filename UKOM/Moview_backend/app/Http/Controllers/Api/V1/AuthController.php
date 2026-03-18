<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
     * Register new user
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
            // Check if email already exists
            $existingUser = DB::table('users')
                ->where('email', $request->email)
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

            // Generate token
            $token = base64_encode($request->email . '|' . time() . '|' . uniqid());

            // Insert new user
            $userId = DB::table('users')->insertGetId([
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'status' => 'active',
                'remember_token' => $token,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Get the created user
            $user = DB::table('users')->where('id', $userId)->first();

            // Create default user profile
            DB::table('user_profiles')->insert([
                'user_id' => $userId,
                'display_name' => $user->username,
                'profile_photo' => null,
                'backdrop_path' => null,
                'bio' => null,
                'location' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
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
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
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
