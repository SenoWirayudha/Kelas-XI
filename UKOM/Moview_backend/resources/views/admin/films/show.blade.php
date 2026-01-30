@extends('layouts.admin')

@section('title', 'Film Preview - ' . $movie->title)
@section('page-title', 'Film Preview')
@section('page-subtitle', 'Admin preview mode')

@section('content')
<!-- Preview Mode Banner -->
<div class="bg-yellow-500 text-white px-6 py-3 rounded-lg mb-6 flex items-center justify-between">
    <div class="flex items-center">
        <i class="fas fa-exclamation-triangle text-2xl mr-3"></i>
        <div>
            <p class="font-semibold">Preview Mode</p>
            <p class="text-sm">This is how users will see this film</p>
        </div>
    </div>
    <a href="{{ route('admin.films.edit', $movie->id) }}" class="bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50">
        <i class="fas fa-edit mr-2"></i>
        Edit Film
    </a>
</div>

<!-- Quick Actions -->
<div class="mb-6 flex space-x-3">
    <a href="{{ route('admin.films.index') }}" class="text-blue-600 hover:text-blue-800 flex items-center">
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Films
    </a>
    <span class="text-gray-400">|</span>
    <a href="{{ route('admin.films.cast-crew', $movie->id) }}" class="text-purple-600 hover:text-purple-800 flex items-center">
        <i class="fas fa-users mr-2"></i>
        Manage Cast & Crew
    </a>
    <span class="text-gray-400">|</span>
    <a href="{{ route('admin.films.reviews', $movie->id) }}" class="text-green-600 hover:text-green-800 flex items-center">
        <i class="fas fa-star mr-2"></i>
        View Reviews
    </a>
</div>

@php
    // Get active poster and backdrop
    $activePoster = $movie->posters()->where('is_default', true)->first();
    $activeBackdrop = $movie->backdrops()->where('is_default', true)->first();
    
    // Fallback to first if no default
    if (!$activePoster) {
        $activePoster = $movie->posters()->first();
    }
    if (!$activeBackdrop) {
        $activeBackdrop = $movie->backdrops()->first();
    }
@endphp

<!-- Film Hero Section -->
<div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
    <div class="relative h-96">
        <img src="{{ $activeBackdrop ? asset('storage/' . $activeBackdrop->media_path) : 'https://via.placeholder.com/1920x1080' }}" alt="{{ $movie->title }}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div class="flex items-end space-x-6">
                <img src="{{ $activePoster ? asset('storage/' . $activePoster->media_path) : 'https://via.placeholder.com/500x750' }}" alt="{{ $movie->title }}" class="w-48 h-72 object-cover rounded-lg shadow-2xl">
                <div class="flex-1 pb-4">
                    <h1 class="text-5xl font-bold mb-2">{{ $movie->title }}</h1>
                    <div class="flex items-center space-x-4 text-lg mb-3">
                        <span>{{ $movie->release_year }}</span>
                        <span>•</span>
                        <span>{{ $movie->duration }} min</span>
                        <span>•</span>
                        <span class="px-2 py-1 border border-white rounded">{{ $movie->age_rating ?? 'NR' }}</span>
                    </div>
                    <div class="flex items-center space-x-6 mb-4">
                        <div class="flex items-center">
                            @php
                                $rating5Scale = $movie->rating_average ?? 0;
                                $fullStars = floor($rating5Scale);
                                $hasHalfStar = ($rating5Scale - $fullStars) >= 0.5;
                            @endphp
                            
                            <!-- Star Rating Display -->
                            <div class="flex items-center mr-3">
                                @for($i = 1; $i <= 5; $i++)
                                    @if($i <= $fullStars)
                                        <i class="fas fa-star text-yellow-400 text-2xl"></i>
                                    @elseif($i == $fullStars + 1 && $hasHalfStar)
                                        <i class="fas fa-star-half-alt text-yellow-400 text-2xl"></i>
                                    @else
                                        <i class="far fa-star text-yellow-400 text-2xl"></i>
                                    @endif
                                @endfor
                            </div>
                            
                            <div>
                                <span class="text-3xl font-bold">{{ number_format($rating5Scale, 1) }}</span>
                                <span class="text-gray-300 ml-2">/5</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-300">{{ number_format($movie->total_reviews ?? 0) }} reviews</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-4">
                        @foreach($movie->movieGenres as $movieGenre)
                        <span class="px-3 py-1 bg-blue-600 bg-opacity-80 rounded-full text-sm">{{ $movieGenre->genre->name }}</span>
                        @endforeach
                    </div>
                    
                    <!-- Trailer Button -->
                    @if($movie->trailer_url)
                    <div class="mt-4">
                        <a href="{{ $movie->trailer_url }}" target="_blank" class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-xl">
                            <i class="fas fa-play-circle text-2xl mr-3"></i>
                            <span>Watch Trailer</span>
                        </a>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Film Details -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Content -->
    <div class="lg:col-span-2 space-y-6">
        <!-- Synopsis -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-4">Synopsis</h2>
            <p class="text-gray-700 leading-relaxed">{{ $movie->synopsis ?? 'No synopsis available' }}</p>
        </div>

        <!-- Rating Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-6 flex items-center">
                <i class="fas fa-chart-bar text-purple-600 mr-3"></i>
                Rating Distribution
            </h2>
            
            @php
                // Get actual rating distribution from database
                $ratingDistribution = [];
                for ($i = 5; $i >= 1; $i--) {
                    $ratingDistribution[$i] = $movie->ratings()
                        ->where('rating', $i)
                        ->count();
                }
                $totalRatings = array_sum($ratingDistribution);
                
                // Calculate average rating
                $totalPoints = 0;
                foreach ($ratingDistribution as $rating => $count) {
                    $totalPoints += $rating * $count;
                }
                $averageRating = $totalRatings > 0 ? $totalPoints / $totalRatings : 0;
                
                // Get total reviews from reviews table
                $totalReviews = $movie->reviews()->where('status', 'published')->count();
            @endphp
            
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="text-center">
                    <p class="text-gray-600 text-sm mb-1">Total Reviews</p>
                    <p class="text-3xl font-bold text-gray-800">{{ number_format($totalReviews) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 text-sm mb-1">Average Rating</p>
                    <p class="text-3xl font-bold text-purple-600">{{ number_format($averageRating, 1) }} / 5</p>
                </div>
            </div>
            
            <!-- Distribution Bars -->
            <div class="space-y-3">
                @foreach([5, 4, 3, 2, 1] as $stars)
                    @php
                        $count = $ratingDistribution[$stars];
                        $percentage = $totalRatings > 0 ? ($count / $totalRatings) * 100 : 0;
                    @endphp
                    
                    <div class="flex items-center gap-4">
                        <!-- Star Icons -->
                        <div class="flex items-center w-28">
                            @for($i = 1; $i <= 5; $i++)
                                @if($i <= $stars)
                                    <i class="fas fa-star text-yellow-400 text-sm"></i>
                                @else
                                    <i class="far fa-star text-gray-300 text-sm"></i>
                                @endif
                            @endfor
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="flex-1">
                            <div class="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
                                     style="width: {{ $percentage }}%">
                                    @if($percentage > 15)
                                        <span class="text-white text-xs font-semibold">{{ number_format($percentage, 1) }}%</span>
                                    @endif
                                </div>
                                @if($percentage <= 15 && $percentage > 0)
                                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 text-xs font-semibold">{{ number_format($percentage, 1) }}%</span>
                                @endif
                            </div>
                        </div>
                        
                        <!-- Count -->
                        <div class="w-16 text-right">
                            <span class="text-gray-700 font-semibold">{{ number_format($count) }}</span>
                        </div>
                    </div>
                @endforeach
            </div>
            
            <!-- Info Notice -->
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex">
                    <i class="fas fa-info-circle text-blue-600 mr-3 mt-1"></i>
                    <div class="text-sm text-blue-800">
                        <p class="font-medium mb-1">Rating Information</p>
                        <p class="text-blue-700">This distribution shows how users have rated this film on a scale of 1 to 5 stars. The data is read-only and reflects actual user feedback.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cast Preview -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Cast & Crew</h2>
                <a href="{{ route('admin.films.cast-crew', $movie->id) }}" class="text-blue-600 hover:text-blue-800">
                    Manage →
                </a>
            </div>
            
            @php
                $castCrewPreview = $movie->moviePersons->take(5);
            @endphp
            
            <!-- Cast & Crew Table -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Character</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @foreach($castCrewPreview as $moviePerson)
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 whitespace-nowrap">
                                <div class="flex items-center">
                                    @if($moviePerson->person->photo_path)
                                        <img src="{{ asset('storage/' . $moviePerson->person->photo_path) }}" alt="{{ $moviePerson->person->full_name }}" class="w-10 h-10 rounded-full object-cover">
                                    @else
                                        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <i class="fas fa-user text-gray-400"></i>
                                        </div>
                                    @endif
                                    <span class="ml-3 text-sm font-medium text-gray-900">{{ $moviePerson->person->full_name }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    {{ $moviePerson->role_type === 'cast' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800' }}">
                                    {{ ucfirst($moviePerson->role_type) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-900">
                                {{ $moviePerson->character_name ?? $moviePerson->job ?? '-' }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button class="text-red-600 hover:text-red-900" title="Remove" onclick="deleteCastCrew({{ $movie->id }}, {{ $moviePerson->id }})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            
            <!-- Add Button -->
            <div class="mt-4 pt-4 border-t">
                <a href="{{ route('admin.films.cast-crew', $movie->id) }}" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center">
                    <i class="fas fa-users-cog mr-2"></i>
                    Manage Cast & Crew
                </a>
            </div>
        </div>

        <!-- Media Management & Metadata Tabs -->
        <div class="bg-white rounded-lg shadow p-6" x-data="{ activeSection: 'media', activeTab: 'posters', currentTab: 'posters' }">
            <!-- Section Tabs -->
            <div class="border-b border-gray-200 mb-6">
                <nav class="-mb-px flex space-x-8">
                    <button @click="activeSection = 'media'" 
                            :class="activeSection === 'media' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200">
                        <i class="fas fa-images mr-2"></i>
                        Media Management
                    </button>
                    <button @click="activeSection = 'metadata'" 
                            :class="activeSection === 'metadata' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200">
                        <i class="fas fa-tags mr-2"></i>
                        Metadata
                    </button>
                </nav>
            </div>
            
            <!-- Media Management Section -->
            <div x-show="activeSection === 'media'" x-transition>
            
            @php
                $posters = $movie->posters;
                $backdrops = $movie->backdrops;
            @endphp
            
            <!-- Active Media Display -->
            <div class="mb-8 grid md:grid-cols-2 gap-6">
                <!-- Active Poster -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-semibold text-gray-700">Active Poster</h3>
                        <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            <i class="fas fa-check-circle mr-1"></i>Default
                        </span>
                    </div>
                    <div class="relative group">
                        <img src="{{ $activePoster ? asset('storage/' . $activePoster->media_path) : 'https://via.placeholder.com/500x750' }}" 
                             alt="Active Poster" 
                             class="w-full h-96 object-cover rounded-lg shadow-lg">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <i class="fas fa-search-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Active Backdrop -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-semibold text-gray-700">Active Backdrop</h3>
                        <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            <i class="fas fa-check-circle mr-1"></i>Default
                        </span>
                    </div>
                    <div class="relative group">
                        <img src="{{ $activeBackdrop ? asset('storage/' . $activeBackdrop->media_path) : 'https://via.placeholder.com/1920x1080' }}" 
                             alt="Active Backdrop" 
                             class="w-full h-96 object-cover rounded-lg shadow-lg">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <i class="fas fa-search-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Divider -->
            <div class="border-t border-gray-200 mb-6"></div>
            
            <!-- Media Options Section -->
            <div x-data="mediaManager()">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800">Media Options</h3>
                    <div>
                        <input type="file" id="mediaFileInput" @change="handleFileSelect" accept="image/*" class="hidden">
                        <button @click="openFileDialog()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                            <i class="fas fa-plus mr-2"></i>
                            Add <span x-text="currentTab === 'posters' ? 'Poster' : 'Backdrop'" class="ml-1"></span>
                        </button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="border-b border-gray-200 mb-6">
                    <nav class="-mb-px flex space-x-8">
                        <button @click="activeTab = 'posters'; currentTab = 'posters'" 
                                :class="activeTab === 'posters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                            <i class="fas fa-image mr-2"></i>
                            Posters ({{ count($posters) }})
                        </button>
                        <button @click="activeTab = 'backdrops'; currentTab = 'backdrops'" 
                                :class="activeTab === 'backdrops' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                            <i class="fas fa-panorama mr-2"></i>
                            Backdrops ({{ count($backdrops) }})
                        </button>
                    </nav>
                </div>
                
                <!-- Posters Tab Content -->
                <div x-show="activeTab === 'posters'" x-transition>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        @foreach($posters as $poster)
                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                            <div class="relative aspect-[2/3] group">
                                <img src="{{ asset('storage/' . $poster->media_path) }}" 
                                     alt="Poster {{ $poster->id }}" 
                                     class="w-full h-full object-cover">
                                
                                <!-- Active Badge -->
                                @if($poster->is_default)
                                <div class="absolute top-2 right-2">
                                    <span class="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        <i class="fas fa-check mr-1"></i>Active
                                    </span>
                                </div>
                                @endif
                                
                                <!-- Hover Overlay -->
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                                </div>
                            </div>
                            
                            <!-- Media Info & Actions -->
                            <div class="p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs text-gray-500">Poster</span>
                                    <span class="text-xs text-gray-500">ID: {{ $poster->id }}</span>
                                </div>
                                
                                <div class="space-y-2">
                                    @if(!$poster->is_default)
                                    <button onclick="setMediaDefault({{ $movie->id }}, {{ $poster->id }})" 
                                            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-check mr-1"></i>Set as Default
                                    </button>
                                    @else
                                    <button disabled 
                                            class="w-full bg-gray-300 text-gray-500 px-3 py-2 rounded text-xs font-medium cursor-not-allowed">
                                        <i class="fas fa-check-circle mr-1"></i>Current Default
                                    </button>
                                    @endif
                                    
                                    <button onclick="deleteMedia({{ $movie->id }}, {{ $poster->id }})" 
                                            class="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-trash mr-1"></i>Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                    
                    <!-- Poster Guidelines -->
                    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex">
                            <i class="fas fa-info-circle text-blue-600 mr-3 mt-1"></i>
                            <div class="text-sm text-blue-800">
                                <p class="font-medium mb-1">Poster Guidelines</p>
                                <ul class="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Recommended: 2000 x 3000 pixels (2:3 ratio)</li>
                                    <li>Max file size: 5 MB</li>
                                    <li>Format: JPG, PNG</li>
                                    <li>Portrait orientation required</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Backdrops Tab Content -->
                <div x-show="activeTab === 'backdrops'" x-transition>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @foreach($backdrops as $backdrop)
                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                            <div class="relative aspect-video group">
                                <img src="{{ asset('storage/' . $backdrop->media_path) }}" 
                                     alt="Backdrop {{ $backdrop->id }}" 
                                     class="w-full h-full object-cover">
                                
                                <!-- Active Badge -->
                                @if($backdrop->is_default)
                                <div class="absolute top-2 right-2">
                                    <span class="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        <i class="fas fa-check mr-1"></i>Active
                                    </span>
                                </div>
                                @endif
                                
                                <!-- Hover Overlay -->
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                                </div>
                            </div>
                            
                            <!-- Media Info & Actions -->
                            <div class="p-3">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="text-xs text-gray-500">Backdrop</span>
                                    <span class="text-xs text-gray-500">ID: {{ $backdrop->id }}</span>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2">
                                    @if(!$backdrop->is_default)
                                    <button onclick="setMediaDefault({{ $movie->id }}, {{ $backdrop->id }})" 
                                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-check mr-1"></i>Set Default
                                    </button>
                                    @else
                                    <button disabled 
                                            class="bg-gray-300 text-gray-500 px-3 py-2 rounded text-xs font-medium cursor-not-allowed">
                                        <i class="fas fa-check-circle mr-1"></i>Default
                                    </button>
                                    @endif
                                    
                                    <button onclick="deleteMedia({{ $movie->id }}, {{ $backdrop->id }})" 
                                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-trash mr-1"></i>Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                    
                    <!-- Backdrop Guidelines -->
                    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex">
                            <i class="fas fa-info-circle text-blue-600 mr-3 mt-1"></i>
                            <div class="text-sm text-blue-800">
                                <p class="font-medium mb-1">Backdrop Guidelines</p>
                                <ul class="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Recommended: 3840 x 2160 pixels (16:9 ratio / 4K)</li>
                                    <li>Max file size: 10 MB</li>
                                    <li>Format: JPG, PNG</li>
                                    <li>Wide landscape orientation works best</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <!-- End Media Management Section -->
            
            <!-- Metadata Section -->
            <div x-show="activeSection === 'metadata'" x-transition>
                <div class="space-y-8">
                    <!-- Production House Section -->
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <label class="block text-lg font-semibold text-gray-800">
                                <i class="fas fa-building text-blue-600 mr-2"></i>
                                Production House
                            </label>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @if($movie->movieProductionHouses->count() > 0)
                            <!-- Selected Production Houses Display -->
                            <div class="flex flex-wrap gap-2 mb-3">
                                @foreach($movie->movieProductionHouses as $mph)
                                    <span class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
                                        {{ $mph->productionHouse->name }}
                                    </span>
                                @endforeach
                            </div>
                            @else
                            <p class="text-gray-500 text-sm">No production houses added yet</p>
                            @endif
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Edit film to add or change production companies
                            </p>
                        </div>
                    </div>
                    
                    <!-- Genre Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-film text-purple-600 mr-2"></i>
                            Genre
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @if($movie->movieGenres->count() > 0)
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                @foreach($movie->movieGenres as $mg)
                                    <div class="flex items-center space-x-2">
                                        <i class="fas fa-check text-purple-600"></i>
                                        <span class="text-sm font-medium text-gray-700">{{ $mg->genre->name }}</span>
                                    </div>
                                @endforeach
                            </div>
                            
                            <!-- Selected Genres Preview -->
                            <div class="mt-4 pt-4 border-t border-gray-300">
                                <p class="text-xs text-gray-500 mb-2">Selected genres:</p>
                                <div class="flex flex-wrap gap-2">
                                    @foreach($movie->movieGenres as $mg)
                                        <span class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                            {{ $mg->genre->name }}
                                        </span>
                                    @endforeach
                                </div>
                            </div>
                            @else
                            <p class="text-gray-500 text-sm">No genres added yet</p>
                            @endif
                        </div>
                    </div>
                    
                    <!-- Country Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-globe text-green-600 mr-2"></i>
                            Country
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @if($movie->movieCountries->count() > 0)
                            <!-- Selected Countries Display -->
                            <div class="flex flex-wrap gap-2 mb-3">
                                @foreach($movie->movieCountries as $mc)
                                    <span class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-full text-sm font-medium">
                                        {{ $mc->country->name }}
                                    </span>
                                @endforeach
                            </div>
                            @else
                            <p class="text-gray-500 text-sm">No countries added yet</p>
                            @endif
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Edit film to add countries where this film was produced
                            </p>
                        </div>
                    </div>
                    
                    <!-- Language Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-language text-orange-600 mr-2"></i>
                            Language
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @if($movie->movieLanguages->count() > 0)
                            <!-- Selected Languages Display -->
                            <div class="flex flex-wrap gap-2 mb-3">
                                @foreach($movie->movieLanguages as $ml)
                                    <span class="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-full text-sm font-medium">
                                        {{ $ml->language->name }}
                                    </span>
                                @endforeach
                            </div>
                            @else
                            <p class="text-gray-500 text-sm">No languages added yet</p>
                            @endif
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Edit film to add languages spoken in this film
                            </p>
                        </div>
                    </div>
                    
                    <!-- Edit Button -->
                    <div class="flex justify-end pt-4 border-t border-gray-200">
                        <a href="{{ route('admin.films.edit', $movie->id) }}" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <i class="fas fa-edit mr-2"></i>
                            Edit Metadata
                        </a>
                    </div>
                </div>
            </div>
            <!-- End Metadata Section -->
        </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
        <!-- Status Info -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-lg mb-4">Status</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Publication:</span>
                    <span class="px-3 py-1 text-sm font-semibold rounded-full 
                        {{ $movie->status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">
                        {{ ucfirst($movie->status) }}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Created:</span>
                    <span class="text-sm">Jan 15, 2024</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Last Updated:</span>
                    <span class="text-sm">Jan 20, 2024</span>
                </div>
            </div>
        </div>

        <!-- Streaming Services -->
        <div class="bg-white rounded-lg shadow p-6" x-data="{ showServiceModal: false, editingService: null }">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg">Available On</h3>
                <button @click="showServiceModal = true; editingService = null" 
                        class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                    <i class="fas fa-edit mr-1"></i> Edit
                </button>
            </div>
            <div class="space-y-3">
                @forelse($movie->movieServices as $movieService)
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
                            {{ substr($movieService->service->name, 0, 1) }}
                        </div>
                        <div>
                            <span class="font-medium">{{ $movieService->service->name }}</span>
                            @if($movieService->release_date)
                                <p class="text-xs text-gray-600">
                                    <i class="fas fa-calendar mr-1"></i>
                                    {{ \Carbon\Carbon::parse($movieService->release_date)->format('d M Y') }}
                                </p>
                            @endif
                            @if($movieService->availability_type)
                                <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded ml-2">
                                    {{ ucfirst($movieService->availability_type) }}
                                </span>
                            @endif
                        </div>
                    </div>
                </div>
                @empty
                <p class="text-gray-500 text-sm text-center py-4">No services added yet</p>
                @endforelse
            </div>

            <!-- Modal Edit Services -->
            <div x-show="showServiceModal" 
                 x-cloak
                 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                 @click.self="showServiceModal = false">
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Manage Available Services</h3>
                        <button @click="showServiceModal = false" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <form action="{{ route('admin.films.services.update', $movie->id) }}" method="POST">
                        @csrf
                        @method('PUT')
                        
                        <div class="space-y-4 mb-6">
                            <!-- Service Selection with Multiple Availability Types -->
                            @php
                                $allServices = \App\Models\Service::all();
                            @endphp
                            
                            @foreach($allServices as $service)
                            <div class="border rounded-lg p-4 hover:bg-gray-50">
                                <div class="font-medium mb-3">
                                    {{ $service->name }}
                                    <span class="text-xs text-gray-500">({{ ucfirst($service->type) }})</span>
                                </div>
                                
                                @if($service->type === 'streaming')
                                    <!-- For streaming services, show multiple availability options -->
                                    @php
                                        $availabilityTypes = ['stream', 'rent', 'buy'];
                                        $existingEntries = $movie->movieServices->where('service_id', $service->id);
                                    @endphp
                                    
                                    <div class="space-y-2 pl-4">
                                        @foreach($availabilityTypes as $availType)
                                        @php
                                            $existingEntry = $existingEntries->firstWhere('availability_type', $availType);
                                            $isChecked = $existingEntry !== null;
                                        @endphp
                                        <div class="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                                            <input type="checkbox" 
                                                   name="services[{{ $service->id }}][{{ $availType }}][enabled]" 
                                                   value="1"
                                                   {{ $isChecked ? 'checked' : '' }}
                                                   id="service_{{ $service->id }}_{{ $availType }}"
                                                   class="mt-1">
                                            <div class="flex-1">
                                                <label for="service_{{ $service->id }}_{{ $availType }}" class="font-medium cursor-pointer text-sm">
                                                    {{ ucfirst($availType) }}
                                                </label>
                                                
                                                <input type="hidden" 
                                                       name="services[{{ $service->id }}][{{ $availType }}][availability_type]" 
                                                       value="{{ $availType }}">
                                                
                                                <div class="mt-1">
                                                    <label class="block text-xs text-gray-700 mb-1">
                                                        Release Date <span class="text-gray-500">(Optional)</span>
                                                    </label>
                                                    <input type="date" 
                                                           name="services[{{ $service->id }}][{{ $availType }}][release_date]"
                                                           value="{{ $existingEntry->release_date ?? '' }}"
                                                           class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                                </div>
                                            </div>
                                        </div>
                                        @endforeach
                                    </div>
                                @else
                                    <!-- For theatrical services, single entry -->
                                    @php
                                        $existingEntry = $movie->movieServices->firstWhere('service_id', $service->id);
                                        $isChecked = $existingEntry !== null;
                                    @endphp
                                    <div class="flex items-start space-x-3 pl-4">
                                        <input type="checkbox" 
                                               name="services[{{ $service->id }}][theatrical][enabled]" 
                                               value="1"
                                               {{ $isChecked ? 'checked' : '' }}
                                               id="service_{{ $service->id }}_theatrical"
                                               class="mt-1">
                                        <div class="flex-1">
                                            <label for="service_{{ $service->id }}_theatrical" class="font-medium cursor-pointer text-sm">
                                                Enable
                                            </label>
                                            
                                            <input type="hidden" 
                                                   name="services[{{ $service->id }}][theatrical][availability_type]" 
                                                   value="stream">
                                            
                                            <div class="mt-2">
                                                <label class="block text-sm text-gray-700 mb-1">Release Date</label>
                                                <input type="date" 
                                                       name="services[{{ $service->id }}][theatrical][release_date]"
                                                       value="{{ $existingEntry->release_date ?? '' }}"
                                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            </div>
                                        </div>
                                    </div>
                                @endif
                            </div>
                            @endforeach
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button type="button" 
                                    @click="showServiceModal = false"
                                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <i class="fas fa-save mr-2"></i>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Statistics -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-lg mb-4">Statistics</h3>
            <div class="space-y-4">
                <div>
                    <div class="flex justify-between items-center text-sm mb-2">
                        <span class="text-gray-600">Average Rating</span>
                        <div class="flex items-center">
                            @php
                                $rating = $movie->rating_average ?? 0;
                            @endphp
                            @for($i = 1; $i <= 5; $i++)
                                @if($i <= floor($rating))
                                    <i class="fas fa-star text-yellow-400 text-xs"></i>
                                @elseif($i == floor($rating) + 1 && ($rating - floor($rating)) >= 0.5)
                                    <i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>
                                @else
                                    <i class="far fa-star text-yellow-400 text-xs"></i>
                                @endif
                            @endfor
                            <span class="font-bold ml-2">{{ number_format($rating, 1) }}/5</span>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-yellow-400 h-2 rounded-full" style="width: {{ ($rating / 5) * 100 }}%"></div>
                    </div>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Total Reviews:</span>
                    <span class="font-bold">{{ number_format($totalReviews) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Views:</span>
                    <span class="font-bold">{{ number_format($movie->ratings()->count()) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Likes:</span>
                    <span class="font-bold">{{ number_format($movie->likes()->count()) }}</span>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-lg mb-4">Quick Actions</h3>
            <div class="space-y-2">
                <form method="POST" action="{{ route('admin.films.toggle-status', $movie->id) }}">
                    @csrf
                    @method('PUT')
                    <button type="submit" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-200">
                        <i class="fas fa-toggle-on mr-2"></i>
                        {{ $movie->status === 'published' ? 'Unpublish' : 'Publish' }}
                    </button>
                </form>
                <form method="POST" action="{{ route('admin.films.duplicate', $movie->id) }}">
                    @csrf
                    <button type="submit" 
                            class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors duration-200">
                        <i class="fas fa-copy mr-2"></i>
                        Duplicate
                    </button>
                </form>
                <form method="POST" action="{{ route('admin.films.destroy', $movie->id) }}" onsubmit="return confirm('Are you sure you want to delete this film? This action cannot be undone.')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" 
                            class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors duration-200">
                        <i class="fas fa-trash mr-2"></i>
                        Delete Film
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
// Media Manager Alpine.js component
document.addEventListener('alpine:init', () => {
    Alpine.data('mediaManager', () => ({
        currentTab: 'posters',
        
        openFileDialog() {
            document.getElementById('mediaFileInput').click();
        },
        
        async handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const activeTab = this.currentTab;
            const mediaType = activeTab === 'posters' ? 'poster' : 'backdrop';
            
            const formData = new FormData();
            formData.append('media_file', file);
            formData.append('media_type', mediaType);
            formData.append('_token', '{{ csrf_token() }}');
            
            try {
                const response = await fetch('{{ route("admin.films.media.upload", $movie->id) }}', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert(data.message);
                    location.reload(); // Reload to show new media
                } else {
                    alert('Error: ' + (data.message || 'Upload gagal'));
                }
            } catch (error) {
                alert('Error uploading file: ' + error.message);
            }
            
            event.target.value = ''; // Reset input
        }
    }));
});

// Set media as default
async function setMediaDefault(movieId, mediaId) {
    if (!confirm('Set sebagai media default?')) return;
    
    try {
        const response = await fetch(`/admin/films/${movieId}/media/${mediaId}/default`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Delete media
async function deleteMedia(movieId, mediaId) {
    if (!confirm('Hapus media ini?')) return;
    
    try {
        const response = await fetch(`/admin/films/${movieId}/media/${mediaId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Delete cast/crew
async function deleteCastCrew(movieId, moviePersonId) {
    if (!confirm('Hapus cast/crew ini?')) return;
    
    try {
        const response = await fetch(`/admin/films/${movieId}/cast-crew/${moviePersonId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
</script>
@endpush
