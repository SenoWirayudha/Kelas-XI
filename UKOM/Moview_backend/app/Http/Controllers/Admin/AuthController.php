<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\AdminAuth;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        if (session()->has('admin_logged_in')) {
            return $this->redirectToDashboard();
        }

        return view('admin.auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        $canLogin = $user
            && in_array($user->role, User::WEB_ROLES, true)
            && $user->status === 'active'
            && Hash::check($request->password, $user->password);

        if (!$canLogin) {
            return back()->withErrors([
                'email' => 'Email atau password salah, atau akun tidak aktif.',
            ])->withInput($request->only('email'));
        }

        if ($user->isCinemaUser() && !$user->cinema_id) {
            return back()->withErrors([
                'email' => 'Akun Anda belum terhubung ke bioskop. Hubungi admin.',
            ])->withInput($request->only('email'));
        }

        AdminAuth::putSession($request, $user);

        return $this->redirectToDashboard();
    }

    public function logout()
    {
        session()->flush();

        return redirect()->route('home');
    }

    private function redirectToDashboard()
    {
        $role = session('admin_role');

        $route = match ($role) {
            User::ROLE_ADMIN => 'admin.dashboard',
            User::ROLE_MANAGER => 'manager.dashboard',
            User::ROLE_STAFF => 'staff.dashboard',
            User::ROLE_USER => 'discover',
            default => null,
        };

        if (!$route) {
            session()->flush();

            return redirect()->route('admin.login');
        }

        return redirect()->route($route);
    }
}
