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
    <a href="{{ route('admin.films.edit', $movie->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" class="bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50">
        <i class="fas fa-edit mr-2"></i>
        Edit Film
    </a>
</div>

<!-- Quick Actions -->
<div class="mb-6 flex space-x-3">
    <a href="{{ route('admin.films.index') . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" class="text-blue-600 hover:text-blue-800 flex items-center">
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
                <div class="flex-1 pb-4 min-w-0">
                    <h1 id="film-title-hero" class="font-bold mb-2 break-words leading-tight" style="font-size: clamp(1.75rem, 4vw, 3rem); overflow-wrap: anywhere;">{{ $movie->title }}</h1>
                    @if($movie->original_title)
                        <p id="film-original-title" class="font-normal mb-2 break-words text-gray-300" style="font-size: clamp(0.95rem, 1.8vw, 1.15rem);">{{ $movie->original_title }}</p>
                    @endif
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
                // Get actual rating distribution from database (0.5-5.0 increments)
                $ratingDistribution = [];
                for ($i = 5; $i >= 0.5; $i -= 0.5) {
                    $ratingDistribution[number_format($i, 1)] = $movie->ratings()
                        ->where('rating', round($i, 1))
                        ->count();
                }
                $totalRatings = array_sum($ratingDistribution);
                
                // Calculate average rating
                $totalPoints = 0;
                foreach ($ratingDistribution as $rating => $count) {
                    $totalPoints += (float)$rating * $count;
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
                @foreach($ratingDistribution as $stars => $count)
                    @php
                        $percentage = $totalRatings > 0 ? ($count / $totalRatings) * 100 : 0;
                    @endphp
                    
                    <div class="flex items-center gap-4">
                        <!-- Rating Label -->
                        <div class="flex items-center w-28">
                            <span class="text-sm font-semibold text-gray-700 w-10">{{ $stars }}</span>
                            <i class="fas fa-star text-yellow-400 text-sm"></i>
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
                        <button @click="setTab('posters')" 
                                :class="activeTab === 'posters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                            <i class="fas fa-image mr-2"></i>
                            Posters ({{ count($posters) }})
                        </button>
                        <button @click="setTab('backdrops')" 
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
                    
                    <!-- Theme Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-palette text-purple-600 mr-2"></i>
                            Themes
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @if($movie->movieThemes->count() > 0)
                            <div class="flex flex-wrap gap-2 mb-3">
                                @foreach($movie->movieThemes as $mt)
                                    <span class="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm font-medium">
                                        {{ $mt->theme->name }}
                                    </span>
                                @endforeach
                            </div>
                            @else
                            <p class="text-gray-500 text-sm">No themes added yet</p>
                            @endif
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Edit film to add themes and moods for this film
                            </p>
                        </div>
                    </div>
                    
                    <!-- Release Dates Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-calendar-alt text-blue-600 mr-2"></i>
                            Release Dates
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            @php
                                $releaseStatus = $movie->release_status;
                                $releaseTypeLabels = [
                                    \App\Models\MovieRelease::TYPE_PREMIERE => 'Premiere / Festival',
                                    \App\Models\MovieRelease::TYPE_THEATRICAL => 'Theatrical',
                                    \App\Models\MovieRelease::TYPE_STREAMING => 'Streaming',
                                ];
                                $releaseTypeColors = [
                                    \App\Models\MovieRelease::TYPE_PREMIERE => 'bg-purple-100 text-purple-800',
                                    \App\Models\MovieRelease::TYPE_THEATRICAL => 'bg-blue-100 text-blue-800',
                                    \App\Models\MovieRelease::TYPE_STREAMING => 'bg-green-100 text-green-800',
                                ];
                            @endphp

                            <div class="flex items-center space-x-3 mb-4">
                                @if($releaseStatus === 'released')
                                    <span class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-full text-sm font-semibold">
                                        <i class="fas fa-circle-check mr-2"></i>
                                        Rilis
                                    </span>
                                    <p class="text-xs text-gray-500">
                                        Sudah ada rilis theatrical/streaming yang tanggalnya telah lewat.
                                    </p>
                                @else
                                    <span class="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded-full text-sm font-semibold">
                                        <i class="fas fa-clock mr-2"></i>
                                        Coming Soon
                                    </span>
                                    <p class="text-xs text-gray-500">
                                        Belum ada rilis theatrical/streaming yang tanggalnya lewat. Hari ini: {{ now()->format('d M Y') }}.
                                    </p>
                                @endif
                            </div>

                            @if($movie->movieReleases->count() > 0)
                                <div class="space-y-2">
                                    @foreach($movie->movieReleases as $release)
                                        <div class="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                            <div class="flex items-center space-x-2">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {{ $releaseTypeColors[$release->type] ?? 'bg-gray-100 text-gray-700' }}">
                                                    {{ $releaseTypeLabels[$release->type] ?? ucfirst($release->type) }}
                                                </span>
                                                @if($release->country_code)
                                                    @php
                                                        $flag = '';
                                                        foreach (str_split(strtoupper($release->country_code)) as $letter) {
                                                            $flag .= mb_chr(127397 + ord($letter));
                                                        }
                                                    @endphp
                                                    <span class="text-base">{{ $flag }}</span>
                                                    <span class="text-sm font-medium text-gray-700">
                                                        {{ $countryNameByCode[$release->country_code] ?? $release->country_code }}
                                                    </span>
                                                @endif
                                                @if($release->name)
                                                    <span class="text-sm text-gray-500">— {{ $release->name }}</span>
                                                @endif
                                            </div>
                                            <span class="text-sm font-medium text-gray-800">
                                                <i class="fas fa-calendar-day text-gray-400 mr-1"></i>
                                                {{ \Carbon\Carbon::parse($release->release_date)->format('d M Y') }}
                                            </span>
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                <p class="text-gray-500 text-sm">Belum ada data rilis.</p>
                            @endif

                            <p class="mt-3 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Tanggal premiere paling awal dipakai sebagai primary release date untuk sort & filter tahun.
                            </p>
                        </div>
                    </div>

                    <!-- Edit Button -->
                    <div class="flex justify-end pt-4 border-t border-gray-200">
                        <a href="{{ route('admin.films.edit', $movie->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <i class="fas fa-edit mr-2"></i>
                            Edit Metadata
                        </a>
                    </div>
                </div>
            </div>
            <!-- End Metadata Section -->
        </div>
    <!-- Related Films — paling bawah, di luar area metadata, width konsisten dengan left column -->
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-2 flex items-center">
            <i class="fas fa-link text-blue-600 mr-2"></i>
            Related Films
            <span class="ml-2 text-sm font-normal text-gray-500">({{ isset($relatedMovies) ? $relatedMovies->count() : 0 }})</span>
        </h2>
        <p class="text-sm text-gray-500 mb-4"><i class="fas fa-info-circle mr-1"></i>Film yang saling terkait (mis. Vengeance Trilogy). Urutan sesuai sort_order — simetris.</p>
        @if(isset($relatedMovies) && $relatedMovies->count() > 0)
            <div class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style="scrollbar-width: thin;">
                @foreach($relatedMovies as $rm)
                    <a href="{{ route('admin.films.show', $rm->id) }}" class="group flex-shrink-0 w-28 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div class="aspect-[2/3] bg-gray-100 overflow-hidden">
                            @if($rm->default_poster_path)
                                <img src="{{ asset('storage/' . $rm->default_poster_path) }}" alt="{{ $rm->title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200">
                            @else
                                <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"><i class="fas fa-film text-xl"></i></div>
                            @endif
                        </div>
                        <div class="p-2">
                            <p class="text-xs font-medium text-gray-800 truncate" title="{{ $rm->title }}">{{ $rm->title }}</p>
                            <p class="text-[11px] text-gray-500">{{ $rm->release_year ?? '' }}</p>
                            <p class="text-[11px] text-blue-600">#{{ $loop->iteration }}</p>
                        </div>
                    </a>
                @endforeach
            </div>
        @else
            <p class="text-gray-500 text-sm">Belum ada related film. Tambahkan di <a href="{{ route('admin.films.edit', $movie->id) }}" class="text-blue-600 hover:underline">Edit Film → Related Films (paling bawah)</a>.</p>
        @endif
    </div>

    <!-- Similar Films — paling bawah setelah Related -->
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-2 flex items-center">
            <i class="fas fa-clone text-purple-600 mr-2"></i>
            Similar Films
            <span class="ml-2 text-sm font-normal text-gray-500">({{ isset($similarMovies) ? $similarMovies->count() : 0 }})</span>
        </h2>
        <p class="text-sm text-gray-500 mb-4"><i class="fas fa-info-circle mr-1"></i>Film yang mirip (manual). Urutan sesuai sort_order — simetris.</p>
        @if(isset($similarMovies) && $similarMovies->count() > 0)
            <div class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style="scrollbar-width: thin;">
                @foreach($similarMovies as $sm)
                    <a href="{{ route('admin.films.show', $sm->id) }}" class="group flex-shrink-0 w-28 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div class="aspect-[2/3] bg-gray-100 overflow-hidden">
                            @if($sm->default_poster_path)
                                <img src="{{ asset('storage/' . $sm->default_poster_path) }}" alt="{{ $sm->title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200">
                            @else
                                <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"><i class="fas fa-film text-xl"></i></div>
                            @endif
                        </div>
                        <div class="p-2">
                            <p class="text-xs font-medium text-gray-800 truncate" title="{{ $sm->title }}">{{ $sm->title }}</p>
                            <p class="text-[11px] text-gray-500">{{ $sm->release_year ?? '' }}</p>
                            <p class="text-[11px] text-purple-600">#{{ $loop->iteration }}</p>
                        </div>
                    </a>
                @endforeach
            </div>
        @else
            <p class="text-gray-500 text-sm">Belum ada similar film. Tambahkan di <a href="{{ route('admin.films.edit', $movie->id) }}" class="text-purple-600 hover:underline">Edit Film → Similar Films (paling bawah)</a>.</p>
        @endif
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
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Primary Release Date:</span>
                    <span class="text-sm font-medium">{{ $movie->primary_release_date ? \Carbon\Carbon::parse($movie->primary_release_date)->format('d M Y') : '-' }} <span class="text-xs text-gray-400">({{ $movie->release_status ?? '-' }})</span></span>
                </div>
            </div>
        </div>

        <!-- Streaming Services -->
        <div class="bg-white rounded-lg shadow p-6" x-data="serviceModal">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg">Available On</h3>
                <button @click="openServiceModal()" 
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
                            <div class="flex items-center gap-2">
                                <span class="font-medium">{{ $movieService->service->name }}</span>
                                @if($movieService->is_coming_soon)
                                    <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                                        <i class="fas fa-clock mr-1"></i>
                                        Coming Soon
                                    </span>
                                @elseif($movieService->availability_type)
                                    <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                        {{ ucfirst($movieService->availability_type) }}
                                    </span>
                                @endif
                            </div>
                            @if($movieService->release_date)
                                <p class="text-xs text-gray-600 mt-1">
                                    <i class="fas fa-calendar mr-1"></i>
                                    {{ \Carbon\Carbon::parse($movieService->release_date)->format('d M Y') }}
                                </p>
                            @endif
                            @if($movieService->service->type === 'streaming')
                                @php
                                    $serviceCountries = $movie->movieServiceCountries
                                        ->where('service_id', $movieService->service_id)
                                        ->where('availability_type', $movieService->availability_type)
                                        ->map(fn($msc) => $msc->country)
                                        ->filter()
                                        ->values();
                                @endphp
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-globe mr-1"></i>
                                    {{ ucfirst($movieService->availability_type) }}:
                                    @if($serviceCountries->isEmpty())
                                        available in all countries
                                    @else
                                        available in {{ $serviceCountries->pluck('code')->implode(', ') }}
                                    @endif
                                </p>
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
                 @click.self="closeServiceModal()">
                <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                    <div class="flex justify-between items-center p-6 pb-3 shrink-0">
                        <h3 class="text-lg font-bold">Manage Available Services</h3>
                        <div class="flex items-center gap-2">
                            <button type="button"
                                    @click="openAddService()"
                                    class="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                                <i class="fas fa-plus mr-1"></i> Add Service
                            </button>
                            <button @click="closeServiceModal()" class="text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Add/Edit Service (separate form — a form cannot nest) -->
                    <div x-show="serviceForm.open" x-cloak class="mx-6 mb-3 shrink-0 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="font-bold text-sm" x-text="serviceForm.mode === 'add' ? 'Add Service' : 'Edit Service'"></h4>
                            <button type="button" @click="cancelServiceForm()" class="text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="serviceAdminForm" enctype="multipart/form-data" @submit.prevent="saveService()" class="space-y-3">
                            <input type="hidden" name="_method" value="PUT" x-show="serviceForm.mode === 'edit'"
                                   :disabled="serviceForm.mode !== 'edit'">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                <input type="text" name="name" x-model="serviceForm.name" required maxlength="100"
                                       class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                                <select name="type" x-model="serviceForm.type"
                                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="streaming">Streaming</option>
                                    <option value="theatrical">Theatrical</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">
                                    Logo <span class="text-gray-500">(JPG/PNG/WEBP, max 2 MB)</span>
                                </label>
                                <div class="flex items-start gap-3">
                                    <div class="w-12 h-12 shrink-0 border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden">
                                        <img x-show="serviceForm.logoUrl" x-cloak :src="serviceForm.logoUrl" alt=""
                                             class="w-full h-full object-contain">
                                        <span x-show="!serviceForm.logoUrl"
                                              class="text-lg font-bold text-blue-500"
                                              x-text="(serviceForm.name || 'S').charAt(0).toUpperCase()"></span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <input type="file" name="logo" id="serviceLogoInput"
                                               accept="image/jpeg,image/png,image/webp"
                                               @change="handleLogoSelect($event)"
                                               class="text-sm w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                                        <p x-show="serviceForm.logoError" x-cloak x-text="serviceForm.logoError"
                                           class="text-xs text-red-600 mt-1"></p>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <button type="button" @click="cancelServiceForm()"
                                        class="px-3 py-1 border border-gray-300 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Cancel</button>
                                <button type="submit" :disabled="serviceForm.saving"
                                        class="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                    <i class="fas fa-save mr-1"></i>
                                    <span x-text="serviceForm.saving ? 'Saving...' : 'Save Service'"></span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <form action="{{ route('admin.films.services.update', $movie->id) }}" method="POST" class="flex-1 min-h-0 flex flex-col">
                        @csrf
                        @method('PUT')
                        
                        <div class="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                            @php
                                $allServices = \App\Models\Service::all();
                                $streamingServicesList = $allServices->where('type', 'streaming');
                                $theatricalServicesList = $allServices->where('type', 'theatrical');
                                $allCountries = \App\Models\Country::orderBy('name')
                                    ->get(['id', 'code', 'name'])
                                    ->map(fn($c) => ['id' => $c->id, 'code' => $c->code, 'name' => $c->name]);
                                $serviceLogos = $allServices->mapWithKeys(fn($s) => [
                                    $s->id => $s->logo_path ? url('storage/' . $s->logo_path) : null,
                                ]);
                                $theatricalEnabled = [];
                                foreach ($theatricalServicesList as $ts) {
                                    $theatricalEnabled[$ts->id] = $movie->movieServices
                                        ->where('service_id', $ts->id)->isNotEmpty();
                                }
                            @endphp
                            <script>
                                window.allServiceCountries = @json($allCountries);
                                window.moviewServiceLogos = @json($serviceLogos);
                                // Mirror of App\Services\AvailabilityResolver::status() for live preview only.
                                window.moviewAvailabilityStatus = function (dateStr, comingSoon) {
                                    if (dateStr) {
                                        var t = new Date();
                                        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
                                        var today = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
                                        return dateStr > today ? 'Coming Soon' : 'Available';
                                    }
                                    return comingSoon ? 'Coming Soon' : 'Available';
                                };
                                window.cinemaCountryPicker = function (selected, defaults) {
                                    return {
                                        selected: selected || [],
                                        defaults: defaults || {},
                                        defDate: (defaults && defaults.date) || '',
                                        defCs: !!(defaults && defaults.cs),
                                        ov: {},
                                        ovDate: {},
                                        ovCs: {},
                                        search: '',
                                        open: false,
                                        on: !!(defaults && defaults.on),
                                        init() {
                                            (this.selected || []).forEach(c => {
                                                if (c.override) {
                                                    this.ov[c.id] = true;
                                                    this.ovDate[c.id] = c.date || '';
                                                    this.ovCs[c.id] = !!c.cs;
                                                }
                                            });
                                        },
                                        get filtered() {
                                            const q = this.search.toLowerCase();
                                            return (window.allServiceCountries || []).filter(c =>
                                                !this.selected.some(s => s.id === c.id) &&
                                                (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
                                            ).slice(0, 50);
                                        },
                                        add(c) { this.selected.push(c); this.search = ''; this.open = false; },
                                        remove(id) {
                                            this.selected = this.selected.filter(s => s.id !== id);
                                            delete this.ov[id]; delete this.ovDate[id]; delete this.ovCs[id];
                                        },
                                        toggleOverride(c, checked) {
                                            if (!checked) return;
                                            if (this.ovDate[c.id] === undefined) this.ovDate[c.id] = this.defDate;
                                            if (this.ovCs[c.id] === undefined) this.ovCs[c.id] = this.defCs;
                                        },
                                        chipStatus(c) {
                                            const on = !!this.ov[c.id];
                                            const date = on ? (this.ovDate[c.id] || '') : this.defDate;
                                            const cs = on ? !!this.ovCs[c.id] : this.defCs;
                                            return 'Status: ' + window.moviewAvailabilityStatus(date, cs);
                                        },
                                        overrideCount() {
                                            return Object.keys(this.ov).filter(k => this.ov[k]).length;
                                        }
                                    };
                                };
                            </script>

                            <!-- STREAMING group -->
                            <div>
                                <div class="sticky top-0 z-10 bg-white -mx-6 px-6 pt-3 pb-3 border-b border-gray-200" id="streamingGroupHeading">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Streaming</span>
                                        <span class="text-xs text-gray-500 truncate">Country availability is set per availability type (Stream/Rent/Buy)</span>
                                    </div>
                                    <input type="text" x-model="streamQuery"
                                           placeholder="Cari layanan streaming..."
                                           class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                    <div x-show="streamVisible === 0" x-cloak class="text-xs text-gray-400 mt-2">
                                        Tidak ada layanan yang cocok dengan pencarian.
                                    </div>
                                </div>
                                <div class="space-y-4 pt-3" id="streamingServiceRows">
                                    @foreach($streamingServicesList as $service)
                                    @php
                                        $availabilityTypes = ['stream', 'rent', 'buy'];
                                        $existingEntries = $movie->movieServices->where('service_id', $service->id);
                                        $existingCountriesByType = $movie->movieServiceCountries
                                            ->where('service_id', $service->id)
                                            ->groupBy('availability_type');
                                        $enabledTypes = [];
                                        $anyComingSoon = false;
                                        foreach ($availabilityTypes as $t) {
                                            $entry = $existingEntries->firstWhere('availability_type', $t);
                                            if ($entry) {
                                                $enabledTypes[] = $t;
                                                if ($entry->is_coming_soon) $anyComingSoon = true;
                                            }
                                        }
                                        if (!$anyComingSoon && $movie->movieServiceCountries
                                            ->where('service_id', $service->id)
                                            ->where('is_coming_soon', 1)->isNotEmpty()) {
                                            $anyComingSoon = true;
                                        }
                                        if (!$enabledTypes) {
                                            $summary = 'Nonaktif';
                                        } else {
                                            $segments = [];
                                            foreach ($enabledTypes as $t) {
                                                $cnt = ($existingCountriesByType->get($t) ?? collect())->count();
                                                $segments[] = ucfirst($t) . ' • ' . ($cnt === 0 ? 'All countries' : $cnt . ' negara');
                                            }
                                            $summary = implode(', ', $segments);
                                            if ($anyComingSoon) $summary .= ' • Coming Soon';
                                        }
                                        $dataSearch = strtolower($service->name . ' ' . $service->type . ' ' . $summary);
                                    @endphp
                                    <div class="border rounded-lg p-4 hover:bg-gray-50" data-service-card
                                         x-show="rowVisible($el, streamQuery)">
                                        <div class="font-medium flex items-center justify-between gap-2" data-service-row="{{ $service->id }}" data-search="{{ $dataSearch }}">
                                            <button type="button"
                                                    class="flex min-w-0 items-center gap-2 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    @click="toggleExpand({{ $service->id }})"
                                                    :aria-expanded="expanded[{{ $service->id }}] ? 'true' : 'false'"
                                                    aria-controls="service-panel-{{ $service->id }}">
                                                <i class="fas fa-chevron-right text-xs text-gray-400 transition-transform shrink-0"
                                                   :class="expanded[{{ $service->id }}] ? 'rotate-90' : ''"></i>
                                                <span data-service-name>{{ $service->name }}</span>
                                                <span class="text-xs text-gray-500 shrink-0">(streaming)</span>
                                                <span class="text-xs text-gray-400 truncate" data-summary="{{ $summary }}" title="{{ $summary }}">{{ $summary }}</span>
                                            </button>
                                            <button type="button"
                                                    @click.stop="openEditService({{ $service->id }}, 'streaming')"
                                                    class="text-xs text-blue-600 hover:text-blue-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" title="Edit service">
                                                <i class="fas fa-pen"></i>
                                            </button>
                                        </div>

                                        <div x-show="expanded[{{ $service->id }}]" x-cloak id="service-panel-{{ $service->id }}" class="mt-3">
                                        <div class="space-y-3 pl-4">
                                            @foreach($availabilityTypes as $availType)
                                            @php
                                                $existingEntry = $existingEntries->firstWhere('availability_type', $availType);
                                                $isChecked = $existingEntry !== null;
                                                $selectedForType = ($existingCountriesByType->get($availType) ?? collect())
                                                    ->filter(fn($msc) => $msc->country)
                                                    ->map(fn($msc) => [
                                                        'id' => $msc->country['id'] ?? $msc->country->id,
                                                        'code' => $msc->country['code'] ?? $msc->country->code,
                                                        'name' => $msc->country['name'] ?? $msc->country->name,
                                                        'override' => $msc->is_coming_soon !== null,
                                                        'date' => $msc->available_from,
                                                        'cs' => (bool) $msc->is_coming_soon,
                                                    ])
                                                    ->values()
                                                    ->all();
                                            @endphp
                                            <div class="border border-gray-200 rounded p-3"
                                                 x-data="window.cinemaCountryPicker(@js($selectedForType), { dateId: 'avail_date_{{ $service->id }}_{{ $availType }}', csId: 'coming_soon_{{ $service->id }}_{{ $availType }}', date: @js($existingEntry->release_date ?? ''), cs: {{ ($existingEntry->is_coming_soon ?? 0) ? 'true' : 'false' }}, on: {{ $isChecked ? 'true' : 'false' }} })">
                                                <div class="flex items-center justify-between gap-2">
                                                    <div class="flex items-center gap-2 min-w-0">
                                                        <input type="checkbox"
                                                               name="services[{{ $service->id }}][{{ $availType }}][enabled]"
                                                               value="1"
                                                               {{ $isChecked ? 'checked' : '' }}
                                                               id="service_{{ $service->id }}_{{ $availType }}"
                                                               x-model="on"
                                                               class="sr-only peer">
                                                        <label for="service_{{ $service->id }}_{{ $availType }}"
                                                               class="relative inline-block w-9 h-5 shrink-0 rounded-full bg-gray-300 cursor-pointer transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-blue-500 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                                                               title="Aktifkan / nonaktifkan tipe ini"></label>
                                                        <label for="service_{{ $service->id }}_{{ $availType }}" class="font-medium cursor-pointer text-sm shrink-0">
                                                            {{ ucfirst($availType) }}
                                                        </label>
                                                        <span x-show="overrideCount() > 0" x-cloak
                                                              class="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0"
                                                              title="Ada negara dengan pengaturan manual">Manual</span>
                                                    </div>
                                                </div>

                                                <input type="hidden"
                                                       name="services[{{ $service->id }}][{{ $availType }}][availability_type]"
                                                       value="{{ $availType }}">

                                                <div x-show="on" x-cloak class="mt-2">
                                                        <div class="mt-1 space-y-2">
                                                            <div>
                                                                <label class="block text-xs text-gray-700 mb-1">
                                                                    Available From <span class="text-gray-500">(Optional)</span>
                                                                </label>
                                                                <input type="date"
                                                                       id="avail_date_{{ $service->id }}_{{ $availType }}"
                                                                       name="services[{{ $service->id }}][{{ $availType }}][release_date]"
                                                                       value="{{ $existingEntry->release_date ?? '' }}"
                                                                       x-model="defDate"
                                                                       class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                                            </div>
                                                            <div class="flex items-center space-x-2">
                                                                <input type="hidden"
                                                                       name="services[{{ $service->id }}][{{ $availType }}][is_coming_soon]"
                                                                       value="0">
                                                                <input type="checkbox"
                                                                       name="services[{{ $service->id }}][{{ $availType }}][is_coming_soon]"
                                                                       value="1"
                                                                       {{ ($existingEntry->is_coming_soon ?? 0) ? 'checked' : '' }}
                                                                       id="coming_soon_{{ $service->id }}_{{ $availType }}"
                                                                       x-model="defCs"
                                                                       class="rounded">
                                                                <label for="coming_soon_{{ $service->id }}_{{ $availType }}" class="text-xs text-gray-700 cursor-pointer">
                                                                    <i class="fas fa-clock text-blue-500 mr-1"></i>
                                                                    Coming Soon
                                                                </label>
                                                            </div>
                                                            <div class="text-xs text-gray-500"
                                                                 x-text="'Status: ' + moviewAvailabilityStatus(defDate, defCs)"></div>
                                                        </div>

                                                <!-- Country availability for this availability type -->
                                                <div class="mt-3">
                                                    <label class="block text-xs text-gray-700 mb-1">
                                                        <i class="fas fa-globe text-blue-500 mr-1"></i>Available Countries
                                                    </label>
                                                    <div class="flex flex-wrap gap-1 mb-1">
                                                        <span x-show="selected.length === 0" class="text-xs text-gray-500">
                                                            No selection = available in all countries
                                                        </span>
                                                        <span x-show="selected.length > 0" class="text-xs text-amber-600">
                                                            Selected = this type only applies to the chosen countries
                                                        </span>
                                                    </div>
                                                    <div class="space-y-1 mb-1">
                                                        <template x-for="c in selected" :key="c.id">
                                                            <div class="border border-gray-200 rounded px-2 py-1">
                                                                <div class="flex items-center justify-between gap-2">
                                                                    <span class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                                                        <span x-text="c.code + ' · ' + c.name"></span>
                                                                        <button type="button" @click="remove(c.id)"
                                                                                class="text-blue-400 hover:text-blue-700 font-bold leading-none"
                                                                                aria-label="Remove country"><i class="fas fa-xmark"></i></button>
                                                                    </span>
                                                                    <label class="text-xs text-gray-700 cursor-pointer whitespace-nowrap">
                                                                        <input type="checkbox" class="rounded"
                                                                               x-model="ov[c.id]"
                                                                               @change="toggleOverride(c, $event.target.checked)">
                                                                        Atur manual
                                                                    </label>
                                                                </div>
                                                                <template x-if="ov[c.id]">
                                                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                                                        <input type="date"
                                                                               class="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                               :name="'services[{{ $service->id }}][{{ $availType }}][overrides][' + c.id + '][available_from]'"
                                                                               x-model="ovDate[c.id]">
                                                                        <input type="hidden"
                                                                               :name="'services[{{ $service->id }}][{{ $availType }}][overrides][' + c.id + '][is_coming_soon]'"
                                                                               value="0">
                                                                        <input type="checkbox" class="rounded"
                                                                               :name="'services[{{ $service->id }}][{{ $availType }}][overrides][' + c.id + '][is_coming_soon]'"
                                                                               value="1"
                                                                               x-model="ovCs[c.id]">
                                                                        <label class="text-xs text-gray-700 cursor-pointer">
                                                                            <i class="fas fa-clock text-blue-500 mr-1"></i> Coming Soon
                                                                        </label>
                                                                    </div>
                                                                </template>
                                                                <div class="text-xs mt-0.5"
                                                                     :class="ov[c.id] ? 'text-amber-600' : 'text-gray-500'"
                                                                     x-text="chipStatus(c)"></div>
                                                            </div>
                                                        </template>
                                                    </div>
                                                    <div class="relative">
                                                        <input type="text" x-model="search" @focus="open = true"
                                                               @click.outside="open = false"
                                                               placeholder="Search country to add..."
                                                               class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                                        <div x-show="open && search.length > 0" x-cloak
                                                             class="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg">
                                                            <template x-for="c in filtered" :key="c.id">
                                                                <div class="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer flex justify-between"
                                                                     @click="add(c)">
                                                                    <span x-text="c.name"></span>
                                                                    <span class="text-gray-400" x-text="c.code"></span>
                                                                </div>
                                                            </template>
                                                            <div x-show="filtered.length === 0" class="px-3 py-1.5 text-sm text-gray-400">
                                                                No match
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <template x-for="c in selected" :key="'input-' + c.id">
                                                        <input type="hidden" name="services[{{ $service->id }}][{{ $availType }}][countries][]" :value="c.id">
                                                    </template>
                                                </div>
                                                </div>
                                            </div>
                                            @endforeach
                                        </div>
                                        </div>
                                    </div>
                                    @endforeach
                                </div>
                            </div>

                            <!-- THEATRICAL group -->
                            <div>
                                <div class="sticky top-0 z-10 bg-white -mx-6 px-6 pt-3 pb-3 border-b border-gray-200" id="theatricalGroupHeading">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-1 rounded shrink-0">Theatrical</span>
                                        <span class="text-xs text-gray-500 truncate">Cinema availability (no country restriction)</span>
                                    </div>
                                    <input type="text" x-model="theatricalQuery"
                                           placeholder="Cari layanan theatrical..."
                                           class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                    <div x-show="theatricalVisible === 0" x-cloak class="text-xs text-gray-400 mt-2">
                                        Tidak ada layanan yang cocok dengan pencarian.
                                    </div>
                                </div>
                                <div class="space-y-4 pt-3" id="theatricalServiceRows">
                                    @foreach($theatricalServicesList as $service)
                                    @php
                                        $existingEntry = $movie->movieServices->firstWhere('service_id', $service->id);
                                        $isChecked = $existingEntry !== null;
                                        $summary = 'Nonaktif';
                                        if ($existingEntry) {
                                            $summary = 'Theatrical';
                                            if ($existingEntry->is_coming_soon) $summary .= ' • Coming Soon';
                                            if ($existingEntry->release_date) $summary .= ' • ' . \Carbon\Carbon::parse($existingEntry->release_date)->format('d M Y');
                                        }
                                        $dataSearch = strtolower($service->name . ' ' . $service->type . ' ' . $summary);
                                    @endphp
                                    <div class="border rounded-lg p-4 hover:bg-gray-50" data-service-card
                                         x-show="rowVisible($el, theatricalQuery)">
                                        <div class="font-medium mb-3 flex items-center justify-between gap-2" data-service-row="{{ $service->id }}" data-search="{{ $dataSearch }}">
                                            <div class="flex min-w-0 items-center gap-2">
                                                <span data-service-name>{{ $service->name }}</span>
                                                <span class="text-xs text-gray-500 shrink-0">(theatrical)</span>
                                                <span class="text-xs text-gray-400 truncate" data-summary="{{ $summary }}" title="{{ $summary }}">{{ $summary }}</span>
                                            </div>
                                            <button type="button"
                                                    @click="openEditService({{ $service->id }}, 'theatrical')"
                                                    class="text-xs text-blue-600 hover:text-blue-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" title="Edit service">
                                                <i class="fas fa-pen"></i>
                                            </button>
                                        </div>
                                        <div class="flex items-center gap-2 pl-4 mb-2">
                                            <input type="checkbox"
                                                   name="services[{{ $service->id }}][theatrical][enabled]"
                                                   value="1"
                                                   {{ $isChecked ? 'checked' : '' }}
                                                   id="service_{{ $service->id }}_theatrical"
                                                   x-model="enabledTheatrical[{{ $service->id }}]"
                                                   class="sr-only peer">
                                            <label for="service_{{ $service->id }}_theatrical"
                                                   class="relative inline-block w-9 h-5 shrink-0 rounded-full bg-gray-300 cursor-pointer transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-blue-500 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                                                   title="Aktifkan / nonaktifkan layanan theatrical"></label>
                                            <label for="service_{{ $service->id }}_theatrical" class="font-medium cursor-pointer text-sm">
                                                Enable
                                            </label>
                                        </div>

                                        <input type="hidden"
                                               name="services[{{ $service->id }}][theatrical][availability_type]"
                                               value="stream">

                                        <div x-show="enabledTheatrical[{{ $service->id }}]" x-cloak class="pl-4 space-y-2">
                                            <div>
                                                <label class="block text-sm text-gray-700 mb-1">Release Date</label>
                                                <input type="date"
                                                       name="services[{{ $service->id }}][theatrical][release_date]"
                                                       value="{{ $existingEntry->release_date ?? '' }}"
                                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <input type="hidden"
                                                       name="services[{{ $service->id }}][theatrical][is_coming_soon]"
                                                       value="0">
                                                <input type="checkbox"
                                                       name="services[{{ $service->id }}][theatrical][is_coming_soon]"
                                                       value="1"
                                                       {{ ($existingEntry->is_coming_soon ?? 0) ? 'checked' : '' }}
                                                       id="coming_soon_{{ $service->id }}_theatrical"
                                                       class="rounded">
                                                <label for="coming_soon_{{ $service->id }}_theatrical" class="text-sm text-gray-700 cursor-pointer">
                                                    <i class="fas fa-clock text-blue-500 mr-1"></i>
                                                    Coming Soon
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="shrink-0 border-t border-gray-200 bg-white px-6 py-4 flex justify-end space-x-3">
                            <button type="button" 
                                    @click="closeServiceModal()"
                                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                Cancel
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                <i class="fas fa-save mr-2"></i>
                                Save Changes
                            </button>
                        </div>
                    </form>

                    <!-- Row templates used when a new service is added (Alpine auto-inits inserted nodes) -->
                    <template id="tplServiceRowStreaming">
                        <div class="border rounded-lg p-4 hover:bg-gray-50" data-service-card
                             x-show="rowVisible($el, streamQuery)">
                            <div class="font-medium flex items-center justify-between gap-2" data-service-row="__ID__" data-search="__NAME__ streaming nonaktif">
                                <button type="button"
                                        class="flex min-w-0 items-center gap-2 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        @click="toggleExpand(__ID__)"
                                        :aria-expanded="expanded[__ID__] ? 'true' : 'false'"
                                        aria-controls="service-panel-__ID__">
                                    <i class="fas fa-chevron-right text-xs text-gray-400 transition-transform shrink-0"
                                       :class="expanded[__ID__] ? 'rotate-90' : ''"></i>
                                    <span data-service-name>__NAME__</span>
                                    <span class="text-xs text-gray-500 shrink-0">(streaming)</span>
                                    <span class="text-xs text-gray-400 truncate" data-summary="Nonaktif" title="Nonaktif">Nonaktif</span>
                                </button>
                                <button type="button" @click.stop="openEditService(__ID__, 'streaming')"
                                        class="text-xs text-blue-600 hover:text-blue-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" title="Edit service">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <div x-show="expanded[__ID__]" x-cloak id="service-panel-__ID__" class="mt-3">
                            <div class="space-y-3 pl-4">
                                @foreach(['stream', 'rent', 'buy'] as $availType)
                                <div class="border border-gray-200 rounded p-3"
                                     x-data="window.cinemaCountryPicker([], { dateId: 'avail_date___ID___{{ $availType }}', csId: 'coming_soon___ID___{{ $availType }}', on: false })">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <input type="checkbox"
                                                   name="services[__ID__][{{ $availType }}][enabled]"
                                                   value="1"
                                                   id="service___ID___{{ $availType }}"
                                                   x-model="on"
                                                   class="sr-only peer">
                                            <label for="service___ID___{{ $availType }}"
                                                   class="relative inline-block w-9 h-5 shrink-0 rounded-full bg-gray-300 cursor-pointer transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-blue-500 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                                                   title="Aktifkan / nonaktifkan tipe ini"></label>
                                            <label for="service___ID___{{ $availType }}" class="font-medium cursor-pointer text-sm shrink-0">
                                                {{ ucfirst($availType) }}
                                            </label>
                                            <span x-show="overrideCount() > 0" x-cloak
                                                  class="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0"
                                                  title="Ada negara dengan pengaturan manual">Manual</span>
                                        </div>
                                    </div>

                                    <input type="hidden"
                                           name="services[__ID__][{{ $availType }}][availability_type]"
                                           value="{{ $availType }}">

                                    <div x-show="on" x-cloak class="mt-2">
                                            <div class="mt-1 space-y-2">
                                                <div>
                                                    <label class="block text-xs text-gray-700 mb-1">
                                                        Available From <span class="text-gray-500">(Optional)</span>
                                                    </label>
                                                    <input type="date"
                                                           id="avail_date___ID___{{ $availType }}"
                                                           name="services[__ID__][{{ $availType }}][release_date]"
                                                           value=""
                                                           x-model="defDate"
                                                           class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                                </div>
                                                <div class="flex items-center space-x-2">
                                                    <input type="hidden"
                                                           name="services[__ID__][{{ $availType }}][is_coming_soon]"
                                                           value="0">
                                                    <input type="checkbox"
                                                           name="services[__ID__][{{ $availType }}][is_coming_soon]"
                                                           value="1"
                                                           id="coming_soon___ID___{{ $availType }}"
                                                           x-model="defCs"
                                                           class="rounded">
                                                    <label for="coming_soon___ID___{{ $availType }}" class="text-xs text-gray-700 cursor-pointer">
                                                        <i class="fas fa-clock text-blue-500 mr-1"></i>
                                                        Coming Soon
                                                    </label>
                                                </div>
                                                <div class="text-xs text-gray-500"
                                                     x-text="'Status: ' + moviewAvailabilityStatus(defDate, defCs)"></div>
                                            </div>

                                            <!-- Country availability for this availability type -->
                                            <div class="mt-3">
                                                <label class="block text-xs text-gray-700 mb-1">
                                                    <i class="fas fa-globe text-blue-500 mr-1"></i>Available Countries
                                                </label>
                                                <div class="flex flex-wrap gap-1 mb-1">
                                                    <span x-show="selected.length === 0" class="text-xs text-gray-500">
                                                        No selection = available in all countries
                                                    </span>
                                                    <span x-show="selected.length > 0" class="text-xs text-amber-600">
                                                        Selected = this type only applies to the chosen countries
                                                    </span>
                                                </div>
                                                <div class="space-y-1 mb-1">
                                                    <template x-for="c in selected" :key="c.id">
                                                        <div class="border border-gray-200 rounded px-2 py-1">
                                                            <div class="flex items-center justify-between gap-2">
                                                                <span class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                                                    <span x-text="c.code + ' · ' + c.name"></span>
                                                                    <button type="button" @click="remove(c.id)"
                                                                            class="text-blue-400 hover:text-blue-700 font-bold leading-none"
                                                                            aria-label="Remove country"><i class="fas fa-xmark"></i></button>
                                                                </span>
                                                                <label class="text-xs text-gray-700 cursor-pointer whitespace-nowrap">
                                                                    <input type="checkbox" class="rounded"
                                                                           x-model="ov[c.id]"
                                                                           @change="toggleOverride(c, $event.target.checked)">
                                                                    Atur manual
                                                                </label>
                                                            </div>
                                                            <template x-if="ov[c.id]">
                                                                <div class="flex flex-wrap items-center gap-2 mt-1">
                                                                    <input type="date"
                                                                           class="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                           :name="'services[__ID__][{{ $availType }}][overrides][' + c.id + '][available_from]'"
                                                                           x-model="ovDate[c.id]">
                                                                    <input type="hidden"
                                                                           :name="'services[__ID__][{{ $availType }}][overrides][' + c.id + '][is_coming_soon]'"
                                                                           value="0">
                                                                    <input type="checkbox" class="rounded"
                                                                           :name="'services[__ID__][{{ $availType }}][overrides][' + c.id + '][is_coming_soon]'"
                                                                           value="1"
                                                                           x-model="ovCs[c.id]">
                                                                    <label class="text-xs text-gray-700 cursor-pointer">
                                                                        <i class="fas fa-clock text-blue-500 mr-1"></i> Coming Soon
                                                                    </label>
                                                                </div>
                                                            </template>
                                                            <div class="text-xs mt-0.5"
                                                                 :class="ov[c.id] ? 'text-amber-600' : 'text-gray-500'"
                                                                 x-text="chipStatus(c)"></div>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div class="relative">
                                                    <input type="text" x-model="search" @focus="open = true"
                                                           @click.outside="open = false"
                                                           placeholder="Search country to add..."
                                                           class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                                    <div x-show="open && search.length > 0" x-cloak
                                                         class="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg">
                                                        <template x-for="c in filtered" :key="c.id">
                                                            <div class="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer flex justify-between"
                                                                 @click="add(c)">
                                                                <span x-text="c.name"></span>
                                                                <span class="text-gray-400" x-text="c.code"></span>
                                                            </div>
                                                        </template>
                                                        <div x-show="filtered.length === 0" class="px-3 py-1.5 text-sm text-gray-400">
                                                            No match
                                                        </div>
                                                    </div>
                                                </div>
                                                <template x-for="c in selected" :key="'input-' + c.id">
                                                    <input type="hidden" name="services[__ID__][{{ $availType }}][countries][]" :value="c.id">
                                                </template>
                                            </div>
                                    </div>
                                </div>
                                @endforeach
                            </div>
                            </div>
                        </div>
                    </template>

                    <template id="tplServiceRowTheatrical">
                        <div class="border rounded-lg p-4 hover:bg-gray-50" data-service-card
                             x-show="rowVisible($el, theatricalQuery)">
                            <div class="font-medium mb-3 flex items-center justify-between gap-2" data-service-row="__ID__" data-search="__NAME__ theatrical nonaktif">
                                <div class="flex min-w-0 items-center gap-2">
                                    <span data-service-name>__NAME__</span>
                                    <span class="text-xs text-gray-500 shrink-0">(theatrical)</span>
                                    <span class="text-xs text-gray-400 truncate" data-summary="Nonaktif" title="Nonaktif">Nonaktif</span>
                                </div>
                                <button type="button" @click="openEditService(__ID__, 'theatrical')"
                                        class="text-xs text-blue-600 hover:text-blue-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" title="Edit service">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <div class="flex items-center gap-2 pl-4 mb-2">
                                <input type="checkbox" name="services[__ID__][theatrical][enabled]" value="1"
                                       id="service___ID___theatrical"
                                       x-model="enabledTheatrical[__ID__]"
                                       class="sr-only peer">
                                <label for="service___ID___theatrical"
                                       class="relative inline-block w-9 h-5 shrink-0 rounded-full bg-gray-300 cursor-pointer transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-blue-500 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                                       title="Aktifkan / nonaktifkan layanan theatrical"></label>
                                <label for="service___ID___theatrical" class="font-medium cursor-pointer text-sm">
                                    Enable
                                </label>
                            </div>

                            <input type="hidden" name="services[__ID__][theatrical][availability_type]" value="stream">

                            <div x-show="enabledTheatrical[__ID__]" x-cloak class="pl-4 space-y-2">
                                <div>
                                    <label class="block text-sm text-gray-700 mb-1">Release Date</label>
                                    <input type="date" name="services[__ID__][theatrical][release_date]"
                                           value=""
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="hidden" name="services[__ID__][theatrical][is_coming_soon]" value="0">
                                    <input type="checkbox" name="services[__ID__][theatrical][is_coming_soon]" value="1"
                                           id="coming_soon___ID___theatrical"
                                           class="rounded">
                                    <label for="coming_soon___ID___theatrical" class="text-sm text-gray-700 cursor-pointer">
                                        <i class="fas fa-clock text-blue-500 mr-1"></i> Coming Soon
                                    </label>
                                </div>
                            </div>
                        </div>
                    </template>
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
                <form method="POST" action="{{ route('admin.films.destroy', $movie->id) }}" onsubmit="return requireConfirm(event, 'Are you sure you want to delete this film? This action cannot be undone.', { form: this })">
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
// Service modal (availability editing + Add/Edit Service)
document.addEventListener('alpine:init', () => {
    Alpine.data('serviceModal', () => ({
        showServiceModal: false,
        editingService: null,
        serviceForm: { open: false, mode: 'add', id: null, name: '', type: 'streaming', origType: null, saving: false, logoUrl: '', logoError: '' },
        streamQuery: '',
        theatricalQuery: '',
        streamVisible: 0,
        theatricalVisible: 0,
        expanded: {},
        enabledTheatrical: @json($theatricalEnabled),

        init() {
            this.refreshVisibleCounts();
            this.$watch('streamQuery', () => this.refreshVisibleCounts());
            this.$watch('theatricalQuery', () => this.refreshVisibleCounts());
            this._escHandler = (e) => {
                if (e.key !== 'Escape') return;
                if (this.serviceForm.open) this.cancelServiceForm();
                else if (this.showServiceModal) this.closeServiceModal();
            };
            window.addEventListener('keydown', this._escHandler);
        },
        destroy() {
            if (this._escHandler) window.removeEventListener('keydown', this._escHandler);
        },
        openServiceModal() {
            this.showServiceModal = true;
            this.editingService = null;
            this.serviceForm.open = false;
            this.streamQuery = '';
            this.theatricalQuery = '';
            this.expanded = {};
            this.resetLogoPreview();
        },
        closeServiceModal() {
            this.showServiceModal = false;
            this.serviceForm.open = false;
            this.resetLogoPreview();
        },
        cancelServiceForm() {
            this.serviceForm.open = false;
            this.resetLogoPreview();
        },
        toggleExpand(id) {
            this.expanded[id] = !this.expanded[id];
        },
        rowVisible(el, query) {
            const q = (query || '').toLowerCase().trim();
            if (!q) return true;
            const row = el.querySelector('[data-service-row]');
            return !!row && (row.dataset.search || '').includes(q);
        },
        countVisible(containerId, query) {
            const q = (query || '').toLowerCase().trim();
            const cards = document.querySelectorAll('#' + containerId + ' [data-service-card]');
            let n = 0;
            cards.forEach(card => {
                const row = card.querySelector('[data-service-row]');
                if (!q || (row && (row.dataset.search || '').includes(q))) n++;
            });
            return n;
        },
        refreshVisibleCounts() {
            this.streamVisible = this.countVisible('streamingServiceRows', this.streamQuery);
            this.theatricalVisible = this.countVisible('theatricalServiceRows', this.theatricalQuery);
        },
        resetLogoPreview() {
            const url = this.serviceForm.logoUrl;
            if (url && url.indexOf('blob:') === 0) URL.revokeObjectURL(url);
            this.serviceForm.logoUrl = '';
            this.serviceForm.logoError = '';
            const input = document.getElementById('serviceLogoInput');
            if (input) input.value = '';
        },
        handleLogoSelect(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (okTypes.indexOf(file.type) === -1) {
                this.serviceForm.logoError = 'Logo harus berupa file JPG, PNG, atau WEBP.';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                this.serviceForm.logoError = 'Ukuran logo maksimal 2 MB.';
                return;
            }
            this.serviceForm.logoError = '';
            const prev = this.serviceForm.logoUrl;
            if (prev && prev.indexOf('blob:') === 0) URL.revokeObjectURL(prev);
            this.serviceForm.logoUrl = URL.createObjectURL(file);
        },
        openAddService(type) {
            this.resetLogoPreview();
            this.serviceForm = { open: true, mode: 'add', id: null, name: '', type: type || 'streaming', origType: null, saving: false, logoUrl: '', logoError: '' };
        },
        openEditService(id, type) {
            this.resetLogoPreview();
            const row = document.querySelector('[data-service-row="' + id + '"]');
            const name = row ? (row.querySelector('[data-service-name]')?.textContent || '').trim() : '';
            const logo = (window.moviewServiceLogos && window.moviewServiceLogos[id]) || '';
            this.serviceForm = { open: true, mode: 'edit', id: id, name: name, type: type, origType: type, saving: false, logoUrl: logo, logoError: '' };
        },
        async saveService() {
            const f = this.serviceForm;
            if (!f.name.trim()) {
                if (window.showToast) window.showToast('Service name is required', 'error');
                return;
            }
            f.saving = true;
            try {
                const fd = new FormData(document.getElementById('serviceAdminForm'));
                if (f.mode === 'add') fd.delete('_method');
                const url = f.mode === 'add'
                    ? @json(route('admin.services.store'))
                    : @json(route('admin.services.update', '__ID__')).replace('__ID__', f.id);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    },
                    body: fd
                });
                let data = {};
                try { data = await res.json(); } catch (e) {}
                if (!res.ok || !data.success) {
                    if (window.showToast) window.showToast(data.message || 'Failed to save service', 'error');
                    return;
                }
                if (f.mode === 'add') this.insertServiceRow(data.service);
                else this.updateServiceRow(data.service);
                if (window.showToast) window.showToast(data.message, 'success');
                f.open = false;
                this.resetLogoPreview();
            } catch (e) {
                if (window.showToast) window.showToast('Error: ' + e.message, 'error');
            } finally {
                f.saving = false;
            }
        },
        insertServiceRow(service) {
            const streaming = service.type === 'streaming';
            const tpl = document.getElementById(streaming ? 'tplServiceRowStreaming' : 'tplServiceRowTheatrical');
            const container = document.getElementById(streaming ? 'streamingServiceRows' : 'theatricalServiceRows');
            if (!tpl || !container) { location.reload(); return; }
            const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const html = tpl.innerHTML
                .split('__ID__').join(service.id)
                .split('__NAME__').join(esc(service.name))
                .split('__INITIAL__').join(esc(service.name).charAt(0).toUpperCase());
            if (window.moviewServiceLogos) window.moviewServiceLogos[service.id] = service.logo_url || null;
            this.expanded[service.id] = true;
            container.insertAdjacentHTML('beforeend', html);
            const card = container.lastElementChild;
            const rowEl = card ? card.querySelector('[data-service-row]') : null;
            if (rowEl) rowEl.dataset.search = (service.name + ' ' + service.type + ' Nonaktif').toLowerCase();
            this.refreshVisibleCounts();
        },
        updateServiceRow(service) {
            if (service.type !== this.serviceForm.origType) { location.reload(); return; }
            const row = document.querySelector('[data-service-row="' + service.id + '"]');
            if (!row) { location.reload(); return; }
            const nameEl = row.querySelector('[data-service-name]');
            if (nameEl) nameEl.textContent = service.name;
            const sumEl = row.querySelector('[data-summary]');
            const summary = sumEl ? (sumEl.dataset.summary || sumEl.textContent || '') : '';
            row.dataset.search = (service.name + ' ' + service.type + ' ' + summary).toLowerCase();
            if (window.moviewServiceLogos) window.moviewServiceLogos[service.id] = service.logo_url || null;
            this.expanded[service.id] = true;
            this.refreshVisibleCounts();
        }
    }));
});

// Media Manager Alpine.js component
document.addEventListener('alpine:init', () => {
    Alpine.data('mediaManager', () => ({
        currentTab: sessionStorage.getItem('moview_media_tab') || 'posters',
        activeTab: sessionStorage.getItem('moview_media_tab') || 'posters',

        init() {
            const saved = sessionStorage.getItem('moview_media_tab');
            if (saved === 'posters' || saved === 'backdrops') {
                this.currentTab = saved;
                this.activeTab = saved;
            }
        },

        setTab(tab) {
            this.activeTab = tab;
            this.currentTab = tab;
            sessionStorage.setItem('moview_media_tab', tab);
        },
        
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
                    window.showToastAfterReload(data.message);
                    location.reload(); // Reload to show new media
                } else {
                    window.showToast('Error: ' + (data.message || 'Upload gagal'), 'error');
                }
            } catch (error) {
                window.showToast('Error uploading file: ' + error.message, 'error');
            }
            
            event.target.value = ''; // Reset input
        }
    }));
});

// Set media as default
function setMediaDefault(movieId, mediaId) {
    window.confirmAction('Set sebagai media default?', async () => {
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
                window.showToastAfterReload(data.message);
                location.reload();
            } else {
                window.showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            window.showToast('Error: ' + error.message, 'error');
        }
    }, { danger: false, confirmText: 'Ya, Set Default' });
}

// Delete media
function deleteMedia(movieId, mediaId) {
    window.confirmAction('Hapus media ini?', async () => {
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
                window.showToastAfterReload(data.message);
                location.reload();
            } else {
                window.showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            window.showToast('Error: ' + error.message, 'error');
        }
    });
}

// Hero title auto-shrink: ukuran font hero diukur beneran vs container, bukan cuma clamp vw.
// Jika scrollHeight > 2 baris atau keluar dari hero (h-96), kecilkan step 1px sampai muat, min 28px.
function fitHeroTitle() {
    const h1 = document.getElementById('film-title-hero');
    const hero = h1 ? h1.closest('.relative.h-96, .relative.min-h-\\[24rem\\]') : null;
    if (!h1 || !hero) return;
    // reset ke max clamp dulu
    h1.style.fontSize = 'clamp(1.75rem, 4vw, 3rem)';
    let size = parseFloat(getComputedStyle(h1).fontSize);
    const min = 28; // 1.75rem
    const lineH = parseFloat(getComputedStyle(h1).lineHeight) || size * 1.1;
    const maxH = lineH * 2 + 4; // 2 baris
    let guard = 40;
    while (guard-- > 0 && size > min && h1.scrollHeight > maxH + 1) {
        size -= 1;
        h1.style.fontSize = size + 'px';
    }
    // Jika masih overflow keluar hero (absolute bottom content nabrak atas), kecilkan lagi
    const content = h1.closest('.absolute.bottom-0');
    if (content && hero) {
        let cGuard = 20;
        while (cGuard-- > 0 && size > min && content.getBoundingClientRect().top < hero.getBoundingClientRect().top + 8) {
            size -= 1;
            h1.style.fontSize = size + 'px';
        }
    }
}
document.addEventListener('DOMContentLoaded', fitHeroTitle);
window.addEventListener('resize', fitHeroTitle);
window.addEventListener('load', fitHeroTitle);

// Delete cast/crew
function deleteCastCrew(movieId, moviePersonId) {
    window.confirmAction('Hapus cast/crew ini?', async () => {
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
                window.showToastAfterReload(data.message);
                location.reload();
            } else {
                window.showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            window.showToast('Error: ' + error.message, 'error');
        }
    });
}
</script>
@endpush
