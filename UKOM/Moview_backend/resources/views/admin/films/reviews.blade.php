@extends('layouts.admin')

@section('title', 'Reviews - ' . $film['title'])
@section('page-title', 'Reviews & Ratings Overview')
@section('page-subtitle', $film['title'])

@section('content')
<!-- Back Button -->
<div class="mb-6 flex space-x-3">
    <a href="{{ route('admin.films.show', $film['id']) }}" class="text-blue-600 hover:text-blue-800 flex items-center">
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Film
    </a>
    <span class="text-gray-400">|</span>
    <a href="{{ route('admin.films.edit', $film['id']) }}" class="text-indigo-600 hover:text-indigo-800 flex items-center">
        <i class="fas fa-edit mr-2"></i>
        Edit Film Details
    </a>
</div>

<!-- Film Info Banner -->
<div class="bg-white rounded-lg shadow mb-6 p-4 flex items-center space-x-4">
    <img src="{{ $film['poster'] }}" alt="{{ $film['title'] }}" class="w-16 h-24 object-cover rounded">
    <div class="flex-1">
        <h3 class="text-xl font-bold">{{ $film['title'] }}</h3>
        <p class="text-gray-600">{{ $film['year'] }} • {{ implode(', ', $film['genres']) }}</p>
    </div>
    <div class="text-right">
        <div class="flex items-center justify-end mb-1">
            <i class="fas fa-star text-yellow-400 text-3xl mr-2"></i>
            <span class="text-4xl font-bold">{{ $film['rating_average'] }}</span>
            <span class="text-gray-500 ml-1">/10</span>
        </div>
        <p class="text-sm text-gray-600">{{ number_format($film['total_reviews']) }} reviews</p>
    </div>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Average Rating</p>
                <p class="text-3xl font-bold text-yellow-600">{{ $film['rating_average'] }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
                <i class="fas fa-star text-yellow-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Reviews</p>
                <p class="text-3xl font-bold text-blue-600">{{ number_format($film['total_reviews']) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-comments text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Pending Moderation</p>
                <p class="text-3xl font-bold text-orange-600">12</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-full">
                <i class="fas fa-clock text-orange-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Flagged Reviews</p>
                <p class="text-3xl font-bold text-red-600">3</p>
            </div>
            <div class="bg-red-100 p-3 rounded-full">
                <i class="fas fa-flag text-red-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Rating Distribution -->
    <div class="lg:col-span-1 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6 flex items-center">
            <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
            Rating Distribution
        </h2>
        
        <div class="space-y-3">
            @foreach(range(10, 1) as $rating)
            @php
                $percentage = $ratingDistribution[$rating] ?? 0;
            @endphp
            <div class="flex items-center space-x-3">
                <span class="text-sm font-medium w-8">{{ $rating }}</span>
                <i class="fas fa-star text-yellow-400 text-xs"></i>
                <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all" 
                         style="width: {{ $percentage }}%"></div>
                </div>
                <span class="text-sm text-gray-600 w-12 text-right">{{ number_format($percentage, 1) }}%</span>
            </div>
            @endforeach
        </div>

        <div class="mt-6 pt-6 border-t">
            <h3 class="font-semibold mb-3">Review Summary</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Excellent (9-10):</span>
                    <span class="font-bold text-green-600">85%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Good (7-8):</span>
                    <span class="font-bold text-blue-600">13%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Average (5-6):</span>
                    <span class="font-bold text-yellow-600">1.5%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Poor (1-4):</span>
                    <span class="font-bold text-red-600">0.5%</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Reviews List -->
    <div class="lg:col-span-2 space-y-6">
        <!-- Filter & Search -->
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex flex-wrap gap-3">
                <div class="flex-1 min-w-[200px]">
                    <input type="text" placeholder="Search reviews..." 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Reviews</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Flagged</option>
                </select>
                <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sort: Latest</option>
                    <option>Sort: Highest Rating</option>
                    <option>Sort: Lowest Rating</option>
                    <option>Sort: Most Helpful</option>
                </select>
            </div>
        </div>

        <!-- Reviews -->
        <div class="space-y-4">
            @foreach($reviews as $review)
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {{ substr($review['user'], 0, 1) }}
                        </div>
                        <div>
                            <p class="font-bold">{{ $review['user'] }}</p>
                            <p class="text-sm text-gray-500">{{ date('M d, Y', strtotime($review['date'])) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                            <i class="fas fa-star text-yellow-500 mr-1"></i>
                            <span class="font-bold text-yellow-700">{{ $review['rating'] }}/10</span>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-700 mb-4">{{ $review['comment'] }}</p>
                
                <div class="flex items-center justify-between pt-3 border-t">
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <button class="flex items-center space-x-1 hover:text-green-600" onclick="alert('Helpful action (UI only)')">
                            <i class="fas fa-thumbs-up"></i>
                            <span>{{ rand(10, 100) }}</span>
                        </button>
                        <button class="flex items-center space-x-1 hover:text-red-600" onclick="alert('Not helpful action (UI only)')">
                            <i class="fas fa-thumbs-down"></i>
                            <span>{{ rand(0, 10) }}</span>
                        </button>
                        <button class="flex items-center space-x-1 hover:text-blue-600" onclick="alert('Reply action (UI only)')">
                            <i class="fas fa-reply"></i>
                            <span>Reply</span>
                        </button>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button class="text-green-600 hover:text-green-800 px-3 py-1 text-sm" title="Approve" onclick="alert('Approve review (UI only)')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="text-yellow-600 hover:text-yellow-800 px-3 py-1 text-sm" title="Flag" onclick="alert('Flag review (UI only)')">
                            <i class="fas fa-flag"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 px-3 py-1 text-sm" title="Delete" onclick="if(confirm('Delete this review?')) alert('Deleted (UI only)')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            @endforeach
        </div>

        <!-- Load More -->
        <div class="text-center">
            <button class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" onclick="alert('Load more (UI only)')">
                <i class="fas fa-chevron-down mr-2"></i>
                Load More Reviews
            </button>
        </div>
    </div>
</div>

<!-- Review Analytics (Additional Section) -->
<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-line text-green-600 mr-2"></i>
            Review Trends
        </h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div class="text-center text-gray-400">
                <i class="fas fa-chart-area text-6xl mb-3"></i>
                <p>Chart Placeholder</p>
                <p class="text-sm">Reviews over time graph</p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-tags text-purple-600 mr-2"></i>
            Common Keywords
        </h3>
        <div class="flex flex-wrap gap-2">
            @foreach(['masterpiece', 'excellent', 'great acting', 'emotional', 'must watch', 'brilliant', 'compelling', 'powerful', 'outstanding', 'classic', 'unforgettable', 'inspiring'] as $keyword)
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {{ $keyword }}
            </span>
            @endforeach
        </div>
        <div class="mt-6 pt-6 border-t">
            <h4 class="font-semibold mb-3">Sentiment Analysis</h4>
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Positive</span>
                    <div class="flex items-center space-x-2">
                        <div class="w-32 bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 92%"></div>
                        </div>
                        <span class="text-sm font-bold">92%</span>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Neutral</span>
                    <div class="flex items-center space-x-2">
                        <div class="w-32 bg-gray-200 rounded-full h-2">
                            <div class="bg-gray-500 h-2 rounded-full" style="width: 6%"></div>
                        </div>
                        <span class="text-sm font-bold">6%</span>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Negative</span>
                    <div class="flex items-center space-x-2">
                        <div class="w-32 bg-gray-200 rounded-full h-2">
                            <div class="bg-red-500 h-2 rounded-full" style="width: 2%"></div>
                        </div>
                        <span class="text-sm font-bold">2%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Bulk Actions -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-tasks text-indigo-600 mr-2"></i>
        Bulk Actions
    </h3>
    <div class="flex flex-wrap gap-3">
        <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" onclick="alert('Approve all pending (UI only)')">
            <i class="fas fa-check-double mr-2"></i>
            Approve All Pending
        </button>
        <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg" onclick="alert('Export reviews (UI only)')">
            <i class="fas fa-download mr-2"></i>
            Export Reviews
        </button>
        <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg" onclick="if(confirm('Delete all flagged?')) alert('Deleted (UI only)')">
            <i class="fas fa-trash-alt mr-2"></i>
            Delete All Flagged
        </button>
    </div>
</div>
@endsection
