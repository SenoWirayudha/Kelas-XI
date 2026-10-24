<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Allow the request only for the given roles (e.g. "role:admin,manager").
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = session('admin_role');

        if (!$role) {
            session()->flush();

            if ($request->expectsJson()) {
                abort(403, 'Unauthenticated.');
            }

            return redirect()->route('admin.login');
        }

        if (!in_array($role, $roles, true)) {
            if ($request->expectsJson()) {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }

            $home = match ($role) {
                'admin' => 'admin.dashboard',
                'manager' => 'manager.dashboard',
                'staff' => 'staff.dashboard',
                'user' => 'discover',
                default => null,
            };

            if ($home && !$request->routeIs($home)) {
                return redirect()->route($home)
                    ->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
            }

            abort(403, 'Anda tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
