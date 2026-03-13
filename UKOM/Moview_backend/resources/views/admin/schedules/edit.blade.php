@extends('layouts.admin')

@section('title', 'Edit Jadwal')
@section('page-title', 'Edit Jadwal')
@section('page-subtitle', 'Perbarui jadwal tayang film')

@section('content')
<div class="p-6 max-w-2xl">

    <div class="mb-4">
        <a href="{{ route('admin.schedules.index') }}"
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

        <form action="{{ route('admin.schedules.update', $schedule->id) }}" method="POST" x-data="scheduleForm()" x-init="init()">
            @csrf
            @method('PUT')

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

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Cinema <span class="text-red-500">*</span></label>
                <select name="cinema_id" required
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

            <div class="grid grid-cols-2 gap-4 mb-5">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Show Date <span class="text-red-500">*</span></label>
                    <input type="date" name="show_date" required
                           value="{{ old('show_date', \Carbon\Carbon::parse($schedule->show_date)->format('Y-m-d')) }}"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Show Time <span class="text-red-500">*</span></label>
                    <input type="time" name="show_time" required
                           value="{{ old('show_time', substr($schedule->show_time, 0, 5)) }}"
                           class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
            </div>

            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Price (Rp) <span class="text-red-500">*</span></label>
                <input type="number" name="ticket_price" required min="0" step="500"
                       value="{{ old('ticket_price', $schedule->ticket_price) }}"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="flex items-center gap-3">
                <button type="submit"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    <i class="fas fa-save mr-2"></i> Update Jadwal
                </button>
                <a href="{{ route('admin.schedules.index') }}"
                   class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
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
        init() {
            if (this.cinemaId) this.loadStudios();
        },
        loadStudios() {
            if (!this.cinemaId) return;
            const select = document.querySelector('select[name="studio_id"]');
            const oldVal = '{{ old('studio_id', $schedule->studio_id) }}';
            fetch(`/admin/cinemas/${this.cinemaId}/studios`)
                .then(r => r.json())
                .then(studios => {
                    select.innerHTML = '<option value="">-- Pilih Studio --</option>';
                    studios.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.id;
                        opt.textContent = `${s.studio_name} (${s.total_seats} kursi)`;
                        if (String(s.id) === String(oldVal)) opt.selected = true;
                        select.appendChild(opt);
                    });
                });
        }
    }
}
</script>
@endsection
