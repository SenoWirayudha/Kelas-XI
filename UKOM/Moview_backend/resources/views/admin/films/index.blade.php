@extends('layouts.admin')

@section('title', 'Films Management')
@section('page-title', 'Films Management')
@section('page-subtitle', 'Manage your film collection')

@section('content')
<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <form method="GET" action="{{ route('admin.films.index') }}" id="filterForm">
        <div class="mb-4 flex justify-between items-center flex-wrap gap-4">
            <div class="flex space-x-4 flex-1">
                <div class="relative flex-1 min-w-[200px]">
                    <input type="text" 
                           name="search"
                           value="{{ request('search') }}"
                           placeholder="Search films..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
                <select name="status"
                        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onchange="document.getElementById('filterForm').submit()">
                    <option value="">All Status</option>
                    <option value="published" {{ request('status') == 'published' ? 'selected' : '' }}>Published</option>
                    <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                </select>
                <button type="submit" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-filter mr-2"></i>Filter
                </button>
                @if(request()->hasAny(['search', 'status']))
                    <a href="{{ route('admin.films.index') }}" 
                       class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        <i class="fas fa-times mr-2"></i>Clear
                    </a>
                @endif
            </div>
            <a href="{{ route('admin.films.create') }}" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center whitespace-nowrap">
                <i class="fas fa-plus mr-2"></i>
                Add New Film
            </a>
        </div>
    </form>
</div>

<!-- Active Filters Display -->
@if(request()->hasAny(['search', 'status']))
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
        <span class="text-sm text-blue-700 ml-auto">
            Showing {{ $films->total() }} result{{ $films->total() != 1 ? 's' : '' }}
        </span>
    </div>
</div>
@endif

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Films</p>
                <p class="text-3xl font-bold text-gray-800">{{ count($films) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-film text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Published</p>
                <p class="text-3xl font-bold text-green-600">{{ $films->where('status', 'published')->count() }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Draft</p>
                <p class="text-3xl font-bold text-yellow-600">{{ $films->where('status', 'draft')->count() }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
                <i class="fas fa-edit text-yellow-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Films Table View -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Film</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runtime</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @foreach($films as $film)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        @php
                            $poster = $film->posters()->where('is_default', true)->first() ?? $film->posters()->first();
                        @endphp
                        <img src="{{ $poster ? asset('storage/' . $poster->media_path) : 'https://via.placeholder.com/100x150' }}" alt="{{ $film->title }}" class="w-12 h-16 object-cover rounded">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $film->title }}</div>
                            <div class="text-sm text-gray-500">{{ $film->movieGenres->pluck('genre.name')->implode(', ') }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ $film->release_year }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ $film->duration }} min</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $film->status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">
                        {{ ucfirst($film->status) }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <i class="fas fa-star text-yellow-400 mr-1"></i>
                        <span class="text-sm font-medium text-gray-900">{{ number_format($film->rating_average ?? 0, 1) }}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ number_format($film->total_reviews ?? 0) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <a href="{{ route('admin.films.show', $film->id) }}" 
                           class="text-blue-600 hover:text-blue-900" title="View">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="{{ route('admin.films.edit', $film->id) }}" 
                           class="text-indigo-600 hover:text-indigo-900" title="Edit">
                            <i class="fas fa-edit"></i>
                        </a>
                        <a href="{{ route('admin.films.cast-crew', $film->id) }}" 
                           class="text-purple-600 hover:text-purple-900" title="Cast & Crew">
                            <i class="fas fa-users"></i>
                        </a>
                        <a href="{{ route('admin.films.reviews', $film->id) }}" 
                           class="text-green-600 hover:text-green-900" title="Reviews">
                            <i class="fas fa-star"></i>
                        </a>
                        <button class="text-red-600 hover:text-red-900" title="Delete" onclick="alert('Delete action (UI only)')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            Showing {{ $films->firstItem() ?? 0 }} to {{ $films->lastItem() ?? 0 }} of {{ $films->total() }} films
        </p>
        <div>
            {{ $films->links() }}
        </div>
    </div>
</div>
    <p class="text-sm text-gray-600">Showing 1 to {{ count($films) }} of {{ count($films) }} results</p>
    <div class="flex space-x-2">
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Previous</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Next</button>
    </div>
</div>
@endsection
