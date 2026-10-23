<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('admin_logged_in')) {
            return redirect()->route('admin.login');
        }

        // Sessions created before roles existed only contain admin_logged_in.
        // Re-hydrate them so the role/cinema guards still work.
        if (!session()->has('admin_role')) {
            $user = User::find(session('admin_user_id'));

            if (!$user || $user->status !== 'active' || !$user->isAdmin()) {
                session()->flush();

                return redirect()->route('admin.login')
                    ->withErrors(['email' => 'Sesi Anda sudah berakhir. Silakan login kembali.']);
            }

            $this->putSession($request, $user);
        }

        return $next($request);
    }

    public static function putSession(Request $request, User $user): void
    {
        $user->loadMissing('cinema');

        $request->session()->put([
            'admin_logged_in' => true,
            'admin_user_id' => $user->id,
            'admin_user_name' => $user->username,
            'admin_user_email' => $user->email,
            'admin_role' => $user->role,
            'admin_cinema_id' => $user->cinema_id,
            'admin_cinema_name' => $user->cinema?->cinema_name,
        ]);
    }
}
