@extends('layouts.admin')

@section('title', 'Cast & Crew Management')
@section('page-title', 'Cast & Crew Management')
@section('page-subtitle', 'Manage actors, directors, and crew members')

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total People</p>
                <p class="text-3xl font-bold text-gray-800">{{ $totalPeople }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-user-friends text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Actors</p>
                <p class="text-3xl font-bold text-purple-600">{{ $actorsCount }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-theater-masks text-purple-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Directors</p>
                <p class="text-3xl font-bold text-blue-600">{{ $directorsCount }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-video text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Writers</p>
                <p class="text-3xl font-bold text-green-600">{{ $writersCount }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-pen text-green-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">Cast & Crew List</h3>
        <a href="{{ route('admin.cast-crew.add') }}" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center">
            <i class="fas fa-plus mr-2"></i>
            Add Person
        </a>
    </div>
    <form method="GET" action="{{ route('admin.cast-crew.index') }}" class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
            <div class="relative">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by name..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>
        <select name="role" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all" {{ request('role') == 'all' ? 'selected' : '' }}>All Roles</option>
            <option value="Actor" {{ request('role') == 'Actor' ? 'selected' : '' }}>Actor</option>
            <option value="Director" {{ request('role') == 'Director' ? 'selected' : '' }}>Director</option>
            <option value="Writer" {{ request('role') == 'Writer' ? 'selected' : '' }}>Writer</option>
            <option value="Producer" {{ request('role') == 'Producer' ? 'selected' : '' }}>Producer</option>
            <option value="Cinematographer" {{ request('role') == 'Cinematographer' ? 'selected' : '' }}>Cinematographer</option>
            <option value="Composer" {{ request('role') == 'Composer' ? 'selected' : '' }}>Composer</option>
        </select>
        <select name="sort" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="name_asc" {{ request('sort') == 'name_asc' ? 'selected' : '' }}>Sort: Name (A-Z)</option>
            <option value="name_desc" {{ request('sort') == 'name_desc' ? 'selected' : '' }}>Sort: Name (Z-A)</option>
            <option value="recent" {{ request('sort') == 'recent' ? 'selected' : '' }}>Sort: Recently Added</option>
        </select>
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <i class="fas fa-filter mr-2"></i>Filter
        </button>
    </form>
</div>

<!-- Cast & Crew Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
    @forelse($people as $person)
    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
        <div class="relative">
            @if($person->photo_path)
                <img src="{{ asset('storage/' . $person->photo_path) }}" alt="{{ $person->full_name }}" class="w-full h-80 object-cover">
            @else
                <div class="w-full h-80 bg-gray-200 flex items-center justify-center">
                    <i class="fas fa-user text-gray-400 text-6xl"></i>
                </div>
            @endif
            <div class="absolute top-2 right-2">
                <span class="px-3 py-1 text-xs font-semibold rounded-full 
                    {{ $person->primary_role === 'Actor' ? 'bg-purple-500 text-white' : 
                       ($person->primary_role === 'Director' ? 'bg-blue-500 text-white' : 
                       ($person->primary_role === 'Writer' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white')) }}">
                    {{ $person->primary_role }}
                </span>
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-bold text-lg mb-1">{{ $person->full_name }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ $person->movie_persons_count }} films</p>
            
            <div class="flex space-x-2">
                <a href="{{ route('admin.cast-crew.show', $person->id) }}" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm text-center">
                    <i class="fas fa-eye mr-1"></i> View
                </a>
                <a href="{{ route('admin.cast-crew.edit', $person->id) }}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm">
                    <i class="fas fa-edit"></i>
                </a>
                <form method="POST" action="{{ route('admin.cast-crew.destroy', $person->id) }}" onsubmit="return confirm('Are you sure you want to delete this person?')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
    @empty
    <div class="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <i class="fas fa-user-friends text-gray-300 text-6xl mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No People Found</h3>
        <p class="text-gray-500 mb-4">There are no cast or crew members in the database yet.</p>
        <a href="{{ route('admin.cast-crew.add') }}" class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            <i class="fas fa-plus mr-2"></i>
            Add Your First Person
        </a>
    </div>
    @endforelse
</div>

<!-- Table View Alternative -->
<div class="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div class="p-6 border-b">
        <h3 class="text-lg font-bold">All Cast & Crew Members</h3>
    </div>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Role</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Films Count</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Bio</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($people as $person)
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        @if($person->photo_path)
                            <img src="{{ asset('storage/' . $person->photo_path) }}" alt="{{ $person->full_name }}" class="h-12 w-12 rounded-full object-cover">
                        @else
                            <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <i class="fas fa-user text-gray-400"></i>
                            </div>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-semibold text-gray-900">{{ $person->full_name }}</div>
                        <div class="text-xs text-gray-500">{{ $person->nationality ?? '-' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            {{ $person->primary_role === 'Actor' ? 'bg-purple-100 text-purple-800' : 
                               ($person->primary_role === 'Director' ? 'bg-blue-100 text-blue-800' : 
                               ($person->primary_role === 'Writer' ? 'bg-green-100 text-green-800' : 
                               ($person->primary_role === 'Composer' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'))) }}">
                            <i class="fas {{ $person->primary_role === 'Actor' ? 'fa-theater-masks' : ($person->primary_role === 'Director' ? 'fa-video' : ($person->primary_role === 'Writer' ? 'fa-pen' : 'fa-music')) }} mr-1"></i>
                            {{ $person->primary_role }}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">{{ $person->movie_persons_count }} films</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-600 max-w-md line-clamp-2">
                            {{ Str::limit($person->bio, 120) }}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end space-x-2">
                            <a href="{{ route('admin.cast-crew.show', $person->id) }}" class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50" title="View Details">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="{{ route('admin.cast-crew.edit', $person->id) }}" class="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50" title="Edit">
                                <i class="fas fa-edit"></i>
                            </a>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <i class="fas fa-user-friends text-gray-300 text-4xl mb-3"></i>
                        <p class="text-gray-500">No cast or crew members found.</p>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Pagination -->
@if($people->hasPages())
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">
        Showing {{ $people->firstItem() }} to {{ $people->lastItem() }} of {{ $people->total() }} results
    </p>
    <div class="flex space-x-2">
        {{ $people->links() }}
    </div>
</div>
@endif
@endsection
