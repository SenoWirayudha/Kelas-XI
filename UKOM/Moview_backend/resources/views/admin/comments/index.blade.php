@extends('layouts.admin')

@section('title', 'Comments Management')
@section('page-title', 'Comments Management')
@section('page-subtitle', 'Manage user comments on reviews')

@section('content')
<!-- Filter Section -->
<div class="bg-white rounded-lg shadow mb-6 p-4">
    <form method="GET" action="{{ route('admin.comments.index') }}" class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px]">
            <input type="text" 
                   name="search" 
                   value="{{ request('search') }}" 
                   placeholder="Search comments or users..." 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <select name="status" 
                onchange="this.form.submit()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="published" {{ request('status') == 'published' ? 'selected' : '' }}>Published</option>
            <option value="flagged" {{ request('status') == 'flagged' ? 'selected' : '' }}>Flagged</option>
            <option value="deleted" {{ request('status') == 'deleted' ? 'selected' : '' }}>Deleted</option>
            <option value="hidden" {{ request('status') == 'hidden' ? 'selected' : '' }}>Hidden</option>
        </select>
        <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-search mr-2"></i>
            Search
        </button>
        @if(request()->hasAny(['search', 'status']))
        <a href="{{ route('admin.comments.index') }}" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <i class="fas fa-times mr-2"></i>
            Clear
        </a>
        @endif
    </form>
</div>

<!-- Active Filters -->
@if(request()->hasAny(['search', 'status']))
<div class="mb-6">
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 flex-wrap">
                <span class="text-sm font-medium text-blue-800">Active filters:</span>
                
                @if(request('search'))
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Search: {{ request('search') }}
                    <a href="{{ request()->fullUrlWithQuery(['search' => null]) }}" class="ml-2 hover:text-blue-600">
                        <i class="fas fa-times"></i>
                    </a>
                </span>
                @endif
                
                @if(request('status'))
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Status: {{ ucfirst(request('status')) }}
                    <a href="{{ request()->fullUrlWithQuery(['status' => null]) }}" class="ml-2 hover:text-blue-600">
                        <i class="fas fa-times"></i>
                    </a>
                </span>
                @endif
            </div>
            
            <a href="{{ route('admin.comments.index') }}" class="text-sm text-blue-600 hover:text-blue-800">
                Clear all
            </a>
        </div>
    </div>
</div>
@endif

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Comments</p>
                <p class="text-3xl font-bold text-blue-600">{{ number_format($comments->total()) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-comments text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Published</p>
                <p class="text-3xl font-bold text-green-600">{{ number_format(\App\Models\ReviewComment::where('status', 'published')->count()) }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6" data-flagged-count="{{ \App\Models\ReviewComment::where('status', 'flagged')->count() }}">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Flagged</p>
                <p class="text-3xl font-bold text-red-600">{{ number_format(\App\Models\ReviewComment::where('status', 'flagged')->count()) }}</p>
            </div>
            <div class="bg-red-100 p-3 rounded-full">
                <i class="fas fa-flag text-red-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Deleted</p>
                <p class="text-3xl font-bold text-gray-600">{{ number_format(\App\Models\ReviewComment::where('status', 'deleted')->count()) }}</p>
            </div>
            <div class="bg-gray-100 p-3 rounded-full">
                <i class="fas fa-trash text-gray-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Comments Table -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($comments as $comment)
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {{ substr($comment->user->username ?? 'U', 0, 1) }}
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-900">{{ $comment->user->username ?? 'Unknown' }}</p>
                                <p class="text-sm text-gray-500">{{ $comment->user->email ?? '' }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900 max-w-xs">
                            <p class="line-clamp-2">{{ $comment->content }}</p>
                        </div>
                        @if($comment->parent_id)
                        <span class="text-xs text-blue-600 mt-1 inline-block">
                            <i class="fas fa-reply mr-1"></i>Reply to comment
                        </span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm">
                            @if($comment->review && $comment->review->movie)
                            <a href="{{ route('admin.films.reviews', $comment->review->movie->id) }}" 
                               class="text-blue-600 hover:text-blue-800">
                                {{ $comment->review->movie->title }}
                            </a>
                            <p class="text-xs text-gray-500 mt-1">
                                by {{ $comment->review->user->username ?? 'Unknown' }}
                            </p>
                            @else
                            <span class="text-gray-400">Review not found</span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ $comment->created_at->format('M d, Y') }}
                        <br>
                        <span class="text-xs text-gray-400">{{ $comment->created_at->format('H:i') }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            @if($comment->status === 'published') bg-green-100 text-green-800
                            @elseif($comment->status === 'flagged') bg-red-100 text-red-800
                            @elseif($comment->status === 'deleted') bg-gray-100 text-gray-800
                            @else bg-yellow-100 text-yellow-800
                            @endif">
                            {{ ucfirst($comment->status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div class="flex items-center justify-center space-x-2">
                            @if($comment->status !== 'deleted')
                            <form action="{{ route('admin.comments.delete', $comment->id) }}" method="POST" class="inline">
                                @csrf
                                <button type="submit" 
                                        class="text-red-600 hover:text-red-900" 
                                        title="Mark as Deleted"
                                        onclick="return confirm('Mark this comment as deleted? It will show as \\'Comment removed\\' on mobile.')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                            @endif
                            
                            @if(in_array($comment->status, ['flagged', 'deleted']))
                            <form action="{{ route('admin.comments.restore', $comment->id) }}" method="POST" class="inline">
                                @csrf
                                <button type="submit" 
                                        class="text-green-600 hover:text-green-900" 
                                        title="Restore Comment"
                                        onclick="return confirm('Restore this comment?')">
                                    <i class="fas fa-undo"></i>
                                </button>
                            </form>
                            @endif
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center justify-center text-gray-400">
                            <i class="fas fa-comments text-6xl mb-4"></i>
                            <p class="text-lg font-medium text-gray-500">No comments found</p>
                            <p class="text-sm text-gray-400 mt-2">Comments will appear here once users start commenting on reviews</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    @if($comments->hasPages())
    <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ $comments->firstItem() }}</span>
                to <span class="font-medium">{{ $comments->lastItem() }}</span>
                of <span class="font-medium">{{ $comments->total() }}</span> comments
            </div>
            <div>
                {{ $comments->links() }}
            </div>
        </div>
    </div>
    @endif
</div>
@endsection
