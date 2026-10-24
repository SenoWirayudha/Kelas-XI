@extends('layouts.admin')

@section('title', 'Pilih Kursi')
@section('page-title', 'Pilih Kursi')
@section('page-subtitle', $schedule->movie?->title ?? 'Kasir Tiket')

@section('content')
<style>
    @media (max-width: 767px) {
        body.moview-theme aside { display: none; }
        body.moview-theme main { padding: 0.75rem; }
    }
</style>
@php
    $snapScript = config('services.midtrans.is_production')
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
@endphp

@if(config('services.midtrans.client_key'))
    <script src="{{ $snapScript }}" data-client-key="{{ config('services.midtrans.client_key') }}"></script>
@endif

<div x-data="cashierSeatPage()" x-init="init()" class="pb-44 lg:pb-36">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h3 class="text-xl font-semibold text-white">{{ $schedule->movie?->title ?? '-' }}</h3>
            <p class="mt-1 text-sm text-gray-400">
                {{ substr((string) $schedule->show_time, 0, 5) }}
                <span class="mx-1">•</span>
                {{ $schedule->studio?->studio_name ?? '-' }}
                <span class="mx-1">•</span>
                {{ $schedule->show_date?->locale('id')->isoFormat('dddd, D MMMM Y') }}
            </p>
        </div>
        <a href="{{ route('staff.cashier.index') }}"
           class="inline-flex items-center rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">
            <i class="fas fa-arrow-left mr-2"></i> Pilih Film Lain
        </a>
    </div>

    <div class="rounded-xl border border-gray-700/60 bg-white p-4 shadow-lg sm:p-6">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span x-show="loading" class="text-xs text-gray-500"><i class="fas fa-spinner fa-spin mr-1"></i> Memuat denah...</span>
            <span x-show="!loading" class="text-xs text-gray-500" x-text="seats.length + ' kursi'"></span>
        </div>

        <div class="mb-6 flex flex-col items-center">
            <div class="h-1.5 w-56 rounded-full bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"></div>
            <p class="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">Layar</p>
        </div>

        <div x-show="error" x-text="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"></div>

        {{-- Horizontal scroll stays inside the seat area only. --}}
        <div class="overflow-x-auto pb-2">
            <div class="mx-auto grid w-max justify-center gap-1.5" :style="gridStyle()" x-show="seats.length > 0">
                <template x-for="seat in seats" :key="seat.uid">
                    <button type="button"
                            @click="toggleSeat(seat)"
                            :disabled="!seat.selectable"
                            :style="seatStyle(seat)"
                            :class="seatClass(seat)"
                            :title="seatTitle(seat)">
                        <span class="pointer-events-none" x-text="seatLabel(seat)"></span>
                    </button>
                </template>
            </div>
        </div>

        {{-- Dynamic legend from the studio's seat type definitions. --}}
        <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-700/60 pt-4 text-xs text-gray-400">
            <template x-for="type in legend" :key="type.key">
                <span class="flex items-center gap-1.5">
                    <span class="inline-block h-3.5 w-3.5 rounded border" :style="{ backgroundColor: type.bg, borderColor: type.color }"></span>
                    <span x-text="type.label"></span>
                    <span class="text-gray-500" x-show="type.price" x-text="'• ' + formatRupiah(type.price)"></span>
                </span>
            </template>
            <span class="flex items-center gap-1.5">
                <span class="inline-block h-3.5 w-3.5 rounded border border-blue-400 bg-blue-500"></span> Dipilih
            </span>
            <span class="flex items-center gap-1.5">
                <span class="inline-block h-3.5 w-3.5 rounded border border-red-900 bg-red-950"></span> Terjual
            </span>

        </div>

        <div x-show="!loading && seats.length === 0" class="py-16 text-center">
            <i class="fas fa-chair text-3xl text-gray-600"></i>
            <p class="mt-3 text-sm text-gray-400">Denah kursi tidak tersedia.</p>
        </div>
    </div>

{{-- Fixed checkout bar: never covers the map; page has bottom padding. --}}
<div class="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-700/80 bg-[#121821]/95 shadow-2xl backdrop-blur lg:left-64">
    <div class="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">{{ $schedule->movie?->title ?? '-' }}</p>
                <p class="mt-0.5 text-xs text-gray-400">
                    {{ substr((string) $schedule->show_time, 0, 5) }} • {{ $schedule->studio?->studio_name ?? '-' }}
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    <template x-for="seat in selected" :key="seat.seat_id">
                        <span class="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                            <span x-text="seat.label"></span>
                            <button type="button" @click="toggleSeat(seat)" class="text-blue-300 hover:text-white" aria-label="Hapus kursi">&times;</button>
                        </span>
                    </template>
                    <span x-show="selected.length === 0" class="text-xs text-gray-500">Belum ada kursi dipilih</span>
                </div>
            </div>
            <div class="flex flex-shrink-0 items-center gap-4">
                <div class="text-right">
                    <p class="text-[10px] uppercase tracking-wide text-gray-500">Total</p>
                    <p class="text-lg font-bold text-white" x-text="formatRupiah(total())"></p>
                </div>
                <button type="button" @click="openPayment()"
                        :disabled="selected.length === 0 || processing"
                        class="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                    <i class="fas fa-arrow-right-to-bracket mr-2"></i> Lanjut Bayar
                </button>
            </div>
        </div>
    </div>
</div>

{{-- Payment step --}}
<div x-show="showPayment" x-cloak class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
    <div @click.outside="closePayment()" class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-700 bg-[#171F2A] p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h3 class="text-lg font-semibold text-white">Pembayaran</h3>
                <p class="mt-1 text-xs text-gray-400">Pilih metode pembayaran untuk menyelesaikan transaksi.</p>
            </div>
            <button type="button" @click="closePayment()" class="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white" aria-label="Tutup">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="mt-4 rounded-xl border border-gray-700/70 bg-[#121821] p-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-medium text-white">{{ $schedule->movie?->title ?? '-' }}</p>
                    <p class="mt-1 text-xs text-gray-400">{{ substr((string) $schedule->show_time, 0, 5) }} • {{ $schedule->studio?->studio_name ?? '-' }}</p>
                    <p class="mt-1 text-xs text-gray-500"><span x-text="selected.length"></span> kursi: <span x-text="selected.map(s => s.label).join(', ')"></span></p>
                </div>
                <p class="whitespace-nowrap text-lg font-bold text-white" x-text="formatRupiah(total())"></p>
            </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" @click="method = 'cash'"
                    class="rounded-xl border p-3 text-left transition"
                    :class="method === 'cash' ? 'border-blue-400 bg-blue-500/15' : 'border-gray-700 bg-[#121821] hover:border-gray-500'">
                <i class="fas fa-money-bill-wave text-green-400"></i>
                <p class="mt-2 text-sm font-semibold text-white">Tunai</p>
                <p class="mt-0.5 text-[11px] text-gray-400">Langsung lunas</p>
            </button>
            <button type="button" @click="method = 'qris'"
                    class="rounded-xl border p-3 text-left transition"
                    :class="method === 'qris' ? 'border-blue-400 bg-blue-500/15' : 'border-gray-700 bg-[#121821] hover:border-gray-500'">
                <i class="fas fa-qrcode text-blue-400"></i>
                <p class="mt-2 text-sm font-semibold text-white">QRIS</p>
                <p class="mt-0.5 text-[11px] text-gray-400">Midtrans sandbox</p>
            </button>
            <button type="button" @click="method = 'card'"
                    class="rounded-xl border p-3 text-left transition"
                    :class="method === 'card' ? 'border-blue-400 bg-blue-500/15' : 'border-gray-700 bg-[#121821] hover:border-gray-500'">
                <i class="fas fa-credit-card text-purple-400"></i>
                <p class="mt-2 text-sm font-semibold text-white">Kartu Kredit</p>
                <p class="mt-0.5 text-[11px] text-gray-400">Midtrans sandbox</p>
            </button>
        </div>

        <div x-show="method === 'cash'" class="mt-4 rounded-xl border border-gray-700/70 bg-[#121821] p-4">
            <label class="block text-xs font-medium text-gray-400">Uang diterima</label>
            <input type="number" inputmode="numeric" min="0" x-model.number="cash"
                   class="mt-2 w-full rounded-lg border border-gray-600 bg-[#0F1419] px-3 py-2.5 text-lg font-semibold text-white focus:border-blue-400 focus:outline-none"
                   placeholder="0">
            <div class="mt-2 flex flex-wrap gap-2">
                <button type="button" @click="cash = total()" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Uang pas</button>
                <button type="button" @click="cash = 50000" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">50.000</button>
                <button type="button" @click="cash = 100000" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">100.000</button>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-700/70 pt-3">
                <span class="text-sm text-gray-400">Kembalian</span>
                <span class="text-lg font-bold" :class="cash >= total() ? 'text-green-400' : 'text-red-400'" x-text="formatRupiah(change())"></span>
            </div>
        </div>

        <div x-show="method !== 'cash'" class="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-gray-300">
            <i class="fas fa-circle-info mr-1 text-blue-400"></i>
            Pembayaran diproses melalui Midtrans sandbox. Kursi ditahan sebagai pending sampai pembayaran dikonfirmasi.
        </div>

        <div x-show="paymentMessage" x-text="paymentMessage" class="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-200"></div>
        <div x-show="paymentError" x-text="paymentError" class="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-200"></div>

        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" @click="closePayment()"
                    class="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">
                Batal
            </button>
            <button type="button" @click="submitPayment()"
                    :disabled="processing || (method === 'cash' && cash < total())"
                    class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                <i class="fas fa-spinner fa-spin mr-2" x-show="processing"></i>
                <span x-text="method === 'cash' ? 'Bayar Tunai' : 'Lanjut ke Midtrans'"></span>
            </button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
function cashierSeatPage() {
    return {
        seats: [],
        rows: 1,
        columns: 1,
        rowDirection: 'front_to_back',
        minRow: 0,
        minCol: 0,
        rowCount: 1,
        selected: [],
        legend: [],
        loading: true,
        processing: false,
        error: '',
        showPayment: false,
        method: 'cash',
        cash: 0,
        paymentMessage: '',
        paymentError: '',
        pendingOrderCode: '',
        definitions: {},
        seatDataUrl: '{{ route('staff.cashier.seat-data') }}',
        storeUrl: '{{ route('staff.cashier.store') }}',
        statusUrl: '{{ route('staff.cashier.status') }}',
        csrfToken: '{{ csrf_token() }}',

        init() {
            this.loadSeats();
        },

        async loadSeats() {
            this.loading = true;
            this.error = '';
            this.selected = [];
            this.legend = [];
            this.definitions = {};

            try {
                const response = await fetch(this.seatDataUrl + '?schedule_id={{ $schedule->id }}', {
                    headers: { 'Accept': 'application/json' },
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success) {
                    throw new Error(payload.message || 'Gagal memuat denah kursi.');
                }

                this.applyLayout(payload.data || {});
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Mirrors the Android seat screen: normalise position, colour by the
         * studio's seat_type_definitions, honour row_direction, and never make
         * placeholder/unavailable seats selectable.
         */
        applyLayout(data) {
            const raw = data.seats || [];

            (data.seat_type_definitions || []).forEach(def => {
                this.definitions[String(def.key || '').toLowerCase()] = def;
            });

            const minRow = raw.length ? Math.min(...raw.map(s => Number(s.row_index) || 0)) : 0;
            const minCol = raw.length ? Math.min(...raw.map(s => Number(s.column) || 0)) : 0;
            const maxRow = raw.length ? Math.max(...raw.map(s => Number(s.row_index) || 0)) : 0;
            const maxCol = raw.length ? Math.max(...raw.map(s => Number(s.column) || 0)) : 0;

            this.minRow = minRow;
            this.minCol = minCol;
            this.rowCount = Math.max(1, maxRow - minRow + 1);
            this.rows = this.rowCount;
            this.columns = Math.max(1, maxCol - minCol + 1);
            this.rowDirection = data.row_direction || 'front_to_back';

            const placeholderKeys = ['aisle', 'entrance', 'unavailable'];
            const legend = [];
            const seen = {};

            this.seats = raw.map((seat, index) => {
                const key = String(seat.seat_type || 'seat').toLowerCase();
                const def = this.definitions[key] || null;
                const sellable = def
                    ? (def.purchase_mode === 'individual' || def.purchase_mode === 'paired')
                    : !placeholderKeys.includes(key);

                const rowIndex = (Number(seat.row_index) || 0) - minRow;
                const displayRow = this.rowDirection === 'front_to_back'
                    ? rowIndex
                    : (this.rowCount - 1 - rowIndex);
                const displayColumn = (Number(seat.column) || 0) - minCol;
                const status = seat.status || null;
                const selectable = sellable && status === 'available' && seat.is_active !== false;
                const color = def && def.color ? def.color : '#64748B';

                if (sellable && status !== 'unavailable' && def && !seen[key]) {
                    seen[key] = true;
                    legend.push({
                        key,
                        label: def.label || key,
                        color,
                        bg: this.rgba(color, 0.18),
                        price: Number(seat.price) || 0,
                    });
                }

                return {
                    uid: 'seat-' + (seat.seat_id ?? index),
                    seat_id: seat.seat_id,
                    label: seat.seat_code || ((seat.row || '').trim() + (displayColumn + 1)),
                    raw_label: seat.seat_code,
                    price: Number(seat.price) || 0,
                    status,
                    sellable,
                    selectable,
                    key,
                    def,
                    color,
                    seat_group: seat.seat_group || null,
                    purchase_mode: def ? def.purchase_mode : null,
                    displayRow,
                    displayColumn,
                };
            });

            this.legend = legend;
        },

        isSelected(seat) {
            return this.selected.some(s => s.seat_id === seat.seat_id);
        },

        toggleSeat(seat) {
            if (!seat || !seat.selectable) return;

            const group = (seat.purchase_mode === 'paired' && seat.seat_group)
                ? this.seats.filter(s => s.seat_group === seat.seat_group && s.selectable)
                : [seat];

            const allSelected = group.every(s => this.isSelected(s));
            if (allSelected) {
                const ids = new Set(group.map(s => s.seat_id));
                this.selected = this.selected.filter(s => !ids.has(s.seat_id));
            } else {
                group.forEach(s => {
                    if (!this.isSelected(s)) this.selected.push(s);
                });
            }
        },

        seatLabel(seat) {
            if (!seat.sellable && (seat.key === 'aisle' || seat.key === 'entrance')) return '';
            if (seat.key === 'unavailable') return 'X';
            return seat.label;
        },

        seatTitle(seat) {
            if (seat.status === 'booked') return 'Kursi sudah terjual';
            if (!seat.sellable || seat.status === 'unavailable') return seat.def?.label || 'Tidak tersedia';
            return seat.label + ' • ' + this.formatRupiah(seat.price);
        },

        gridStyle() {
            return 'grid-template-columns: repeat(' + Math.max(1, this.columns) + ', minmax(2.25rem, 2.25rem));';
        },

        seatClass(seat) {
            const base = 'flex h-9 w-9 items-center justify-center rounded border text-[10px] font-semibold transition ';
            if (this.isSelected(seat)) return base + 'cursor-pointer border-blue-400 shadow-lg';
            if (seat.status === 'booked') return base + 'cursor-not-allowed';
            if (!seat.sellable || seat.status === 'unavailable' || !seat.selectable) return base + 'cursor-not-allowed';
            return base + 'cursor-pointer hover:brightness-125' + (seat.key === 'seat' ? ' border-white/60 bg-transparent text-white' : '');
        },

        seatStyle(seat) {
            const style = {
                gridColumn: String(seat.displayColumn + 1),
                gridRow: String(seat.displayRow + 1),
            };

            if (this.isSelected(seat)) {
                style.backgroundColor = '#135BEC';
                style.borderColor = '#135BEC';
                style.color = '#ffffff';
                return style;
            }

            if (seat.status === 'booked') {
                style.backgroundColor = 'rgba(127, 29, 29, 0.35)';
                style.borderColor = '#7F1D1D';
                style.color = '#F87171';
                return style;
            }

            if (seat.key === 'aisle' || seat.key === 'entrance') {
                style.backgroundColor = 'transparent';
                style.borderColor = 'transparent';
                style.color = 'transparent';
                return style;
            }

            if (seat.key === 'unavailable' || seat.status === 'unavailable') {
                style.backgroundColor = 'transparent';
                style.borderColor = 'transparent';
                style.color = 'transparent';
                return style;
            }

            if (!seat.sellable || !seat.selectable) {
                style.backgroundColor = 'rgba(31, 41, 55, 0.6)';
                style.borderColor = '#374151';
                style.color = '#6B7280';
                return style;
            }

            style.backgroundColor = this.rgba(seat.color, 0.18);
            style.borderColor = seat.color;
            style.color = this.lighten(seat.color, 0.55);
            return style;
        },

        hexToRgb(hex) {
            const value = String(hex || '#64748B').replace('#', '');
            const full = value.length === 3
                ? value.split('').map(c => c + c).join('')
                : value.padEnd(6, '0').slice(0, 6);
            const num = parseInt(full, 16);
            return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
        },

        rgba(hex, alpha) {
            const [r, g, b] = this.hexToRgb(hex);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },

        lighten(hex, amount) {
            const [r, g, b] = this.hexToRgb(hex);
            const mix = v => Math.round(v + (255 - v) * amount);
            return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
        },

        total() {
            return this.selected.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
        },

        change() {
            return Math.max(0, Number(this.cash || 0) - this.total());
        },

        formatRupiah(value) {
            return 'Rp ' + Math.round(Number(value || 0)).toLocaleString('id-ID');
        },

        openPayment() {
            if (this.selected.length === 0) return;
            this.method = 'cash';
            this.cash = this.total();
            this.paymentError = '';
            this.paymentMessage = '';
            this.showPayment = true;
        },

        closePayment() {
            if (this.processing) return;
            this.showPayment = false;
        },

        openSnap(token) {
            if (typeof snap === 'undefined') {
                this.paymentError = 'Midtrans Snap tidak tersedia. Muat ulang halaman lalu coba lagi.';
                return;
            }

            snap.pay(token, {
                onSuccess: (result) => this.completeMidtransPayment(result),
                onPending: (result) => this.completeMidtransPayment(result),
                onError: () => {
                    this.processing = false;
                    this.paymentError = 'Pembayaran Midtrans gagal. Silakan coba lagi.';
                    this.loadSeats();
                },
                onClose: () => {
                    if (this.processing) {
                        this.processing = false;
                        this.paymentMessage = 'Pembayaran belum selesai. Kursi masih ditahan sampai batas waktu pembayaran.';
                    }
                }
            });
        },

        async completeMidtransPayment(result) {
            const orderCode = this.pendingOrderCode || result?.order_id || '';
            if (!orderCode) {
                this.processing = false;
                this.paymentError = 'Kode order tidak ditemukan. Cek status pembayaran di menu order.';
                return;
            }

            this.paymentMessage = 'Mengecek status pembayaran ke Midtrans...';

            for (let attempt = 0; attempt < 8; attempt++) {
                const status = await this.checkStatus(orderCode);
                if (status?.redirect) {
                    window.location.href = status.redirect;
                    return;
                }
                if (status?.order_status === 'cancelled') {
                    this.processing = false;
                    this.paymentError = 'Pembayaran gagal atau kedaluwarsa. Kursi telah dilepas.';
                    this.loadSeats();
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            this.processing = false;
            this.paymentMessage = 'Pembayaran masih diproses. Cek status beberapa saat lagi.';
        },

        async checkStatus(orderCode) {
            try {
                const response = await fetch(this.statusUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                    },
                    body: JSON.stringify({ order_code: orderCode }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || !payload.success) {
                    this.paymentError = payload.message || 'Gagal mengecek status pembayaran.';
                    return null;
                }
                return payload;
            } catch (error) {
                this.paymentError = 'Gagal menghubungi server untuk cek status.';
                return null;
            }
        },

        async submitPayment() {
            if (this.selected.length === 0 || this.processing) return;
            if (this.method === 'cash' && Number(this.cash || 0) < this.total()) {
                this.paymentError = 'Uang tunai kurang dari total pembayaran.';
                return;
            }

            this.processing = true;
            this.paymentError = '';
            this.paymentMessage = '';

            try {
                const response = await fetch(this.storeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                    },
                    body: JSON.stringify({
                        schedule_id: {{ $schedule->id }},
                        seats: this.selected.map(seat => seat.seat_id),
                        payment_method: this.method,
                        cash_received: this.method === 'cash' ? Number(this.cash || 0) : null,
                    }),
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success) {
                    const soldOut = (payload.message || '').includes('Kursi sudah terjual');
                    if (soldOut) {
                        await this.loadSeats();
                        this.paymentError = 'Kursi sudah terjual. Denah telah dimuat ulang.';
                    } else {
                        this.paymentError = payload.message || 'Pembayaran gagal. Coba lagi.';
                    }
                    this.processing = false;
                    return;
                }

                if (payload.redirect) {
                    window.location.href = payload.redirect;
                    return;
                }

                if (payload.snap_token) {
                    this.pendingOrderCode = payload.order_code;
                    this.paymentMessage = 'Membuka halaman pembayaran Midtrans...';
                    this.openSnap(payload.snap_token);
                    return;
                }

                this.processing = false;
                this.paymentError = 'Respons pembayaran tidak dikenali.';
            } catch (error) {
                this.processing = false;
                this.paymentError = 'Gagal menghubungi server. Coba lagi.';
            }
        },
    };
}
</script>
@endpush