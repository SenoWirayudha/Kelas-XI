@extends('layouts.admin')

@section('title', 'Analytics Dashboard')
@section('page-title', 'Analytics & Reports')
@section('page-subtitle', 'View application statistics and insights')

@section('content')
<!-- Key Metrics -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-blue-100 text-sm mb-1">Total Views</p>
                <p class="text-4xl font-bold">1.2M</p>
                <p class="text-blue-100 text-sm mt-2">
                    <i class="fas fa-arrow-up mr-1"></i>
                    +12.5% from last month
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
                <p class="text-4xl font-bold">8,432</p>
                <p class="text-green-100 text-sm mt-2">
                    <i class="fas fa-arrow-up mr-1"></i>
                    +8.2% from last month
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
                <p class="text-4xl font-bold">342</p>
                <p class="text-purple-100 text-sm mt-2">
                    <i class="fas fa-arrow-down mr-1"></i>
                    -3.1% from last month
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-comment text-3xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-yellow-100 text-sm mb-1">Avg Session</p>
                <p class="text-4xl font-bold">12m</p>
                <p class="text-yellow-100 text-sm mt-2">
                    <i class="fas fa-arrow-up mr-1"></i>
                    +5.7% from last month
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-clock text-3xl"></i>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Views Chart -->
    <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center justify-between">
            <span><i class="fas fa-chart-line text-blue-600 mr-2"></i>Views Over Time</span>
            <select class="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last Year</option>
            </select>
        </h3>
        <div class="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div class="text-center text-gray-400">
                <i class="fas fa-chart-area text-6xl mb-3"></i>
                <p class="font-medium">Chart Placeholder</p>
                <p class="text-sm">Line chart showing views trend</p>
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
            @php
                $topFilms = [
                    ['title' => 'The Shawshank Redemption', 'views' => 12450, 'change' => '+15%'],
                    ['title' => 'The Godfather', 'views' => 10230, 'change' => '+8%'],
                    ['title' => 'The Dark Knight', 'views' => 9870, 'change' => '+22%'],
                    ['title' => 'Inception', 'views' => 8540, 'change' => '+5%'],
                    ['title' => 'Pulp Fiction', 'views' => 7920, 'change' => '-2%'],
                ];
            @endphp
            
            @foreach($topFilms as $index => $film)
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {{ $index + 1 }}
                </div>
                <div class="flex-1">
                    <p class="font-medium text-sm">{{ $film['title'] }}</p>
                    <p class="text-xs text-gray-500">{{ number_format($film['views']) }} views</p>
                </div>
                <span class="text-xs font-semibold {{ str_contains($film['change'], '+') ? 'text-green-600' : 'text-red-600' }}">
                    {{ $film['change'] }}
                </span>
            </div>
            @endforeach
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- User Engagement -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-users-cog text-purple-600 mr-2"></i>
            User Engagement
        </h3>
        <div class="space-y-4">
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Daily Active Users</span>
                    <span class="font-bold">2,345</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style="width: 85%"></div>
                </div>
            </div>
            
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Reviews per Day</span>
                    <span class="font-bold">127</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style="width: 65%"></div>
                </div>
            </div>
            
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Average Rating</span>
                    <span class="font-bold">8.4/10</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full" style="width: 84%"></div>
                </div>
            </div>
            
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">User Retention</span>
                    <span class="font-bold">76%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style="width: 76%"></div>
                </div>
            </div>
        </div>
        
        <div class="mt-6 pt-6 border-t">
            <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p class="text-2xl font-bold text-blue-600">4.2</p>
                    <p class="text-xs text-gray-600">Avg Reviews/User</p>
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-600">18m</p>
                    <p class="text-xs text-gray-600">Avg Time/Session</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Traffic Sources -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-globe text-green-600 mr-2"></i>
            Traffic Sources
        </h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
            <div class="text-center text-gray-400">
                <i class="fas fa-chart-pie text-6xl mb-3"></i>
                <p class="font-medium">Pie Chart Placeholder</p>
                <p class="text-sm">Traffic source distribution</p>
            </div>
        </div>
        <div class="space-y-3">
            @php
                $sources = [
                    ['name' => 'Direct', 'percentage' => 42, 'color' => 'blue'],
                    ['name' => 'Search Engines', 'percentage' => 28, 'color' => 'green'],
                    ['name' => 'Social Media', 'percentage' => 18, 'color' => 'purple'],
                    ['name' => 'Referrals', 'percentage' => 12, 'color' => 'yellow'],
                ];
            @endphp
            
            @foreach($sources as $source)
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-{{ $source['color'] }}-500 rounded-full"></div>
                    <span class="text-sm">{{ $source['name'] }}</span>
                </div>
                <span class="text-sm font-bold">{{ $source['percentage'] }}%</span>
            </div>
            @endforeach
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
        @php
            $activities = [
                ['type' => 'review', 'user' => 'John Doe', 'action' => 'posted a review on', 'target' => 'The Shawshank Redemption', 'time' => '2 minutes ago'],
                ['type' => 'user', 'user' => 'Jane Smith', 'action' => 'joined the platform', 'target' => '', 'time' => '15 minutes ago'],
                ['type' => 'film', 'user' => 'Admin', 'action' => 'added new film', 'target' => 'Inception', 'time' => '1 hour ago'],
                ['type' => 'review', 'user' => 'Mike Johnson', 'action' => 'updated review on', 'target' => 'The Godfather', 'time' => '2 hours ago'],
                ['type' => 'user', 'user' => 'Sarah Williams', 'action' => 'upgraded to Premium', 'target' => '', 'time' => '3 hours ago'],
            ];
        @endphp
        
        @foreach($activities as $activity)
        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-gradient-to-br 
                {{ $activity['type'] === 'review' ? 'from-purple-400 to-purple-600' : 
                   ($activity['type'] === 'user' ? 'from-green-400 to-green-600' : 'from-blue-400 to-blue-600') }}
                rounded-full flex items-center justify-center text-white">
                <i class="fas fa-{{ $activity['type'] === 'review' ? 'star' : ($activity['type'] === 'user' ? 'user' : 'film') }}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm">
                    <span class="font-medium">{{ $activity['user'] }}</span>
                    <span class="text-gray-600"> {{ $activity['action'] }}</span>
                    @if($activity['target'])
                    <span class="font-medium">{{ $activity['target'] }}</span>
                    @endif
                </p>
                <p class="text-xs text-gray-500">{{ $activity['time'] }}</p>
            </div>
        </div>
        @endforeach
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
