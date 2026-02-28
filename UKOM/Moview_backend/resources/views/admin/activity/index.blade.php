@extends('layouts.admin')

@section('title', 'User Activity Log')
@section('page-title', 'User Activity Log')
@section('page-subtitle', 'Monitor all user activities'))

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-blue-100 p-3 rounded-full mb-2">
                <i class="fas fa-user-plus text-blue-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Follow</p>
            <p class="text-2xl font-bold text-blue-600">{{ number_format($stats['follow']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-pink-100 p-3 rounded-full mb-2">
                <i class="fas fa-heart text-pink-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Like Review</p>
            <p class="text-2xl font-bold text-pink-600">{{ number_format($stats['like_review']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-cyan-100 p-3 rounded-full mb-2">
                <i class="fas fa-comment text-cyan-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Comment Review</p>
            <p class="text-2xl font-bold text-cyan-600">{{ number_format($stats['comment_review']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-green-100 p-3 rounded-full mb-2">
                <i class="fas fa-eye text-green-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Watched</p>
            <p class="text-2xl font-bold text-green-600">{{ number_format($stats['watched']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-purple-100 p-3 rounded-full mb-2">
                <i class="fas fa-book text-purple-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Logged</p>
            <p class="text-2xl font-bold text-purple-600">{{ number_format($stats['logged']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-yellow-100 p-3 rounded-full mb-2">
                <i class="fas fa-star text-yellow-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Reviewed</p>
            <p class="text-2xl font-bold text-yellow-600">{{ number_format($stats['reviewed']) }}</p>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col items-center justify-center">
            <div class="bg-orange-100 p-3 rounded-full mb-2">
                <i class="fas fa-bookmark text-orange-600 text-xl"></i>
            </div>
            <p class="text-gray-500 text-xs mb-1">Watchlist</p>
            <p class="text-2xl font-bold text-orange-600">{{ number_format($stats['watchlist']) }}</p>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <form method="GET" action="{{ route('admin.activity.index') }}" id="filterForm">
        <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
                <div class="relative">
                    <input type="text" 
                           name="user_search" 
                           value="{{ request('user_search') }}"
                           placeholder="Search by user..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
            </div>
            <select name="activity_type" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="">All Activities</option>
                <option value="follow" {{ request('activity_type') == 'follow' ? 'selected' : '' }}>Follow</option>
                <option value="like_review" {{ request('activity_type') == 'like_review' ? 'selected' : '' }}>Like Review</option>
                <option value="comment_review" {{ request('activity_type') == 'comment_review' ? 'selected' : '' }}>Comment Review</option>
                <option value="watched" {{ request('activity_type') == 'watched' ? 'selected' : '' }}>Watched</option>
                <option value="logged" {{ request('activity_type') == 'logged' ? 'selected' : '' }}>Logged</option>
                <option value="reviewed" {{ request('activity_type') == 'reviewed' ? 'selected' : '' }}>Reviewed</option>
                <option value="watchlist" {{ request('activity_type') == 'watchlist' ? 'selected' : '' }}>Watchlist</option>
            </select>
            <input type="text" 
                   name="film_search" 
                   value="{{ request('film_search') }}"
                   placeholder="Search by film..." 
                   class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <select name="time_range" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="all" {{ request('time_range', 'all') == 'all' ? 'selected' : '' }}>All Time</option>
                <option value="24h" {{ request('time_range') == '24h' ? 'selected' : '' }}>Last 24 Hours</option>
                <option value="7d" {{ request('time_range') == '7d' ? 'selected' : '' }}>Last 7 Days</option>
                <option value="30d" {{ request('time_range') == '30d' ? 'selected' : '' }}>Last 30 Days</option>
            </select>
            <button type="submit" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-filter mr-2"></i>Filter
            </button>
            @if(request()->hasAny(['user_search', 'activity_type', 'film_search', 'time_range']))
                <a href="{{ route('admin.activity.index') }}" 
                   class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <i class="fas fa-times mr-2"></i>Clear
                </a>
            @endif
        </div>
    </form>
</div>

<!-- Active Filters Display -->
@if(request()->hasAny(['user_search', 'activity_type', 'film_search', 'time_range']))
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-center flex-wrap gap-2">
        <span class="text-sm font-semibold text-blue-900">
            <i class="fas fa-filter mr-1"></i>Active Filters:
        </span>
        @if(request('user_search'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                User: {{ request('user_search') }}
                <a href="{{ request()->fullUrlWithQuery(['user_search' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('activity_type'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Type: {{ ucwords(str_replace('_', ' ', request('activity_type'))) }}
                <a href="{{ request()->fullUrlWithQuery(['activity_type' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('film_search'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Film: {{ request('film_search') }}
                <a href="{{ request()->fullUrlWithQuery(['film_search' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('time_range') && request('time_range') != 'all')
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Time: 
                @if(request('time_range') == '24h') Last 24 Hours
                @elseif(request('time_range') == '7d') Last 7 Days
                @elseif(request('time_range') == '30d') Last 30 Days
                @endif
                <a href="{{ request()->fullUrlWithQuery(['time_range' => 'all']) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        <span class="text-sm text-blue-700 ml-auto">
            Showing {{ $activities->total() }} result{{ $activities->total() != 1 ? 's' : '' }}
        </span>
    </div>
</div>
@endif

<!-- Activity Table -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Film</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @php
                // Helper function to get activity icon and color
                function getActivityStyle($type) {
                    $styles = [
                        'follow' => ['icon' => 'fa-user-plus', 'color' => 'blue'],
                        'like_review' => ['icon' => 'fa-heart', 'color' => 'pink'],
                        'comment_review' => ['icon' => 'fa-comment', 'color' => 'cyan'],
                        'watched' => ['icon' => 'fa-eye', 'color' => 'green'],
                        'logged' => ['icon' => 'fa-book', 'color' => 'purple'],
                        'reviewed' => ['icon' => 'fa-star', 'color' => 'yellow'],
                        'watchlist' => ['icon' => 'fa-bookmark', 'color' => 'orange'],
                    ];
                    return $styles[$type] ?? ['icon' => 'fa-circle', 'color' => 'gray'];
                }
                
                // Format activity type for display
                function formatActivityType($type) {
                    $names = [
                        'follow' => 'Follow',
                        'like_review' => 'Like Review',
                        'comment_review' => 'Comment Review',
                        'watched' => 'Watched',
                        'logged' => 'Logged',
                        'reviewed' => 'Reviewed',
                        'watchlist' => 'Watchlist',
                    ];
                    return $names[$type] ?? ucfirst($type);
                }
            @endphp
            
            @forelse($activities as $activity)
            @php
                $style = getActivityStyle($activity->type);
                $meta = $activity->meta ?? [];
            @endphp
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {{ substr($activity->user_name, 0, 1) }}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $activity->user_name }}</div>
                            <div class="text-sm text-gray-500">{{ $activity->user_email }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    @if($activity->type === 'follow')
                        <span class="text-sm text-gray-400 italic">N/A</span>
                    @else
                        <div>
                            <div class="text-sm font-medium text-gray-900">{{ $activity->movie_title ?? 'Unknown Film' }}</div>
                            <div class="text-xs text-gray-500">{{ $activity->release_year ?? 'N/A' }}</div>
                        </div>
                    @endif
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-{{ $style['color'] }}-100 text-{{ $style['color'] }}-800">
                        <i class="fas {{ $style['icon'] }} mr-1.5"></i>
                        {{ formatActivityType($activity->type) }}
                    </span>
                </td>
                <td class="px-6 py-4">
                    @if($activity->type === 'follow')
                        @php
                            $targetUser = isset($meta['followed_user_id']) ? \App\Models\User::find($meta['followed_user_id']) : null;
                        @endphp
                        @if($targetUser)
                            <div class="flex items-center">
                                <div class="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                    {{ substr($targetUser->username, 0, 1) }}
                                </div>
                                <span class="text-sm font-medium text-gray-900">{{ $targetUser->username }}</span>
                            </div>
                        @else
                            <span class="text-sm text-gray-400">-</span>
                        @endif
                    @elseif($activity->type === 'like_review' || $activity->type === 'comment_review')
                        @php
                            $reviewId = $meta['review_id'] ?? null;
                            $review = null;
                            if ($reviewId) {
                                $review = DB::table('reviews')
                                    ->join('users', 'reviews.user_id', '=', 'users.id')
                                    ->leftJoin('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                                    ->join('movies', 'reviews.film_id', '=', 'movies.id')
                                    ->where('reviews.id', $reviewId)
                                    ->select(
                                        'reviews.id',
                                        'reviews.rating',
                                        'users.username',
                                        'user_profiles.display_name',
                                        'movies.title as movie_title'
                                    )
                                    ->first();
                            }
                        @endphp
                        @if($review)
                            <div class="bg-gray-50 px-3 py-2 rounded border-l-2 border-{{ $style['color'] }}-400 max-w-md">
                                <div class="flex items-center mb-1">
                                    <span class="text-xs font-semibold text-gray-700 mr-2">Review by:</span>
                                    <span class="text-xs text-gray-900">{{ $review->display_name ?? $review->username }}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-yellow-500 text-xs mr-2">{{ str_repeat('★', (int)$review->rating) }}</span>
                                    <span class="text-xs text-gray-600">{{ $review->movie_title }}</span>
                                </div>
                            </div>
                        @else
                            <span class="text-sm text-gray-400">-</span>
                        @endif
                    @elseif($activity->type === 'watched')
                        @if($activity->rating)
                            <div class="flex items-center">
                                <span class="text-yellow-500 text-base mr-2">
                                    @for($i = 1; $i <= 5; $i++)
                                        @if($i <= $activity->rating)
                                            ★
                                        @else
                                            ☆
                                        @endif
                                    @endfor
                                </span>
                                <span class="text-sm text-gray-600">({{ number_format($activity->rating, 1) }}/5)</span>
                            </div>
                        @else
                            <span class="text-sm text-gray-400">No rating</span>
                        @endif
                    @elseif($activity->type === 'reviewed')
                        @if($activity->review_content)
                            <div class="bg-yellow-50 px-3 py-2 rounded border-l-2 border-yellow-400 max-w-md">
                                @if($activity->rating)
                                    <div class="flex items-center mb-1">
                                        <span class="text-yellow-500 text-sm">
                                            {{ str_repeat('★', (int)$activity->rating) }}{{ str_repeat('☆', 5 - (int)$activity->rating) }}
                                        </span>
                                        <span class="text-xs text-gray-600 ml-2">({{ number_format($activity->rating, 1) }}/5)</span>
                                    </div>
                                @endif
                                <p class="text-xs text-gray-700 leading-relaxed">
                                    {{ Str::limit($activity->review_content, 100) }}
                                </p>
                            </div>
                        @else
                            <span class="text-sm text-gray-400">No content</span>
                        @endif
                    @elseif(in_array($activity->type, ['logged', 'watchlist']))
                        <span class="text-sm text-gray-600">{{ formatActivityType($activity->type) }} film</span>
                    @elseif(isset($meta['action']))
                        <span class="text-sm text-gray-600">{{ $meta['action'] }}</span>
                    @else
                        <span class="text-sm text-gray-400">-</span>
                    @endif
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ \Carbon\Carbon::parse($activity->created_at)->format('M d, Y') }}</div>
                    <div class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($activity->created_at)->format('H:i:s') }}</div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>No activities found</p>
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            Showing {{ $activities->firstItem() ?? 0 }} to {{ $activities->lastItem() ?? 0 }} of {{ $activities->total() }} activities
        </p>
        <div>
            {{ $activities->links() }}
        </div>
    </div>
</div>
@endsection
