@extends('layouts.admin')

@section('title', 'Edit Jadwal')
@section('page-title', 'Edit Jadwal')
@section('page-subtitle', 'Perbarui jadwal tayang film')

@section('content')
@php
    $returnUrl = \App\Support\ReturnUrl::fromRequest(request());
    $backUrl = $returnUrl ?? route($panelPrefix.'.schedules.index');
@endphp
<div class="max-w-2xl p-0 sm:p-6">

    <div class="mb-4">
        <a href="{{ $backUrl }}" data-no-history
           class="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Jadwal
        </a>
    </div>

    <div class="bg-white rounded-xl shadow p-6">

        @if($errors->any())
            <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                <ul class="list-disc list-inside space-y-1">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route($panelPrefix.'.schedules.update', $schedule->id) }}" method="POST" x-data="scheduleForm()" x-init="init()">
            @csrf
            @method('PUT')
            <input type="hidden" name="return" value="{{ $returnUrl }}">

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Movie <span class="text-red-500">*</span></label>
                <select name="movie_id" required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Film --</option>
                    @foreach($movies as $movie)
                        <option value="{{ $movie->id }}" {{ old('movie_id', $schedule->movie_id) == $movie->id ? 'selected' : '' }}>
                            {{ $movie->title }}{{ $movie->release_date ? ' — Rilis: ' . \Carbon\Carbon::parse($movie->release_date)->translatedFormat('d M Y') : '' }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Cinema hidden for managers: their own cinema is applied by the backend. --}}
            <div class="mb-5 {{ $isManager ? 'hidden' : '' }}">
                <label class="block text-sm font-medium text-gray-700 mb-1">Cinema <span class="text-red-500">*</span></label>
                <select name="cinema_id" {{ $isManager ? '' : 'required' }}
                        x-model="cinemaId"
                        @change="loadStudios()"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Bioskop --</option>
                    @foreach($cinemas as $cinema)
                        <option value="{{ $cinema->id }}" {{ old('cinema_id', $schedule->studio->cinema_id ?? '') == $cinema->id ? 'selected' : '' }}>
                            {{ $cinema->cinema_name }}{{ $cinema->city ? ' — ' . $cinema->city : '' }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Studio <span class="text-red-500">*</span></label>
                <select name="studio_id" required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Studio --</option>
                    @foreach($studios as $studio)
                        <option value="{{ $studio->id }}" {{ old('studio_id', $schedule->studio_id) == $studio->id ? 'selected' : '' }}>
                            {{ $studio->cinema->cinema_name ?? '' }} — {{ $studio->studio_name }} ({{ $studio->total_seats }} kursi)
                        </option>
                    @endforeach
                </select>
                <p class="text-xs text-gray-400 mt-1">Pilih bioskop terlebih dahulu untuk memfilter studio.</p>
            </div>

            <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Show Date <span class="text-red-500">*</span></label>
                    <input type="date" name="show_date" required
                           value="{{ old('show_date', \Carbon\Carbon::parse($schedule->show_date)->format('Y-m-d')) }}"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Show Time <span class="text-red-500">*</span></label>
                    <input type="text" name="show_time" required
                           value="{{ old('show_time', substr($schedule->show_time, 0, 5)) }}"
                           placeholder="17:30"
                           inputmode="numeric" maxlength="5"
                           pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                           title="Format 24 jam, contoh: 17:30"
                           oninput="this.value = this.value.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})/, '$1:')"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <p class="text-xs text-gray-400 mt-1">Format 24 jam (WIB), contoh: 17:30</p>
                </div>
            </div>

            {{-- Harga dasar (Reguler). Tipe kursi lain menambah nominal di bawah. --}}
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Harga Dasar (Reguler) (Rp) <span class="text-red-500">*</span></label>
                <input type="number" name="ticket_price" required min="0" step="500"
                       x-model.number="basePrice"
                       value="{{ old('ticket_price', $schedule->ticket_price) }}"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Pratinjau harga per tipe kursi</p>
                    <template x-if="selectedStudio">
                        <ul class="space-y-1 text-sm">
                            <template x-for="type in (selectedStudio.surcharges || [])" :key="type.key">
                                <li class="flex items-center justify-between gap-3">
                                    <span class="text-gray-700" x-text="type.label"></span>
                                    <span class="text-gray-900 font-medium">
                                        Rp <span x-text="formatRupiah((Number(basePrice) || 0) + Number(type.surcharge || 0))"></span>
                                        <span class="text-xs text-gray-400" x-show="Number(type.surcharge || 0) > 0"
                                              x-text="'(+Rp ' + formatRupiah(type.surcharge) + ')'"></span>
                                    </span>
                                </li>
                            </template>
                        </ul>
                    </template>
                    <p class="text-xs text-gray-400" x-show="!selectedStudio">Pilih studio untuk melihat pratinjau harga.</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit"
                        class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    <i class="fas fa-save mr-2"></i> Update Jadwal
                </button>
                <a href="{{ $backUrl }}"
                   data-no-history
                   class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>

<script>
function scheduleForm() {
    return {
        cinemaId: '{{ old('cinema_id', $schedule->studio->cinema_id ?? '') }}',
        basePrice: {{ (int) old('ticket_price', (int) $schedule->ticket_price) }},
        studios: [],
        selectedStudioId: '{{ old('studio_id', $schedule->studio_id) }}',
        get selectedStudio() {
            return this.studios.find(s => String(s.id) === String(this.selectedStudioId)) || null;
        },
        formatRupiah(value) {
            return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
        },
        init() {
            if (this.cinemaId) this.loadStudios();
        },
        loadStudios() {
            if (!this.cinemaId) return;
            const select = document.querySelector('select[name="studio_id"]');
            const oldVal = '{{ old('studio_id', $schedule->studio_id) }}';
            fetch(`/{{ $panelPrefix }}/cinemas/${this.cinemaId}/studios`)
                .then(r => r.json())
                .then(studios => {
                    select.innerHTML = '<option value="">-- Pilih Studio --</option>';
                    this.studios = studios;
                    studios.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.id;
                        opt.textContent = `${s.studio_name} (${s.total_seats} kursi)`;
                        if (String(s.id) === String(oldVal)) opt.selected = true;
                        select.appendChild(opt);
                    });
                    select.addEventListener('change', () => { this.selectedStudioId = select.value; });
                    this.selectedStudioId = select.value;
                });
        }
    }
}
</script>
@endsection
