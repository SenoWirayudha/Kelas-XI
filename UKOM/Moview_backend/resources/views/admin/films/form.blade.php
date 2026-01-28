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

    <form method="POST" action="{{ isset($film) ? route('admin.films.update', $film->id) : route('admin.films.store') }}" class="space-y-6">
        @csrf
        @if(isset($film))
            @method('PUT')
        @endif
        
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
                           name="title"
                           value="{{ old('title', $film->title ?? '') }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('title') border-red-500 @enderror"
                           placeholder="Enter film title"
                           required>
                    @error('title')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Release Year *</label>
                    <input type="number" 
                           name="release_year"
                           value="{{ old('release_year', $film->release_year ?? '') }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('release_year') border-red-500 @enderror"
                           placeholder="2024"
                           required>
                    @error('release_year')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Runtime (minutes) *</label>
                    <input type="number" 
                           name="duration"
                           value="{{ old('duration', $film->duration ?? '') }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('duration') border-red-500 @enderror"
                           placeholder="120"
                           required>
                    @error('duration')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Age Rating</label>
                    <select name="age_rating" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select age rating</option>
                        <option value="G" {{ old('age_rating', $film->age_rating ?? '') === 'G' ? 'selected' : '' }}>G</option>
                        <option value="PG" {{ old('age_rating', $film->age_rating ?? '') === 'PG' ? 'selected' : '' }}>PG</option>
                        <option value="PG-13" {{ old('age_rating', $film->age_rating ?? '') === 'PG-13' ? 'selected' : '' }}>PG-13</option>
                        <option value="R" {{ old('age_rating', $film->age_rating ?? '') === 'R' ? 'selected' : '' }}>R</option>
                        <option value="NC-17" {{ old('age_rating', $film->age_rating ?? '') === 'NC-17' ? 'selected' : '' }}>NC-17</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select name="status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="draft" {{ old('status', $film->status ?? 'draft') === 'draft' ? 'selected' : '' }}>Draft</option>
                        <option value="published" {{ old('status', $film->status ?? '') === 'published' ? 'selected' : '' }}>Published</option>
                    </select>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Synopsis</label>
                    <textarea name="synopsis" rows="5" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter film synopsis">{{ old('synopsis', $film->synopsis ?? '') }}</textarea>
                </div>
            </div>
        </div>

        <!-- Image Management -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-images text-blue-600 mr-2"></i>
                Image Management
            </h3>
            
            @if(isset($film))
                <!-- Edit Mode: Show link to manage media -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <i class="fas fa-info-circle text-blue-600 text-3xl mb-3"></i>
                    <p class="text-gray-700 mb-4">
                        Untuk mengelola poster dan backdrop, gunakan halaman detail film.
                    </p>
                    <a href="{{ route('admin.films.show', $film->id) }}" 
                       class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                        <i class="fas fa-images mr-2"></i>
                        Kelola Media ({{ $film->movieMedia->count() }} media)
                    </a>
                </div>
            @else
                <!-- Create Mode: Show info message -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mb-3"></i>
                    <p class="text-gray-700 mb-2 font-medium">
                        Upload poster dan backdrop hanya tersedia setelah film disimpan
                    </p>
                    <p class="text-sm text-gray-600">
                        Simpan film terlebih dahulu, kemudian Anda dapat menambahkan media dari halaman detail film.
                    </p>
                </div>
            @endif
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
                           name="genres[]"
                           value="{{ $genre->id }}"
                           {{ isset($film) && $film->movieGenres->pluck('genre_id')->contains($genre->id) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm">{{ $genre->name }}</span>
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
                       {{ isset($film) && $film->movieServices->pluck('service_id')->contains($service->id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200' }}">
                    <input type="checkbox" 
                           name="services[]"
                           value="{{ $service->id }}"
                           {{ isset($film) && $film->movieServices->pluck('service_id')->contains($service->id) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium">{{ $service->name }}</span>
                    </div>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Countries -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-globe text-blue-600 mr-2"></i>
                Countries
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                @foreach($countries as $country)
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" 
                           name="countries[]"
                           value="{{ $country->id }}"
                           {{ isset($film) && $film->movieCountries->pluck('country_id')->contains($country->id) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm">{{ $country->name }}</span>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Languages -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-language text-blue-600 mr-2"></i>
                Languages
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                @foreach($languages as $language)
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" 
                           name="languages[]"
                           value="{{ $language->id }}"
                           {{ isset($film) && $film->movieLanguages->pluck('language_id')->contains($language->id) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm">{{ $language->name }}</span>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Production Houses -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-building text-blue-600 mr-2"></i>
                Production Houses
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                @foreach($productionHouses as $productionHouse)
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" 
                           name="production_houses[]"
                           value="{{ $productionHouse->id }}"
                           {{ isset($film) && $film->movieProductionHouses->pluck('production_house_id')->contains($productionHouse->id) ? 'checked' : '' }}
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm">{{ $productionHouse->name }}</span>
                </label>
                @endforeach
            </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center">
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
                            name="status"
                            value="draft"
                            class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        <i class="fas fa-file mr-2"></i>
                        Save as Draft
                    </button>
                    <button type="submit" 
                            name="status"
                            value="published"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-check-circle mr-2"></i>
                        {{ isset($film) ? 'Update & Publish' : 'Publish Film' }}
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection
