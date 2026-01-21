@extends('layouts.admin')

@section('title', 'Film Preview - ' . $film['title'])
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
    <a href="{{ route('admin.films.edit', $film['id']) }}" class="bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50">
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
    <a href="{{ route('admin.films.cast-crew', $film['id']) }}" class="text-purple-600 hover:text-purple-800 flex items-center">
        <i class="fas fa-users mr-2"></i>
        Manage Cast & Crew
    </a>
    <span class="text-gray-400">|</span>
    <a href="{{ route('admin.films.reviews', $film['id']) }}" class="text-green-600 hover:text-green-800 flex items-center">
        <i class="fas fa-star mr-2"></i>
        View Reviews
    </a>
</div>

<!-- Film Hero Section -->
<div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
    <div class="relative h-96">
        <img src="{{ $film['backdrop'] }}" alt="{{ $film['title'] }}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div class="flex items-end space-x-6">
                <img src="{{ $film['poster'] }}" alt="{{ $film['title'] }}" class="w-48 h-72 object-cover rounded-lg shadow-2xl">
                <div class="flex-1 pb-4">
                    <h1 class="text-5xl font-bold mb-2">{{ $film['title'] }}</h1>
                    <div class="flex items-center space-x-4 text-lg mb-3">
                        <span>{{ $film['year'] }}</span>
                        <span>•</span>
                        <span>{{ $film['runtime'] }} min</span>
                        <span>•</span>
                        <span class="px-2 py-1 border border-white rounded">{{ $film['age_rating'] }}</span>
                    </div>
                    <div class="flex items-center space-x-6 mb-4">
                        <div class="flex items-center">
                            @php
                                $rating5Scale = $film['rating_average'];
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
                            <p class="text-sm text-gray-300">{{ number_format($film['total_reviews']) }} reviews</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        @foreach($film['genres'] as $genre)
                        <span class="px-3 py-1 bg-blue-600 bg-opacity-80 rounded-full text-sm">{{ $genre }}</span>
                        @endforeach
                    </div>
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
            <p class="text-gray-700 leading-relaxed">{{ $film['synopsis'] }}</p>
        </div>

        <!-- Rating Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-6 flex items-center">
                <i class="fas fa-chart-bar text-purple-600 mr-3"></i>
                Rating Distribution
            </h2>
            
            @php
                // Dummy rating distribution data
                $ratingDistribution = [
                    5 => 420,
                    4 => 310,
                    3 => 120,
                    2 => 45,
                    1 => 18,
                ];
                $totalRatings = array_sum($ratingDistribution);
            @endphp
            
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="text-center">
                    <p class="text-gray-600 text-sm mb-1">Total Reviews</p>
                    <p class="text-3xl font-bold text-gray-800">{{ number_format($totalRatings) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 text-sm mb-1">Average Rating</p>
                    <p class="text-3xl font-bold text-purple-600">{{ number_format($film['rating_average'], 1) }} / 5</p>
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
                <a href="{{ route('admin.films.cast-crew', $film['id']) }}" class="text-blue-600 hover:text-blue-800">
                    Manage →
                </a>
            </div>
            
            @php
                $castCrewPreview = [
                    ['name' => 'Tim Robbins', 'role' => 'Actor', 'character' => 'Andy Dufresne', 'photo' => 'https://image.tmdb.org/t/p/w200/hsCuROGEzJAULGgxQS8Y9JzB0gH.jpg'],
                    ['name' => 'Morgan Freeman', 'role' => 'Actor', 'character' => 'Ellis Boyd Redding', 'photo' => 'https://image.tmdb.org/t/p/w200/jPsLqiYGSofU4s6BjrxnefMfabb.jpg'],
                    ['name' => 'Frank Darabont', 'role' => 'Director', 'character' => null, 'photo' => 'https://image.tmdb.org/t/p/w200/7LqmE3p1XTwCdNCOmBxovq210Qk.jpg'],
                    ['name' => 'Stephen King', 'role' => 'Writer', 'character' => null, 'photo' => 'https://image.tmdb.org/t/p/w200/cqH5caPdVS0kPUCDoJPCqvza5h3.jpg'],
                ];
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
                        @foreach($castCrewPreview as $person)
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 whitespace-nowrap">
                                <div class="flex items-center">
                                    <img src="{{ $person['photo'] }}" alt="{{ $person['name'] }}" class="w-10 h-10 rounded-full object-cover">
                                    <span class="ml-3 text-sm font-medium text-gray-900">{{ $person['name'] }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    {{ $person['role'] === 'Actor' ? 'bg-purple-100 text-purple-800' : 
                                       ($person['role'] === 'Director' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800') }}">
                                    {{ $person['role'] }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-900">
                                {{ $person['character'] ?? '-' }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button class="text-indigo-600 hover:text-indigo-900" title="Edit" onclick="alert('Edit cast/crew (UI only)')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="text-red-600 hover:text-red-900" title="Remove" onclick="alert('Remove cast/crew (UI only)')">
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
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm" onclick="alert('Add cast/crew (UI only)')">
                    <i class="fas fa-plus mr-2"></i>
                    Add Cast / Crew Member
                </button>
            </div>
        </div>

        <!-- Media Management & Metadata Tabs -->
        <div class="bg-white rounded-lg shadow p-6" x-data="{ activeSection: 'media', activeTab: 'posters' }">
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
                $posters = [
                    ['id' => 1, 'url' => 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', 'is_active' => true, 'size' => '1.2 MB'],
                    ['id' => 2, 'url' => 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'is_active' => false, 'size' => '1.5 MB'],
                    ['id' => 3, 'url' => 'https://image.tmdb.org/t/p/w500/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg', 'is_active' => false, 'size' => '1.3 MB'],
                    ['id' => 4, 'url' => 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg', 'is_active' => false, 'size' => '1.4 MB'],
                ];
                
                $backdrops = [
                    ['id' => 1, 'url' => 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg', 'is_active' => true, 'size' => '2.8 MB'],
                    ['id' => 2, 'url' => 'https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', 'is_active' => false, 'size' => '3.2 MB'],
                    ['id' => 3, 'url' => 'https://image.tmdb.org/t/p/original/qqHQsStV6exghCM7zbObuYBiYxw.jpg', 'is_active' => false, 'size' => '2.9 MB'],
                    ['id' => 4, 'url' => 'https://image.tmdb.org/t/p/original/dIWwZW7dJJtqC6CgWzYkNVKIUm8.jpg', 'is_active' => false, 'size' => '3.1 MB'],
                ];
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
                        @php $activePoster = collect($posters)->firstWhere('is_active', true); @endphp
                        <img src="{{ $activePoster['url'] }}" 
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
                        @php $activeBackdrop = collect($backdrops)->firstWhere('is_active', true); @endphp
                        <img src="{{ $activeBackdrop['url'] }}" 
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
            <div>
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800">Media Options</h3>
                    <button onclick="alert('Add new media (UI only)\n\nIn production, this will open upload dialog.')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
                        <i class="fas fa-plus mr-2"></i>
                        Add Media
                    </button>
                </div>
                
                <!-- Tabs -->
                <div class="border-b border-gray-200 mb-6">
                    <nav class="-mb-px flex space-x-8">
                        <button @click="activeTab = 'posters'" 
                                :class="activeTab === 'posters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                            <i class="fas fa-image mr-2"></i>
                            Posters ({{ count($posters) }})
                        </button>
                        <button @click="activeTab = 'backdrops'" 
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
                                <img src="{{ $poster['url'] }}" 
                                     alt="Poster {{ $poster['id'] }}" 
                                     class="w-full h-full object-cover">
                                
                                <!-- Active Badge -->
                                @if($poster['is_active'])
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
                                    <span class="text-xs text-gray-500">{{ $poster['size'] }}</span>
                                    <span class="text-xs text-gray-500">Poster</span>
                                </div>
                                
                                <div class="space-y-2">
                                    @if(!$poster['is_active'])
                                    <button onclick="alert('Set as default poster (UI only)')" 
                                            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-check mr-1"></i>Set as Default
                                    </button>
                                    @else
                                    <button disabled 
                                            class="w-full bg-gray-300 text-gray-500 px-3 py-2 rounded text-xs font-medium cursor-not-allowed">
                                        <i class="fas fa-check-circle mr-1"></i>Current Default
                                    </button>
                                    @endif
                                    
                                    <button onclick="if(confirm('Remove this poster? (UI only)')) alert('Poster removed (UI only)')" 
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
                                <img src="{{ $backdrop['url'] }}" 
                                     alt="Backdrop {{ $backdrop['id'] }}" 
                                     class="w-full h-full object-cover">
                                
                                <!-- Active Badge -->
                                @if($backdrop['is_active'])
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
                                    <span class="text-xs text-gray-500">{{ $backdrop['size'] }}</span>
                                    <span class="text-xs text-gray-500">Backdrop</span>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2">
                                    @if(!$backdrop['is_active'])
                                    <button onclick="alert('Set as default backdrop (UI only)')" 
                                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200">
                                        <i class="fas fa-check mr-1"></i>Set Default
                                    </button>
                                    @else
                                    <button disabled 
                                            class="bg-gray-300 text-gray-500 px-3 py-2 rounded text-xs font-medium cursor-not-allowed">
                                        <i class="fas fa-check-circle mr-1"></i>Default
                                    </button>
                                    @endif
                                    
                                    <button onclick="if(confirm('Remove this backdrop? (UI only)')) alert('Backdrop removed (UI only)')" 
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
                            <button onclick="alert('Add New Production House (UI only)\n\nIn production, this will open a modal to add a new PH to the database.')" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                <i class="fas fa-plus mr-2"></i>
                                Add New PH
                            </button>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4" x-data="{ 
                            selectedPH: ['Warner Bros', 'Legendary Pictures'],
                            allPH: ['Warner Bros', 'Universal Pictures', 'Legendary Pictures', 'A24', 'CJ Entertainment', 'Sony Pictures', 'Paramount Pictures', '20th Century Studios']
                        }">
                            <!-- Selected Tags Display -->
                            <div class="flex flex-wrap gap-2 mb-3" x-show="selectedPH.length > 0">
                                <template x-for="ph in selectedPH" :key="ph">
                                    <span class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
                                        <span x-text="ph"></span>
                                        <button @click="selectedPH = selectedPH.filter(p => p !== ph)" 
                                                class="ml-2 text-blue-200 hover:text-white transition-colors">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </span>
                                </template>
                            </div>
                            
                            <!-- Dropdown Select -->
                            <select @change="if($event.target.value && !selectedPH.includes($event.target.value)) { selectedPH.push($event.target.value); } $event.target.value = ''" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="">Select Production House...</option>
                                <template x-for="ph in allPH" :key="ph">
                                    <option :value="ph" x-text="ph" :disabled="selectedPH.includes(ph)"></option>
                                </template>
                            </select>
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Select one or more production companies
                            </p>
                        </div>
                    </div>
                    
                    <!-- Genre Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-film text-purple-600 mr-2"></i>
                            Genre
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4" x-data="{
                            selectedGenres: ['Sci-Fi', 'Action', 'Adventure'],
                            genres: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western']
                        }">
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <template x-for="genre in genres" :key="genre">
                                    <label class="flex items-center space-x-2 cursor-pointer group">
                                        <input type="checkbox" 
                                               :checked="selectedGenres.includes(genre)"
                                               @change="selectedGenres.includes(genre) ? selectedGenres = selectedGenres.filter(g => g !== genre) : selectedGenres.push(genre)"
                                               class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                                        <span class="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors" 
                                              x-text="genre"></span>
                                    </label>
                                </template>
                            </div>
                            
                            <!-- Selected Genres Preview -->
                            <div x-show="selectedGenres.length > 0" class="mt-4 pt-4 border-t border-gray-300">
                                <p class="text-xs text-gray-500 mb-2">Selected genres:</p>
                                <div class="flex flex-wrap gap-2">
                                    <template x-for="genre in selectedGenres" :key="genre">
                                        <span class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold" 
                                              x-text="genre"></span>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Country Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-globe text-green-600 mr-2"></i>
                            Country
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4" x-data="{ 
                            selectedCountries: ['USA'],
                            allCountries: ['USA', 'United Kingdom', 'South Korea', 'Japan', 'France', 'Germany', 'China', 'India', 'Canada', 'Australia', 'Spain', 'Italy', 'Brazil', 'Mexico']
                        }">
                            <!-- Selected Tags Display -->
                            <div class="flex flex-wrap gap-2 mb-3" x-show="selectedCountries.length > 0">
                                <template x-for="country in selectedCountries" :key="country">
                                    <span class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-full text-sm font-medium">
                                        <span x-text="country"></span>
                                        <button @click="selectedCountries = selectedCountries.filter(c => c !== country)" 
                                                class="ml-2 text-green-200 hover:text-white transition-colors">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </span>
                                </template>
                            </div>
                            
                            <!-- Dropdown Select -->
                            <select @change="if($event.target.value && !selectedCountries.includes($event.target.value)) { selectedCountries.push($event.target.value); } $event.target.value = ''" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                                <option value="">Select Country...</option>
                                <template x-for="country in allCountries" :key="country">
                                    <option :value="country" x-text="country" :disabled="selectedCountries.includes(country)"></option>
                                </template>
                            </select>
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Select countries where this film was produced
                            </p>
                        </div>
                    </div>
                    
                    <!-- Language Section -->
                    <div>
                        <label class="block text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-language text-orange-600 mr-2"></i>
                            Language
                        </label>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4" x-data="{ 
                            selectedLanguages: ['English'],
                            allLanguages: ['English', 'Korean', 'Japanese', 'Mandarin Chinese', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Hindi', 'Arabic', 'Russian']
                        }">
                            <!-- Selected Tags Display -->
                            <div class="flex flex-wrap gap-2 mb-3" x-show="selectedLanguages.length > 0">
                                <template x-for="language in selectedLanguages" :key="language">
                                    <span class="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-full text-sm font-medium">
                                        <span x-text="language"></span>
                                        <button @click="selectedLanguages = selectedLanguages.filter(l => l !== language)" 
                                                class="ml-2 text-orange-200 hover:text-white transition-colors">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </span>
                                </template>
                            </div>
                            
                            <!-- Dropdown Select -->
                            <select @change="if($event.target.value && !selectedLanguages.includes($event.target.value)) { selectedLanguages.push($event.target.value); } $event.target.value = ''" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                                <option value="">Select Language...</option>
                                <template x-for="language in allLanguages" :key="language">
                                    <option :value="language" x-text="language" :disabled="selectedLanguages.includes(language)"></option>
                                </template>
                            </select>
                            <p class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Select all languages spoken in this film
                            </p>
                        </div>
                    </div>
                    
                    <!-- Save Button -->
                    <div class="flex justify-end pt-4 border-t border-gray-200">
                        <button onclick="alert('Metadata saved successfully! (UI only)\n\nIn production, this will update the database.')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center">
                            <i class="fas fa-save mr-2"></i>
                            Save Metadata
                        </button>
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
                        {{ $film['status'] === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">
                        {{ $film['status'] }}
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
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-lg mb-4">Available On</h3>
            <div class="space-y-3">
                @foreach($film['services'] as $service)
                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
                        {{ substr($service, 0, 1) }}
                    </div>
                    <span class="font-medium">{{ $service }}</span>
                </div>
                @endforeach
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
                                $rating = $film['rating_average'];
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
                    <span class="font-bold">{{ number_format($film['total_reviews']) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Views:</span>
                    <span class="font-bold">{{ number_format(rand(10000, 100000)) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Favorites:</span>
                    <span class="font-bold">{{ number_format(rand(1000, 10000)) }}</span>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-lg mb-4">Quick Actions</h3>
            <div class="space-y-2">
                <button onclick="alert('Toggle status (UI only)')" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                    <i class="fas fa-toggle-on mr-2"></i>
                    {{ $film['status'] === 'Published' ? 'Unpublish' : 'Publish' }}
                </button>
                <button onclick="alert('Duplicate (UI only)')" 
                        class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">
                    <i class="fas fa-copy mr-2"></i>
                    Duplicate
                </button>
                <button onclick="if(confirm('Are you sure? (UI only)')) alert('Deleted (UI only)')" 
                        class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">
                    <i class="fas fa-trash mr-2"></i>
                    Delete Film
                </button>
            </div>
        </div>
    </div>
</div>
@endsection
