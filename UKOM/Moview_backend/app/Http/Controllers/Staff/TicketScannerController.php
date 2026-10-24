<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\TicketController as ApiTicketController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class TicketScannerController extends Controller
{
    public function index()
    {
        return view('admin.tickets.scanner');
    }

    public function preview(Request $request)
    {
        return app(ApiTicketController::class)->scanPreview($request, $this->cinemaId());
    }

    public function scan(Request $request)
    {
        return app(ApiTicketController::class)->scan($request, $this->cinemaId());
    }

    public function verifyFocusPassword(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|string|max:255',
        ]);

        $user = User::find((int) session('admin_user_id'));

        if (! $user || ! $user->isStaff() || $user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Sesi staff tidak valid. Silakan login kembali.',
            ], 403);
        }

        $key = 'staff-focus-exit:' . $user->id;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan. Coba lagi dalam {$seconds} detik.",
                'retry_after' => $seconds,
            ], 429);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($key, 300);
            $attemptsLeft = max(0, 5 - RateLimiter::attempts($key));

            return response()->json([
                'success' => false,
                'message' => $attemptsLeft > 0
                    ? "Password salah. Sisa {$attemptsLeft} percobaan."
                    : 'Password salah. Batas percobaan habis. Coba lagi beberapa menit lagi.',
                'attempts_left' => $attemptsLeft,
            ], 422);
        }

        RateLimiter::clear($key);

        return response()->json([
            'success' => true,
            'message' => 'Mode fokus dinonaktifkan.',
        ]);
    }

    private function cinemaId(): int
    {
        $cinemaId = (int) session('admin_cinema_id');

        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        return $cinemaId;
    }
}
