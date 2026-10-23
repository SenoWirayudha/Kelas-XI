<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCinemaScope
{
    /**
     * Managers and staff may only touch data belonging to their own cinema.
     * Admins are unrestricted.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $role = session('admin_role');

        if ($role === 'admin') {
            return $next($request);
        }

        if (!in_array($role, ['manager', 'staff'], true)) {
            abort(403, 'Anda tidak memiliki akses ke data bioskop.');
        }

        $cinemaId = (int) session('admin_cinema_id');

        if ($cinemaId <= 0) {
            abort(403, 'Akun Anda belum terhubung ke bioskop.');
        }

        foreach (['cinema', 'cinemaId', 'cinema_id'] as $parameter) {
            $value = $request->route($parameter);

            if ($value instanceof Model) {
                $value = $value->getKey();
            }

            if ($value !== null && (int) $value !== $cinemaId) {
                abort(403, 'Anda hanya dapat mengakses data bioskop Anda sendiri.');
            }
        }

        $inputCinemaId = $request->input('cinema_id');

        if ($inputCinemaId !== null && $inputCinemaId !== '' && (int) $inputCinemaId !== $cinemaId) {
            abort(403, 'Anda hanya dapat mengakses data bioskop Anda sendiri.');
        }

        return $next($request);
    }
}
