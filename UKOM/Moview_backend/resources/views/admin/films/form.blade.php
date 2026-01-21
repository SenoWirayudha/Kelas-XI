@extends('layouts.admin')

@section('title', isset($film) ? 'Edit Film' : 'Add New Film')
@section('page-title', isset($film) ? 'Edit Film' : 'Add New Film')
@section('page-subtitle', isset($film) ? 'Update film information' : 'Add a new film to the collection')

@section('content')
<div class="max-w-6xl">
    <!-- Back Button -->
    <div class="mb-6">
        <a href="{{ route('admin.films.index') }}" class="text-blue-600 hover:text-blue-800 flex items-center">
            <i class="fas fa-arrow-left mr-2"></i>
            Back to Films
        </a>
    </div>

    <form class="space-y-6" onsubmit="event.preventDefault(); alert('This is a UI demo - no data will be saved');">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                Basic Information
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input type="text" 
                           value="{{ $film['title'] ?? '' }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Enter film title">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Release Year *</label>
                    <input type="number" 
                           value="{{ $film['year'] ?? '' }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="2024">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Runtime (minutes) *</label>
                    <input type="number" 
                           value="{{ $film['runtime'] ?? '' }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="120">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Age Rating *</label>
                    <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select age rating</option>
                        <option {{ isset($film) && $film['age_rating'] === 'G' ? 'selected' : '' }}>G</option>
                        <option {{ isset($film) && $film['age_rating'] === 'PG' ? 'selected' : '' }}>PG</option>
                        <option {{ isset($film) && $film['age_rating'] === 'PG-13' ? 'selected' : '' }}>PG-13</option>
                        <option {{ isset($film) && $film['age_rating'] === 'R' ? 'selected' : '' }}>R</option>
                        <option {{ isset($film) && $film['age_rating'] === 'NC-17' ? 'selected' : '' }}>NC-17</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option {{ isset($film) && $film['status'] === 'Draft' ? 'selected' : '' }}>Draft</option>
                        <option {{ isset($film) && $film['status'] === 'Published' ? 'selected' : '' }}>Published</option>
                    </select>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Synopsis *</label>
                    <textarea rows="5" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter film synopsis">{{ $film['synopsis'] ?? '' }}</textarea>
                </div>
            </div>
        </div>

        <!-- Image Management -->
        <div class="bg-white rounded-lg shadow p-6" x-data="{ activeTab: 'posters' }">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-images text-blue-600 mr-2"></i>
                Image Management
            </h3>
            
            <!-- Tabs -->
            <div class="border-b mb-4">
                <div class="flex space-x-4">
                    <button type="button" @click="activeTab = 'posters'" 
                            :class="activeTab === 'posters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'"
                            class="px-4 py-2 border-b-2 font-medium">
                        Posters
                    </button>
                    <button type="button" @click="activeTab = 'backdrops'" 
                            :class="activeTab === 'backdrops' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'"
                            class="px-4 py-2 border-b-2 font-medium">
                        Backdrops
                    </button>
                </div>
            </div>
            
            <!-- Posters Tab -->
            <div x-show="activeTab === 'posters'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-600">Upload or select poster images</p>
                    <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('Upload action (UI only)')">
                        <i class="fas fa-upload mr-2"></i>
                        Upload New
                    </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    @if(isset($film))
                    <div class="relative group">
                        <img src="{{ $film['poster'] }}" alt="Poster" class="w-full h-40 object-cover rounded-lg">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center">
                            <div class="hidden group-hover:flex space-x-2">
                                <button type="button" class="bg-white text-blue-600 p-2 rounded-full" title="Set as Default">
                                    <i class="fas fa-star"></i>
                                </button>
                                <button type="button" class="bg-white text-green-600 p-2 rounded-full" title="Preview">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="bg-white text-red-600 p-2 rounded-full" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="absolute top-2 left-2">
                            <span class="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Default</span>
                        </div>
                    </div>
                    @endif
                    
                    <!-- Placeholder for more posters -->
                    <div class="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-blue-500">
                        <div class="text-center text-gray-400">
                            <i class="fas fa-plus text-2xl mb-2"></i>
                            <p class="text-xs">Add Poster</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Backdrops Tab -->
            <div x-show="activeTab === 'backdrops'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-600">Upload or select backdrop images</p>
                    <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('Upload action (UI only)')">
                        <i class="fas fa-upload mr-2"></i>
                        Upload New
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @if(isset($film))
                    <div class="relative group">
                        <img src="{{ $film['backdrop'] }}" alt="Backdrop" class="w-full h-40 object-cover rounded-lg">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center">
                            <div class="hidden group-hover:flex space-x-2">
                                <button type="button" class="bg-white text-blue-600 p-2 rounded-full" title="Set as Default">
                                    <i class="fas fa-star"></i>
                                </button>
                                <button type="button" class="bg-white text-green-600 p-2 rounded-full" title="Preview">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="bg-white text-red-600 p-2 rounded-full" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="absolute top-2 left-2">
                            <span class="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Default</span>
                        </div>
                    </div>
                    @endif
                    
                    <!-- Placeholder for more backdrops -->
                    <div class="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-blue-500">
                        <div class="text-center text-gray-400">
                            <i class="fas fa-plus text-2xl mb-2"></i>
                            <p class="text-xs">Add Backdrop</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Genres -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-tags text-blue-600 mr-2"></i>
                Genres
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                @foreach($genres as $genre)
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" 
                           {{ isset($film) && in_array($genre, $film['genres']) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm">{{ $genre }}</span>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Streaming Services -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-tv text-blue-600 mr-2"></i>
                Available on Streaming Services
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                @foreach($services as $service)
                <label class="flex items-center space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 
                       {{ isset($film) && in_array($service['name'], $film['services']) ? 'border-blue-500 bg-blue-50' : 'border-gray-200' }}">
                    <input type="checkbox" 
                           {{ isset($film) && in_array($service['name'], $film['services']) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl">{{ $service['icon'] }}</span>
                        <span class="text-sm font-medium">{{ $service['name'] }}</span>
                    </div>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between">
                <button type="button" 
                        class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        onclick="window.history.back()">
                    Cancel
                </button>
                <div class="flex space-x-3">
                    <button type="button" 
                            class="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                            onclick="alert('Preview action (UI only)')">
                        <i class="fas fa-eye mr-2"></i>
                        Preview
                    </button>
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-save mr-2"></i>
                        {{ isset($film) ? 'Update Film' : 'Save Film' }}
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection
