@extends('layouts.admin')

@section('title', $isEdit ? 'Ubah Sesi' : 'Tambah Sesi')
@section('page-title', $isEdit ? 'Ubah Sesi Festival' : 'Tambah Sesi Festival')
@section('page-subtitle', $event->title)

@section('content')
@php
    $sessionsUrl = route($panelPrefix.'.events.sessions', $event->id);
    $moviesPayload = $movies->map(fn ($m) => [
        'id' => $m->id,
        'title' => $m->title,
        'release_year' => $m->release_year,
        'duration' => (int) $m->duration,
    ])->values();
@endphp

<div class="max-w-3xl">
    <div class="mb-4">
        <a href="{{ $sessionsUrl }}" data-no-history
           class="inline-flex items-center text-sm text-gray-500 transition hover:text-gray-800">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Sesi
        </a>
    </div>

    <div class="rounded-xl bg-white p-6 shadow">
        @if($errors->any())
            <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                <ul class="list-inside list-disc space-y-1">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST"
              action="{{ $isEdit ? route($panelPrefix.'.events.sessions.update', [$event->id, $session->id]) : route($panelPrefix.'.events.sessions.store', $event->id) }}"
              x-data="festivalSessionForm({{ \Illuminate\Support\Js::from($moviesPayload) }}, {{ \Illuminate\Support\Js::from(array_map('intval', old('movies', $selectedMovies))) }}, {{ (int) \App\Support\FestivalSchedule::GAP_MINUTES }})">
            @csrf
            @if($isEdit) @method('PUT') @endif

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Studio <span class="text-red-500">*</span></label>
                <x-admin.searchable-select
                    name="studio_id"
                    :options="$studios->map(fn ($s) => ['id' => (int) $s->id, 'label' => $s->studio_name . ' — ' . (int) $s->total_seats . ' kursi'])->values()->all()"
                    :selected="(string) old('studio_id', $session->studio_id)"
                    placeholder="Cari studio..."
                    empty-text="Studio tidak ditemukan"
                />
                <p class="mt-1 text-xs text-gray-500">Hanya studio milik bioskop event ini.</p>
            </div>

            <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tanggal <span class="text-red-500">*</span></label>
                    <input type="date" name="show_date" required
                           min="{{ $event->start_date->format('Y-m-d') }}"
                           max="{{ $event->end_date->format('Y-m-d') }}"
                           x-model="showDate" @change="recalc()"
                           value="{{ old('show_date', optional($session->show_date)->format('Y-m-d')) }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Jam Mulai (WIB, 24 jam) <span class="text-red-500">*</span></label>
                    <input type="text" name="show_time" required inputmode="numeric" maxlength="5"
                           placeholder="HH:MM"
                           pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                           oninput="moviewMaskTime(this)"
                           x-model="showTime" @change="recalc()"
                           value="{{ old('show_time', $session->show_time ? substr((string) $session->show_time, 0, 5) : '') }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Judul Sesi</label>
                <input type="text" name="session_title" maxlength="255"
                       value="{{ old('session_title', $session->session_title) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p class="mt-1 text-xs text-gray-500">Wajib diisi jika sesi berisi lebih dari satu film.</p>
            </div>

            {{-- Film picker --}}
            <div class="mb-5 rounded-lg border border-gray-200 p-4">
                <div class="mb-3 flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-700">Film <span class="text-red-500">*</span></p>
                    <button type="button" @click="addMovieOpen = !addMovieOpen"
                            class="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Tambah Film Manual
                    </button>
                </div>

                {{-- Manual film form --}}
                <div x-show="addMovieOpen" x-cloak class="mb-4 rounded-lg bg-gray-50 p-4">
                    <p class="mb-3 text-xs text-gray-600">
                        Film baru langsung tersimpan ke database dengan status terbit.
                    </p>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input type="text" x-model="newMovie.title" placeholder="Judul *"
                               class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <input type="number" x-model.number="newMovie.release_year" placeholder="Tahun rilis *" min="1800"
                               class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <input type="number" x-model.number="newMovie.duration" placeholder="Durasi (menit) *" min="1"
                               class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <input type="text" x-model="newMovie.director" placeholder="Sutradara"
                               class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <textarea x-model="newMovie.synopsis" placeholder="Sinopsis" rows="2"
                                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"></textarea>
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-xs text-gray-600">Poster (opsional)</label>
                            <input type="file" x-ref="newPoster" accept="image/*" class="w-full text-sm">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-xs text-gray-600">Backdrop (opsional)</label>
                            <input type="file" x-ref="newBackdrop" accept="image/*" class="w-full text-sm">
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2">
                        <button type="button" @click="saveMovie()" :disabled="savingMovie"
                                class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                            <i class="fas fa-save mr-1"></i> <span x-text="savingMovie ? 'Menyimpan…' : 'Simpan Film'"></span>
                        </button>
                        <button type="button" @click="addMovieOpen = false"
                                class="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700">
                            Tutup
                        </button>
                        <span class="text-xs text-red-600" x-text="movieError"></span>
                    </div>
                </div>

                {{-- Selected, ordered list --}}
                <template x-if="selected.length">
                    <ol class="mb-3 space-y-1.5">
                        <template x-for="(id, index) in selected" :key="id">
                            <li class="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                                <span class="w-5 text-xs font-bold text-blue-700" x-text="index + 1"></span>
                                <span class="flex-1 truncate text-sm text-gray-800" x-text="movieTitle(id) + ' · ' + movieDuration(id) + ' mnt'"></span>
                                <button type="button" @click="move(index, -1)" :disabled="index === 0"
                                        class="rounded p-1 text-xs text-gray-500 hover:bg-white disabled:opacity-30">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                                <button type="button" @click="move(index, 1)" :disabled="index === selected.length - 1"
                                        class="rounded p-1 text-xs text-gray-500 hover:bg-white disabled:opacity-30">
                                    <i class="fas fa-arrow-down"></i>
                                </button>
                                <button type="button" @click="remove(id)" class="rounded p-1 text-xs text-red-600 hover:bg-white">
                                    <i class="fas fa-times"></i>
                                </button>
                            </li>
                        </template>
                    </ol>
                </template>

                <!-- Searchable film picker: pick a film to append to the line-up -->
                <div x-data="moviewSingleSelect({
                        options: movies.map(m => ({ value: String(m.id), label: m.title + ' (' + m.release_year + ') · ' + m.duration + ' mnt' })),
                        selected: '',
                        placeholder: 'Cari film untuk ditambahkan...',
                        emptyText: 'Film tidak ditemukan'
                     })"
                     x-effect="if (selected) { addMovie(selected); selected = ''; }">
                    <button type="button"
                            @click="open = !open; if (open) $nextTick(() => $refs.search.focus())"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-left flex items-center justify-between bg-white">
                        <span class="truncate text-gray-400" x-text="selectedLabel() || placeholder"></span>
                        <i class="fas fa-chevron-down text-gray-400 text-xs" :class="open ? 'rotate-180' : ''"></i>
                    </button>
                    <div x-show="open" x-cloak @click.outside="open = false"
                         class="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        <div class="p-2 border-b border-gray-200 bg-gray-50">
                            <input type="text" x-ref="search" x-model="query" placeholder="Cari film..."
                                   class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm">
                        </div>
                        <div class="max-h-56 overflow-y-auto p-1">
                            <template x-for="option in filtered()" :key="option.value">
                                <button type="button" @click="select(option.value)"
                                        class="w-full text-left px-3 py-1.5 rounded hover:bg-blue-50 text-sm text-gray-700"
                                        x-text="option.label"></button>
                            </template>
                            <p x-show="filtered().length === 0" class="text-sm text-gray-400 text-center py-2">Film tidak ditemukan</p>
                        </div>
                    </div>
                </div>

                <template x-for="id in selected" :key="'f' + id">
                    <input type="hidden" name="movies[]" :value="id">
                </template>

                <p class="mt-2 text-xs text-gray-500">
                    Total durasi: <span class="font-semibold" x-text="totalDuration()"></span> menit.
                    Perkiraan selesai: <span class="font-semibold" x-text="estimatedEnd()"></span>
                    (termasuk jeda {{ \App\Support\FestivalSchedule::GAP_MINUTES }} menit).
                </p>
            </div>

            <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Harga <span class="text-red-500">*</span></label>
                    <input type="number" name="ticket_price" required min="0" step="500"
                           value="{{ old('ticket_price', (int) $session->ticket_price) }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Kuota</label>
                    <input type="number" name="quota" min="1"
                           value="{{ old('quota', $session->quota) }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <p class="mt-1 text-xs text-gray-500">Kosongkan untuk memakai kapasitas studio.</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit"
                        class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    <i class="fas fa-save mr-2"></i> Simpan Sesi
                </button>
                <a href="{{ $sessionsUrl }}" data-no-history
                   class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
function festivalSessionForm(allMovies, initialSelected, gapMinutes) {
    return {
        movies: allMovies,
        selected: initialSelected || [],
        gapMinutes: gapMinutes,
        showDate: @js(old('show_date', optional($session->show_date)->format('Y-m-d'))),
        showTime: @js(old('show_time', $session->show_time ? substr((string) $session->show_time, 0, 5) : '')),
        addMovieOpen: false,
        savingMovie: false,
        movieError: '',
        newMovie: { title: '', release_year: '', duration: '', director: '', synopsis: '' },

        movie(id) {
            return this.movies.find(m => m.id === Number(id));
        },
        movieTitle(id) { return this.movie(id)?.title ?? '?'; },
        movieDuration(id) { return this.movie(id)?.duration ?? 0; },
        available() { return this.movies.filter(m => !this.selected.includes(m.id)); },

        addMovie(id) {
            const movieId = Number(id);
            if (movieId && !this.selected.includes(movieId)) {
                this.selected.push(movieId);
            }
            this.recalc();
        },
        addFromSelect(event) {
            const id = Number(event.target.value);
            if (id && !this.selected.includes(id)) {
                this.selected.push(id);
            }
            event.target.value = '';
            this.recalc();
        },
        remove(id) {
            this.selected = this.selected.filter(x => x !== id);
            this.recalc();
        },
        move(index, delta) {
            const to = index + delta;
            if (to < 0 || to >= this.selected.length) return;
            const list = this.selected.slice();
            [list[index], list[to]] = [list[to], list[index]];
            this.selected = list;
        },

        totalDuration() {
            return this.selected.reduce((sum, id) => sum + this.movieDuration(id), 0);
        },
        estimatedEnd() {
            if (!this.showTime) return '—';
            const [h, m] = this.showTime.split(':').map(Number);
            const total = h * 60 + m + this.totalDuration() + this.gapMinutes;
            const hh = String(Math.floor((total % 1440) / 60)).padStart(2, '0');
            const mm = String(total % 60).padStart(2, '0');
            return hh + ':' + mm;
        },
        recalc() { /* reactive getters handle the rest */ },

        async saveMovie() {
            this.movieError = '';
            if (!this.newMovie.title || !this.newMovie.release_year || !this.newMovie.duration) {
                this.movieError = 'Judul, tahun, dan durasi wajib diisi.';
                return;
            }
            this.savingMovie = true;
            try {
                const form = new FormData();
                form.append('title', this.newMovie.title);
                form.append('release_year', this.newMovie.release_year);
                form.append('duration', this.newMovie.duration);
                if (this.newMovie.director) form.append('director', this.newMovie.director);
                if (this.newMovie.synopsis) form.append('synopsis', this.newMovie.synopsis);
                const poster = this.$refs.newPoster?.files?.[0];
                const backdrop = this.$refs.newBackdrop?.files?.[0];
                if (poster) form.append('poster', poster);
                if (backdrop) form.append('backdrop', backdrop);

                const response = await fetch(@js(route($panelPrefix.'.events.movies.store')), {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': @js(csrf_token()),
                        'Accept': 'application/json',
                    },
                    body: form,
                });
                const payload = await response.json();
                if (!response.ok || !payload.success) {
                    this.movieError = payload.message || 'Gagal menyimpan film.';
                    return;
                }
                this.movies.push(payload.movie);
                this.selected.push(payload.movie.id);
                this.newMovie = { title: '', release_year: '', duration: '', director: '', synopsis: '' };
                this.addMovieOpen = false;
            } catch (e) {
                this.movieError = 'Gagal menghubungi server.';
            } finally {
                this.savingMovie = false;
            }
        },
    };
}
</script>
@endpush