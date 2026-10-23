@extends('layouts.admin')

@section('title', 'Kasir Tiket')
@section('page-title', 'Kasir Tiket')
@section('page-subtitle', 'Penjualan tiket offline di bioskop Anda')

@section('content')
<div class="p-6" x-data="cashierPage()" x-init="init()">
    @if($schedules->isEmpty())
        <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-5">
            <i class="fas fa-circle-info mr-2"></i>
            Tidak ada jadwal tayang hari ini di bioskop Anda.
        </div>
    @else
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
            <div class="bg-white rounded-xl shadow p-5">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Jadwal Tayang Hari Ini</label>
                <select x-model="scheduleId" @change="loadSeats()"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    @foreach($schedules as $schedule)
                        <option value="{{ $schedule->id }}">
                            {{ $schedule->movie?->title ?? '-' }} — {{ $schedule->studio?->studio_name ?? '-' }} — {{ substr((string) $schedule->show_time, 0, 5) }}
                        </option>
                    @endforeach
                </select>
                <p class="mt-2 text-xs text-gray-500">
                    Kursi yang sudah terjual (online maupun offline) tidak dapat dipilih.
                </p>
            </div>

            <div class="bg-white rounded-xl shadow p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-chair text-blue-500"></i> Denah Studio
                    </h3>
                    <span x-show="loadingSeats" class="text-xs text-gray-500">
                        <i class="fas fa-spinner fa-spin mr-1"></i> Memuat...
                    </span>
                </div>

                <div x-show="error" x-text="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3"></div>

                <div class="overflow-x-auto pb-2">
                    <div class="grid gap-1 justify-center mx-auto" :style="gridStyle()">
                        <template x-for="seat in seats" :key="seat.seat_id">
                            <button type="button"
                                    @click="toggleSeat(seat)"
                                    :disabled="!isSelectable(seat)"
                                    :style="seatStyle(seat)"
                                    :class="seatClass(seat)"
                                    :title="seat.status === 'booked' ? 'Sudah terjual' : seat.seat_code">
                                <span x-text="seatLabel(seat)"></span>
                            </button>
                        </template>
                    </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded border bg-white border-gray-300"></span> Tersedia</span>
                    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-blue-600"></span> Dipilih</span>
                    <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-gray-300"></span> Terjual</span>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-cash-register text-blue-500"></i> Pembayaran
                </h3>

                <div class="mb-4">
                    <p class="text-xs text-gray-500 mb-1">Kursi dipilih</p>
                    <div class="flex flex-wrap gap-1 min-h-[1.75rem]">
                        <template x-for="seat in selected" :key="seat.seat_id">
                            <span class="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2 py-1 rounded">
                                <span x-text="seat.seat_code"></span>
                                <button type="button" @click="toggleSeat(seat)" class="text-blue-500 hover:text-blue-800">&times;</button>
                            </span>
                        </template>
                        <span x-show="selected.length === 0" class="text-sm text-gray-400">Belum ada kursi dipilih</span>
                    </div>
                </div>

                <div class="flex items-center justify-between py-2 border-t border-gray-100">
                    <span class="text-sm text-gray-600">Total</span>
                    <span class="font-bold text-gray-900" x-text="formatRupiah(total())"></span>
                </div>

                <label class="block text-sm font-medium text-gray-700 mt-3 mb-1">Nama Pembeli <span class="text-gray-400 font-normal">(opsional)</span></label>
                <input type="text" x-model="buyerName" maxlength="100"
                       placeholder="Nama pembeli"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">

                <label class="block text-sm font-medium text-gray-700 mt-3 mb-1">Uang Tunai</label>
                <input type="number" min="0" step="1000" x-model.number="cash"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">

                <div class="flex items-center justify-between py-2 mt-1">
                    <span class="text-sm text-gray-600">Kembalian</span>
                    <span class="font-semibold" :class="cash >= total() ? 'text-green-700' : 'text-red-600'" x-text="formatRupiah(change())"></span>
                </div>

                <button type="button" @click="pay()"
                        :disabled="processing || selected.length === 0 || cash < total()"
                        class="mt-4 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-money-bill-wave mr-1"></i>
                    <span x-text="processing ? 'Memproses...' : 'Bayar'"></span>
                </button>
            </div>
        </div>
    </div>
    @endif
</div>
@endsection

@push('scripts')
<script>
function cashierPage() {
    return {
        scheduleId: '{{ $schedules->first()?->id }}',
        seats: [],
        rows: 0,
        columns: 0,
        selected: [],
        buyerName: '',
        cash: 0,
        loadingSeats: false,
        processing: false,
        error: '',
        seatsUrl: '{{ route('staff.cashier.seats') }}',
        storeUrl: '{{ route('staff.cashier.store') }}',
        csrfToken: '{{ csrf_token() }}',

        init() {
            if (this.scheduleId) {
                this.loadSeats();
            }
        },

        async loadSeats() {
            this.loadingSeats = true;
            this.error = '';
            this.selected = [];
            this.seats = [];

            try {
                const response = await fetch(this.seatsUrl + '?schedule_id=' + encodeURIComponent(this.scheduleId), {
                    headers: { 'Accept': 'application/json' },
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success) {
                    throw new Error(payload.message || 'Gagal memuat denah kursi.');
                }

                this.seats = payload.data.seats || [];
                this.rows = payload.data.rows || 0;
                this.columns = payload.data.columns || 0;
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loadingSeats = false;
            }
        },

        isSelectable(seat) {
            return seat.status === 'available';
        },

        isSelected(seat) {
            return this.selected.some(s => s.seat_id === seat.seat_id);
        },

        toggleSeat(seat) {
            if (!this.isSelectable(seat)) {
                return;
            }

            const index = this.selected.findIndex(s => s.seat_id === seat.seat_id);
            if (index >= 0) {
                this.selected.splice(index, 1);
            } else {
                this.selected.push(seat);
            }
        },

        seatLabel(seat) {
            if (!seat.status && (seat.seat_type === 'aisle' || seat.seat_type === 'entrance')) {
                return '';
            }
            return seat.seat_code || '';
        },

        seatStyle(seat) {
            return 'grid-column: ' + (Number(seat.column) + 1) + '; grid-row: ' + (Number(seat.row_index) + 1) + ';';
        },

        gridStyle() {
            return 'grid-template-columns: repeat(' + Math.max(1, Number(this.columns)) + ', minmax(2.25rem, 2.25rem));';
        },

        seatClass(seat) {
            const base = 'w-9 h-9 rounded border text-[10px] font-semibold flex items-center justify-center transition ';

            if (this.isSelected(seat)) {
                return base + 'bg-blue-600 border-blue-700 text-white';
            }
            if (seat.status === 'booked') {
                return base + 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed';
            }
            if (seat.status === 'unavailable') {
                return base + 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed';
            }
            if (!seat.status) {
                return base + 'bg-transparent border-transparent cursor-default';
            }
            return base + 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50';
        },

        total() {
            return this.selected.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
        },

        change() {
            return Math.max(0, Number(this.cash || 0) - this.total());
        },

        formatRupiah(value) {
            return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
        },

        async pay() {
            if (this.selected.length === 0 || this.processing) {
                return;
            }

            this.processing = true;
            this.error = '';

            try {
                const response = await fetch(this.storeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        schedule_id: this.scheduleId,
                        seats: this.selected.map(seat => seat.seat_id),
                        buyer_name: this.buyerName,
                        cash_received: Number(this.cash || 0),
                    }),
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success) {
                    const soldOut = (payload.message || '').includes('Kursi sudah terjual');

                    if (soldOut) {
                        await this.loadSeats();
                        this.error = 'Kursi sudah terjual. Denah telah dimuat ulang.';
                    } else {
                        this.error = payload.message || 'Pembayaran gagal. Coba lagi.';
                    }
                    return;
                }

                window.location.href = payload.redirect;
            } catch (error) {
                this.error = 'Gagal menghubungi server. Coba lagi.';
            } finally {
                this.processing = false;
            }
        },
    };
}
</script>
@endpush
