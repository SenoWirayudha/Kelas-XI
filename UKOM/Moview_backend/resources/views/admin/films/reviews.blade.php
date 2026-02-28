@extends('layouts.admin')

@section('title', 'Reviews - ' . $movie->title)
@section('page-title', 'Reviews & Ratings Overview')
@section('page-subtitle', $movie->title)

@section('content')
<!-- Back Button -->
<div class="mb-6 flex space-x-3">
    <a href="{{ route('admin.films.show', $movie->id) }}" class="text-blue-600 hover:text-blue-800 flex items-center">
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Film
    </a>
    <span class="text-gray-400">|</span>
    <a href="{{ route('admin.films.edit', $movie->id) }}" class="text-indigo-600 hover:text-indigo-800 flex items-center">
        <i class="fas fa-edit mr-2"></i>
        Edit Film Details
    </a>
</div>

<!-- Film Info Banner -->
<div class="bg-white rounded-lg shadow mb-6 p-4 flex items-center space-x-4">
    @php
        $poster = $movie->posters()->where('is_default', true)->first() ?? $movie->posters()->first();
    @endphp
    <img src="{{ $poster ? asset('storage/' . $poster->media_path) : 'https://via.placeholder.com/100x150' }}" alt="{{ $movie->title }}" class="w-16 h-24 object-cover rounded">
    <div class="flex-1">
        <h3 class="text-xl font-bold">{{ $movie->title }}</h3>
        <p class="text-gray-600">{{ $movie->release_year }} • {{ $movie->movieGenres->pluck('genre.name')->implode(', ') }}</p>
    </div>
    <div class="text-right">
        <div class="flex items-center justify-end mb-1">
            <i class="fas fa-star text-yellow-400 text-3xl mr-2"></i>
            <span class="text-4xl font-bold">{{ number_format($movie->rating_average ?? 0, 1) }}</span>
            <span class="text-gray-500 ml-1">/5</span>
        </div>
        <p class="text-sm text-gray-600">{{ number_format($movie->reviews->count()) }} reviews</p>
    </div>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Average Rating</p>
                <p class="text-3xl font-bold text-yellow-600">{{ number_format($movie->rating_average ?? 0, 1) }}/5</p>
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
                <p class="text-3xl font-bold text-blue-600">{{ number_format($movie->reviews->count()) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-comments text-blue-600 text-2xl"></i>
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
            @foreach(range(5, 1) as $rating)
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
            @forelse($reviews as $review)
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {{ substr($review->user->username ?? 'U', 0, 1) }}
                        </div>
                        <div>
                            <p class="font-bold">{{ $review->user->username ?? 'Unknown User' }}</p>
                            <p class="text-sm text-gray-500">{{ $review->created_at->format('M d, Y') }}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                            <i class="fas fa-star text-yellow-500 mr-1"></i>
                            <span class="font-bold text-yellow-700">{{ $review->rating }}/5</span>
                        </div>
                        <span class="px-3 py-1 text-xs font-semibold rounded-full 
                            {{ $review->status === 'published' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }}">
                            {{ ucfirst($review->status) }}
                        </span>
                    </div>
                </div>
                
                @if($review->title)
                <p class="font-semibold text-gray-800 mb-2">{{ $review->title }}</p>
                @endif
                <p class="text-gray-700 mb-4">{{ $review->content }}</p>
                
                <div class="flex items-center justify-end pt-3 border-t">
                    <div class="flex space-x-2">
                        <button class="text-red-600 hover:text-red-800 px-3 py-1 text-sm" title="Delete" onclick="if(confirm('Delete this review?')) alert('Deleted (UI only)')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            @empty
            <div class="bg-white rounded-lg shadow p-8 text-center">
                <i class="fas fa-comments text-gray-300 text-6xl mb-4"></i>
                <p class="text-gray-500 text-lg">No reviews yet</p>
            </div>
            @endforelse
        </div>
    </div>
</div>
@endsection
