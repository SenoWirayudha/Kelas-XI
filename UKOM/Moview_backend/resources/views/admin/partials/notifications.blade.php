@if($flaggedComments->isEmpty() && $flaggedReviews->isEmpty())
<div class="p-8 text-center text-gray-500">
    <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
    <p class="font-medium">All clear!</p>
    <p class="text-sm">No flagged content</p>
</div>
@else
<div class="divide-y divide-gray-100">
    {{-- Flagged Reviews --}}
    @foreach($flaggedReviews as $review)
    <div class="p-4 hover:bg-gray-50 transition-colors">
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <i class="fas fa-star mr-1"></i>
                        Review
                    </span>
                    <span class="font-semibold text-gray-800">{{ $review->display_name ?? $review->username }}</span>
                    <span class="text-xs text-gray-500">•</span>
                    <span class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($review->updated_at)->diffForHumans() }}</span>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2 mb-2">{{ $review->content }}</p>
                <div class="flex items-center text-xs text-gray-500">
                    <i class="fas fa-film mr-1"></i>
                    <span>{{ $review->movie_title }}</span>
                </div>
            </div>
            <div class="ml-4">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <i class="fas fa-flag mr-1"></i>
                    Flagged
                </span>
            </div>
        </div>
        <div class="mt-3 flex items-center space-x-2">
            <form action="{{ route('admin.reviews.delete', $review->id) }}" method="POST" class="inline">
                @csrf
                @method('DELETE')
                <button type="submit" class="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
                    <i class="fas fa-trash-alt mr-1"></i>
                    Delete
                </button>
            </form>
            <form action="{{ route('admin.reviews.restore', $review->id) }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
                    <i class="fas fa-check mr-1"></i>
                    Approve
                </button>
            </form>
        </div>
    </div>
    @endforeach
    
    {{-- Flagged Comments --}}
    @foreach($flaggedComments as $comment)
    <div class="p-4 hover:bg-gray-50 transition-colors">
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <i class="fas fa-comment mr-1"></i>
                        Comment
                    </span>
                    <span class="font-semibold text-gray-800">{{ $comment->user->username ?? 'Unknown User' }}</span>
                    <span class="text-xs text-gray-500">•</span>
                    <span class="text-xs text-gray-500">{{ $comment->updated_at->diffForHumans() }}</span>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2 mb-2">{{ $comment->content }}</p>
                @if($comment->review && $comment->review->movie)
                <div class="flex items-center text-xs text-gray-500">
                    <i class="fas fa-film mr-1"></i>
                    <span>{{ $comment->review->movie->title ?? 'Unknown Movie' }}</span>
                </div>
                @endif
            </div>
            <div class="ml-4">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <i class="fas fa-flag mr-1"></i>
                    Flagged
                </span>
            </div>
        </div>
        <div class="mt-3 flex items-center space-x-2">
            <form action="{{ route('admin.comments.delete', $comment->id) }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
                    <i class="fas fa-trash-alt mr-1"></i>
                    Delete
                </button>
            </form>
            <form action="{{ route('admin.comments.restore', $comment->id) }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
                    <i class="fas fa-check mr-1"></i>
                    Approve
                </button>
            </form>
        </div>
    </div>
    @endforeach
</div>
<div class="p-4 border-t border-gray-200 bg-gray-50">
    <a href="{{ route('admin.comments.index', ['status' => 'flagged']) }}" 
       class="block text-center text-sm font-medium text-blue-600 hover:text-blue-800">
        View all flagged content
        <i class="fas fa-arrow-right ml-1"></i>
    </a>
</div>
@endif
