@extends('layouts.admin')

@section('title', 'Film Activity Log')
@section('page-title', 'Film Activity Log')
@section('page-subtitle', 'Monitor user activities (Film Status, Watchlist, Media, Social Interactions)'))

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Watched</p>
                <p class="text-2xl font-bold text-blue-600">{{ number_format($stats['watched']) }}</p>
            </div>
            <div class="bg-blue-100 p-2 rounded-full">
                <i class="fas fa-eye text-blue-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Logged</p>
                <p class="text-2xl font-bold text-green-600">{{ number_format($stats['logged']) }}</p>
            </div>
            <div class="bg-green-100 p-2 rounded-full">
                <i class="fas fa-bookmark text-green-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Reviewed</p>
                <p class="text-2xl font-bold text-purple-600">{{ number_format($stats['reviewed']) }}</p>
            </div>
            <div class="bg-purple-100 p-2 rounded-full">
                <i class="fas fa-star text-purple-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Watchlist</p>
                <p class="text-2xl font-bold text-orange-600">{{ number_format($stats['watchlist']) }}</p>
            </div>
            <div class="bg-orange-100 p-2 rounded-full">
                <i class="fas fa-list text-orange-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Media</p>
                <p class="text-2xl font-bold text-indigo-600">{{ number_format($stats['media']) }}</p>
            </div>
            <div class="bg-indigo-100 p-2 rounded-full">
                <i class="fas fa-images text-indigo-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Likes</p>
                <p class="text-2xl font-bold text-pink-600">{{ number_format($stats['likes']) }}</p>
            </div>
            <div class="bg-pink-100 p-2 rounded-full">
                <i class="fas fa-heart text-pink-600 text-lg"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-xs">Comments</p>
                <p class="text-2xl font-bold text-cyan-600">{{ number_format($stats['comments']) }}</p>
            </div>
            <div class="bg-cyan-100 p-2 rounded-full">
                <i class="fas fa-comment text-cyan-600 text-lg"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
            <div class="relative">
                <input type="text" placeholder="Search by user..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Activities</option>
            <option>Watched</option>
            <option>Logged</option>
            <option>Reviewed</option>
            <option>Watchlist</option>
            <option>Change Poster</option>
            <option>Change Backdrop</option>
            <option>Like Review</option>
            <option>Comment Review</option>
        </select>
        <input type="text" placeholder="Search by film..." 
               class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>All Time</option>
        </select>
    </div>
</div>

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
                        'watched' => ['icon' => 'fa-eye', 'color' => 'blue'],
                        'logged' => ['icon' => 'fa-bookmark', 'color' => 'green'],
                        'reviewed' => ['icon' => 'fa-star', 'color' => 'purple'],
                        'watchlist' => ['icon' => 'fa-list', 'color' => 'orange'],
                        'media' => ['icon' => 'fa-image', 'color' => 'indigo'],
                        'like' => ['icon' => 'fa-heart', 'color' => 'pink'],
                        'comment' => ['icon' => 'fa-comment', 'color' => 'cyan'],
                    ];
                    return $styles[$type] ?? ['icon' => 'fa-circle', 'color' => 'gray'];
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
                            {{ $activity->user ? substr($activity->user->username, 0, 1) : '?' }}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $activity->user->username ?? 'Unknown' }}</div>
                            <div class="text-sm text-gray-500">{{ $activity->user->email ?? 'N/A' }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ $activity->movie->title ?? 'Unknown Film' }}</div>
                        <div class="text-xs text-gray-500">{{ $activity->movie->release_year ?? 'N/A' }}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-{{ $style['color'] }}-100 text-{{ $style['color'] }}-800">
                        <i class="fas {{ $style['icon'] }} mr-1.5"></i>
                        {{ ucfirst($activity->type) }}
                    </span>
                </td>
                <td class="px-6 py-4">
                    @if(isset($meta['action']))
                        <span class="text-sm text-gray-600">{{ $meta['action'] }}</span>
                    @elseif(isset($meta['comment']))
                        <div class="text-xs text-gray-500 italic bg-gray-50 px-2 py-1 rounded border-l-2 border-cyan-400 max-w-md">
                            "{{ Str::limit($meta['comment'], 60) }}"
                        </div>
                    @else
                        <span class="text-sm text-gray-400">-</span>
                    @endif
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ $activity->created_at->format('M d, Y') }}</div>
                    <div class="text-xs text-gray-500">{{ $activity->created_at->format('H:i:s') }}</div>
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
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing {{ $activities->count() }} activities</p>
</div>
@endsection
