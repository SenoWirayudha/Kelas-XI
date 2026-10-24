@extends('layouts.admin')

@section('title', 'Pilih Kursi')
@section('page-title', 'Pilih Kursi')
@section('page-subtitle', $schedule->movie?->title ?? 'Kasir Tiket')

@section('content')
@php
    $snapScript = config('services.midtrans.is_production')
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
@endphp

@if(config('services.midtrans.client_key'))
    <script src="{{ $snapScript }}" data-client-key="{{ config('services.midtrans.client_key') }}"></script>
@endif

<div x-data="cashierSeatPage()" class="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
    <div class="flex flex-shrink-0 items-start justify-between gap-3">
        <div class="min-w-0">
            <h3 class="truncate text-lg font-semibold text-white sm:text-xl">{{ $schedule->movie?->title ?? '-' }}</h3>
            <p class="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">
                {{ substr((string) $schedule->show_time, 0, 5) }}
                <span class="mx-1">•</span>
                {{ $schedule->studio?->studio_name ?? '-' }}
                <span class="mx-1">•</span>
                {{ $schedule->show_date?->locale('id')->isoFormat('dddd, D MMMM Y') }}
            </p>
        </div>
        <a href="{{ route('staff.cashier.index') }}"
           class="inline-flex min-h-[40px] flex-shrink-0 items-center rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 sm:text-sm">
            <i class="fas fa-arrow-left mr-2"></i> Pilih Film Lain
        </a>
    </div>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-700/60 bg-white p-3 shadow-lg sm:p-4">
        <div class="flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
            <span x-show="loading" class="text-xs text-gray-500"><i class="fas fa-spinner fa-spin mr-1"></i> Memuat denah...</span>
            <span x-show="!loading" class="text-xs text-gray-500" x-text="seats.length + ' kursi'"></span>
            <div class="flex items-center gap-1.5">
                <button type="button" @click="zoomOut()" :disabled="zoom <= 1"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Perkecil denah">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="w-10 text-center text-[11px] font-semibold text-gray-400" x-text="Math.round(zoom * 100) + '%'"></span>
                <button type="button" @click="zoomIn()" :disabled="zoom >= 2.5"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Perbesar denah">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>

        <div class="mt-1 flex flex-shrink-0 flex-col items-center">
            <div class="h-1 w-40 max-w-full rounded-full bg-gradient-to-r from-transparent via-blue-400/80 to-transparent sm:w-56"></div>
            <p class="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-500">Layar</p>
        </div>

        <div x-show="error" x-text="error" class="mt-2 flex-shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700"></div>
        <div x-show="mapMessage" x-text="mapMessage" class="mt-2 flex-shrink-0 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-2 text-xs text-yellow-200"></div>

        <div x-ref="seatScroll"
             class="mt-2 min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-gray-700/60 bg-[#121821] p-1">
            <div class="min-w-max p-1">
                <div class="mx-auto grid w-max" :style="gridStyle()" x-show="seats.length > 0">
                    <template x-for="row in rowLabels" :key="row.displayRow">
                        <span class="flex items-center justify-center text-[10px] font-bold text-gray-500"
                              :style="rowLabelStyle(row)"
                              x-text="row.label"></span>
                    </template>
                    <template x-for="seat in seats" :key="seat.uid">
                        <button type="button"
                                @click="toggleSeat(seat)"
                                :disabled="!seat.selectable"
                                :style="seatStyle(seat)"
                                :class="seatClass(seat)"
                                :title="seatTitle(seat)">
                            <span class="pointer-events-none" x-text="seatButtonLabel(seat)"></span>
                        </button>
                    </template>
                </div>
            </div>

            <div x-show="!loading && seats.length === 0" class="flex h-full flex-col items-center justify-center py-10 text-center">
                <i class="fas fa-chair text-3xl text-gray-600"></i>
                <p class="mt-3 text-sm text-gray-400">Denah kursi tidak tersedia.</p>
            </div>
        </div>

        <div class="mt-2 flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-700/60 pt-2 text-[10px] text-gray-400 sm:text-xs">
            <template x-for="type in legend" :key="type.key">
                <span class="flex items-center gap-1">
                    <span class="inline-block h-3 w-3 rounded border" :style="{ backgroundColor: type.bg, borderColor: type.color }"></span>
                    <span x-text="type.label"></span>
                    <span class="hidden text-gray-500 sm:inline" x-show="type.price" x-text="'• ' + formatRupiah(type.price)"></span>
                </span>
            </template>
            <span class="flex items-center gap-1">
                <span class="inline-block h-3 w-3 rounded border border-blue-400 bg-blue-500"></span> Dipilih
            </span>
            <span class="flex items-center gap-1">
                <span class="inline-block h-3 w-3 rounded border border-red-900 bg-red-950"></span> Terjual
            </span>
        </div>
    </div>

    <div class="flex-shrink-0 rounded-xl border border-gray-700/80 bg-[#121821]/95 p-3 shadow-2xl backdrop-blur">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">{{ $schedule->movie?->title ?? '-' }}</p>
                <p class="mt-0.5 text-xs text-gray-400">
                    {{ substr((string) $schedule->show_time, 0, 5) }} • {{ $schedule->studio?->studio_name ?? '-' }}
                </p>
                <div class="mt-1 flex max-h-10 flex-wrap items-center gap-1 overflow-y-auto">
                    <template x-for="seat in selected" :key="seat.seat_id">
                        <span class="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                            <span x-text="seat.label"></span>
                            <button type="button" @click="toggleSeat(seat)" class="inline-flex h-5 w-5 items-center justify-center text-blue-300 hover:text-white" aria-label="Hapus kursi">&times;</button>
                        </span>
                    </template>
                    <span x-show="selected.length === 0" class="text-xs text-gray-500">Belum ada kursi dipilih</span>
                </div>
            </div>
            <div class="flex flex-shrink-0 items-center justify-between gap-3 sm:justify-end">
                <div class="text-right">
                    <p class="text-[10px] uppercase tracking-wide text-gray-500">Total</p>
                    <p class="text-base font-bold text-white sm:text-lg" x-text="formatRupiah(total())"></p>
                </div>
                <button type="button" @click="openSummary()"
                        :disabled="selected.length === 0 || summaryLoading || processing"
                        class="inline-flex min-h-[40px] items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                    <i class="fas fa-arrow-right mr-2"></i> Lanjut
                </button>
            </div>
        </div>
    </div>

{{-- Purchase summary step --}}
<div x-show="showSummary" x-cloak class="fixed inset-0 z-40 overflow-y-auto bg-[#0F1419]">
    <div class="mx-auto min-h-full w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div class="flex items-start justify-between gap-3">
            <div>
                <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">Langkah 2 dari 3</p>
                <h2 class="mt-1 text-xl font-semibold text-white">Ringkasan Pembelian</h2>
            </div>
            <button type="button" @click="closeSummary()"
                    :disabled="summaryLoading || processing"
                    class="min-h-[40px] rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40">
                <i class="fas fa-arrow-left mr-1"></i> Kembali
            </button>
        </div>

        <div x-show="summaryLoading" class="mt-8 rounded-xl border border-gray-700/60 bg-[#171F2A] p-6 text-center text-sm text-gray-400">
            <i class="fas fa-spinner fa-spin mr-2 text-blue-400"></i> Memeriksa ketersediaan kursi...
        </div>

        <div x-show="summaryError" x-text="summaryError" class="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"></div>

        <template x-if="summary && !summaryLoading">
            <div class="mt-4 space-y-4">
                <div class="rounded-xl border border-gray-700/60 bg-[#171F2A] p-4">
                    <div class="flex gap-4">
                        <template x-if="summary?.movie?.poster_url">
                            <img :src="summary.movie.poster_url" :alt="summary.movie.title"
                                 class="h-24 w-16 flex-shrink-0 rounded-lg bg-gray-800 object-cover sm:h-28 sm:w-20">
                        </template>
                        <template x-if="!summary?.movie?.poster_url">
                            <div class="flex h-24 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-600 sm:h-28 sm:w-20">
                                <i class="fas fa-film"></i>
                            </div>
                        </template>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-lg font-semibold text-white" x-text="summary.movie.title"></h3>
                            <div class="mt-2 space-y-1 text-xs text-gray-400">
                                <p><i class="fas fa-building mr-2 w-3 text-gray-500"></i><span x-text="summary.cinema_name"></span></p>
                                <p><i class="fas fa-door-open mr-2 w-3 text-gray-500"></i><span x-text="summary.studio_name"></span></p>
                                <p><i class="fas fa-calendar-day mr-2 w-3 text-gray-500"></i><span x-text="summary.date_label"></span></p>
                                <p><i class="fas fa-clock mr-2 w-3 text-gray-500"></i><span x-text="summary.time"></span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border border-gray-700/60 bg-[#171F2A] p-4">
                    <div class="flex items-center justify-between gap-3">
                        <h3 class="text-sm font-semibold text-white">Kursi Dipilih</h3>
                        <span class="text-xs text-gray-400"><span x-text="summary.quantity"></span> tiket</span>
                    </div>

                    <div class="mt-3 divide-y divide-gray-700/60">
                        <template x-for="seat in summary.seats" :key="seat.seat_id">
                            <div class="flex items-center justify-between gap-3 py-2.5">
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-white" x-text="seat.seat_code"></p>
                                    <p class="mt-0.5 text-[11px] text-gray-500" x-text="seat.seat_type_label"></p>
                                </div>
                                <p class="whitespace-nowrap text-sm text-gray-200" x-text="formatRupiah(seat.price)"></p>
                            </div>
                        </template>
                    </div>

                    <div class="mt-2 flex items-center justify-between border-t border-gray-700/60 pt-3">
                        <span class="text-sm text-gray-400">Total</span>
                        <span class="text-xl font-bold text-white" x-text="formatRupiah(summary.total)"></span>
                    </div>
                </div>
            </div>
        </template>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" @click="closeSummary()"
                    :disabled="summaryLoading || processing"
                    class="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
                Kembali
            </button>
            <button type="button" @click="continueToPayment()"
                    :disabled="!summary || summaryLoading || processing"
                    class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
                <i class="fas fa-spinner fa-spin mr-2" x-show="summaryLoading"></i>
                <span>Lanjut ke Pembayaran</span>
            </button>
        </div>
    </div>
</div>

{{-- Payment step --}}
<div x-show="showPayment" x-cloak class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
    <div @click.outside="closePayment()" class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-700 bg-[#171F2A] p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h3 class="text-lg font-semibold text-white">Konfirmasi Pembayaran</h3>
                <p class="mt-1 text-xs text-gray-400">Pilih metode pembayaran untuk menyelesaikan transaksi.</p>
            </div>
            <button type="button" @click="closePayment()" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white" aria-label="Tutup">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="mt-4 rounded-xl border border-gray-700/70 bg-[#121821] p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div class="min-w-0">
                    <p class="text-sm font-medium text-white">{{ $schedule->movie?->title ?? '-' }}</p>
                    <p class="mt-1 text-xs text-gray-400">{{ substr((string) $schedule->show_time, 0, 5) }} • {{ $schedule->studio?->studio_name ?? '-' }}</p>
                    <p class="mt-1 break-words text-xs text-gray-500"><span x-text="selected.length"></span> kursi: <span x-text="selected.map(s => s.label).join(', ')"></span></p>
                </div>
                <p class="whitespace-nowrap text-lg font-bold text-white" x-text="formatRupiah(orderTotal())"></p>
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
                <button type="button" @click="cash = orderTotal()" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Uang pas</button>
                <button type="button" @click="cash = 50000" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">50.000</button>
                <button type="button" @click="cash = 100000" class="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">100.000</button>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-700/70 pt-3">
                <span class="text-sm text-gray-400">Kembalian</span>
                <span class="text-lg font-bold" :class="cash >= orderTotal() ? 'text-green-400' : 'text-red-400'" x-text="formatRupiah(change())"></span>
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
                Kembali
            </button>
            <button type="button" @click="submitPayment()"
                    :disabled="processing || (method === 'cash' && cash < orderTotal())"
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
        mapMessage: '',
        showSummary: false,
        summary: null,
        summaryLoading: false,
        summaryError: '',
        showPayment: false,
        method: 'cash',
        cash: 0,
        paymentMessage: '',
        paymentError: '',
        pendingOrderCode: '',
        definitions: {},
        seatSize: 36,
        fitSeatSize: 36,
        zoom: 1,
        mapObserver: null,
        seatDataUrl: '{{ route('staff.cashier.seat-data') }}',
        summaryUrl: '{{ route('staff.cashier.summary') }}',
        storeUrl: '{{ route('staff.cashier.store') }}',
        statusUrl: '{{ route('staff.cashier.status') }}',
        csrfToken: '{{ csrf_token() }}',

        init() {
            this.$nextTick(() => this.setupMapObserver());
            this.loadSeats();
        },

        setupMapObserver() {
            const el = this.$refs.seatScroll;
            if (!el) return;

            this.updateSeatSize();

            if (window.ResizeObserver && !this.mapObserver) {
                this.mapObserver = new ResizeObserver(() => this.updateSeatSize());
                this.mapObserver.observe(el);
            }
        },

        updateSeatSize() {
            const el = this.$refs.seatScroll;
            if (!el || this.seats.length === 0) return;

            const style = getComputedStyle(el);
            const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            const availW = Math.max(0, el.clientWidth - padX - 10);
            const availH = Math.max(0, el.clientHeight - padY - 10);
            const cols = Math.max(1, this.columns);
            const rows = Math.max(1, this.rowCount);
            const gap = 6;
            const labelWidth = 24;
            const byWidth = (availW - labelWidth - cols * gap) / cols;
            const byHeight = (availH - (rows - 1) * gap) / rows;
            const fit = Math.max(28, Math.floor(Math.min(byWidth, byHeight)));

            this.fitSeatSize = fit;
            this.seatSize = Math.max(28, Math.floor(fit * this.zoom));
        },

        zoomIn() {
            if (this.zoom >= 2.5) return;
            this.zoom = Math.min(2.5, this.zoom + 0.25);
            this.updateSeatSize();
            this.$nextTick(() => this.centerMap());
        },

        zoomOut() {
            if (this.zoom <= 1) return;
            this.zoom = Math.max(1, this.zoom - 0.25);
            this.updateSeatSize();
            this.$nextTick(() => this.centerMap());
        },

        centerMap() {
            const el = this.$refs.seatScroll;
            if (!el) return;
            if (this.zoom <= 1) {
                el.scrollTo({ left: 0, top: 0 });
                return;
            }
            el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
            el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
        },

        async loadSeats(options = {}) {
            const keepSelected = options.keepSelected === true;
            const previousSelected = keepSelected
                ? this.selected.map(seat => Number(seat.seat_id))
                : [];
            const blockedSeatIds = new Set((options.dropSeatIds || []).map(Number));

            this.loading = true;
            this.error = '';
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
                this.selected = keepSelected
                    ? this.seats.filter(seat =>
                        previousSelected.includes(Number(seat.seat_id))
                        && seat.selectable
                        && !blockedSeatIds.has(Number(seat.seat_id))
                    )
                    : [];
            } catch (error) {
                this.selected = [];
                this.error = error.message;
            } finally {
                this.loading = false;
                this.$nextTick(() => this.updateSeatSize());
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
                    rowLabel: String(seat.row || seat.seat_code || '').replace(/\d+$/, '').trim() || String.fromCharCode(65 + displayRow),
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

        get rowLabels() {
            const rows = new Map();
            this.seats.forEach(seat => {
                if (!rows.has(seat.displayRow)) {
                    rows.set(seat.displayRow, { displayRow: seat.displayRow, label: seat.rowLabel });
                }
            });
            return [...rows.values()].sort((a, b) => a.displayRow - b.displayRow);
        },

        isSelected(seat) {
            return this.selected.some(s => s.seat_id === seat.seat_id);
        },

        toggleSeat(seat) {
            if (!seat || !seat.selectable) return;

            this.mapMessage = '';

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

        seatButtonLabel(seat) {
            return this.seatLabel(seat);
        },

        rowLabelStyle(row) {
            return `grid-column: 1; grid-row: ${row.displayRow + 1};`;
        },

        seatTitle(seat) {
            if (seat.status === 'booked') return 'Kursi sudah terjual';
            if (!seat.sellable || seat.status === 'unavailable') return seat.def?.label || 'Tidak tersedia';
            return seat.label + ' • ' + this.formatRupiah(seat.price);
        },

        gridStyle() {
            const cols = Math.max(1, this.columns);
            const rows = Math.max(1, this.rowCount);
            return `grid-template-columns: 1.5rem repeat(${cols}, ${this.seatSize}px); grid-template-rows: repeat(${rows}, ${this.seatSize}px); gap: 6px;`;
        },

        seatClass(seat) {
            const base = 'flex h-full w-full min-h-0 min-w-0 items-center justify-center rounded border font-semibold transition ';
            if (this.isSelected(seat)) return base + 'cursor-pointer border-blue-400 shadow-lg';
            if (seat.status === 'booked') return base + 'cursor-not-allowed';
            if (!seat.sellable || seat.status === 'unavailable' || !seat.selectable) return base + 'cursor-not-allowed';
            return base + 'cursor-pointer hover:brightness-125' + (seat.key === 'seat' ? ' border-white/60 bg-transparent text-white' : '');
        },

        seatStyle(seat) {
            const style = {
                gridColumn: String(seat.displayColumn + 2),
                gridRow: String(seat.displayRow + 1),
                fontSize: Math.max(10, Math.min(12, Math.floor(this.seatSize * 0.32))) + 'px',
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

        orderTotal() {
            return this.summary ? Number(this.summary.total || 0) : this.total();
        },

        change() {
            return Math.max(0, Number(this.cash || 0) - this.orderTotal());
        },

        formatRupiah(value) {
            return 'Rp ' + Math.round(Number(value || 0)).toLocaleString('id-ID');
        },

        async fetchSummary() {
            const response = await fetch(this.summaryUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken,
                },
                body: JSON.stringify({
                    schedule_id: {{ $schedule->id }},
                    seats: this.selected.map(seat => seat.seat_id),
                }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !payload.success) {
                const error = new Error(payload.message || 'Gagal memuat ringkasan pembelian.');
                error.status = response.status;
                error.payload = payload;
                throw error;
            }

            return payload.data;
        },

        async openSummary() {
            if (this.selected.length === 0 || this.summaryLoading || this.processing) return;

            this.summaryLoading = true;
            this.summary = null;
            this.summaryError = '';
            this.showSummary = true;

            try {
                this.summary = await this.fetchSummary();
            } catch (error) {
                await this.handleSummaryError(error);
            } finally {
                this.summaryLoading = false;
            }
        },

        async continueToPayment() {
            if (!this.summary || this.summaryLoading || this.processing) return;

            this.summaryLoading = true;
            this.summaryError = '';

            try {
                // Re-check availability and refresh the server-calculated total.
                this.summary = await this.fetchSummary();
                this.method = 'cash';
                this.cash = this.orderTotal();
                this.paymentError = '';
                this.paymentMessage = '';
                this.showPayment = true;
            } catch (error) {
                await this.handleSummaryError(error);
            } finally {
                this.summaryLoading = false;
            }
        },

        async handleSummaryError(error) {
            if (error.status === 409) {
                await this.handleUnavailableSeats(error.payload || {});
                return;
            }

            this.summaryError = error.message || 'Gagal memuat ringkasan pembelian.';
        },

        async handleUnavailableSeats(payload) {
            this.showPayment = false;
            this.showSummary = false;
            this.summary = null;
            this.summaryError = '';
            this.paymentError = '';

            const message = payload.message || 'Kursi yang dipilih sudah terjual. Silakan pilih kursi lain.';

            await this.loadSeats({
                keepSelected: true,
                dropSeatIds: payload.seat_ids || [],
            });

            this.mapMessage = message + ' Denah telah dimuat ulang.';
        },

        closeSummary() {
            if (this.summaryLoading || this.processing) return;
            this.showSummary = false;
        },

        closePayment() {
            if (this.processing) return;
            this.showPayment = false;
            if (this.summary) this.showSummary = true;
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
            if (this.method === 'cash' && Number(this.cash || 0) < this.orderTotal()) {
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
                    const soldOut = response.status === 409
                        || (payload.message || '').includes('Kursi sudah terjual');

                    if (soldOut) {
                        const codes = new Set(payload.seat_codes || []);
                        const blockedIds = this.selected
                            .filter(seat => codes.has(seat.label))
                            .map(seat => Number(seat.seat_id));

                        this.processing = false;
                        await this.handleUnavailableSeats({
                            message: payload.message,
                            seat_ids: payload.seat_ids || blockedIds,
                        });
                    } else {
                        this.paymentError = payload.message || 'Pembayaran gagal. Coba lagi.';
                        this.processing = false;
                    }
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