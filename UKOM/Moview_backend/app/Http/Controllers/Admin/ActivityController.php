<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        // Get filter parameters
        $userSearch = $request->input('user_search');
        $activityType = $request->input('activity_type');
        $filmSearch = $request->input('film_search');
        $timeRange = $request->input('time_range', 'all');
        
        // Calculate date filter based on time range
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
        
        // Get all different types of activities and combine them
        
        // 1. Follow, Like Review, Comment Review from user_activities
        $userActivitiesQuery = DB::table('user_activities')
            ->join('users', 'user_activities.user_id', '=', 'users.id')
            ->leftJoin('movies', 'user_activities.film_id', '=', 'movies.id')
            ->select(
                'user_activities.id',
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
            ->whereIn('user_activities.type', ['follow', 'like_review', 'comment_review']);
        
        // Apply filters for user activities
        if ($userSearch) {
            $userActivitiesQuery->where(function($q) use ($userSearch) {
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
        if ($activityType && in_array($activityType, ['follow', 'like_review', 'comment_review'])) {
            $userActivitiesQuery->where('user_activities.type', $activityType);
        }
        
        $userActivities = (!$activityType || in_array($activityType, ['follow', 'like_review', 'comment_review'])) 
            ? $userActivitiesQuery->get() 
            : collect([]);
        
        // 2. Watched from ratings table
        $watchedQuery = DB::table('ratings')
            ->join('users', 'ratings.user_id', '=', 'users.id')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select(
                'ratings.id',
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
        
        // Apply filters for watched
        if ($userSearch) {
            $watchedQuery->where(function($q) use ($userSearch) {
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
        
        // Apply filters for logged
        if ($userSearch) {
            $loggedQuery->where(function($q) use ($userSearch) {
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
        
        // Apply filters for reviewed
        if ($userSearch) {
            $reviewedQuery->where(function($q) use ($userSearch) {
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
        
        // Apply filters for watchlist
        if ($userSearch) {
            $watchlistQuery->where(function($q) use ($userSearch) {
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
        
        // Parse meta for user_activities
        $allActivities = $allActivities->map(function($activity) {
            if ($activity->meta) {
                $activity->meta = json_decode($activity->meta, true);
            }
            return $activity;
        });
        
        // Paginate the collection
        $perPage = 15;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $currentItems = $allActivities->slice(($currentPage - 1) * $perPage, $perPage)->values();
        
        $activities = new LengthAwarePaginator(
            $currentItems,
            $allActivities->count(),
            $perPage,
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'query' => $request->query()
            ]
        );
        
        // Calculate stats by type (always show total, not filtered)
        $stats = [
            'follow' => UserActivity::where('type', 'follow')->count(),
            'like_review' => UserActivity::where('type', 'like_review')->count(),
            'comment_review' => UserActivity::where('type', 'comment_review')->count(),
            'watched' => DB::table('ratings')->count(),
            'logged' => DB::table('diaries')->whereNull('review_id')->count(),
            'reviewed' => DB::table('reviews')->where('status', 'published')->count(),
            'watchlist' => DB::table('watchlists')->count(),
        ];
        
        return view('admin.activity.index', compact('activities', 'stats'));
    }
}
