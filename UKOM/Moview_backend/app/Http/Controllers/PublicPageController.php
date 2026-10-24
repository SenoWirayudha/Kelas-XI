<?php

namespace App\Http\Controllers;

use App\Models\Cinema;
use App\Models\Movie;
use App\Models\Review;
use App\Models\Schedule;
use App\Models\User;
use App\Models\UserFavoriteFilm;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        return view('landing', array_merge(
            $this->appDownload(),
            $this->androidBuildInfo(),
            $this->landingData()
        ));
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

        $popularMovies = $this->weeklyPopularMovies();

        if ($popularMovies->isEmpty()) {
            $popularMovies = $movies;
        }

        return view('discover', array_merge($this->appDownload(), [
            'user' => $user,
            'movies' => $movies,
            'popularMovies' => $this->movieCards($popularMovies),
            'reviews' => $reviews,
        ]));
    }

    private function landingData(): array
    {
        $schedules = Schedule::with(['movie', 'studio.cinema'])
            ->openForOnline()
            ->orderBy('show_date')
            ->orderBy('show_time')
            ->limit(60)
            ->get();

        $nowShowing = $schedules
            ->map(fn (Schedule $schedule) => $schedule->movie)
            ->filter()
            ->unique('id')
            ->values();

        if ($nowShowing->isEmpty()) {
            $nowShowing = Movie::query()
                ->where('status', 'published')
                ->whereNotNull('default_poster_path')
                ->latest('id')
                ->limit(12)
                ->get();
        }

        $heroSchedules = $schedules
            ->filter(fn (Schedule $schedule) => $schedule->movie !== null)
            ->unique('movie_id')
            ->values();

        $heroSchedule = $heroSchedules->first();
        $heroMovie = $heroSchedule?->movie ?? $nowShowing->first();
        $heroPosters = $heroSchedules
            ->filter(fn (Schedule $schedule) => $schedule->movie?->default_poster_path)
            ->take(3)
            ->map(fn (Schedule $schedule) => [
                'title' => $schedule->movie->title,
                'poster_url' => $this->posterUrl($schedule->movie->default_poster_path),
            ])
            ->values();

        $review = Review::with(['user', 'movie'])
            ->where('status', 'published')
            ->whereNotNull('content')
            ->whereRaw('LENGTH(content) >= 80')
            ->latest('created_at')
            ->latest('id')
            ->first()
            ?? Review::with(['user', 'movie'])
                ->where('status', 'published')
                ->whereNotNull('content')
                ->latest('created_at')
                ->latest('id')
                ->first();

        $reviewStats = [
            // Likes by OTHER users live in review_likes.
            // reviews.is_liked is the review author's own movie like and is unrelated.
            'likes' => $review ? DB::table('review_likes')->where('review_id', $review->id)->count() : 0,
            'comments' => $review
                ? DB::table('review_comments')
                    ->where('review_id', $review->id)
                    ->where('status', 'published')
                    ->count()
                : 0,
            'saved' => $review ? DB::table('watchlists')->where('film_id', $review->film_id)->count() : 0,
        ];

        $curator = $review?->user
            ?? User::query()->where('role', User::ROLE_USER)->where('status', 'active')->latest('id')->first();

        $curatorStats = [
            'watched' => $curator ? DB::table('diaries')->where('user_id', $curator->id)->count() : 0,
            'reviews' => $curator
                ? DB::table('reviews')->where('user_id', $curator->id)->where('status', 'published')->count()
                : 0,
            'watchlist' => $curator ? DB::table('watchlists')->where('user_id', $curator->id)->count() : 0,
        ];

        $popularMovies = $this->weeklyPopularMovies();

        if ($popularMovies->isEmpty()) {
            $popularMovies = $nowShowing;
        }

        $favoritePosters = $curator
            ? UserFavoriteFilm::with('movie')
                ->where('user_id', $curator->id)
                ->orderBy('position')
                ->limit(4)
                ->get()
                ->map(fn (UserFavoriteFilm $favorite) => $favorite->movie)
                ->filter()
                ->values()
            : collect();

        if ($favoritePosters->count() < 4) {
            $favoritePosters = $favoritePosters
                ->concat($nowShowing)
                ->unique('id')
                ->take(4)
                ->values();
        }

        return [
            'nowShowing' => $nowShowing,
            'heroMovie' => $heroMovie,
            'heroSchedule' => $heroSchedule,
            'heroPosters' => $heroPosters,
            'popularMovies' => $this->movieCards($popularMovies),
            'favoriteCards' => $this->movieCards($favoritePosters),
            'reviewCard' => $review?->movie
                ? $this->movieCards(collect([$review->movie]))->first()
                : null,
            'review' => $review,
            'reviewStats' => $reviewStats,
            'curator' => $curator,
            'curatorStats' => $curatorStats,
            'favoritePosters' => $favoritePosters,
            'stats' => [
                'reviews' => Review::query()->where('status', 'published')->count(),
                'cinemas' => Cinema::query()->count(),
            ],
        ];
    }

    /**
     * Same ranking source as the admin Analytics "Top Films This Week":
     * count of ratings in the last 7 days, highest first.
     */
    private function weeklyPopularMovies()
    {
        $ids = DB::table('ratings')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select('movies.id', DB::raw('COUNT(*) as view_count'))
            ->whereBetween('ratings.created_at', [now()->subWeek(), now()])
            ->groupBy('movies.id')
            ->orderByDesc('view_count')
            ->limit(5)
            ->pluck('movies.id');

        if ($ids->isEmpty()) {
            return collect();
        }

        $order = $ids->flip();

        return Movie::query()
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn (Movie $movie) => $order->get($movie->id, 999))
            ->values();
    }

    private function movieCards($movies)
    {
        $ids = collect($movies)->pluck('id')->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $detailed = Movie::query()
            ->whereIn('id', $ids)
            ->with([
                'genres',
                'moviePersons' => fn ($query) => $query
                    ->where('role_type', 'crew')
                    ->where('job', 'Director')
                    ->with('person'),
            ])
            ->withAvg('ratings as ratings_avg_rating', 'rating')
            ->get()
            ->keyBy('id');

        return collect($movies)
            ->map(function ($movie) use ($detailed) {
                $detail = $detailed->get($movie->id);

                if (! $detail) {
                    return null;
                }

                $director = $detail->moviePersons
                    ->map(fn ($credit) => $credit->person?->full_name)
                    ->filter()
                    ->unique()
                    ->take(2)
                    ->implode(', ');

                $poster = $this->posterUrl($detail->default_poster_path);

                return [
                    'id' => $detail->id,
                    'title' => $detail->title,
                    'year' => $detail->release_year,
                    'poster_url' => $poster,
                    'backdrop_url' => $this->posterUrl($detail->default_backdrop_path),
                    'rating' => round((float) ($detail->ratings_avg_rating ?? 0), 1),
                    'duration' => $detail->duration ? (int) $detail->duration : null,
                    'genres' => $detail->genres->pluck('name')->take(3)->implode(', '),
                    'director' => $director,
                    'synopsis' => $detail->synopsis
                        ? Str::limit(trim(strip_tags($detail->synopsis)), 240)
                        : null,
                ];
            })
            ->filter()
            ->values();
    }

    private function posterUrl(?string $path): ?string
    {
        return $path ? asset('storage/' . $path) : null;
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

    private function androidBuildInfo(): array
    {
        $buildFile = base_path('../Moview/app/build.gradle.kts');
        $version = null;
        $minSdk = null;

        if (is_file($buildFile)) {
            $contents = @file_get_contents($buildFile);

            if ($contents !== false) {
                if (preg_match('/versionName\s*=\s*"([^"]+)"/', $contents, $match)) {
                    $version = $match[1];
                }

                if (preg_match('/minSdk\s*=\s*(\d+)/', $contents, $match)) {
                    $minSdk = (int) $match[1];
                }
            }
        }

        return [
            'appVersion' => $version,
            'minSdk' => $minSdk,
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
