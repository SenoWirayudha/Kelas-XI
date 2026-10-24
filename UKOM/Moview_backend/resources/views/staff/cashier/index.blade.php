@extends('layouts.admin')

@section('title', 'Kasir Tiket')
@section('page-title', 'Kasir Tiket')
@section('page-subtitle', 'Pilih film lalu jam tayang hari ini')

@section('header-actions')
<div class="flex flex-col items-end gap-1">
    <button type="button"
            onclick="window.moviewCashierWide?.toggle()"
            class="inline-flex min-h-[40px] items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            aria-label="Layar Penuh">
        <i class="fas fa-expand sm:mr-2"></i>
        <span class="hidden sm:inline">Layar Penuh</span>
    </button>
    <p class="hidden max-w-[210px] text-right text-[10px] leading-tight text-gray-400 xl:block">
        Tekan F11 agar layar penuh browser menetap di semua langkah.
    </p>
</div>
@endsection

@section('content')
<style>
    .cashier-screen { height: 100%; }
    html.cashier-fullscreen .cashier-screen { padding: 0.75rem; }
</style>
<div class="cashier-screen flex min-h-0 flex-col"
     x-data="cashierFilms(@js($films))">

    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
            <p class="text-sm text-gray-400">
                <span class="font-semibold text-white">{{ number_format($totalFilms, 0, ',', '.') }}</span> film
                <span class="mx-1">•</span>
                <span class="font-semibold text-white">{{ number_format($totalSchedules, 0, ',', '.') }}</span> jam tayang tersedia
            </p>
            <p class="mt-0.5 text-xs text-gray-500">Jadwal yang sudah lewat batas kasir tidak ditampilkan.</p>
        </div>
        <span x-show="films.length > 0" class="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            Halaman <span x-text="page"></span> / <span x-text="totalPages"></span>
        </span>
    </div>

    @if($films->isEmpty())
        <div class="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-700/60 bg-white text-center">
            <i class="fas fa-film text-4xl text-gray-600"></i>
            <p class="mt-3 text-sm font-medium text-gray-300">Tidak ada jadwal tayang hari ini</p>
            <p class="mt-1 text-xs text-gray-500">Jadwal yang sudah melewati batas penjualan kasir otomatis disembunyikan.</p>
        </div>
    @else
        <div class="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 lg:overflow-hidden">
            <template x-for="film in pagedFilms" :key="film.id">
                <article class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-700/60 bg-white shadow-lg">
                    <div class="flex gap-3 border-b border-gray-700/50 p-3">
                        <template x-if="film.poster_url">
                            <img :src="film.poster_url" :alt="film.title"
                                 class="h-20 w-14 flex-shrink-0 rounded-lg object-cover bg-gray-800">
                        </template>
                        <template x-if="!film.poster_url">
                            <div class="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-600">
                                <i class="fas fa-film"></i>
                            </div>
                        </template>
                        <div class="min-w-0 flex-1">
                            <h3 class="truncate text-base font-semibold text-white" :title="film.title" x-text="film.title"></h3>
                            <p class="mt-1 text-xs text-gray-500"><span x-text="film.studios.length"></span> studio tersedia</p>
                        </div>
                    </div>

                    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                        <template x-for="studio in film.studios" :key="studio.name + '|' + studio.type">
                            <div>
                                <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    <i class="fas fa-door-open mr-1 text-blue-400"></i><span x-text="studio.name"></span>
                                    <span class="font-normal normal-case text-gray-500" x-show="studio.type" x-text="'• ' + studio.type"></span>
                                </p>
                                <div class="flex flex-wrap gap-1.5">
                                    <template x-for="schedule in studio.schedules" :key="schedule.id">
                                        <a :href="seatsUrl + '?schedule_id=' + schedule.id"
                                           class="group inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/25"
                                           :title="'Tutup kasir ' + schedule.closes_at">
                                            <i class="far fa-clock text-[10px] text-blue-400"></i>
                                            <span x-text="schedule.time"></span>
                                        </a>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </div>
                </article>
            </template>
        </div>

        <div x-show="totalPages > 1" class="mt-3 flex items-center justify-between gap-3">
            <button type="button" @click="prev()"
                    :disabled="!hasPrev"
                    class="inline-flex min-h-[40px] items-center rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition disabled:pointer-events-none disabled:opacity-40 hover:bg-gray-800">
                <i class="fas fa-chevron-left mr-1"></i> Sebelumnya
            </button>
            <button type="button" @click="next()"
                    :disabled="!hasNext"
                    class="inline-flex min-h-[40px] items-center rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition disabled:pointer-events-none disabled:opacity-40 hover:bg-gray-800">
                Berikutnya <i class="fas fa-chevron-right ml-1"></i>
            </button>
        </div>
    @endif
</div>
@endsection

@push('scripts')
<script>
function cashierFilms(films) {
    return {
        films: films || [],
        page: 1,
        perPage: 2,
        seatsUrl: '{{ route('staff.cashier.seats') }}',

        init() {
            this.applyBreakpoint();
            window.addEventListener('resize', () => this.applyBreakpoint());
        },

        applyBreakpoint() {
            const width = window.innerWidth;
            this.perPage = width >= 1024 ? 6 : (width >= 640 ? 4 : 2);
            if (this.page > this.totalPages) this.page = this.totalPages;
        },

        get totalPages() {
            return Math.max(1, Math.ceil(this.films.length / this.perPage));
        },

        get pagedFilms() {
            const start = (this.page - 1) * this.perPage;
            return this.films.slice(start, start + this.perPage);
        },

        get hasPrev() { return this.page > 1; },
        get hasNext() { return this.page < this.totalPages; },

        prev() { if (this.hasPrev) this.page--; },
        next() { if (this.hasNext) this.page++; },
    };
}
</script>
@endpush