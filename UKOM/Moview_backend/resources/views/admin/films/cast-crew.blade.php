@extends('layouts.admin')

@section('title', 'Cast & Crew - ' . $movie->title)
@section('page-title', 'Cast & Crew Management')
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
    @if($movie->default_poster_path)
        <img src="{{ asset('storage/' . $movie->default_poster_path) }}" alt="{{ $movie->title }}" class="w-16 h-24 object-cover rounded">
    @else
        <div class="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
            <i class="fas fa-film text-gray-400"></i>
        </div>
    @endif
    <div>
        <h3 class="text-xl font-bold">{{ $movie->title }}</h3>
        <p class="text-gray-600">{{ $movie->release_date ? $movie->release_date->format('Y') : 'TBA' }} • {{ $movie->genres->pluck('name')->implode(', ') }}</p>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Cast Section -->
    <div class="bg-white rounded-lg shadow" x-data="{ showAddCast: false }">
        <div class="p-6 border-b">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold flex items-center">
                    <i class="fas fa-users text-blue-600 mr-2"></i>
                    Cast <span class="ml-2 text-sm font-normal text-gray-500">({{ $cast->count() }})</span>
                </h2>
                <button @click="showAddCast = !showAddCast" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>
                    Add Cast
                </button>
            </div>
        </div>

        <!-- Add Cast Form -->
        <div x-show="showAddCast" x-cloak class="p-6 bg-blue-50 border-b">
            <form action="{{ route('admin.films.castcrew.store', $movie->id) }}" method="POST" class="space-y-4">
                @csrf
                <input type="hidden" name="role_type" value="cast">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Actor <span class="text-red-500">*</span></label>
                        <select name="person_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Choose an actor...</option>
                            @foreach($allPersons->where('primary_role', 'Actor') as $person)
                                <option value="{{ $person->id }}">{{ $person->full_name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Character Name</label>
                        <input type="text" name="character_name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Bruce Wayne">
                    </div>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" @click="showAddCast = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Cast Member
                    </button>
                </div>
            </form>
        </div>

        <!-- Cast List -->
        <div class="p-6">
            @if($cast->count() > 0)
                <div class="space-y-4">
                    @foreach($cast as $index => $moviePerson)
                    <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div class="flex items-center space-x-1 text-gray-400">
                            <span class="text-sm font-bold">{{ $index + 1 }}</span>
                        </div>
                        @if($moviePerson->person->photo_path)
                            <img src="{{ asset('storage/' . $moviePerson->person->photo_path) }}" alt="{{ $moviePerson->person->full_name }}" class="w-16 h-16 object-cover rounded-full">
                        @else
                            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-gray-400"></i>
                            </div>
                        @endif
                        <div class="flex-1">
                            <p class="font-bold">{{ $moviePerson->person->full_name }}</p>
                            <p class="text-sm text-gray-600">as {{ $moviePerson->character_name ?? 'Unknown Character' }}</p>
                        </div>
                        <div class="flex space-x-2">
                            <form action="{{ route('admin.films.castcrew.destroy', [$movie->id, $moviePerson->id]) }}" method="POST" class="inline" onsubmit="return confirm('Remove this cast member?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-red-600 hover:text-red-800 p-2" title="Remove">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>No cast members added yet</p>
                </div>
            @endif
        </div>
    </div>

    <!-- Crew Section -->
    <div class="bg-white rounded-lg shadow" x-data="{ showAddCrew: false }">
        <div class="p-6 border-b">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold flex items-center">
                    <i class="fas fa-user-tie text-purple-600 mr-2"></i>
                    Crew <span class="ml-2 text-sm font-normal text-gray-500">({{ $crew->count() }})</span>
                </h2>
                <button @click="showAddCrew = !showAddCrew" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>
                    Add Crew
                </button>
            </div>
        </div>

        <!-- Add Crew Form -->
        <div x-show="showAddCrew" x-cloak class="p-6 bg-purple-50 border-b">
            <form action="{{ route('admin.films.castcrew.store', $movie->id) }}" method="POST" class="space-y-4">
                @csrf
                <input type="hidden" name="role_type" value="crew">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Person <span class="text-red-500">*</span></label>
                        <select name="person_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option value="">Choose a person...</option>
                            @foreach($allPersons->whereIn('primary_role', ['Director', 'Writer', 'Producer', 'Cinematographer', 'Composer']) as $person)
                                <option value="{{ $person->id }}">{{ $person->full_name }} ({{ $person->primary_role }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Job/Role</label>
                        <input type="text" name="job" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Director, Music Composer">
                    </div>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" @click="showAddCrew = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Add Crew Member
                    </button>
                </div>
            </form>
        </div>

        <!-- Crew List -->
        <div class="p-6">
            @if($crew->count() > 0)
                <div class="space-y-4">
                    @foreach($crew as $moviePerson)
                    <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        @if($moviePerson->person->photo_path)
                            <img src="{{ asset('storage/' . $moviePerson->person->photo_path) }}" alt="{{ $moviePerson->person->full_name }}" class="w-16 h-16 object-cover rounded-full">
                        @else
                            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-gray-400"></i>
                            </div>
                        @endif
                        <div class="flex-1">
                            <p class="font-bold">{{ $moviePerson->person->full_name }}</p>
                            <p class="text-sm text-gray-600">{{ $moviePerson->job ?? $moviePerson->person->primary_role }}</p>
                        </div>
                        <div class="flex space-x-2">
                            <form action="{{ route('admin.films.castcrew.destroy', [$movie->id, $moviePerson->id]) }}" method="POST" class="inline" onsubmit="return confirm('Remove this crew member?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-red-600 hover:text-red-800 p-2" title="Remove">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                    @endforeach
                </div>
            @else
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-tie text-4xl mb-2"></i>
                    <p>No crew members added yet</p>
                </div>
            @endif
        </div>
    </div>
</div>

<!-- Save Actions -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            <i class="fas fa-info-circle text-blue-500 mr-1"></i>
            Total: {{ $cast->count() }} Cast, {{ $crew->count() }} Crew
        </p>
        <div class="flex space-x-3">
            <a href="{{ route('admin.films.show', $movie->id) }}" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Done
            </a>
        </div>
    </div>
</div>
@endsection
