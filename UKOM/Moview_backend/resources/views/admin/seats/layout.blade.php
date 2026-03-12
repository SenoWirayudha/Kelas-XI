@extends('layouts.admin')

@section('title', 'Layout Kursi — ' . $studio->studio_name)
@section('page-title', 'Layout Kursi')
@section('page-subtitle', $studio->cinema->cinema_name . ' › ' . $studio->studio_name)

@section('content')
<div class="p-6">

    {{-- Alerts --}}
    @if(session('success'))
        <div class="mb-4 px-4 py-3 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-2">
            <i class="fas fa-check-circle"></i> {{ session('success') }}
        </div>
    @endif
    @if(session('error'))
        <div class="mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <i class="fas fa-exclamation-circle"></i> {{ session('error') }}
        </div>
    @endif

    <div class="mb-4">
        <a href="{{ route('admin.studios.index') }}"
           class="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Studio
        </a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {{-- ===== LEFT: Generator Form ===== --}}
        <div class="lg:col-span-1 space-y-4">

            {{-- Generate Form --}}
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-magic text-blue-500"></i> Generate Layout Kursi
                </h3>

                @if($seats->count() > 0)
                    <div class="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded text-xs">
                        <i class="fas fa-exclamation-triangle mr-1"></i>
                        Studio sudah memiliki <strong>{{ $seats->count() }}</strong> kursi.
                        Generate ulang akan menghapus layout lama (kecuali kursi yang sudah dipesan).
                    </div>
                @endif

                <form action="{{ route('admin.seats.generate', $studio->id) }}" method="POST"
                      x-data="{
                          dblAisle: {{ count($aisles) >= 2 ? 'true' : 'false' }},
                          hasEntrance: {{ $entranceConfig['enabled'] ? 'true' : 'false' }}
                      }">
                    @csrf

                    {{-- Jumlah Baris --}}
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah Baris <span class="text-red-500">*</span>
                            <span class="text-xs text-gray-400 font-normal">(A–Z, maks 26)</span>
                        </label>
                        <input type="number" name="rows_count" required min="1" max="26"
                               value="{{ old('rows_count', $rows->count() ?: 8) }}"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <p class="text-xs text-gray-400 mt-1">1 = baris A saja, 10 = A sampai J</p>
                    </div>

                    {{-- Kursi per Baris --}}
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Kursi per Baris <span class="text-red-500">*</span>
                        </label>
                        <input type="number" name="seats_per_row" required min="1" max="50"
                               value="{{ old('seats_per_row', $seats->isNotEmpty() ? $seats->where('seat_type','seat')->where('seat_row', $seats->first()->seat_row)->count() : 15) }}"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>

                    {{-- Lorong 1 --}}
                    <div class="mb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Lorong 1 — Setelah Kursi ke-
                            <span class="text-xs text-gray-400 font-normal">(0 = tidak ada)</span>
                        </label>
                        <input type="number" name="aisle_after_1" min="0" max="49"
                               value="{{ old('aisle_after_1', $aisles[0] ?? 0) }}"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <p class="text-xs text-gray-400 mt-1">Contoh: 8 → lorong antara kursi 8 dan 9</p>
                    </div>

                    {{-- Double Aisle Toggle --}}
                    <div class="mb-4">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" x-model="dblAisle"
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-medium text-gray-700">Aktifkan Lorong Kedua</span>
                        </label>
                    </div>

                    {{-- Lorong 2 --}}
                    <div class="mb-5" x-show="dblAisle" x-cloak>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Lorong 2 — Setelah Kursi ke-
                        </label>
                        <input type="number" name="aisle_after_2" min="1" max="49"
                               value="{{ old('aisle_after_2', $aisles[1] ?? 0) }}"
                               :disabled="!dblAisle"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <p class="text-xs text-gray-400 mt-1">Harus lebih besar dari Lorong 1</p>
                    </div>

                    {{-- Entrance Toggle --}}
                    <div class="border-t border-gray-100 pt-4 mb-3">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" x-model="hasEntrance"
                                   class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400">
                            <span class="text-sm font-medium text-gray-700">Aktifkan Area Entrance</span>
                        </label>
                        <p class="text-xs text-gray-400 mt-1 ml-6">Posisi sudut yang tidak dapat dipesan</p>
                    </div>

                    {{-- Entrance Fields --}}
                    <div class="mb-5 space-y-3 pl-3 border-l-2 border-yellow-300" x-show="hasEntrance" x-cloak>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Mulai dari Baris <span class="text-red-500">*</span>
                            </label>
                            <select name="entrance_start_row"
                                    :disabled="!hasEntrance"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                                <option value="">-- Pilih Baris --</option>
                                @for($i = 0; $i < 26; $i++)
                                    <option value="{{ chr(65 + $i) }}"
                                        {{ old('entrance_start_row', $entranceConfig['start_row']) === chr(65 + $i) ? 'selected' : '' }}>
                                        Baris {{ chr(65 + $i) }}
                                    </option>
                                @endfor
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Lebar Entrance (jumlah kolom)
                            </label>
                            <input type="number" name="entrance_width" min="1" max="25"
                                   value="{{ old('entrance_width', $entranceConfig['width'] ?: 2) }}"
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Posisi Entrance
                            </label>
                            <select name="entrance_side"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                                <option value="left"  {{ old('entrance_side', $entranceConfig['side']) === 'left'  ? 'selected' : '' }}>Kiri</option>
                                <option value="right" {{ old('entrance_side', $entranceConfig['side']) === 'right' ? 'selected' : '' }}>Kanan</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit"
                            onclick="return confirm('Generate layout kursi? Layout lama (yang belum dipesan) akan dihapus.')"
                            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fas fa-magic"></i> Generate Kursi
                    </button>
                </form>
            </div>

            {{-- Stats --}}
            @if($seats->count() > 0)
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-info-circle text-blue-500"></i> Info Layout
                </h3>
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <dt class="text-gray-500">Total Baris</dt>
                        <dd class="font-semibold">{{ $rows->count() }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-gray-500">Total Kursi</dt>
                        <dd class="font-semibold">{{ $seats->where('seat_type','seat')->count() }}</dd>
                    </div>
                    @if($seats->where('seat_type','entrance')->count() > 0)
                    <div class="flex justify-between">
                        <dt class="text-gray-500">Area Entrance</dt>
                        <dd class="font-semibold">{{ $seats->where('seat_type','entrance')->count() }} posisi</dd>
                    </div>
                    @endif
                    <div class="flex justify-between">
                        <dt class="text-gray-500">Baris</dt>
                        <dd class="font-semibold">{{ $rows->keys()->first() }} – {{ $rows->keys()->last() }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-gray-500">Lorong</dt>
                        <dd class="font-semibold">
                            @if(count($aisles) === 0)
                                Tidak ada
                            @else
                                {{ collect($aisles)->map(fn($a) => 'setelah ke-'.$a)->implode(', ') }}
                            @endif
                        </dd>
                    </div>
                </dl>

                <form action="{{ route('admin.seats.destroy-all', $studio->id) }}" method="POST" class="mt-4">
                    @csrf
                    @method('DELETE')
                    <button type="submit"
                            onclick="return confirm('Hapus semua kursi studio ini? Kursi yang sudah dipesan tidak akan terhapus.')"
                            class="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fas fa-trash"></i> Hapus Semua Kursi
                    </button>
                </form>
            </div>
            @endif
        </div>

        {{-- ===== RIGHT: Seat Layout Preview ===== --}}
        <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-th text-blue-500"></i> Preview Layout
                    @if($seats->count() > 0)
                        <span class="text-sm text-gray-400 font-normal">({{ $seats->where('seat_type','seat')->count() }} kursi)</span>
                    @endif
                </h3>

                @if($seats->count() === 0)
                    <div class="py-16 text-center text-gray-400">
                        <i class="fas fa-chair text-5xl mb-3 block"></i>
                        <p class="font-medium">Belum ada layout kursi.</p>
                        <p class="text-sm mt-1">Gunakan form generator di sebelah kiri untuk membuat layout.</p>
                    </div>
                @else
                    {{-- Screen indicator --}}
                    <div class="mb-4 mx-auto w-3/4 py-2 bg-gray-800 text-white text-center text-xs rounded-lg tracking-widest uppercase">
                        ▬▬▬ LAYAR / SCREEN ▬▬▬
                    </div>

                    {{-- Legend --}}
                    <div class="flex items-center flex-wrap gap-3 mb-4 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                            <span class="inline-block w-6 h-6 bg-blue-100 border border-blue-300 rounded text-blue-700 text-center leading-6 font-bold">A</span> Kursi
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="inline-block w-6 h-6 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-300 text-center leading-6">≡</span> Lorong
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="inline-block w-6 h-6 bg-yellow-50 border border-dashed border-yellow-300 rounded text-yellow-500 text-center leading-6"><i class="fas fa-door-open"></i></span> Entrance
                        </span>
                    </div>

                    {{-- Seat Grid --}}
                    <div class="overflow-x-auto">
                        @foreach($rows->reverse() as $rowLabel => $rowSeats)
                        @php
                            $byX = $rowSeats->sortBy('position_x')->keyBy('position_x');
                            $maxX = $rowSeats->max('position_x');
                        @endphp
                        <div class="flex items-center gap-1 mb-1">
                            {{-- Row label --}}
                            <span class="w-5 text-xs font-bold text-gray-500 flex-shrink-0 text-center">{{ $rowLabel }}</span>

                            @for($x = 0; $x <= $maxX; $x++)
                                @if($byX->has($x))
                                    @php $seat = $byX[$x]; @endphp
                                    @if($seat->seat_type === 'aisle')
                                        {{-- Aisle column marker --}}
                                        <span class="flex-shrink-0 w-6 h-7 flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-gray-300 text-xs"
                                              title="Lorong">≡</span>
                                    @elseif($seat->seat_type === 'entrance')
                                        <span class="flex-shrink-0 w-8 h-7 flex items-center justify-center rounded border border-dashed border-yellow-300 bg-yellow-50 text-yellow-500 text-xs"
                                              title="Pintu masuk"><i class="fas fa-door-open"></i></span>
                                    @else
                                        <span title="{{ $seat->seat_code }}"
                                              class="flex-shrink-0 w-8 h-7 flex items-center justify-center rounded text-xs font-semibold
                                                     {{ $seat->is_active ? 'bg-blue-100 border border-blue-300 text-blue-800' : 'bg-gray-200 border border-gray-300 text-gray-400' }}">
                                            {{ $seat->seat_code }}
                                        </span>
                                    @endif
                                @else
                                    <span class="flex-shrink-0 w-8 h-7"></span>
                                @endif
                            @endfor
                        </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

    </div>
</div>
@endsection
