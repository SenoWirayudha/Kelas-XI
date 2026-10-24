<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use App\Models\Review;
use App\Models\User;

class PublicPageController extends Controller
{
    public function landing()
    {
        if (session('admin_logged_in')) {
            $route = match (session('admin_role')) {
                User::ROLE_ADMIN => 'admin.dashboard',
                User::ROLE_MANAGER => 'manager.dashboard',
                User::ROLE_STAFF => 'staff.dashboard',
                User::ROLE_USER => 'discover',
                default => null,
            };

            return $route
                ? redirect()->route($route)
                : redirect()->route('admin.login');
        }

        return view('landing', $this->appDownload());
    }

    public function discover()
    {
        $user = User::find(session('admin_user_id'));

        if (! $user || $user->role !== User::ROLE_USER) {
            return redirect()->route('admin.login');
        }

        $movies = Movie::query()
            ->where('status', 'published')
            ->whereHas('schedules', fn ($query) => $query->openForOnline())
            ->orderByDesc('id')
            ->limit(12)
            ->get();

        $reviews = Review::with(['user', 'movie'])
            ->where('status', 'published')
            ->whereNotNull('content')
            ->latest('created_at')
            ->latest('id')
            ->limit(3)
            ->get();

        return view('discover', array_merge($this->appDownload(), [
            'user' => $user,
            'movies' => $movies,
            'reviews' => $reviews,
        ]));
    }

    private function appDownload(): array
    {
        $path = public_path('downloads/moview.apk');
        $exists = is_file($path);

        return [
            'apkExists' => $exists,
            'apkSize' => $exists ? $this->formatBytes((int) filesize($path)) : null,
        ];
    }

    private function formatBytes(int $bytes): string
    {
        $value = $bytes;
        $unit = 'B';

        foreach (['KB', 'MB', 'GB'] as $next) {
            if ($value < 1024) {
                break;
            }

            $value /= 1024;
            $unit = $next;
        }

        return number_format($value, $unit === 'B' ? 0 : 1, ',', '.') . ' ' . $unit;
    }
}
