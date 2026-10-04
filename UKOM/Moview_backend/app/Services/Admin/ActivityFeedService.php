<?php

namespace App\Services\Admin;

use App\Models\Review;
use App\Models\User;
use App\Models\UserActivity;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ActivityFeedService
{
    /** Tipe dari tabel user_activities yang ikut feed (sama dengan sebelum refactor + reply_comment). */
    private const USER_ACTIVITY_TYPES = ['follow', 'like_review', 'comment_review', 'reply_comment'];

    /**
     * Logika daftar aktivitas halaman /admin/activity.
     * Dipindah utuh dari ActivityController@index: 5 sumber digabung
     * (user_activities, ratings=watched, diaries tanpa review=logged,
     * reviews published=reviewed, watchlists), filter + sort + paginasi sama.
     *
     * @param array $filters  user_search, activity_type, film_search, time_range
     * @param array $query    request()->query() untuk pagination link
     */
    public function list(array $filters, array $query): LengthAwarePaginator
    {
        $userSearch = $filters['user_search'] ?? null;
        $activityType = $filters['activity_type'] ?? null;
        $filmSearch = $filters['film_search'] ?? null;
        $timeRange = $filters['time_range'] ?? 'all';

        $dateFilter = null;
        switch ($timeRange) {
            case '24h':
                $dateFilter = now()->subDay();
                break;
            case '7d':
                $dateFilter = now()->subDays(7);
                break;
            case '30d':
                $dateFilter = now()->subDays(30);
                break;
            default:
                $dateFilter = null;
        }

        // 1. Follow, Like Review, Comment Review from user_activities
        $userActivitiesQuery = DB::table('user_activities')
            ->join('users', 'user_activities.user_id', '=', 'users.id')
            ->leftJoin('movies', 'user_activities.film_id', '=', 'movies.id')
            ->select(
                'user_activities.id',
                'user_activities.user_id',
                'user_activities.type',
                'user_activities.meta',
                'user_activities.created_at',
                'users.username as user_name',
                'users.email as user_email',
                'movies.title as movie_title',
                'movies.release_year',
                DB::raw('NULL as rating'),
                DB::raw('NULL as review_content'),
                DB::raw("'user_activity' as source")
            )
            ->whereIn('user_activities.type', self::USER_ACTIVITY_TYPES);

        if ($userSearch) {
            $userActivitiesQuery->where(function ($q) use ($userSearch) {
                $q->where('users.username', 'like', "%{$userSearch}%")
                    ->orWhere('users.email', 'like', "%{$userSearch}%");
            });
        }
        if ($filmSearch) {
            $userActivitiesQuery->where('movies.title', 'like', "%{$filmSearch}%");
        }
        if ($dateFilter) {
            $userActivitiesQuery->where('user_activities.created_at', '>=', $dateFilter);
        }
        if ($activityType && in_array($activityType, self::USER_ACTIVITY_TYPES)) {
            $userActivitiesQuery->where('user_activities.type', $activityType);
        }

        $userActivities = (!$activityType || in_array($activityType, self::USER_ACTIVITY_TYPES))
            ? $userActivitiesQuery->get()
            : collect([]);

        // 2. Watched from ratings table
        $watchedQuery = DB::table('ratings')
            ->join('users', 'ratings.user_id', '=', 'users.id')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select(
                'ratings.id',
                'ratings.user_id',
                DB::raw("'watched' as type"),
                DB::raw('NULL as meta'),
                'ratings.created_at',
                'users.username as user_name',
                'users.email as user_email',
                'movies.title as movie_title',
                'movies.release_year',
                'ratings.rating',
                DB::raw('NULL as review_content'),
                DB::raw("'rating' as source")
            );

        if ($userSearch) {
            $watchedQuery->where(function ($q) use ($userSearch) {
                $q->where('users.username', 'like', "%{$userSearch}%")
                    ->orWhere('users.email', 'like', "%{$userSearch}%");
            });
        }
        if ($filmSearch) {
            $watchedQuery->where('movies.title', 'like', "%{$filmSearch}%");
        }
        if ($dateFilter) {
            $watchedQuery->where('ratings.created_at', '>=', $dateFilter);
        }

        $watched = (!$activityType || $activityType === 'watched')
            ? $watchedQuery->get()
            : collect([]);

        // 3. Logged from diaries with review_id = null
        $loggedQuery = DB::table('diaries')
            ->join('users', 'diaries.user_id', '=', 'users.id')
            ->join('movies', 'diaries.film_id', '=', 'movies.id')
            ->select(
                'diaries.id',
                'diaries.user_id',
                DB::raw("'logged' as type"),
                DB::raw('NULL as meta'),
                'diaries.created_at',
                'users.username as user_name',
                'users.email as user_email',
                'movies.title as movie_title',
                'movies.release_year',
                DB::raw('NULL as rating'),
                DB::raw('NULL as review_content'),
                DB::raw("'diary' as source")
            )
            ->whereNull('diaries.review_id');

        if ($userSearch) {
            $loggedQuery->where(function ($q) use ($userSearch) {
                $q->where('users.username', 'like', "%{$userSearch}%")
                    ->orWhere('users.email', 'like', "%{$userSearch}%");
            });
        }
        if ($filmSearch) {
            $loggedQuery->where('movies.title', 'like', "%{$filmSearch}%");
        }
        if ($dateFilter) {
            $loggedQuery->where('diaries.created_at', '>=', $dateFilter);
        }

        $logged = (!$activityType || $activityType === 'logged')
            ? $loggedQuery->get()
            : collect([]);

        // 4. Reviewed from reviews table
        $reviewedQuery = DB::table('reviews')
            ->join('users', 'reviews.user_id', '=', 'users.id')
            ->join('movies', 'reviews.film_id', '=', 'movies.id')
            ->select(
                'reviews.id',
                'reviews.user_id',
                DB::raw("'reviewed' as type"),
                DB::raw('NULL as meta'),
                'reviews.created_at',
                'users.username as user_name',
                'users.email as user_email',
                'movies.title as movie_title',
                'movies.release_year',
                'reviews.rating',
                'reviews.content as review_content',
                DB::raw("'review' as source")
            )
            ->where('reviews.status', 'published');

        if ($userSearch) {
            $reviewedQuery->where(function ($q) use ($userSearch) {
                $q->where('users.username', 'like', "%{$userSearch}%")
                    ->orWhere('users.email', 'like', "%{$userSearch}%");
            });
        }
        if ($filmSearch) {
            $reviewedQuery->where('movies.title', 'like', "%{$filmSearch}%");
        }
        if ($dateFilter) {
            $reviewedQuery->where('reviews.created_at', '>=', $dateFilter);
        }

        $reviewed = (!$activityType || $activityType === 'reviewed')
            ? $reviewedQuery->get()
            : collect([]);

        // 5. Watchlist from watchlists table
        $watchlistQuery = DB::table('watchlists')
            ->join('users', 'watchlists.user_id', '=', 'users.id')
            ->join('movies', 'watchlists.film_id', '=', 'movies.id')
            ->select(
                'watchlists.id',
                'watchlists.user_id',
                DB::raw("'watchlist' as type"),
                DB::raw('NULL as meta'),
                'watchlists.created_at',
                'users.username as user_name',
                'users.email as user_email',
                'movies.title as movie_title',
                'movies.release_year',
                DB::raw('NULL as rating'),
                DB::raw('NULL as review_content'),
                DB::raw("'watchlist' as source")
            );

        if ($userSearch) {
            $watchlistQuery->where(function ($q) use ($userSearch) {
                $q->where('users.username', 'like', "%{$userSearch}%")
                    ->orWhere('users.email', 'like', "%{$userSearch}%");
            });
        }
        if ($filmSearch) {
            $watchlistQuery->where('movies.title', 'like', "%{$filmSearch}%");
        }
        if ($dateFilter) {
            $watchlistQuery->where('watchlists.created_at', '>=', $dateFilter);
        }

        $watchlist = (!$activityType || $activityType === 'watchlist')
            ? $watchlistQuery->get()
            : collect([]);

        // Combine all activities and sort by created_at
        $allActivities = $userActivities
            ->concat($watched)
            ->concat($logged)
            ->concat($reviewed)
            ->concat($watchlist)
            ->sortByDesc('created_at')
            ->values();

        $allActivities = $allActivities->map(function ($activity) {
            if ($activity->meta) {
                $activity->meta = json_decode($activity->meta, true);
            }
            return $activity;
        });

        $perPage = 15;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $currentItems = $allActivities->slice(($currentPage - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator(
            $currentItems,
            $allActivities->count(),
            $perPage,
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'query' => $query,
            ]
        );
    }

    /** Statistik kartu filter halaman Activity (total tanpa filter), persis seperti sebelum refactor. */
    public function stats(): array
    {
        return [
            'follow' => UserActivity::where('type', 'follow')->count(),
            'like_review' => UserActivity::where('type', 'like_review')->count(),
            'comment_review' => UserActivity::where('type', 'comment_review')->count(),
            'watched' => DB::table('ratings')->count(),
            'logged' => DB::table('diaries')->whereNull('review_id')->count(),
            'reviewed' => DB::table('reviews')->where('status', 'published')->count(),
            'watchlist' => DB::table('watchlists')->count(),
        ];
    }

    /**
     * N aktivitas terbaru dari SEMUA sumber, tanpa batas waktu, urut created_at desc.
     * Dipakai widget Recent Activity di dashboard analytics dan bagian
     * Recent Activity pada export CSV (data yang sama keduanya).
     *
     * Sumber & tipe identik dengan list(); target (user yang di-follow, pemilik
     * review) di-resolve beramai-ramai dalam 2 query tambahan, dan judul film
     * datang dari join — tanpa query per baris (N+1).
     */
    public function recent(int $limit): Collection
    {
        $userActivities = DB::table('user_activities')
            ->join('users', 'user_activities.user_id', '=', 'users.id')
            ->leftJoin('movies', 'user_activities.film_id', '=', 'movies.id')
            ->select(
                'user_activities.id',
                'user_activities.type',
                'user_activities.meta',
                'user_activities.created_at',
                'users.username as user_name',
                'movies.title as movie_title'
            )
            ->whereIn('user_activities.type', self::USER_ACTIVITY_TYPES)
            ->orderByDesc('user_activities.created_at')
            ->limit($limit)
            ->get();

        $watched = DB::table('ratings')
            ->join('users', 'ratings.user_id', '=', 'users.id')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select(
                'ratings.id',
                DB::raw("'watched' as type"),
                DB::raw('NULL as meta'),
                'ratings.created_at',
                'users.username as user_name',
                'movies.title as movie_title'
            )
            ->orderByDesc('ratings.created_at')
            ->limit($limit)
            ->get();

        $logged = DB::table('diaries')
            ->join('users', 'diaries.user_id', '=', 'users.id')
            ->join('movies', 'diaries.film_id', '=', 'movies.id')
            ->select(
                'diaries.id',
                DB::raw("'logged' as type"),
                DB::raw('NULL as meta'),
                'diaries.created_at',
                'users.username as user_name',
                'movies.title as movie_title'
            )
            ->whereNull('diaries.review_id')
            ->orderByDesc('diaries.created_at')
            ->limit($limit)
            ->get();

        $reviewed = DB::table('reviews')
            ->join('users', 'reviews.user_id', '=', 'users.id')
            ->join('movies', 'reviews.film_id', '=', 'movies.id')
            ->select(
                'reviews.id',
                DB::raw("'reviewed' as type"),
                DB::raw('NULL as meta'),
                'reviews.created_at',
                'users.username as user_name',
                'movies.title as movie_title'
            )
            ->where('reviews.status', 'published')
            ->orderByDesc('reviews.created_at')
            ->limit($limit)
            ->get();

        $watchlist = DB::table('watchlists')
            ->join('users', 'watchlists.user_id', '=', 'users.id')
            ->join('movies', 'watchlists.film_id', '=', 'movies.id')
            ->select(
                'watchlists.id',
                DB::raw("'watchlist' as type"),
                DB::raw('NULL as meta'),
                'watchlists.created_at',
                'users.username as user_name',
                'movies.title as movie_title'
            )
            ->orderByDesc('watchlists.created_at')
            ->limit($limit)
            ->get();

        $items = $userActivities
            ->concat($watched)
            ->concat($logged)
            ->concat($reviewed)
            ->concat($watchlist)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values()
            ->map(function ($activity) {
                $activity->meta = $activity->meta ? json_decode($activity->meta, true) : null;
                return $activity;
            });

        // Resolve target follow & pemilik review beramai-ramai (bukan N+1).
        $followTargetIds = $items
            ->where('type', 'follow')
            ->pluck('meta.followed_user_id')
            ->filter()
            ->unique()
            ->values();
        $followTargets = $followTargetIds->isEmpty()
            ? collect()
            : User::whereIn('id', $followTargetIds)->pluck('username', 'id');

        $reviewIds = $items
            ->whereIn('type', ['like_review', 'comment_review'])
            ->pluck('meta.review_id')
            ->filter()
            ->unique()
            ->values();
        $reviews = $reviewIds->isEmpty()
            ? collect()
            : Review::with(['user:id,username', 'movie:id,title'])
                ->whereIn('id', $reviewIds)
                ->get()
                ->keyBy('id');

        return $items->map(function ($activity) use ($followTargets, $reviews) {
            $activity->target_name = null;
            $activity->reviewer_name = null;

            if ($activity->type === 'follow') {
                $activity->target_name = $followTargets[$activity->meta['followed_user_id'] ?? null] ?? null;
            }

            if (in_array($activity->type, ['like_review', 'comment_review'])) {
                $review = $reviews[$activity->meta['review_id'] ?? null] ?? null;
                if ($review) {
                    $activity->reviewer_name = $review->user->username ?? null;
                    if (!$activity->movie_title) {
                        $activity->movie_title = $review->movie->title ?? null;
                    }
                }
            }

            $activity->action = self::actionLabel($activity);
            $activity->description = self::description($activity);

            return $activity;
        });
    }

    /** Label aksi singkat (tanpa judul film) — dipakai kolom Activity pada export CSV. */
    private static function actionLabel(object $activity): string
    {
        return match ($activity->type) {
            'follow' => 'followed' . ($activity->target_name ? ' ' . $activity->target_name : ''),
            'like_review' => 'liked review',
            'comment_review' => 'commented on review',
            'watched' => 'watched',
            'logged' => 'logged',
            'reviewed' => 'reviewed',
            'watchlist' => 'added to watchlist',
            default => str_replace('_', ' ', (string) $activity->type),
        };
    }

    /** Kalimat utuh untuk widget dashboard (identik gaya tampilan sebelumnya, untuk semua tipe). */
    private static function description(object $activity): string
    {
        $movie = $activity->movie_title;

        return match ($activity->type) {
            'follow' => 'followed ' . ($activity->target_name ?? 'a user'),
            'like_review' => ($activity->reviewer_name ? "liked {$activity->reviewer_name}'s review" : 'liked a review')
                . ($movie ? " on {$movie}" : ''),
            'comment_review' => ($activity->reviewer_name ? "commented on {$activity->reviewer_name}'s review" : 'commented on a review')
                . ($movie ? " on {$movie}" : ''),
            'watched' => 'watched ' . ($movie ?? 'a film'),
            'logged' => 'logged ' . ($movie ?? 'a film'),
            'reviewed' => 'reviewed ' . ($movie ?? 'a film'),
            'watchlist' => 'added ' . ($movie ?? 'a film') . ' to watchlist',
            default => str_replace('_', ' ', (string) $activity->type),
        };
    }
}
