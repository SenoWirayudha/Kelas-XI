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
             seat_prices: @js($studio->seat_prices ?? ['couple' => 1.5, 'premium' => 2.0, 'wheelchair' => 1.0])
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
                    Klik sel pada preview untuk toggle tipe kursi. Baris boleh tidak sama panjang
                    (sel ujung kiri/kanan dikosongkan). Sweetbox/Couple dibuat dengan klik 2 sel
                    berdekatan setelah memilih tool <b>Couple</b>.
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

                {{-- Tools --}}
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alat (klik sel untuk melukis)</label>
                    <div class="grid grid-cols-2 gap-2">
                        <template x-for="t in tools" :key="t.id">
                            <button type="button"
                                    @click="tool = t.id; couplePending = null"
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition"
                                    :class="tool === t.id
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'">
                                <span class="inline-block w-4 h-4 rounded border"
                                      :style="`background:${t.color}; border-color:${t.border}`"></span>
                                <span x-text="t.label"></span>
                            </button>
                        </template>
                    </div>
                    <div class="mt-2 text-xs text-gray-400" x-show="couplePending" x-cloak>
                        <i class="fas fa-hand-pointer text-rose-500 mr-1"></i>
                        Pilih sel pasangan (berdekatan) untuk melengkapi sweetbox/couple.
                    </div>
                </div>

                {{-- Row direction --}}
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Urutan Label Baris</label>
                    <select x-model="rowDirection"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="front_to_back">A di depan (dekat layar)</option>
                        <option value="back_to_front">A di belakang (jauh dari layar)</option>
                    </select>
                </div>

                {{-- Price multipliers --}}
                <div class="mb-5 border-t border-gray-100 pt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Multiplier Harga (× ticket_price)
                        <span class="text-xs text-gray-400 font-normal">· regular = 1.0</span>
                    </label>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <span class="w-24 text-xs text-gray-600">Sweetbox/Couple</span>
                            <input type="number" step="0.1" min="0" max="20" x-model.number="seatPrices.couple"
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-24 text-xs text-gray-600">Premiere/Sofa</span>
                            <input type="number" step="0.1" min="0" max="20" x-model.number="seatPrices.premium"
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-24 text-xs text-gray-600">Aksesibilitas</span>
                            <input type="number" step="0.1" min="0" max="20" x-model.number="seatPrices.wheelchair"
                                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        </div>
                    </div>
                </div>

                <button @click="save()" type="button"
                        :disabled="saving"
                        class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i>
                    <span x-text="saving ? 'Menyimpan...' : 'Simpan Layout'"></span>
                </button>
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

                {{-- Legend --}}
                <div class="flex items-center flex-wrap gap-3 mb-4 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-blue-100 border border-blue-300 rounded text-blue-700 text-center leading-6 font-bold">A</span> Regular
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-rose-100 border border-rose-400 rounded text-rose-700 text-center leading-6 font-bold">C</span> Sweetbox/Couple
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-purple-100 border border-purple-400 rounded text-purple-700 text-center leading-6 font-bold">P</span> Premiere/Sofa
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-green-100 border border-green-500 rounded text-green-700 text-center leading-6 font-bold">W</span> Aksesibilitas
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-gray-200 border border-gray-400 rounded text-gray-500 text-center leading-6 font-bold">X</span> Rusak
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-300 text-center leading-6">≡</span> Lorong
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="inline-block w-6 h-6 bg-yellow-50 border border-dashed border-yellow-300 rounded text-yellow-500 text-center leading-6"><i class="fas fa-door-open"></i></span> Entrance
                    </span>
                </div>

                {{-- Interactive grid --}}
                <div class="overflow-x-auto">
                    <template x-for="(dr, ri) in displayRows" :key="dr.idx">
                        <div class="flex items-center gap-1 mb-1">
                            <span class="w-5 text-xs font-bold text-gray-500 flex-shrink-0 text-center" x-text="dr.row.label"></span>
                            <template x-for="(cell, ci) in dr.row.cells" :key="ci">
                                <button type="button"
                                        @click="paint(dr.idx, ci)"
                                        @dblclick="clearCell(dr.idx, ci)"
                                        class="flex-shrink-0 h-7 rounded text-xs font-semibold transition select-none"
                                        :class="cellClasses(cell, ci, dr.row.cells)"
                                        :title="cellTitle(cell, dr.row.label, dr.idx, ci)"
                                        x-text="cellText(cell, dr.row.label, ci, dr.row.cells)"></button>
                            </template>
                        </div>
                    </template>
                </div>

                <p class="text-xs text-gray-400 mt-4">
                    <i class="fas fa-mouse-pointer mr-1"></i>
                    Klik = lukis dengan alat terpilih · Klik ganda = hapus sel (kosongkan) ·
                    Nomor kursi dihitung otomatis (melewati lorong, pola CGV).
                </p>
            </div>
        </div>

    </div>
</div>
@endsection

@push('scripts')
<script>
function seatGridBuilder(initialGrid, config) {
    return {
        rows: 8,
        cols: 15,
        grid: [],
        tool: 'seat',
        rowDirection: config.row_direction || 'front_to_back',
        seatPrices: Object.assign({ couple: 1.5, premium: 2.0, wheelchair: 1.0 }, config.seat_prices || {}),
        couplePending: null,
        coupleCounter: 0,
        saving: false,
        tools: [
            { id: 'seat',       label: 'Regular',        color: '#DBEAFE', border: '#93C5FD' },
            { id: 'couple',     label: 'Sweetbox/Couple', color: '#FFE4E6', border: '#FB7185' },
            { id: 'premium',    label: 'Premiere/Sofa',   color: '#EDE9FE', border: '#A78BFA' },
            { id: 'wheelchair', label: 'Aksesibilitas',   color: '#DCFCE7', border: '#22C55E' },
            { id: 'unavailable',label: 'Rusak',           color: '#E5E7EB', border: '#9CA3AF' },
            { id: 'aisle',      label: 'Lorong',          color: '#F9FAFB', border: '#D1D5DB' },
            { id: 'entrance',   label: 'Entrance',        color: '#FEFCE8', border: '#FDE047' },
            { id: 'empty',      label: 'Kosong',          color: '#FFFFFF', border: '#E5E7EB' },
        ],
        init() {
            if (Array.isArray(initialGrid) && initialGrid.length > 0) {
                this.grid = initialGrid.map(r => ({ label: r.label, cells: r.cells.map(c => ({ type: c.type, group: c.group || null })) }));
                this.rows = this.grid.length;
                this.cols = Math.max(...this.grid.map(r => r.cells.length));
            } else {
                this.applyDims();
            }
        },
        get displayRows() {
            // Render in visual order: if A is front, screen is on top → A at bottom near front.
            // row_direction front_to_back = A near screen (bottom of grid); back_to_front = A at top.
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
            this.couplePending = null;
        },
        seatCount() {
            let n = 0;
            for (const row of this.grid) for (const cell of row.cells) {
                if (['seat','couple','premium','wheelchair'].includes(cell.type)) n++;
            }
            return n;
        },
        paint(ri, ci) {
            const cell = this.grid[ri].cells[ci];
            if (this.tool === 'couple') {
                if (this.couplePending === null) {
                    this.coupleCounter++;
                    cell.type = 'couple';
                    cell.group = 'SB' + this.coupleCounter;
                    this.couplePending = { ri, ci };
                } else {
                    const p = this.couplePending;
                    const adjacent = (p.ri === ri && Math.abs(p.ci - ci) === 1);
                    if (adjacent) {
                        cell.type = 'couple';
                        cell.group = this.grid[p.ri].cells[p.ci].group;
                        this.couplePending = null;
                    } else {
                        this.coupleCounter++;
                        cell.type = 'couple';
                        cell.group = 'SB' + this.coupleCounter;
                        this.couplePending = { ri, ci };
                    }
                }
                return;
            }
            cell.type = this.tool;
            cell.group = null;
            this.couplePending = null;
        },
        clearCell(ri, ci) {
            this.grid[ri].cells[ci].type = 'empty';
            this.grid[ri].cells[ci].group = null;
            if (this.couplePending && this.couplePending.ri === ri && this.couplePending.ci === ci) {
                this.couplePending = null;
            }
        },
        // Auto-numbering: skip placeholders (aisle/entrance/empty), CGV-style continuous numbering.
        cellNumber(rowCells, ci) {
            let n = 0;
            for (let j = 0; j <= ci; j++) {
                const t = rowCells[j].type;
                if (['seat','couple','premium','wheelchair','unavailable'].includes(t)) n++;
            }
            return n;
        },
        cellText(cell, rowLabel, ci, rowCells) {
            switch (cell.type) {
                case 'seat':      return rowLabel + this.cellNumber(rowCells, ci);
                case 'couple':    return rowLabel + this.cellNumber(rowCells, ci);
                case 'premium':   return 'P' + this.cellNumber(rowCells, ci);
                case 'wheelchair': return 'W' + this.cellNumber(rowCells, ci);
                case 'unavailable': return 'X' + this.cellNumber(rowCells, ci);
                case 'aisle':     return '≡';
                case 'entrance':  return '🚪';
                case 'empty':     return '';
            }
        },
        cellTitle(cell, rowLabel, ri, ci) {
            const t = this.tools.find(t => t.id === cell.type);
            let label = t ? t.label : cell.type;
            if (cell.type === 'couple' && cell.group) label += ' (' + cell.group + ')';
            return `${rowLabel} · ${label}`;
        },
        cellClasses(cell, ci, rowCells) {
            const base = 'w-8 ';
            switch (cell.type) {
                case 'seat':       return base + 'bg-blue-100 border border-blue-300 text-blue-800';
                case 'couple':     return base + 'bg-rose-100 border border-rose-400 text-rose-700';
                case 'premium':    return base + 'bg-purple-100 border border-purple-400 text-purple-700';
                case 'wheelchair': return base + 'bg-green-100 border border-green-500 text-green-700';
                case 'unavailable':return base + 'bg-gray-200 border border-gray-400 text-gray-500 line-through';
                case 'aisle':      return base + 'bg-gray-50 border border-dashed border-gray-300 text-gray-300';
                case 'entrance':   return base + 'bg-yellow-50 border border-dashed border-yellow-300 text-yellow-500';
                case 'empty':      return 'w-8';
            }
            return 'w-8';
        },
        save() {
            if (this.saving) return;
            // Reject orphaned couple cells before submit
            const counts = {};
            for (const row of this.grid) for (const cell of row.cells) {
                if (cell.type === 'couple') {
                    const g = cell.group;
                    if (!g) { alert('Ada sel couple tanpa group.'); return; }
                    counts[g] = (counts[g] || 0) + 1;
                }
            }
            for (const g in counts) {
                if (counts[g] !== 2) {
                    alert('Sweetbox/couple group ' + g + ' harus berisi tepat 2 sel. Klik 2 sel berdekatan untuk melengkapinya.');
                    return;
                }
            }

            const payload = {
                row_direction: this.rowDirection,
                seat_prices: {
                    couple: parseFloat(this.seatPrices.couple) || 1.0,
                    premium: parseFloat(this.seatPrices.premium) || 1.0,
                    wheelchair: parseFloat(this.seatPrices.wheelchair) || 1.0,
                },
                rows: this.grid.map(row => ({
                    label: row.label,
                    cells: row.cells.map(c => ({ type: c.type, group: c.group || null })),
                })),
            };

            this.saving = true;
            fetch('{{ route('admin.seats.save-layout', $studio->id) }}', {
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
