<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ActivityFeedService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function __construct(private readonly ActivityFeedService $activityFeed)
    {
    }

    public function index()
    {
        return view('admin.analytics.index', $this->reportData());
    }

    public function export()
    {
        $data = $this->reportData();

        $filename = 'analytics_' . now()->format('Ymd_Hi') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            $eol = "\r\n";
            $write = function (array $fields) use ($out, $eol) {
                fputcsv($out, $fields, ',', '"', '\\', $eol);
            };

            // Proteksi CSV injection (prefiks apostrof untuk sel AWAL = + - @):
            // DIPAKAI HANYA untuk sel teks yang berasal dari konten buatan user
            // (judul film; pada commit item 5 ditambah username/teks aktivitas/nama).
            // TIDAK dipakai untuk label sistem ("Summary", "No films viewed this week",
            // note "+0.0% from last month"), tanggal, angka, dan persen — semuanya
            // diekstrak mentah apa adanya agar identik dengan tampilan dashboard.
            $guard = function (string $v): string {
                return ($v !== '' && in_array($v[0], ['=', '+', '-', '@'], true)) ? "'" . $v : $v;
            };

            $write(['Moview Analytics Report']);
            $write(['Generated At', now()->format('Y-m-d H:i:s') . ' ' . config('app.timezone')]);
            $write([]);
            $write(['Summary']);
            $write(['Metric', 'Value', 'Note']);
            $write([
                'Total Views',
                $data['totalViews'],
                ($data['viewsChange'] >= 0 ? '+' : '') . number_format($data['viewsChange'], 1) . '% from last month',
            ]);
            $write(['Active Users', $data['activeUsers'], 'Total registered users']);
            $write([
                'Reviews Posted',
                $data['reviewsPosted'],
                ($data['reviewsChange'] >= 0 ? '+' : '') . number_format($data['reviewsChange'], 1) . '% from last month',
            ]);
            $write([]);
            $write(['Top Films This Week']);
            $write(['Rank', 'Title', 'Views', 'Change']);
            if ($data['topFilms']->isEmpty()) {
                $write(['No films viewed this week']);
            } else {
                foreach ($data['topFilms'] as $index => $film) {
                    $write([
                        $index + 1,
                        $guard($film->title),
                        $film->view_count,
                        ($film->change >= 0 ? '+' : '') . number_format($film->change, 0) . '%',
                    ]);
                }
            }
            $write([]);
            $write(['Views Over Time - Last 7 Days']);
            $write(['Date', 'Views']);
            foreach ($data['viewsOverTime'] as $day) {
                $write([$day['iso'], $day['count']]);
            }
            // Recent Activity: sumber data & urutan yang sama dengan widget di atas
            // ($data['recentActivities'] = ActivityFeedService::recent(10)).
            // Sel yang diproteksi: User, Activity, Movie (teks buatan user).
            // Sel yang dikecualikan: Time (sistem) dan sel Summary/Top Films.
            $write([]);
            $write(['Recent Activity']);
            $write(['Time', 'User', 'Activity', 'Movie']);
            foreach ($data['recentActivities'] as $activity) {
                $write([
                    \Carbon\Carbon::parse($activity->created_at)->format('Y-m-d H:i:s'),
                    $guard($activity->user_name),
                    $guard($activity->action),
                    $activity->movie_title !== null && $activity->movie_title !== '' ? $guard($activity->movie_title) : '',
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function reportData(): array
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
                'iso' => $targetDate->format('Y-m-d'),
                'count' => $count
            ];
        }
        
        // Recent Activity (10 terbaru, semua sumber, tanpa batas waktu —
        // ActivityFeedService::recent() juga menjadi sumber bagian CSV export)
        $recentActivities = $this->activityFeed->recent(10);
        
        return [
            'totalViews' => $totalViews,
            'viewsChange' => $viewsChange,
            'activeUsers' => $activeUsers,
            'reviewsPosted' => $reviewsPosted,
            'reviewsChange' => $reviewsChange,
            'topFilms' => $topFilmsWithChange,
            'viewsOverTime' => $viewsOverTime,
            'recentActivities' => $recentActivities
        ];
    }
}
