@extends('layouts.admin')

@section('title', $person->full_name)
@section('page-title', $person->full_name)
@section('page-subtitle', $person->primary_role)

@section('content')
<!-- Breadcrumb -->
<div class="mb-6">
    <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
                <a href="{{ route('admin.cast-crew.index') }}" class="inline-flex items-center text-sm text-gray-700 hover:text-blue-600">
                    <i class="fas fa-user-friends mr-2"></i>
                    Cast & Crew
                </a>
            </li>
            <li>
                <div class="flex items-center">
                    <i class="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <span class="text-sm font-medium text-gray-500">{{ $person->full_name }}</span>
                </div>
            </li>
        </ol>
    </nav>
</div>

<!-- Action Buttons -->
<div class="mb-6 flex justify-end space-x-3">
    <a href="{{ route('admin.cast-crew.edit', $person->id) }}" 
       class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
        <i class="fas fa-edit mr-2"></i>
        Edit Person
    </a>
    <form action="{{ route('admin.cast-crew.destroy', $person->id) }}" method="POST" class="inline"
          onsubmit="return confirm('Are you sure you want to delete {{ $person->full_name }}? This action cannot be undone.')">
        @csrf
        @method('DELETE')
        <button type="submit" 
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
            <i class="fas fa-trash mr-2"></i>
            Delete
        </button>
    </form>
</div>

<!-- Person Profile Card -->
<div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
    <div class="md:flex">
        <!-- Photo Section -->
        <div class="md:flex-shrink-0 bg-gray-100 flex items-center justify-center p-8">
            @if($person->photo_path)
                <img src="{{ asset('storage/' . $person->photo_path) }}" 
                     alt="{{ $person->full_name }}" 
                     class="h-64 w-48 object-cover rounded-lg shadow-lg">
            @else
                <div class="h-64 w-48 bg-gray-300 rounded-lg flex items-center justify-center">
                    <i class="fas fa-user text-6xl text-gray-400"></i>
                </div>
            @endif
        </div>

        <!-- Details Section -->
        <div class="p-8 flex-1">
            <div class="uppercase tracking-wide text-sm text-blue-600 font-semibold mb-1">
                {{ $person->primary_role }}
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ $person->full_name }}</h1>

            <!-- Personal Information Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                @if($person->date_of_birth)
                <div class="flex items-start">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-birthday-cake text-blue-600"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                        <p class="text-gray-900 font-medium">
                            {{ $person->date_of_birth->format('F d, Y') }}
                            <span class="text-gray-500 text-sm ml-2">({{ $person->date_of_birth->age }} years old)</span>
                        </p>
                    </div>
                </div>
                @endif

                @if($person->nationality)
                <div class="flex items-start">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-globe text-blue-600"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Nationality</p>
                        <p class="text-gray-900 font-medium">{{ $person->nationality }}</p>
                    </div>
                </div>
                @endif

                <div class="flex items-start">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-film text-blue-600"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Films</p>
                        <p class="text-gray-900 font-medium">{{ $person->moviePersons->count() }} {{ Str::plural('Film', $person->moviePersons->count()) }}</p>
                    </div>
                </div>

                <div class="flex items-start">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-calendar text-blue-600"></i>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Added</p>
                        <p class="text-gray-900 font-medium">{{ $person->created_at->format('M d, Y') }}</p>
                    </div>
                </div>
            </div>

            <!-- Biography -->
            @if($person->bio)
            <div class="border-t border-gray-200 pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                    Biography
                </h3>
                <p class="text-gray-700 leading-relaxed">{{ $person->bio }}</p>
            </div>
            @endif
        </div>
    </div>
</div>

<!-- Filmography Section -->
<div class="bg-white rounded-lg shadow-lg p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <i class="fas fa-video text-blue-600 mr-3"></i>
        Filmography
    </h2>

    @if($person->moviePersons->count() > 0)
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Film
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Character Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Release Year
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @foreach($person->moviePersons as $moviePerson)
                        @php
                            $movie = $moviePerson->movie;
                        @endphp
                        <tr class="hover:bg-gray-50 transition">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    @if($movie->default_poster_path)
                                        <img src="{{ asset('storage/' . $movie->default_poster_path) }}" 
                                             alt="{{ $movie->title }}" 
                                             class="h-12 w-8 object-cover rounded mr-3">
                                    @else
                                        <div class="h-12 w-8 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                            <i class="fas fa-film text-gray-400 text-xs"></i>
                                        </div>
                                    @endif
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">{{ $movie->title }}</div>
                                        @if($movie->original_title && $movie->original_title != $movie->title)
                                            <div class="text-xs text-gray-500">{{ $movie->original_title }}</div>
                                        @endif
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {{ $moviePerson->role }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-900">
                                    {{ $moviePerson->character_name ?? '-' }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">
                                    {{ $movie->release_date ? $movie->release_date->format('Y') : 'TBA' }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                @if($movie->status === 'published')
                                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        <i class="fas fa-check-circle mr-1"></i>
                                        Published
                                    </span>
                                @else
                                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        <i class="fas fa-clock mr-1"></i>
                                        Draft
                                    </span>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <a href="{{ route('admin.films.edit', $movie->id) }}" 
                                   class="text-blue-600 hover:text-blue-900 mr-3" 
                                   title="Edit Film">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <a href="{{ route('admin.films.show', $movie->id) }}" 
                                   class="text-green-600 hover:text-green-900" 
                                   title="View Film">
                                    <i class="fas fa-eye"></i>
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Stats Summary -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ $person->moviePersons->count() }}</div>
                <div class="text-sm text-blue-800">Total Films</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600">
                    {{ $person->moviePersons->filter(fn($mp) => $mp->movie->status === 'published')->count() }}
                </div>
                <div class="text-sm text-green-800">Published</div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">
                    {{ $person->moviePersons->filter(fn($mp) => $mp->movie->status === 'draft')->count() }}
                </div>
                <div class="text-sm text-yellow-800">Draft</div>
            </div>
        </div>
    @else
        <!-- Empty State -->
        <div class="text-center py-12">
            <i class="fas fa-film text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Films Yet</h3>
            <p class="text-gray-500 mb-6">This person hasn't been assigned to any films yet.</p>
            <a href="{{ route('admin.films.index') }}" 
               class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-plus mr-2"></i>
                Add to Film
            </a>
        </div>
    @endif
</div>

<!-- Back Button -->
<div class="mt-6">
    <a href="{{ route('admin.cast-crew.index') }}" 
       class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Cast & Crew
    </a>
</div>
@endsection
