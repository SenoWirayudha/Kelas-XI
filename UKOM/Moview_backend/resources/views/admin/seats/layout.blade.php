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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6"
         x-data="seatGridBuilder(@js($gridPayload), {
             row_direction: @js($studio->row_direction ?? 'front_to_back'),
             seat_types: @js($seatTypeDefinitions)
         })">

        {{-- ===== LEFT: Visual Builder Controls ===== --}}
        <div class="lg:col-span-1 space-y-4">

            {{-- Builder Panel --}}
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-th text-blue-500"></i> Visual Grid Builder
                    <span class="text-xs text-gray-400 font-normal" x-text="`${seatCount()} kursi · ${grid.length} baris`"></span>
                </h3>

                <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                    Tekan &amp; seret di preview untuk melukis banyak sel sekaligus (dari atas ke bawah).
                    Klik sel untuk toggle tipe kursi. Tipe berpasangan dilukis dengan 2+ sel berdekatan —
                    sel berdekatan otomatis menjadi satu grup. Klik ganda = kosongkan sel.
                </p>

                {{-- Dimensions --}}
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Baris</label>
                        <input type="number" x-model.number="rows" min="1" max="26"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kolom Maks</label>
                        <input type="number" x-model.number="cols" min="1" max="60"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                </div>
                <div class="mb-4">
                    <button @click="applyDims()" type="button"
                            class="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
                        <i class="fas fa-arrows-alt"></i> Terapkan Dimensi
                    </button>
                </div>

                {{-- Tools (dynamic from seat type definitions) --}}
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alat (klik sel untuk melukis)</label>
                    <div class="grid grid-cols-2 gap-2">
                        <template x-for="t in tools" :key="t.key">
                            <button type="button"
                                    @click="tool = t.key"
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition"
                                    :class="tool === t.key
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'">
                                <span class="inline-block w-4 h-4 rounded border"
                                      :style="`background:${shade(t.color,55)}; border-color:${t.color}`"></span>
                                <span x-text="t.label"></span>
                            </button>
                        </template>
                    </div>
                </div>

                {{-- Row direction --}}
                <div class="mb-5">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Urutan Label Baris</label>
                    <select x-model="rowDirection"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="front_to_back">A di depan (dekat layar)</option>
                        <option value="back_to_front">A di belakang (jauh dari layar)</option>
                    </select>
                </div>

                <button @click="save()" type="button"
                        :disabled="saving"
                        class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i>
                    <span x-text="saving ? 'Menyimpan...' : 'Simpan Layout'"></span>
                </button>
            </div>

            {{-- Type Manager --}}
            <div class="bg-white rounded-xl shadow p-5" x-data="seatTypeManager()">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i class="fas fa-palette text-blue-500"></i> Tipe Kursi Studio
                </h3>
                <p class="text-xs text-gray-400 mb-3">
                    Definisi tipe kursi custom per studio. Builtin (Regular/Lorong/Entrance/Rusak) tidak bisa dihapus.
                </p>

                <div class="space-y-2">
                    <template x-for="d in defList" :key="d.key">
                        <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50"
                             :class="{ 'opacity-80': isBuiltin(d) }">
                            <span class="inline-block w-5 h-5 rounded border flex-shrink-0"
                                  :style="`background:${shade(d.color,55)}; border-color:${d.color}`"></span>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-gray-800" x-text="d.label"></div>
                                <div class="text-xs text-gray-500">
                                    <template x-if="d.purchase_mode">
                                        <span x-text="d.purchase_mode === 'paired' ? 'Berpasangan' : 'Individual'"></span>
                                    </template>
                                    <template x-if="d.purchase_mode && d.price_multiplier !== null">
                                        <span x-text="' · × ' + d.price_multiplier"></span>
                                    </template>
                                    <template x-if="!d.purchase_mode">
                                        <span>Bukan kursi</span>
                                    </template>
                                    <template x-if="isBuiltin(d)">
                                        <span class="text-gray-400"> · builtin</span>
                                    </template>
                                </div>
                            </div>
                            <button type="button" @click="startEdit(d)"
                                    class="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" @click="remove(d)" :disabled="isBuiltin(d)"
                                    class="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </template>
                </div>

                <button @click="startAdd()" type="button"
                        class="mt-3 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg transition border border-blue-200">
                    <i class="fas fa-plus mr-1"></i> Tambah Tipe Baru
                </button>

                {{-- Add / Edit form --}}
                <div x-show="formOpen" x-cloak class="mt-3 border-t border-gray-100 pt-3">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3"
                        x-text="editingKey ? 'Edit Tipe Kursi' : 'Tambah Tipe Kursi'"></h4>

                    <div class="space-y-3">
                        <template x-if="!editingKey || !isBuiltin(defList.find(d => d.key === editingKey))">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Key (slug, unik)</label>
                                <input type="text" x-model="form.key" :readonly="editingKey"
                                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                       placeholder="contoh: velvet">
                            </div>
                        </template>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Tipe</label>
                            <input type="text" x-model="form.label"
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                   placeholder="contoh: Velvet">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Warna</label>
                            <div class="flex items-center gap-2">
                                <input type="color" x-model="form.color"
                                       class="w-10 h-10 border border-gray-300 rounded cursor-pointer">
                                <span class="text-xs text-gray-500" x-text="form.color"></span>
                            </div>
                        </div>
                        <template x-if="!editingKey || !isBuiltin(defList.find(d => d.key === editingKey))">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Mekanisme Pembelian</label>
                                <select x-model="form.purchase_mode"
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option value="individual">Individual (1 sel = 1 tiket)</option>
                                    <option value="paired">Berpasangan (grup sel dibeli sekaligus)</option>
                                </select>
                            </div>
                        </template>
                        <template x-if="!editingKey || !isBuiltin(defList.find(d => d.key === editingKey))">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Multiplier Harga <span class="text-xs text-gray-400 font-normal">(× harga tiket)</span>
                                </label>
                                <input type="number" step="0.1" min="0" max="20" x-model.number="form.price_multiplier"
                                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            </div>
                        </template>
                    </div>

                    <div class="mt-4 flex items-center gap-2">
                        <button @click="submit()" :disabled="saving" type="button"
                                class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                            <span x-text="saving ? 'Menyimpan...' : 'Simpan'"></span>
                        </button>
                        <button @click="closeForm()" type="button"
                                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50">
                            Batal
                        </button>
                    </div>
                </div>
            </div>

            {{-- Generate Form (fast-start) --}}
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-magic text-blue-500"></i> Generate Cepat (Semua Baris Sama Panjang)
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

                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Kursi per Baris <span class="text-red-500">*</span>
                        </label>
                        <input type="number" name="seats_per_row" required min="1" max="50"
                               value="{{ old('seats_per_row', $seats->isNotEmpty() ? $seats->where('seat_type','seat')->where('seat_row', $seats->first()->seat_row)->count() : 15) }}"
                               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>

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

                    <div class="mb-4">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" x-model="dblAisle"
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-medium text-gray-700">Aktifkan Lorong Kedua</span>
                        </label>
                    </div>

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

                    <div class="border-t border-gray-100 pt-4 mb-3">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" x-model="hasEntrance"
                                   class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400">
                            <span class="text-sm font-medium text-gray-700">Aktifkan Area Entrance</span>
                        </label>
                        <p class="text-xs text-gray-400 mt-1 ml-6">Posisi sudut yang tidak dapat dipesan</p>
                    </div>

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
                            onclick="return requireConfirm(event, 'Generate layout kursi? Layout lama (yang belum dipesan) akan dihapus.', { form: this.closest('form'), danger: false, confirmText: 'Ya, Generate' })"
                            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fas fa-magic"></i> Generate Kursi
                    </button>
                </form>
            </div>

            {{-- Stats --}}
            @if($seats->count() > 0)
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-info-circle text-blue-500"></i> Info Layout Tersimpan
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
                            onclick="return requireConfirm(event, 'Hapus semua kursi studio ini? Kursi yang sudah dipesan tidak akan terhapus.', { form: this.closest('form') })"
                            class="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fas fa-trash"></i> Hapus Semua Kursi
                    </button>
                </form>
            </div>
            @endif
        </div>

        {{-- ===== RIGHT: Interactive Seat Grid Preview ===== --}}
        <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i class="fas fa-th text-blue-500"></i> Preview Builder
                    <span class="text-sm text-gray-400 font-normal" x-text="`(${seatCount()} kursi)`"></span>
                </h3>

                {{-- Screen indicator --}}
                <div class="mb-4 mx-auto w-3/4 py-2 bg-gray-800 text-white text-center text-xs rounded-lg tracking-widest uppercase">
                    ▬▬▬ LAYAR / SCREEN ▬▬▬
                </div>

                {{-- Legend (dynamic from seat type definitions) --}}
                <div class="flex items-center flex-wrap gap-3 mb-4 text-xs text-gray-500">
                    <template x-for="d in defList" :key="d.key">
                        <span class="flex items-center gap-1">
                            <span class="inline-block w-6 h-6 rounded text-center leading-6 font-bold border"
                                  :style="`background:${shade(d.color,55)}; border-color:${d.color}; color:${shade(d.color,-45)}`"
                                  x-text="swatchText(d)"></span>
                            <span x-text="d.label"></span>
                        </span>
                    </template>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 border border-dashed border-gray-300 rounded text-gray-300 text-center leading-6">≡</span> Kosong
                    </span>
                </div>

                {{-- Interactive grid --}}
                <div class="overflow-x-auto">
                    <template x-for="(dr, ri) in displayRows" :key="dr.idx">
                        <div class="flex items-center gap-1 mb-1">
                            <span class="w-5 text-xs font-bold text-gray-500 flex-shrink-0 text-center" x-text="dr.row.label"></span>
                            <template x-for="(cell, ci) in dr.row.cells" :key="ci">
                                <button type="button"
                                        @mousedown.prevent="startPaint(dr.idx, ci, $event)"
                                        @mouseenter="dragPaint(dr.idx, ci)"
                                        @dblclick="clearCell(dr.idx, ci)"
                                        class="flex-shrink-0 h-7 rounded text-xs font-semibold transition select-none"
                                        :class="cellBaseClass(cell)"
                                        :style="cellStyle(cell)"
                                        :title="cellTitle(cell, dr.row.label, dr.idx, ci)"
                                        x-text="cellText(cell, dr.row.label, ci, dr.row.cells)"></button>
                            </template>
                        </div>
                    </template>
                </div>

                <p class="text-xs text-gray-400 mt-4">
                    <i class="fas fa-mouse-pointer mr-1"></i>
                    Tekan &amp; seret = lukis area · Klik = lukis 1 sel · Shift+klik = lukis rentang dari sel terakhir · Klik ganda = hapus sel ·
                    Nomor kursi dihitung otomatis (melewati lorong, pola CGV).
                </p>
            </div>
        </div>

    </div>
</div>
@endsection

@push('scripts')
<script>
    function shade(hex, percent) {
        const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
        if (!m) return '#ffffff';
        let num = parseInt(m[1], 16);
        let amt = Math.round(2.55 * percent);
        let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
        r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
        return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    document.addEventListener('alpine:init', () => {
        Alpine.store('seatTypes', { defs: @js($seatTypeDefinitions) });
    });

    function seatTypeManager() {
        return {
            defList: Alpine.store('seatTypes').defs,
            formOpen: false,
            editingKey: null,
            form: { key: '', label: '', color: '#8B5CF6', price_multiplier: 1.0, purchase_mode: 'individual' },
            saving: false,
            isBuiltin(def) { return !!def && !!def.is_builtin; },
            find(key) { return this.defList.find(d => d.key === key); },
            startAdd() {
                this.editingKey = null;
                this.form = { key: '', label: '', color: '#8B5CF6', price_multiplier: 1.0, purchase_mode: 'individual' };
                this.formOpen = true;
            },
            startEdit(def) {
                this.editingKey = def.key;
                this.form = {
                    key: def.key,
                    label: def.label,
                    color: def.color || '#8B5CF6',
                    price_multiplier: def.price_multiplier ?? 1.0,
                    purchase_mode: def.purchase_mode || 'individual',
                };
                this.formOpen = true;
            },
            closeForm() { this.formOpen = false; this.editingKey = null; },
            async submit() {
                if (this.saving) return;
                this.saving = true;
                const isEdit = this.editingKey !== null;
                const base = @js(route('admin.seat-types.index', $studio->id));
                try {
                    const res = await fetch(base + (isEdit ? '/' + encodeURIComponent(this.editingKey) : ''), {
                        method: isEdit ? 'PUT' : 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        },
                        body: JSON.stringify(this.form),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Gagal menyimpan tipe kursi.');
                    Alpine.store('seatTypes').defs = data.data;
                    this.defList = data.data;
                    this.closeForm();
                    window.__toast(data.message, 'success');
                } catch (e) {
                    window.__toast(e.message, 'error');
                } finally {
                    this.saving = false;
                }
            },
            remove(def) {
                const base = @js(route('admin.seat-types.index', $studio->id));
                window.confirmAction('Hapus tipe kursi "' + def.label + '"?', async () => {
                    try {
                        const res = await fetch(base + '/' + encodeURIComponent(def.key), {
                            method: 'DELETE',
                            headers: {
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            },
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Gagal menghapus tipe kursi.');
                        Alpine.store('seatTypes').defs = data.data;
                        this.defList = data.data;
                        window.__toast(data.message, 'success');
                    } catch (e) {
                        window.__toast(e.message, 'error');
                    }
                }, { danger: true, confirmText: 'Ya, Hapus' });
            },
        };
    }

    function seatGridBuilder(initialGrid, config) {
        return {
            rows: 8,
            cols: 15,
            grid: [],
            tool: 'seat',
            rowDirection: config.row_direction || 'front_to_back',
            groupCounter: 0,
            painting: false,
            saving: false,
            lastPaintCell: null,

            get defList() { return Alpine.store('seatTypes').defs || []; },
            get defs() {
                const m = {};
                for (const d of this.defList) m[d.key] = d;
                return m;
            },
            get sellableKeys() {
                const s = new Set();
                for (const d of this.defList) if (d.purchase_mode) s.add(d.key);
                return s;
            },
            get tools() {
                return this.defList
                    .map(d => ({ key: d.key, label: d.label, color: d.color || '#64748B' }))
                    .concat([{ key: 'empty', label: 'Kosong', color: '#E5E7EB' }]);
            },
            init() {
                if (Array.isArray(initialGrid) && initialGrid.length > 0) {
                    this.grid = initialGrid.map(r => ({ label: r.label, cells: r.cells.map(c => ({ type: c.type, group: c.group || null })) }));
                    this.rows = this.grid.length;
                    this.cols = Math.max(...this.grid.map(r => r.cells.length));
                } else {
                    this.applyDims();
                }
                // When seat type definitions change (add/edit/delete), drop any
                // painted cells whose type no longer exists so save can't fail.
                this.$watch('defList', () => this.cleanUnknownCells());
            },
            cleanUnknownCells() {
                for (const row of this.grid) for (const cell of row.cells) {
                    if (cell.type !== 'empty' && !this.defs[cell.type]) {
                        cell.type = 'empty';
                        cell.group = null;
                    }
                }
                if (this.tool !== 'empty' && !this.defs[this.tool]) {
                    this.tool = 'seat';
                }
            },
            get displayRows() {
                // Render in visual order: if A is front, screen is on top → A at bottom near front.
                const visual = this.grid.map((row, idx) => ({ row, idx }));
                return this.rowDirection === 'front_to_back' ? visual.reverse() : visual;
            },
            applyDims() {
                const r = Math.min(Math.max(parseInt(this.rows) || 1, 1), 26);
                const c = Math.min(Math.max(parseInt(this.cols) || 1, 1), 60);
                const newGrid = [];
                for (let i = 0; i < r; i++) {
                    const cells = [];
                    for (let j = 0; j < c; j++) cells.push({ type: 'seat', group: null });
                    newGrid.push({ label: String.fromCharCode(65 + i), cells });
                }
                this.grid = newGrid;
            },
            seatCount() {
                let n = 0;
                for (const row of this.grid) for (const cell of row.cells) {
                    if (this.sellableKeys.has(cell.type)) n++;
                }
                return n;
            },
            paint(ri, ci) {
                const cell = this.grid[ri].cells[ci];
                const def = this.defs[this.tool];
                if (def && def.purchase_mode === 'paired') {
                    // Join an adjacent cell of the same type (if any) → same group.
                    const row = this.grid[ri].cells;
                    const left = ci > 0 ? row[ci - 1] : null;
                    const right = ci < row.length - 1 ? row[ci + 1] : null;
                    const above = ri > 0 ? this.grid[ri - 1].cells[ci] : null;
                    const below = ri < this.grid.length - 1 ? this.grid[ri + 1].cells[ci] : null;
                    const neighbor = (left && left.type === this.tool) ? left
                        : (right && right.type === this.tool) ? right
                        : (above && above.type === this.tool) ? above
                        : (below && below.type === this.tool) ? below
                        : null;
                    cell.type = this.tool;
                    cell.group = neighbor ? neighbor.group : 'G' + (++this.groupCounter);
                    return;
                }
                cell.type = this.tool;
                cell.group = null;
            },
            startPaint(ri, ci, event) {
                this.painting = true;
                // Shift+click paints the whole range from the last painted cell.
                if (event && event.shiftKey && this.lastPaintCell) {
                    this.paintRange(this.lastPaintCell.ri, this.lastPaintCell.ci, ri, ci);
                } else {
                    this.paint(ri, ci);
                }
                this.lastPaintCell = { ri, ci };
                this._endPaint = () => this.endPaint();
                window.addEventListener('mouseup', this._endPaint, { once: true });
            },
            paintRange(r0, c0, r1, c1) {
                const minR = Math.min(r0, r1), maxR = Math.max(r0, r1);
                const minC = Math.min(c0, c1), maxC = Math.max(c0, c1);
                for (let r = minR; r <= maxR; r++) {
                    const row = this.grid[r];
                    if (!row) continue;
                    for (let c = minC; c <= maxC; c++) {
                        if (c >= 0 && c < row.cells.length) this.paint(r, c);
                    }
                }
            },
            dragPaint(ri, ci) {
                if (this.painting) {
                    this.paint(ri, ci);
                    this.lastPaintCell = { ri, ci };
                }
            },
            endPaint() {
                this.painting = false;
                if (this._endPaint) {
                    window.removeEventListener('mouseup', this._endPaint);
                    this._endPaint = null;
                }
            },
            clearCell(ri, ci) {
                this.grid[ri].cells[ci].type = 'empty';
                this.grid[ri].cells[ci].group = null;
            },
            // Auto-numbering: skip placeholders (aisle/entrance/empty), CGV-style continuous numbering.
            cellNumber(rowCells, ci) {
                let n = 0;
                for (let j = 0; j <= ci; j++) {
                    const t = rowCells[j].type;
                    if (this.sellableKeys.has(t) || t === 'unavailable') n++;
                }
                return n;
            },
            cellText(cell, rowLabel, ci, rowCells) {
                if (cell.type === 'empty') return '';
                if (cell.type === 'aisle') return '≡';
                if (cell.type === 'entrance') return '🚪';
                if (cell.type === 'unavailable') return 'X' + this.cellNumber(rowCells, ci);
                return rowLabel + this.cellNumber(rowCells, ci);
            },
            cellTitle(cell, rowLabel, ri, ci) {
                const def = this.defs[cell.type];
                let label = def ? def.label : (cell.type === 'empty' ? 'Kosong' : cell.type);
                if (cell.group) label += ' (grup ' + cell.group + ')';
                return `${rowLabel} · ${label}`;
            },
            cellBaseClass(cell) {
                return cell.type === 'empty'
                    ? 'w-8'
                    : 'w-8 border';
            },
            cellStyle(cell) {
                const def = this.defs[cell.type];
                if (!def) return {};
                return {
                    backgroundColor: shade(def.color, 55),
                    borderColor: def.color,
                    color: shade(def.color, -45),
                    borderStyle: (cell.type === 'aisle' || cell.type === 'entrance') ? 'dashed' : 'solid',
                };
            },
            swatchText(d) {
                if (d.key === 'aisle') return '≡';
                if (d.key === 'entrance') return '🚪';
                if (d.key === 'unavailable') return 'X';
                if (d.label) return d.label.charAt(0).toUpperCase();
                return d.key.charAt(0).toUpperCase();
            },
            save() {
                if (this.saving) return;
                // Safety net: drop any painted cells whose type no longer exists
                // (e.g. a type was deleted/renamed mid-session), so validation can't fail.
                this.cleanUnknownCells();
                // Reject orphaned paired groups before submit
                const counts = {};
                for (const row of this.grid) for (const cell of row.cells) {
                    const def = this.defs[cell.type];
                    if (def && def.purchase_mode === 'paired') {
                        const g = cell.group;
                        if (!g) { alert('Ada sel berpasangan tanpa grup.'); return; }
                        counts[g] = (counts[g] || 0) + 1;
                    }
                }
                for (const g in counts) {
                    if (counts[g] < 2) {
                        alert('Grup ' + g + ' harus berisi minimal 2 sel. Klik sel berdekatan untuk melengkapinya.');
                        return;
                    }
                }

                const payload = {
                    row_direction: this.rowDirection,
                    rows: this.grid.map(row => ({
                        label: row.label,
                        cells: row.cells.map(c => ({ type: c.type, group: c.group || null })),
                    })),
                };

                this.saving = true;
                fetch(@js(route('admin.seats.save-layout', $studio->id)), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify(payload),
                }).then(res => {
                    if (res.ok) {
                        window.__toast('Layout berhasil disimpan.', 'success');
                        setTimeout(() => window.location.reload(), 600);
                    } else {
                        return res.json().then(data => { throw new Error(data.message || 'Gagal menyimpan layout.'); });
                    }
                }).catch(err => {
                    this.saving = false;
                    window.__toast(err.message, 'error');
                });
            }
        };
    }
</script>
@endpush