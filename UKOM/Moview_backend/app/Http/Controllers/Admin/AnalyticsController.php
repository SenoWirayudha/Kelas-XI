<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index()
    {
        // Total Views (from ratings table - each rating means user watched)
        $totalViews = DB::table('ratings')->count();
        
        // Views last month for comparison
        $lastMonthViews = DB::table('ratings')
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth()
            ])
            ->count();
        
        $currentMonthViews = DB::table('ratings')
            ->whereBetween('created_at', [
                Carbon::now()->startOfMonth(),
                Carbon::now()
            ])
            ->count();
        
        // Calculate percentage change for views
        $viewsChange = 0;
        if ($lastMonthViews > 0) {
            $viewsChange = (($currentMonthViews - $lastMonthViews) / $lastMonthViews) * 100;
        }
        
        // Active Users (total users in system, excluding admin)
        $activeUsers = DB::table('users')
            ->where('role', '!=', 'admin')
            ->count();
        
        // Reviews Posted
        $reviewsPosted = DB::table('reviews')
            ->where('status', 'published')
            ->count();
        
        // Reviews last month for comparison
        $lastMonthReviews = DB::table('reviews')
            ->where('status', 'published')
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth()
            ])
            ->count();
        
        $currentMonthReviews = DB::table('reviews')
            ->where('status', 'published')
            ->whereBetween('created_at', [
                Carbon::now()->startOfMonth(),
                Carbon::now()
            ])
            ->count();
        
        // Calculate percentage change for reviews
        $reviewsChange = 0;
        if ($lastMonthReviews > 0) {
            $reviewsChange = (($currentMonthReviews - $lastMonthReviews) / $lastMonthReviews) * 100;
        }
        
        // Top Films This Week (based on ratings count - most viewed)
        $topFilms = DB::table('ratings')
            ->join('movies', 'ratings.film_id', '=', 'movies.id')
            ->select(
                'movies.id',
                'movies.title',
                DB::raw('COUNT(*) as view_count')
            )
            ->whereBetween('ratings.created_at', [
                Carbon::now()->subWeek(),
                Carbon::now()
            ])
            ->groupBy('movies.id', 'movies.title')
            ->orderBy('view_count', 'desc')
            ->limit(5)
            ->get();
        
        // Calculate percentage change for each film (compare with previous week)
        $topFilmsWithChange = $topFilms->map(function($film) {
            // Use the view_count already calculated from the main query
            $currentWeekViews = $film->view_count;
            
            $previousWeekViews = DB::table('ratings')
                ->where('film_id', $film->id)
                ->whereBetween('created_at', [
                    Carbon::now()->subWeeks(2),
                    Carbon::now()->subWeek()
                ])
                ->count();
            
            $change = 0;
            if ($previousWeekViews > 0) {
                $change = (($currentWeekViews - $previousWeekViews) / $previousWeekViews) * 100;
            } elseif ($currentWeekViews > 0) {
                $change = 100; // New entry
            }
            
            $film->change = $change;
            return $film;
        });
        
        // Views Over Time (last 7 days)
        $viewsOverTime = [];
        for ($i = 6; $i >= 0; $i--) {
            $targetDate = Carbon::now()->subDays($i);
            $count = DB::table('ratings')
                ->whereDate('created_at', $targetDate->format('Y-m-d'))
                ->count();
            $viewsOverTime[] = [
                'date' => $targetDate->format('M d'),
                'count' => $count
            ];
        }
        
        // Recent Activity (last 10 activities from user_activities in last 24 hours: follow, like_review, comment_review)
        $recentActivities = DB::table('user_activities')
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
            ->whereIn('user_activities.type', ['follow', 'like_review', 'comment_review'])
            ->where('user_activities.created_at', '>=', Carbon::now()->subDay())
            ->orderBy('user_activities.created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($activity) {
                $activity->meta = json_decode($activity->meta, true);
                return $activity;
            });
        
        return view('admin.analytics.index', [
            'totalViews' => $totalViews,
            'viewsChange' => $viewsChange,
            'activeUsers' => $activeUsers,
            'reviewsPosted' => $reviewsPosted,
            'reviewsChange' => $reviewsChange,
            'topFilms' => $topFilmsWithChange,
            'viewsOverTime' => $viewsOverTime,
            'recentActivities' => $recentActivities
        ]);
    }
}
