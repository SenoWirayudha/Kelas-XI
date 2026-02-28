@extends('layouts.admin')

@section('title', 'Analytics Dashboard')
@section('page-title', 'Analytics & Reports')
@section('page-subtitle', 'View application statistics and insights')

@section('content')
<!-- Key Metrics -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-blue-100 text-sm mb-1">Total Views</p>
                <p class="text-4xl font-bold">{{ number_format($totalViews) }}</p>
                <p class="text-blue-100 text-sm mt-2">
                    @if($viewsChange >= 0)
                        <i class="fas fa-arrow-up mr-1"></i>
                        +{{ number_format($viewsChange, 1) }}% from last month
                    @else
                        <i class="fas fa-arrow-down mr-1"></i>
                        {{ number_format($viewsChange, 1) }}% from last month
                    @endif
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-eye text-3xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-green-100 text-sm mb-1">Active Users</p>
                <p class="text-4xl font-bold">{{ number_format($activeUsers) }}</p>
                <p class="text-green-100 text-sm mt-2">
                    <i class="fas fa-check-circle mr-1"></i>
                    Total registered users
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-users text-3xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-purple-100 text-sm mb-1">Reviews Posted</p>
                <p class="text-4xl font-bold">{{ number_format($reviewsPosted) }}</p>
                <p class="text-purple-100 text-sm mt-2">
                    @if($reviewsChange >= 0)
                        <i class="fas fa-arrow-up mr-1"></i>
                        +{{ number_format($reviewsChange, 1) }}% from last month
                    @else
                        <i class="fas fa-arrow-down mr-1"></i>
                        {{ number_format($reviewsChange, 1) }}% from last month
                    @endif
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-comment text-3xl"></i>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Views Chart -->
    <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-line text-blue-600 mr-2"></i>
            Views Over Time - Last 7 Days
        </h3>
        <div class="h-80">
            @php
                // Get max count for scaling
                $counts = array_column($viewsOverTime, 'count');
                $maxCount = max($counts);
                if ($maxCount == 0) $maxCount = 1; // Prevent division by zero
            @endphp
            <div class="h-full flex items-end justify-between space-x-2 pb-6">
                @foreach($viewsOverTime as $day)
                @php
                    if ($day['count'] == 0) {
                        $heightPercent = 2;
                        $opacity = 'opacity-20';
                    } else {
                        // Pure proportional scaling: higher values = taller bars
                        $heightPercent = ($day['count'] / $maxCount) * 90;
                        $opacity = '';
                    }
                @endphp
                <div class="flex-1 flex flex-col items-center justify-end" style="height: 100%;">
                    <div class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all duration-200 relative group {{ $opacity }}" 
                         style="height: {{ $heightPercent }}%;">
                        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {{ $day['count'] }} {{ $day['count'] == 1 ? 'view' : 'views' }}
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-2">{{ $day['date'] }}</p>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    
    <!-- Top Films -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-fire text-orange-600 mr-2"></i>
            Top Films This Week
        </h3>
        <div class="space-y-4">
            @forelse($topFilms as $index => $film)
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {{ $index + 1 }}
                </div>
                <div class="flex-1">
                    <p class="font-medium text-sm">{{ $film->title }}</p>
                    <p class="text-xs text-gray-500">{{ $film->view_count }} {{ $film->view_count == 1 ? 'view' : 'views' }}</p>
                </div>
                <span class="text-xs font-semibold {{ $film->change >= 0 ? 'text-green-600' : 'text-red-600' }}">
                    {{ $film->change >= 0 ? '+' : '' }}{{ number_format($film->change, 0) }}%
                </span>
            </div>
            @empty
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-film text-4xl mb-2"></i>
                <p class="text-sm">No films viewed this week</p>
            </div>
            @endforelse
        </div>
    </div>
</div>

<!-- Recent Activity -->
<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center">
        <i class="fas fa-history text-indigo-600 mr-2"></i>
        Recent Activity
    </h3>
    <div class="space-y-3">
        @forelse($recentActivities as $activity)
        @php
            $iconColor = $activity->type === 'follow' ? 'blue' : 
                         ($activity->type === 'like_review' ? 'pink' : 'cyan');
            $icon = $activity->type === 'follow' ? 'user-plus' : 
                    ($activity->type === 'like_review' ? 'heart' : 'comment');
            
            // Get target user for follow activity
            $targetUser = null;
            if ($activity->type === 'follow' && isset($activity->meta['followed_user_id'])) {
                $targetUser = DB::table('users')->where('id', $activity->meta['followed_user_id'])->first();
            }
            
            // Get review details for like/comment activities
            $reviewData = null;
            if (($activity->type === 'like_review' || $activity->type === 'comment_review') && isset($activity->meta['review_id'])) {
                $reviewData = DB::table('reviews')
                    ->join('users', 'reviews.user_id', '=', 'users.id')
                    ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                    ->join('movies', 'reviews.film_id', '=', 'movies.id')
                    ->where('reviews.id', $activity->meta['review_id'])
                    ->select('users.username', 'user_profiles.display_name', 'movies.title as movie_title', 'reviews.rating')
                    ->first();
            }
        @endphp
        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-gradient-to-br from-{{ $iconColor }}-400 to-{{ $iconColor }}-600 rounded-full flex items-center justify-center text-white">
                <i class="fas fa-{{ $icon }}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm">
                    <span class="font-medium">{{ $activity->user_name }}</span>
                    @if($activity->type === 'follow' && $targetUser)
                        <span class="text-gray-600"> followed </span>
                        <span class="font-medium">{{ $targetUser->username }}</span>
                    @elseif($activity->type === 'like_review' && $reviewData)
                        <span class="text-gray-600"> liked </span>
                        <span class="font-medium">{{ $reviewData->display_name ?? $reviewData->username }}</span>
                        <span class="text-gray-600">'s review on </span>
                        <span class="font-medium">{{ $reviewData->movie_title }}</span>
                    @elseif($activity->type === 'comment_review' && $reviewData)
                        <span class="text-gray-600"> commented on </span>
                        <span class="font-medium">{{ $reviewData->display_name ?? $reviewData->username }}</span>
                        <span class="text-gray-600">'s review on </span>
                        <span class="font-medium">{{ $reviewData->movie_title }}</span>
                    @else
                        <span class="text-gray-600"> {{ str_replace('_', ' ', $activity->type) }}</span>
                    @endif
                </p>
                <p class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($activity->created_at)->diffForHumans() }}</p>
            </div>
        </div>
        @empty
        <div class="text-center text-gray-400 py-8">
            <i class="fas fa-history text-4xl mb-2"></i>
            <p class="text-sm">No recent activity</p>
        </div>
        @endforelse
    </div>
</div>

<!-- Export Options -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-download text-blue-600 mr-2"></i>
        Export Reports
    </h3>
    <div class="flex flex-wrap gap-3">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg" onclick="alert('Export to PDF (UI only)')">
            <i class="fas fa-file-pdf mr-2"></i>
            Export PDF
        </button>
        <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg" onclick="alert('Export to Excel (UI only)')">
            <i class="fas fa-file-excel mr-2"></i>
            Export Excel
        </button>
        <button class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg" onclick="alert('Export to CSV (UI only)')">
            <i class="fas fa-file-csv mr-2"></i>
            Export CSV
        </button>
        <button class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg" onclick="alert('Schedule report (UI only)')">
            <i class="fas fa-calendar mr-2"></i>
            Schedule Report
        </button>
    </div>
</div>
@endsection
