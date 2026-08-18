@extends('layouts.admin')

@section('title', isset($film) ? 'Edit Film' : 'Add New Film')
@section('page-title', isset($film) ? 'Edit Film' : 'Add New Film')
@section('page-subtitle', isset($film) ? 'Update film information' : 'Add a new film to the collection')

@section('content')
<div class="max-w-6xl">
    <!-- Back Button -->
    <div class="mb-6">
        <a href="{{ route('admin.films.index') . (request()->getQueryString() ? '?' . request()->getQueryString() : '') }}" class="text-blue-600 hover:text-blue-800 flex items-center">
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">Original Title (Judul Asli)</label>
                    <input type="text" 
                           name="original_title"
                           value="{{ old('original_title', $film->original_title ?? '') }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('original_title') border-red-500 @enderror"
                           placeholder="Contoh: 霸王别姬"
                           >
                    @error('original_title')
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">Runtime (minutes)</label>
                    <input type="number" 
                           name="duration"
                           value="{{ old('duration', $film->duration ?? '') }}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('duration') border-red-500 @enderror"
                           placeholder="120">
                    @error('duration')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Age Rating</label>
                    <select name="age_rating" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select age rating</option>
                        <option value="G" {{ old('age_rating', $film->age_rating ?? '') === 'G' ? 'selected' : '' }}>G - General Audiences</option>
                        <option value="PG" {{ old('age_rating', $film->age_rating ?? '') === 'PG' ? 'selected' : '' }}>PG - Parental Guidance</option>
                        <option value="PG-13" {{ old('age_rating', $film->age_rating ?? '') === 'PG-13' ? 'selected' : '' }}>PG-13 - Parents Strongly Cautioned</option>
                        <option value="R" {{ old('age_rating', $film->age_rating ?? '') === 'R' ? 'selected' : '' }}>R - Restricted</option>
                        <option value="NC-17" {{ old('age_rating', $film->age_rating ?? '') === 'NC-17' ? 'selected' : '' }}>NC-17 - Adults Only</option>
                        <option value="Not Rated" {{ old('age_rating', $film->age_rating ?? '') === 'Not Rated' ? 'selected' : '' }}>Not Rated</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Release Status</label>
                    <input type="hidden" name="status" value="{{ old('status', $film->status ?? 'draft') }}">
                    @if(isset($film) && $film->release_status === 'released')
                        <span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                            <i class="fas fa-circle-check mr-2"></i>
                            Rilis
                        </span>
                    @else
                        <span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700">
                            <i class="fas fa-clock mr-2"></i>
                            Coming Soon
                        </span>
                    @endif
                    <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        Status rilis dihitung otomatis dari data Release Dates di bawah: "Rilis" jika sudah ada tanggal theatrical/streaming yang lewat.
                    </p>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Synopsis</label>
                    <textarea name="synopsis" rows="5" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter film synopsis">{{ old('synopsis', $film->synopsis ?? '') }}</textarea>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Trailer URL
                        <span class="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input type="url" 
                           name="trailer_url" 
                           value="{{ old('trailer_url', $film->trailer_url ?? '') }}"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="https://www.youtube.com/watch?v=...">
                    <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        Enter YouTube, Vimeo, or other video platform URL
                    </p>
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
            <x-admin.searchable-multiselect
                name="genres[]"
                :options="$genres"
                :selected="old('genres', isset($film) ? $film->movieGenres->pluck('genre_id')->all() : [])"
                placeholder="Search genres..."
            />
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
            <p class="text-sm text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                Searchable multi-select — {{ $countries->count() }} countries total.
            </p>
            <x-admin.searchable-multiselect
                name="countries[]"
                :options="$countries"
                :selected="old('countries', isset($film) ? $film->movieCountries->pluck('country_id')->all() : [])"
                placeholder="Search countries..."
            />
        </div>

        <!-- Languages -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-language text-blue-600 mr-2"></i>
                Languages
            </h3>
            <p class="text-sm text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                Searchable multi-select — {{ $languages->count() }} languages total.
            </p>
            <x-admin.searchable-multiselect
                name="languages[]"
                :options="$languages"
                :selected="old('languages', isset($film) ? $film->movieLanguages->pluck('language_id')->all() : [])"
                placeholder="Search languages..."
            />
        </div>

        <!-- Production Houses -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-building text-blue-600 mr-2"></i>
                Production Houses
            </h3>
            <p class="text-sm text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                Bisa pilih dari {{ $productionHouses->count() }} production house yang ada, atau tambahkan baru langsung dari dropdown.
            </p>
            <x-admin.searchable-multiselect
                name="production_houses[]"
                :options="$productionHouses"
                :selected="old('production_houses', isset($film) ? $film->movieProductionHouses->pluck('production_house_id')->all() : [])"
                placeholder="Search production houses..."
                add-url="{{ route('admin.production-houses.store') }}"
                add-label="+ Add Production House"
                add-placeholder="Production house name... e.g. A24"
                add-button-text="Add"
            />
        </div>

        <!-- Themes -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
                <i class="fas fa-palette text-purple-600 mr-2"></i>
                Themes
            </h3>
            <p class="text-sm text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                Tema/mood film seperti "Coming of age" atau "Mind-bending twists" — {{ $themes->count() }} themes tersedia, bisa tambah baru.
            </p>
            <x-admin.searchable-multiselect
                name="themes[]"
                :options="$themes"
                :selected="old('themes', isset($film) ? $film->movieThemes->pluck('theme_id')->all() : [])"
                placeholder="Search themes..."
                add-url="{{ route('admin.themes.store') }}"
                add-label="+ Add Theme"
                add-placeholder="Theme name... e.g. Mind-bending twists"
                add-button-text="Add"
            />
        </div>

        <!-- Release Dates -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-2 flex items-center">
                <i class="fas fa-calendar-alt text-blue-600 mr-2"></i>
                Release Dates
            </h3>
            <p class="text-sm text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                Multiple releases per film — premiere/festival, theatrical, streaming. Satu baris per rilis. Tanggal premiere paling awal dipakai sebagai primary release date.
            </p>

            <div
                x-data="releaseManager({
                    countries: {{ \Illuminate\Support\Js::from($releaseCountries->map(fn ($c) => ['id' => (int) $c->id, 'name' => $c->name, 'code' => $c->code])->all()) }},
                    rows: {{ \Illuminate\Support\Js::from($existingReleases) }}
                })"
            >
                <template x-for="(row, index) in rows" :key="index">
                    <div class="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/50">
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <!-- Type -->
                            <div class="md:col-span-3">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                <select x-model="row.type"
                                        :name="`releases[${index}][type]`"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="premiere">Premiere / Festival</option>
                                    <option value="theatrical">Theatrical</option>
                                    <option value="streaming">Streaming</option>
                                </select>
                            </div>

                            <!-- Country (searchable, flag) -->
                            <div class="md:col-span-3">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Country</label>
                                <div class="relative">
                                    <button type="button"
                                            @click="toggleCountry(index)"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                                        <span class="flex items-center min-w-0">
                                            <span x-show="row.country_code" class="mr-2 text-base leading-none" x-text="flagEmoji(row.country_code)"></span>
                                            <span x-text="countryName(row.country_code)" class="text-gray-800 truncate"></span>
                                            <span x-show="!row.country_code" class="text-gray-400">Pilih negara...</span>
                                        </span>
                                        <i class="fas fa-chevron-down text-gray-400 text-xs" :class="row.open ? 'rotate-180' : ''"></i>
                                    </button>
                                    <input type="hidden" :name="`releases[${index}][country_code]`" :value="row.country_code || ''">

                                    <div x-show="row.open"
                                         x-cloak
                                         x-transition
                                         @click.outside="row.open = false"
                                         class="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                        <div class="p-2 border-b border-gray-200 bg-gray-50 relative">
                                            <i class="fas fa-search text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm"></i>
                                            <input type="text"
                                                   x-model="row.query"
                                                   class="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                   placeholder="Search country...">
                                        </div>
                                        <div class="max-h-48 overflow-y-auto p-1">
                                            <template x-for="c in filteredCountries(row.query)" :key="c.code">
                                                <button type="button"
                                                        @click="selectCountry(index, c.code); row.open = false"
                                                        class="w-full flex items-center px-3 py-1.5 rounded hover:bg-blue-50 text-sm text-left"
                                                        :class="row.country_code === c.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'">
                                                    <span class="mr-2 text-base" x-text="flagEmoji(c.code)"></span>
                                                    <span x-text="c.name"></span>
                                                </button>
                                            </template>
                                            <p x-show="filteredCountries(row.query).length === 0" class="text-sm text-gray-400 text-center py-2">
                                                No countries found
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Name (festival / platform) — hidden for theatrical -->
                            <div class="md:col-span-3" x-show="row.type !== 'theatrical'">
                                <label class="block text-xs font-medium text-gray-600 mb-1">
                                    <span x-text="row.type === 'premiere' ? 'Festival Name' : 'Platform Name'"></span>
                                    <span class="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input type="text"
                                       x-model="row.name"
                                       :name="`releases[${index}][name]`"
                                       :placeholder="row.type === 'premiere' ? 'e.g. Cannes Film Festival' : 'e.g. Netflix'"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div class="md:col-span-3" x-show="row.type === 'theatrical'">
                                <label class="block text-xs font-medium text-gray-600 mb-1">&nbsp;</label>
                                <p class="px-3 py-2 text-xs text-gray-400 bg-gray-100 rounded-lg">Nama tidak diperlukan untuk rilis theatrical</p>
                            </div>

                            <!-- Date -->
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                <input type="date"
                                       x-model="row.release_date"
                                       :name="`releases[${index}][release_date]`"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <!-- Remove -->
                            <div class="md:col-span-1 flex md:justify-end">
                                <button type="button"
                                        @click="removeRow(index)"
                                        class="mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        title="Remove release">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </template>

                <p x-show="rows.length === 0" class="text-sm text-gray-400 text-center py-3">
                    Belum ada release. Tambahkan baris di bawah.
                </p>

                <button type="button"
                        @click="addRow()"
                        class="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 transition-colors duration-200 flex items-center justify-center">
                    <i class="fas fa-plus mr-2"></i>
                    Add Release Date
                </button>
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

<script>
function releaseManager(cfg) {
    return {
        countries: cfg.countries || [],
        rows: cfg.rows && cfg.rows.length ? cfg.rows.map(normalizeRow) : [],
        addRow() {
            this.rows.push(emptyRow());
        },
        removeRow(index) {
            this.rows.splice(index, 1);
        },
        toggleCountry(index) {
            this.rows.forEach((row, i) => { if (i !== index) row.open = false; });
            this.rows[index].open = !this.rows[index].open;
        },
        selectCountry(index, code) {
            this.rows[index].country_code = code;
        },
        filteredCountries(query) {
            const q = (query || '').trim().toLowerCase();
            if (!q) return this.countries;
            return this.countries.filter(c => c.name.toLowerCase().includes(q));
        },
        countryName(code) {
            const c = this.countries.find(x => x.code === code);
            return c ? c.name : '';
        },
        flagEmoji(code) {
            if (!code || code.length !== 2) return '';
            const base = 127397;
            return code.toUpperCase().split('').map(ch => String.fromCodePoint(base + ch.charCodeAt(0))).join('');
        }
    };
}
function emptyRow() {
    return { type: 'theatrical', country_code: '', name: '', release_date: '', query: '', open: false };
}
function normalizeRow(row) {
    return Object.assign({}, emptyRow(), row || {});
}
</script>
@endsection
