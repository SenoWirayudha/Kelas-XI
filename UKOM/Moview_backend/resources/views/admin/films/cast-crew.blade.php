@extends('layouts.admin')

@section('title', 'Cast & Crew - ' . $film['title'])
@section('page-title', 'Cast & Crew Management')
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
    <div>
        <h3 class="text-xl font-bold">{{ $film['title'] }}</h3>
        <p class="text-gray-600">{{ $film['year'] }} • {{ implode(', ', $film['genres']) }}</p>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Cast Section -->
    <div class="bg-white rounded-lg shadow" x-data="{ showAddCast: false }">
        <div class="p-6 border-b">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold flex items-center">
                    <i class="fas fa-users text-blue-600 mr-2"></i>
                    Cast
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
            <form class="space-y-4" onsubmit="event.preventDefault(); alert('This is a UI demo'); showAddCast = false">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Actor Name</label>
                        <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter actor name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Character Name</label>
                        <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter character name">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Photo URL</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter photo URL or upload">
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
            <div class="space-y-4" x-data="{ dragging: null }">
                @foreach($castCrew['cast'] as $index => $member)
                <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
                     draggable="true"
                     @dragstart="dragging = {{ $index }}"
                     @dragend="dragging = null"
                     :class="dragging === {{ $index }} ? 'opacity-50' : ''">
                    <div class="flex items-center space-x-1 text-gray-400">
                        <i class="fas fa-grip-vertical"></i>
                        <span class="text-sm font-bold">{{ $index + 1 }}</span>
                    </div>
                    <img src="{{ $member['photo'] }}" alt="{{ $member['name'] }}" class="w-16 h-16 object-cover rounded-full">
                    <div class="flex-1">
                        <p class="font-bold">{{ $member['name'] }}</p>
                        <p class="text-sm text-gray-600">as {{ $member['character'] }}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 p-2" title="Edit" onclick="alert('Edit cast (UI only)')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 p-2" title="Remove" onclick="if(confirm('Remove this cast member?')) alert('Removed (UI only)')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                @endforeach
            </div>
            
            <div class="mt-4 text-center text-sm text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>
                Drag and drop to reorder cast members
            </div>
        </div>
    </div>

    <!-- Crew Section -->
    <div class="bg-white rounded-lg shadow" x-data="{ showAddCrew: false }">
        <div class="p-6 border-b">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold flex items-center">
                    <i class="fas fa-user-tie text-purple-600 mr-2"></i>
                    Crew
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
            <form class="space-y-4" onsubmit="event.preventDefault(); alert('This is a UI demo'); showAddCrew = false">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Job/Role</label>
                        <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Director</option>
                            <option>Producer</option>
                            <option>Writer</option>
                            <option>Cinematography</option>
                            <option>Music</option>
                            <option>Editor</option>
                            <option>Production Design</option>
                            <option>Costume Design</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Photo URL</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter photo URL or upload">
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
            <div class="space-y-4">
                @foreach($castCrew['crew'] as $index => $member)
                <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <img src="{{ $member['photo'] }}" alt="{{ $member['name'] }}" class="w-16 h-16 object-cover rounded-full">
                    <div class="flex-1">
                        <p class="font-bold">{{ $member['name'] }}</p>
                        <p class="text-sm text-gray-600">{{ $member['job'] }}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 p-2" title="Edit" onclick="alert('Edit crew (UI only)')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 p-2" title="Remove" onclick="if(confirm('Remove this crew member?')) alert('Removed (UI only)')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
</div>

<!-- Import from Database (Mock) -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-download text-green-600 mr-2"></i>
        Import from External Database
    </h3>
    <p class="text-gray-600 mb-4">Import cast and crew information from TMDB or IMDb</p>
    <div class="flex space-x-3">
        <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg" onclick="alert('Import from TMDB (UI only)')">
            <i class="fas fa-film mr-2"></i>
            Import from TMDB
        </button>
        <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg" onclick="alert('Import from IMDb (UI only)')">
            <i class="fas fa-database mr-2"></i>
            Import from IMDb
        </button>
    </div>
</div>

<!-- Save Actions -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            <i class="fas fa-info-circle text-blue-500 mr-1"></i>
            Changes are automatically saved (UI demo)
        </p>
        <div class="flex space-x-3">
            <button class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onclick="window.history.back()">
                Done
            </button>
            <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onclick="alert('Preview (UI only)')">
                <i class="fas fa-eye mr-2"></i>
                Preview Film
            </button>
        </div>
    </div>
</div>
@endsection
