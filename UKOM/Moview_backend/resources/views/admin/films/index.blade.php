@extends('layouts.admin')

@section('title', 'Films Management')
@section('page-title', 'Films Management')
@section('page-subtitle', 'Manage your film collection')

@section('content')
<!-- Search & Filters -->
@php
    $allFilterKeys = ['status', 'release_type', 'release_status', 'sort_by',
        'filter_genre', 'filter_theme', 'filter_country', 'filter_language',
        'filter_production_house', 'filter_service', 'filter_director', 'filter_cast', 'filter_crew'];
    $activeFilterCount = collect($allFilterKeys)->filter(fn($k) => request($k))->count();
@endphp
<div class="bg-white rounded-lg shadow p-6 mb-6" x-data="{ filterOpen: false }">
    <form method="GET" action="{{ route('admin.films.index') }}" id="filterForm">
        <div class="mb-4 flex justify-between items-center flex-wrap gap-4">
            <div class="flex space-x-4 flex-1">
                <div class="relative flex-1 min-w-[200px]">
                    <input type="text" 
                           name="search"
                           value="{{ request('search') }}"
                           placeholder="Search films..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
                <button type="button" 
                        @click="filterOpen = true" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                    <i class="fas fa-filter mr-2"></i>Filter
                    @if($activeFilterCount > 0)
                        <span class="ml-1 px-2 py-0.5 rounded-full bg-blue-400 text-white text-xs font-bold">
                            {{ $activeFilterCount }}
                        </span>
                    @endif
                </button>
                @if($activeFilterCount > 0 || request('search'))
                    <a href="{{ route('admin.films.index') }}" 
                       class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap">
                        <i class="fas fa-times mr-2"></i>Clear
                    </a>
                @endif
            </div>
            <a href="{{ route('admin.films.create') }}" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center whitespace-nowrap">
                <i class="fas fa-plus mr-2"></i>
                Add New Film
            </a>
        </div>

        <!-- Filter Modal -->
        <div x-show="filterOpen" x-cloak class="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black bg-opacity-50" @click="filterOpen = false"></div>
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-filter mr-2 text-blue-600"></i>Filter & Sort Films
                    </h3>
                    <button type="button" @click="filterOpen = false" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    <!-- SORT SECTION -->
                    <div class="border-b border-gray-200 pb-4">
                        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            <i class="fas fa-sort mr-1"></i>Sort By
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Sort Field</label>
                                <select name="sort_by" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Default (Newest)</option>
                                    <option value="release_year" {{ request('sort_by') == 'release_year' ? 'selected' : '' }}>Release Year</option>
                                    <option value="primary_date" {{ request('sort_by') == 'primary_date' ? 'selected' : '' }}>Primary Release Date</option>
                                    <option value="rating" {{ request('sort_by') == 'rating' ? 'selected' : '' }}>Average Rating</option>
                                    <option value="title" {{ request('sort_by') == 'title' ? 'selected' : '' }}>Title (A–Z)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Order</label>
                                <select name="sort_order" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="desc" {{ request('sort_order', 'desc') == 'desc' ? 'selected' : '' }}>Newest / Highest / Z–A</option>
                                    <option value="asc" {{ request('sort_order') == 'asc' ? 'selected' : '' }}>Oldest / Lowest / A–Z</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- STATUS & RELEASE -->
                    <div>
                        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            <i class="fas fa-info-circle mr-1"></i>Status & Release
                        </h4>
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Publication</label>
                                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    <option value="published" {{ request('status') == 'published' ? 'selected' : '' }}>Published</option>
                                    <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Release Type</label>
                                <select name="release_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    <option value="theatrical" {{ request('release_type') == 'theatrical' ? 'selected' : '' }}>Theatrical</option>
                                    <option value="streaming" {{ request('release_type') == 'streaming' ? 'selected' : '' }}>Streaming</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Release Status</label>
                                <select name="release_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    <option value="released" {{ request('release_status') == 'released' ? 'selected' : '' }}>Released</option>
                                    <option value="coming_soon" {{ request('release_status') == 'coming_soon' ? 'selected' : '' }}>Coming Soon</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- CONTENT FILTERS -->
                    <div>
                        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            <i class="fas fa-film mr-1"></i>Content
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Genre</label>
                                <select name="filter_genre" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Genres</option>
                                    @foreach($allGenres as $g)
                                        <option value="{{ $g->id }}" {{ request('filter_genre') == $g->id ? 'selected' : '' }}>{{ $g->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Theme</label>
                                <select name="filter_theme" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Themes</option>
                                    @foreach($allThemes as $t)
                                        <option value="{{ $t->id }}" {{ request('filter_theme') == $t->id ? 'selected' : '' }}>{{ $t->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Service</label>
                                <select name="filter_service" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Services</option>
                                    @foreach($allServices as $s)
                                        <option value="{{ $s->id }}" {{ request('filter_service') == $s->id ? 'selected' : '' }}>{{ $s->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Country</label>
                                <select name="filter_country" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Countries</option>
                                    @foreach($allCountries as $c)
                                        <option value="{{ $c->id }}" {{ request('filter_country') == $c->id ? 'selected' : '' }}>{{ $c->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Language</label>
                                <select name="filter_language" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Languages</option>
                                    @foreach($allLanguages as $l)
                                        <option value="{{ $l->id }}" {{ request('filter_language') == $l->id ? 'selected' : '' }}>{{ $l->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Production House</label>
                                <select name="filter_production_house" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    @foreach($allProductionHouses as $ph)
                                        <option value="{{ $ph->id }}" {{ request('filter_production_house') == $ph->id ? 'selected' : '' }}>{{ $ph->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- PEOPLE FILTERS -->
                    <div>
                        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            <i class="fas fa-users mr-1"></i>People
                        </h4>
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Director</label>
                                <select name="filter_director" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Directors</option>
                                    @foreach($allDirectors as $d)
                                        <option value="{{ $d->id }}" {{ request('filter_director') == $d->id ? 'selected' : '' }}>{{ $d->full_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Cast</label>
                                <select name="filter_cast" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Cast</option>
                                    @foreach($allCast as $c)
                                        <option value="{{ $c->id }}" {{ request('filter_cast') == $c->id ? 'selected' : '' }}>{{ $c->full_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Crew</label>
                                <select name="filter_crew" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Crew</option>
                                    @foreach($allCrew as $cr)
                                        <option value="{{ $cr->id }}" {{ request('filter_crew') == $cr->id ? 'selected' : '' }}>{{ $cr->full_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                    </div>

                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <a href="{{ route('admin.films.index') }}" 
                       @click="filterOpen = false"
                       class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-times mr-2"></i>Clear
                    </a>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-check mr-2"></i>Apply
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>

<!-- Active Filters Display -->
@php
    $filterLabels = [
        'status' => 'Status: ' . ucfirst(request('status')),
        'release_type' => 'Type: ' . ucfirst(request('release_type')),
        'release_status' => 'Release: ' . (request('release_status') == 'coming_soon' ? 'Coming Soon' : 'Already Released'),
        'sort_by' => 'Sort: ' . str_replace('_', ' ', ucfirst(request('sort_by'))) . ' (' . strtoupper(request('sort_order', 'desc')) . ')',
        'filter_genre' => 'Genre: ' . ($allGenres->firstWhere('id', request('filter_genre'))->name ?? ''),
        'filter_theme' => 'Theme: ' . ($allThemes->firstWhere('id', request('filter_theme'))->name ?? ''),
        'filter_country' => 'Country: ' . ($allCountries->firstWhere('id', request('filter_country'))->name ?? ''),
        'filter_language' => 'Language: ' . ($allLanguages->firstWhere('id', request('filter_language'))->name ?? ''),
        'filter_production_house' => 'Production: ' . ($allProductionHouses->firstWhere('id', request('filter_production_house'))->name ?? ''),
        'filter_service' => 'Service: ' . ($allServices->firstWhere('id', request('filter_service'))->name ?? ''),
        'filter_director' => 'Director: ' . ($allDirectors->firstWhere('id', request('filter_director'))->full_name ?? ''),
        'filter_cast' => 'Cast: ' . ($allCast->firstWhere('id', request('filter_cast'))->full_name ?? ''),
        'filter_crew' => 'Crew: ' . ($allCrew->firstWhere('id', request('filter_crew'))->full_name ?? ''),
    ];
    $activePills = collect($filterLabels)->filter(fn($v, $k) => request($k))->values();
@endphp
@if(request('search') || $activePills->isNotEmpty())
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-center flex-wrap gap-2">
        <span class="text-sm font-semibold text-blue-900">
            <i class="fas fa-filter mr-1"></i>Active Filters:
        </span>
        @if(request('search'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Search: {{ request('search') }}
                <a href="{{ request()->fullUrlWithQuery(['search' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @foreach($filterLabels as $key => $label)
            @if(request($key))
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                    {{ $label }}
                    <a href="{{ request()->fullUrlWithQuery([$key => null]) }}" class="ml-2 hover:text-blue-200">
                        <i class="fas fa-times"></i>
                    </a>
                </span>
            @endif
        @endforeach
        <span class="text-sm text-blue-700 ml-auto">
            Showing {{ $films->total() }} result{{ $films->total() != 1 ? 's' : '' }}
        </span>
    </div>
</div>
@endif

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Films</p>
                <p class="text-3xl font-bold text-gray-800">{{ $totalFilms }}</p>
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
                <p class="text-3xl font-bold text-green-600">{{ $totalPublished }}</p>
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
                <p class="text-3xl font-bold text-yellow-600">{{ $totalDraft }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
                <i class="fas fa-edit text-yellow-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Films Table View -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full table-fixed divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th style="width:28%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Film</th>
                <th style="width:6%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th style="width:8%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runtime</th>
                <th style="width:9%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th style="width:15%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release</th>
                <th style="width:7%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th style="width:8%" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th style="width:19%" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @foreach($films as $film)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-start">
                        @php
                            $poster = $film->posters()->where('is_default', true)->first() ?? $film->posters()->first();
                        @endphp
                        <img src="{{ $poster ? asset('storage/' . $poster->media_path) : 'https://via.placeholder.com/100x150' }}" alt="{{ $film->title }}" class="w-12 h-16 object-cover rounded flex-shrink-0">
                        <div class="ml-4 min-w-0">
                            <div class="text-sm font-medium text-gray-900 break-words">{{ $film->title }}</div>
                            @if($film->original_title)
                                <div class="text-xs text-gray-400 break-words">{{ $film->original_title }}</div>
                            @endif
                            <div class="text-sm text-gray-500 break-words">{{ $film->movieGenres->pluck('genre.name')->implode(', ') }}</div>
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
                    @php
                        $releaseStatus = $film->release_status;
                        $earliestDate = $film->movieReleases
                            ->filter(function ($release) {
                                return $release->release_date
                                    && in_array($release->type, ['theatrical', 'streaming']);
                            })
                            ->sortBy('release_date')
                            ->first();
                    @endphp
                    @if($film->movieReleases->isEmpty())
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">No release data</span>
                    @else
                        @if($releaseStatus === 'coming_soon')
                            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                <i class="fas fa-clock mr-1"></i>Coming Soon
                            </span>
                        @else
                            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                <i class="fas fa-play-circle mr-1"></i>Released
                            </span>
                        @endif
                        @if($earliestDate)
                            <div class="text-xs text-gray-500 mt-1">{{ \Carbon\Carbon::parse($earliestDate->release_date)->format('d M Y') }}</div>
                        @endif
                    @endif
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
                        <a href="{{ route('admin.films.show', $film->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" 
                           class="text-blue-600 hover:text-blue-900" title="View">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="{{ route('admin.films.edit', $film->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" 
                           class="text-indigo-600 hover:text-indigo-900" title="Edit">
                            <i class="fas fa-edit"></i>
                        </a>
                        <a href="{{ route('admin.films.cast-crew', $film->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" 
                           class="text-purple-600 hover:text-purple-900" title="Cast & Crew">
                            <i class="fas fa-users"></i>
                        </a>
                        <a href="{{ route('admin.films.reviews', $film->id) . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" 
                           class="text-green-600 hover:text-green-900" title="Reviews">
                            <i class="fas fa-star"></i>
                        </a>
                        <form action="{{ route('admin.films.destroy', $film->id) }}" method="POST" class="inline"
                              onsubmit="return requireConfirm(event, 'Hapus film &quot;' + {{ json_encode($film->title) }} + '&quot;? Semua data terkait (review, jadwal, media) ikut terhapus.', { form: this })">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:text-red-900" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </form>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            Showing {{ $films->firstItem() ?? 0 }} to {{ $films->lastItem() ?? 0 }} of {{ $films->total() }} films
        </p>
        <div>
            {{ $films->links() }}
        </div>
    </div>
</div>
@endsection
