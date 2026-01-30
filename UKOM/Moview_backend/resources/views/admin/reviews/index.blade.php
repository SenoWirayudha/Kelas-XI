@extends('layouts.admin')

@section('title', 'Reviews Management')
@section('page-title', 'Reviews Management')
@section('page-subtitle', 'Manage all user reviews across films')

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <p class="text-gray-500 text-sm">Pending</p>
                <p class="text-3xl font-bold text-orange-600">{{ number_format($pendingReviews) }}</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-full">
                <i class="fas fa-clock text-orange-600 text-2xl"></i>
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
    <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
            <div class="relative">
                <input type="text" placeholder="Search reviews..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Flagged</option>
        </select>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Ratings</option>
            <option>10 Stars</option>
            <option>9-8 Stars</option>
            <option>7-6 Stars</option>
            <option>5 or Less</option>
        </select>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Sort: Latest</option>
            <option>Sort: Oldest</option>
            <option>Sort: Highest Rating</option>
            <option>Sort: Lowest Rating</option>
        </select>
    </div>
</div>

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
                        <span class="font-bold text-yellow-700">{{ $review->rating }}/10</span>
                    </div>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full 
                        {{ $review->status === 'approved' ? 'bg-green-100 text-green-800' : 
                           ($review->status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800') }}">
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
        
        <div class="flex items-center justify-between pt-4 border-t">
            <div class="flex space-x-3">
                @if($review->status === 'pending')
                <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('Approve review (UI only)')">
                    <i class="fas fa-check mr-2"></i>
                    Approve
                </button>
                @endif
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('View film (UI only)')">
                    <i class="fas fa-film mr-2"></i>
                    View Film
                </button>
                <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('View user (UI only)')">
                    <i class="fas fa-user mr-2"></i>
                    View User
                </button>
            </div>
            <div class="flex space-x-2">
                <button class="text-yellow-600 hover:text-yellow-800 px-3 py-2" title="Flag" onclick="alert('Flag review (UI only)')">
                    <i class="fas fa-flag"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800 px-3 py-2" title="Edit" onclick="alert('Edit review (UI only)')">
                    <i class="fas fa-edit"></i>
                </button>
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

<!-- Bulk Actions -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Bulk Actions</h3>
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

<!-- Pagination -->
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing {{ number_format($reviews->count()) }} reviews</p>
</div>
@endsection
