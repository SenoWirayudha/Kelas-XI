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
                <p class="text-2xl font-bold text-blue-600">1,284</p>
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
                <p class="text-2xl font-bold text-green-600">2,156</p>
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
                <p class="text-2xl font-bold text-purple-600">843</p>
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
                <p class="text-2xl font-bold text-orange-600">1,567</p>
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
                <p class="text-2xl font-bold text-indigo-600">342</p>
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
                <p class="text-2xl font-bold text-pink-600">2,893</p>
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
                <p class="text-2xl font-bold text-cyan-600">1,421</p>
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
                $activities = [
                    [
                        'user' => 'John Doe',
                        'email' => 'john@example.com',
                        'film' => 'Inception',
                        'film_year' => '2010',
                        'action' => 'Like Review',
                        'sub_action' => null,
                        'review_author' => 'Sarah Williams',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 19:40:15',
                        'icon' => 'fa-heart',
                        'color' => 'pink'
                    ],
                    [
                        'user' => 'Jane Smith',
                        'email' => 'jane@example.com',
                        'film' => 'The Shawshank Redemption',
                        'film_year' => '1994',
                        'action' => 'Comment Review',
                        'sub_action' => null,
                        'review_author' => 'David Brown',
                        'comment_text' => 'Great analysis! I totally agree with your perspective.',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 19:25:48',
                        'icon' => 'fa-comment',
                        'color' => 'cyan'
                    ],
                    [
                        'user' => 'Mike Johnson',
                        'email' => 'mike@example.com',
                        'film' => 'Dune',
                        'film_year' => '2021',
                        'action' => 'Like Review',
                        'sub_action' => null,
                        'review_author' => 'Emily Davis',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 18:52:33',
                        'icon' => 'fa-heart',
                        'color' => 'pink'
                    ],
                    [
                        'user' => 'Alex Martinez',
                        'email' => 'alex@example.com',
                        'film' => 'Inception',
                        'film_year' => '2010',
                        'action' => 'Change Poster',
                        'sub_action' => null,
                        'previous_media' => 'https://image.tmdb.org/t/p/w200/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                        'new_media' => 'https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                        'datetime' => '2026-01-21 18:40:15',
                        'icon' => 'fa-image',
                        'color' => 'indigo'
                    ],
                    [
                        'user' => 'Sarah Williams',
                        'email' => 'sarah@example.com',
                        'film' => 'The Dark Knight',
                        'film_year' => '2008',
                        'action' => 'Comment Review',
                        'sub_action' => null,
                        'review_author' => 'John Doe',
                        'comment_text' => "Couldn't have said it better myself!",
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 18:32:11',
                        'icon' => 'fa-comment',
                        'color' => 'cyan'
                    ],
                    [
                        'user' => 'Jane Smith',
                        'email' => 'jane@example.com',
                        'film' => 'Dune',
                        'film_year' => '2021',
                        'action' => 'Change Backdrop',
                        'sub_action' => null,
                        'previous_media' => 'https://image.tmdb.org/t/p/w300/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
                        'new_media' => 'https://image.tmdb.org/t/p/w300/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
                        'datetime' => '2026-01-21 18:15:22',
                        'icon' => 'fa-panorama',
                        'color' => 'indigo'
                    ],
                    [
                        'user' => 'John Doe',
                        'email' => 'john@example.com',
                        'film' => 'The Shawshank Redemption',
                        'film_year' => '1994',
                        'action' => 'Reviewed',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 14:32:15',
                        'icon' => 'fa-star',
                        'color' => 'purple'
                    ],
                    [
                        'user' => 'Jane Smith',
                        'email' => 'jane@example.com',
                        'film' => 'Dune',
                        'film_year' => '2021',
                        'action' => 'Watchlist',
                        'sub_action' => 'Added',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 14:30:22',
                        'icon' => 'fa-list',
                        'color' => 'orange'
                    ],
                    [
                        'user' => 'Mike Johnson',
                        'email' => 'mike@example.com',
                        'film' => 'The Dark Knight',
                        'film_year' => '2008',
                        'action' => 'Change Poster',
                        'sub_action' => null,
                        'previous_media' => 'https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                        'new_media' => 'https://image.tmdb.org/t/p/w200/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg',
                        'datetime' => '2026-01-21 14:22:10',
                        'icon' => 'fa-image',
                        'color' => 'indigo'
                    ],
                    [
                        'user' => 'Jane Smith',
                        'email' => 'jane@example.com',
                        'film' => 'The Godfather',
                        'film_year' => '1972',
                        'action' => 'Watched',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 14:28:42',
                        'icon' => 'fa-eye',
                        'color' => 'blue'
                    ],
                    [
                        'user' => 'Mike Johnson',
                        'email' => 'mike@example.com',
                        'film' => 'Inception',
                        'film_year' => '2010',
                        'action' => 'Logged',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 14:15:33',
                        'icon' => 'fa-bookmark',
                        'color' => 'green'
                    ],
                    [
                        'user' => 'Alex Martinez',
                        'email' => 'alex@example.com',
                        'film' => 'Avatar',
                        'film_year' => '2009',
                        'action' => 'Watchlist',
                        'sub_action' => 'Removed',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 14:05:18',
                        'icon' => 'fa-list',
                        'color' => 'orange'
                    ],
                    [
                        'user' => 'Sarah Williams',
                        'email' => 'sarah@example.com',
                        'film' => 'Interstellar',
                        'film_year' => '2014',
                        'action' => 'Change Backdrop',
                        'sub_action' => null,
                        'previous_media' => 'https://image.tmdb.org/t/p/w300/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
                        'new_media' => 'https://image.tmdb.org/t/p/w300/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
                        'datetime' => '2026-01-21 13:58:21',
                        'icon' => 'fa-panorama',
                        'color' => 'indigo'
                    ],
                    [
                        'user' => 'Sarah Williams',
                        'email' => 'sarah@example.com',
                        'film' => 'The Dark Knight',
                        'film_year' => '2008',
                        'action' => 'Watched',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 13:58:21',
                        'icon' => 'fa-eye',
                        'color' => 'blue'
                    ],
                    [
                        'user' => 'David Brown',
                        'email' => 'david@example.com',
                        'film' => 'Oppenheimer',
                        'film_year' => '2023',
                        'action' => 'Watchlist',
                        'sub_action' => 'Added',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 13:50:12',
                        'icon' => 'fa-list',
                        'color' => 'orange'
                    ],
                    [
                        'user' => 'David Brown',
                        'email' => 'david@example.com',
                        'film' => 'Pulp Fiction',
                        'film_year' => '1994',
                        'action' => 'Reviewed',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 13:45:17',
                        'icon' => 'fa-star',
                        'color' => 'purple'
                    ],
                    [
                        'user' => 'Emily Davis',
                        'email' => 'emily@example.com',
                        'film' => 'The Matrix',
                        'film_year' => '1999',
                        'action' => 'Logged',
                        'sub_action' => null,
                        'previous_media' => null,
                        'datetime' => '2026-01-21 13:22:09',
                        'icon' => 'fa-bookmark',
                        'color' => 'green'
                    ],
                    [
                        'user' => 'Robert Wilson',
                        'email' => 'robert@example.com',
                        'film' => 'Fight Club',
                        'film_year' => '1999',
                        'action' => 'Watched',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 12:58:45',
                        'icon' => 'fa-eye',
                        'color' => 'blue'
                    ],
                    [
                        'user' => 'Lisa Anderson',
                        'email' => 'lisa@example.com',
                        'film' => 'Barbie',
                        'film_year' => '2023',
                        'action' => 'Watchlist',
                        'sub_action' => 'Added',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 12:40:35',
                        'icon' => 'fa-list',
                        'color' => 'orange'
                    ],
                    [
                        'user' => 'Lisa Anderson',
                        'email' => 'lisa@example.com',
                        'film' => 'Forrest Gump',
                        'film_year' => '1994',
                        'action' => 'Logged',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 12:34:52',
                        'icon' => 'fa-bookmark',
                        'color' => 'green'
                    ],
                    [
                        'user' => 'James Taylor',
                        'email' => 'james@example.com',
                        'film' => 'Interstellar',
                        'film_year' => '2014',
                        'action' => 'Reviewed',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 11:47:33',
                        'icon' => 'fa-star',
                        'color' => 'purple'
                    ],
                    [
                        'user' => 'Maria Garcia',
                        'email' => 'maria@example.com',
                        'film' => 'The Lord of the Rings',
                        'film_year' => '2001',
                        'action' => 'Watched',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 11:23:18',
                        'icon' => 'fa-eye',
                        'color' => 'blue'
                    ],
                    [
                        'user' => 'Tom Anderson',
                        'email' => 'tom@example.com',
                        'film' => 'The Batman',
                        'film_year' => '2022',
                        'action' => 'Watchlist',
                        'sub_action' => 'Removed',
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 11:15:44',
                        'icon' => 'fa-list',
                        'color' => 'orange'
                    ],
                    [
                        'user' => 'Tom Anderson',
                        'email' => 'tom@example.com',
                        'film' => 'Gladiator',
                        'film_year' => '2000',
                        'action' => 'Logged',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 10:58:29',
                        'icon' => 'fa-bookmark',
                        'color' => 'green'
                    ],
                    [
                        'user' => 'Amy White',
                        'email' => 'amy@example.com',
                        'film' => 'Titanic',
                        'film_year' => '1997',
                        'action' => 'Reviewed',
                        'sub_action' => null,
                        'previous_media' => null,
                        'new_media' => null,
                        'datetime' => '2026-01-21 10:32:47',
                        'icon' => 'fa-star',
                        'color' => 'purple'
                    ],
                ];
            @endphp
            
            @foreach($activities as $activity)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {{ substr($activity['user'], 0, 1) }}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $activity['user'] }}</div>
                            <div class="text-sm text-gray-500">{{ $activity['email'] }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ $activity['film'] }}</div>
                        <div class="text-xs text-gray-500">{{ $activity['film_year'] }}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-{{ $activity['color'] }}-100 text-{{ $activity['color'] }}-800">
                        <i class="fas {{ $activity['icon'] }} mr-1.5"></i>
                        {{ $activity['action'] }}
                    </span>
                </td>
                <td class="px-6 py-4">
                    @if($activity['action'] === 'Change Poster' || $activity['action'] === 'Change Backdrop')
                        <!-- Media Change Details -->
                        <div class="flex items-center space-x-3">
                            <!-- Previous Media -->
                            <div class="text-center">
                                <img src="{{ $activity['previous_media'] }}" alt="Previous" class="w-16 h-16 object-cover rounded border border-gray-300 mb-1">
                                <p class="text-xs text-gray-500">Previous</p>
                            </div>
                            
                            <!-- Arrow -->
                            <div>
                                <i class="fas fa-arrow-right text-gray-400"></i>
                            </div>
                            
                            <!-- New Media -->
                            <div class="text-center">
                                <img src="{{ $activity['new_media'] }}" alt="New" class="w-16 h-16 object-cover rounded border border-green-500 mb-1">
                                <p class="text-xs text-green-600 font-semibold">New</p>
                            </div>
                        </div>
                    @elseif($activity['action'] === 'Like Review')
                        <!-- Like Review Details -->
                        <div class="text-sm">
                            <span class="text-gray-600">Liked</span>
                            <span class="font-semibold text-gray-900">{{ $activity['review_author'] }}'s</span>
                            <span class="text-gray-600">review</span>
                        </div>
                    @elseif($activity['action'] === 'Comment Review')
                        <!-- Comment Review Details -->
                        <div>
                            <div class="text-sm mb-1">
                                <span class="text-gray-600">Commented on</span>
                                <span class="font-semibold text-gray-900">{{ $activity['review_author'] }}'s</span>
                                <span class="text-gray-600">review</span>
                            </div>
                            @if(isset($activity['comment_text']))
                                <div class="text-xs text-gray-500 italic bg-gray-50 px-2 py-1 rounded border-l-2 border-cyan-400 max-w-md">
                                    "{{ Str::limit($activity['comment_text'], 60) }}"
                                </div>
                            @endif
                        </div>
                    @elseif($activity['sub_action'])
                        <!-- Watchlist Actions -->
                        @if($activity['sub_action'] === 'Added')
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                <i class="fas fa-plus mr-1"></i>
                                {{ $activity['sub_action'] }}
                            </span>
                        @else
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                <i class="fas fa-minus mr-1"></i>
                                {{ $activity['sub_action'] }}
                            </span>
                        @endif
                    @else
                        <span class="text-sm text-gray-400">-</span>
                    @endif
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ date('M d, Y', strtotime($activity['datetime'])) }}</div>
                    <div class="text-xs text-gray-500">{{ date('H:i:s', strtotime($activity['datetime'])) }}</div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing 1 to 23 of 8,547 results</p>
    <div class="flex space-x-2">
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Previous</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">2</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">3</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">...</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">425</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">Next</button>
    </div>
</div>

<!-- Activity Summary -->
<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
            Activity Breakdown
        </h3>
        <div class="space-y-3">
            @php
                $breakdown = [
                    ['type' => 'Logged', 'count' => 2156, 'color' => 'green'],
                    ['type' => 'Watchlist', 'count' => 1567, 'color' => 'orange'],
                    ['type' => 'Watched', 'count' => 1284, 'color' => 'blue'],
                    ['type' => 'Reviewed', 'count' => 843, 'color' => 'purple'],
                    ['type' => 'Media Changes', 'count' => 342, 'color' => 'indigo'],
                ];
            @endphp
                    ['type' => 'Reviewed', 'count' => 843, 'color' => 'purple'],
                ];
            @endphp
            
            @foreach($breakdown as $item)
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-{{ $item['color'] }}-500 rounded-full"></div>
                    <span class="text-sm">{{ $item['type'] }}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-bold">{{ number_format($item['count']) }}</span>
                    <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div class="bg-{{ $item['color'] }}-500 h-2 rounded-full" style="width: {{ ($item['count'] / 2156) * 100 }}%"></div>
                    </div>
                </div>
            </div>
            @endforeach
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-line text-green-600 mr-2"></i>
            Activity Trend (Last 7 Days)
        </h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div class="text-center text-gray-400">
                <i class="fas fa-chart-line text-6xl mb-3"></i>
                <p class="font-medium">Chart Placeholder</p>
                <p class="text-sm">Film status changes over time</p>
            </div>
        </div>
    </div>
</div>
@endsection
