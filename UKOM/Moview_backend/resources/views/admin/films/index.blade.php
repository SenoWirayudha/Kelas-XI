@extends('layouts.admin')

@section('title', 'Films Management')
@section('page-title', 'Films Management')
@section('page-subtitle', 'Manage your film collection')

@section('content')
<div class="mb-6 flex justify-between items-center">
    <div class="flex space-x-4">
        <div class="relative">
            <input type="text" placeholder="Search films..." 
                   class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
        </div>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
        </select>
    </div>
    <a href="{{ route('admin.films.create') }}" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center">
        <i class="fas fa-plus mr-2"></i>
        Add New Film
    </a>
</div>

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
                <p class="text-3xl font-bold text-yellow-600">{{ collect($films)->where('status', 'Draft')->count() }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
                <i class="fas fa-edit text-yellow-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- View Toggle -->
<div class="mb-4 flex justify-end" x-data="{ view: 'table' }">
    <div class="bg-white rounded-lg shadow-sm p-1 flex">
        <button @click="view = 'table'" 
                :class="view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600'"
                class="px-4 py-2 rounded transition">
            <i class="fas fa-table"></i> Table
        </button>
        <button @click="view = 'grid'" 
                :class="view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'"
                class="px-4 py-2 rounded transition">
            <i class="fas fa-th-large"></i> Grid
        </button>
    </div>
</div>

<!-- Films Table View -->
<div class="bg-white rounded-lg shadow overflow-hidden" x-data="{ view: 'table' }" x-show="view === 'table'">
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

<!-- Films Grid View -->
<div x-data="{ view: 'table' }" x-show="view === 'grid'" x-cloak>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @foreach($films as $film)
        @php
            $poster = $film->posters()->where('is_default', true)->first() ?? $film->posters()->first();
        @endphp
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
            <div class="relative">
                <img src="{{ $poster ? asset('storage/' . $poster->media_path) : 'https://via.placeholder.com/300x450' }}" alt="{{ $film->title }}" class="w-full h-96 object-cover">
                <div class="absolute top-2 right-2">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full 
                        {{ $film->status === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white' }}">
                        {{ ucfirst($film->status) }}
                    </span>
                </div>
                <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    <i class="fas fa-star text-yellow-400"></i> {{ number_format($film->rating_average ?? 0, 1) }}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">{{ $film->title }}</h3>
                <p class="text-gray-600 text-sm mb-2">{{ $film->release_year }} • {{ $film->duration }} min</p>
                <p class="text-gray-500 text-xs mb-3">{{ $film->movieGenres->pluck('genre.name')->implode(', ') }}</p>
                
                <div class="flex justify-between items-center pt-3 border-t">
                    <a href="{{ route('admin.films.show', $film->id) }}" 
                       class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <a href="{{ route('admin.films.edit', $film->id) }}" 
                       class="text-indigo-600 hover:text-indigo-800 text-sm">
                        <i class="fas fa-edit"></i> Edit
                    </a>
                    <button class="text-red-600 hover:text-red-800 text-sm" onclick="alert('Delete action (UI only)')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>

<!-- Pagination (dummy) -->
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing 1 to {{ count($films) }} of {{ count($films) }} results</p>
    <div class="flex space-x-2">
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Previous</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Next</button>
    </div>
</div>
@endsection
