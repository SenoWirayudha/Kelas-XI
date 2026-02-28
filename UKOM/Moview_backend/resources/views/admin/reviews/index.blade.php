@extends('layouts.admin')

@section('title', 'Reviews Management')
@section('page-title', 'Reviews Management')
@section('page-subtitle', 'Manage all user reviews across films')

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Reviews</p>
                <p class="text-3xl font-bold text-gray-800">{{ number_format($totalReviews) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-comments text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Flagged</p>
                <p class="text-3xl font-bold text-red-600">{{ number_format($flaggedReviews) }}</p>
            </div>
            <div class="bg-red-100 p-3 rounded-full">
                <i class="fas fa-flag text-red-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <form method="GET" action="{{ route('admin.reviews.index') }}" id="filterForm">
        <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
                <div class="relative">
                    <input type="text" 
                           name="search" 
                           value="{{ request('search') }}"
                           placeholder="Search reviews..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
            </div>
            <select name="status" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="">All Status</option>
                <option value="published" {{ request('status') == 'published' ? 'selected' : '' }}>Published</option>
                <option value="flagged" {{ request('status') == 'flagged' ? 'selected' : '' }}>Flagged</option>
            </select>
            <select name="rating" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="">All Ratings</option>
                <option value="5" {{ request('rating') == '5' ? 'selected' : '' }}>5 Stars</option>
                <option value="4" {{ request('rating') == '4' ? 'selected' : '' }}>4 Stars</option>
                <option value="3" {{ request('rating') == '3' ? 'selected' : '' }}>3 Stars</option>
                <option value="2" {{ request('rating') == '2' ? 'selected' : '' }}>2 Stars</option>
                <option value="1" {{ request('rating') == '1' ? 'selected' : '' }}>1 Star</option>
            </select>
            <select name="sort_by" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="latest" {{ request('sort_by', 'latest') == 'latest' ? 'selected' : '' }}>Sort: Latest</option>
                <option value="oldest" {{ request('sort_by') == 'oldest' ? 'selected' : '' }}>Sort: Oldest</option>
                <option value="highest" {{ request('sort_by') == 'highest' ? 'selected' : '' }}>Sort: Highest Rating</option>
                <option value="lowest" {{ request('sort_by') == 'lowest' ? 'selected' : '' }}>Sort: Lowest Rating</option>
            </select>
            <button type="submit" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-filter mr-2"></i>Filter
            </button>
            @if(request()->hasAny(['search', 'status', 'rating', 'sort_by']))
                <a href="{{ route('admin.reviews.index') }}" 
                   class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <i class="fas fa-times mr-2"></i>Clear
                </a>
            @endif
        </div>
    </form>
</div>

<!-- Active Filters Display -->
@if(request()->hasAny(['search', 'status', 'rating', 'sort_by']))
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-center flex-wrap gap-2">
        <span class="text-sm font-semibold text-blue-900">
            <i class="fas fa-filter mr-1"></i>Active Filters:
        </span>
        @if(request('search'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Search: {{ request('search') }}
                <a href="{{ request()->fullUrlWithQuery(['search' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('status'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Status: {{ ucfirst(request('status')) }}
                <a href="{{ request()->fullUrlWithQuery(['status' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('rating'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Rating: {{ request('rating') }} Stars
                <a href="{{ request()->fullUrlWithQuery(['rating' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('sort_by') && request('sort_by') != 'latest')
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Sort: {{ ucfirst(request('sort_by')) }}
                <a href="{{ request()->fullUrlWithQuery(['sort_by' => 'latest']) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        <span class="text-sm text-blue-700 ml-auto">
            Showing {{ $reviews->total() }} result{{ $reviews->total() != 1 ? 's' : '' }}
        </span>
    </div>
</div>
@endif

<!-- Reviews List -->
<div class="space-y-4">
    @forelse($reviews as $review)
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                    <h3 class="font-bold text-lg">{{ $review->movie->title ?? 'Unknown Film' }}</h3>
                    <div class="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                        <i class="fas fa-star text-yellow-500 mr-1"></i>
                        <span class="font-bold text-yellow-700">{{ $review->rating }}/5</span>
                    </div>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full 
                        {{ $review->status === 'published' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }}">
                        {{ ucfirst($review->status) }}
                    </span>
                </div>
                
                <div class="flex items-center space-x-3 mb-3 text-sm text-gray-600">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                            {{ substr($review->user->username ?? 'U', 0, 1) }}
                        </div>
                        <span class="font-medium">{{ $review->user->username ?? 'Unknown User' }}</span>
                    </div>
                    <span>•</span>
                    <span>{{ $review->created_at->format('M d, Y') }}</span>
                </div>
                
                @if($review->title)
                <p class="font-semibold text-gray-800 mb-2">{{ $review->title }}</p>
                @endif
                <p class="text-gray-700">{{ $review->content }}</p>
            </div>
        </div>
        
        <div class="flex items-center justify-end pt-4 border-t">
            <div class="flex space-x-2">
                <button class="text-red-600 hover:text-red-800 px-3 py-2" title="Delete" onclick="if(confirm('Delete this review?')) alert('Deleted (UI only)')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
    @empty
    <div class="bg-white rounded-lg shadow p-8 text-center">
        <i class="fas fa-comments text-gray-300 text-6xl mb-4"></i>
        <p class="text-gray-500 text-lg">No reviews found</p>
    </div>
    @endforelse
</div>

<!-- Pagination -->
<div class="mt-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            Showing {{ $reviews->firstItem() ?? 0 }} to {{ $reviews->lastItem() ?? 0 }} of {{ $reviews->total() }} reviews
        </p>
        <div>
            {{ $reviews->links() }}
        </div>
    </div>
</div>
@endsection
