@extends('layouts.print')

@section('title', 'Tiket')

@php
    $schedule = $order->schedule;
    $cinema = $schedule?->studio?->cinema;

    // Ticket header follows the cinema chain, not the app name. Matched case-insensitively
    // against the cinema name, most specific brand first.
    $cinemaName = (string) ($cinema?->cinema_name ?? '');
    $brandName = 'MOVIEW';
    foreach (['CINEPOLIS', 'CGV', 'XXI'] as $needle) {
        if (stripos($cinemaName, $needle) !== false) {
            $brandName = $needle;
            break;
        }
    }
@endphp

@section('content')

<div class="p-6">
    <div class="no-print flex flex-wrap items-center gap-3 mb-6">
        @if($fromScan ?? false)
            <a href="{{ route('staff.tickets.scanner') }}"
               class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">
                <i class="fas fa-arrow-left mr-2"></i> Kembali ke Scan
            </a>
        @else
            <a href="{{ route('staff.cashier.index') }}"
               class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">
                <i class="fas fa-arrow-left mr-2"></i> Kembali ke Kasir
            </a>
        @endif
        <button type="button" onclick="window.print()"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            <i class="fas fa-print mr-2"></i> Print
        </button>
        @if(session('success'))
            <span class="text-sm text-green-700">{{ session('success') }}</span>
        @endif
    </div>

    <div id="ticket-print-area" class="max-w-md mx-auto space-y-4">
        @forelse($order->tickets as $ticket)
            <div class="ticket-card bg-white border border-dashed border-gray-400 rounded-xl p-5">
                <div class="flex items-start justify-between border-b border-dashed border-gray-300 pb-3 mb-3">
                    <div>
                        <p class="text-lg font-black tracking-widest text-gray-900">{{ $brandName }}</p>
                        <p class="text-xs text-gray-500">{{ $cinemaName !== '' ? $cinemaName : 'Tiket Bioskop' }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-500">Kode</p>
                        <p class="font-mono text-xs font-semibold text-gray-800 break-all">{{ $ticket->qr_code }}</p>
                    </div>
                </div>

                <p class="text-xl font-bold text-gray-900">{{ $schedule?->movie?->title ?? '-' }}</p>

                <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                        <p class="text-xs text-gray-500">Bioskop</p>
                        <p class="font-medium text-gray-800">{{ $cinema?->cinema_name ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Studio</p>
                        <p class="font-medium text-gray-800">{{ $schedule?->studio?->studio_name ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Tanggal</p>
                        <p class="font-medium text-gray-800">
                            {{ $schedule ? \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMM Y') : '-' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Jam</p>
                        <p class="font-medium text-gray-800">{{ $schedule ? substr((string) $schedule->show_time, 0, 5) : '-' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Kursi</p>
                        <p class="font-bold text-gray-900">{{ $ticket->seat?->seat_code ?? '-' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Order</p>
                        <p class="font-mono text-xs font-medium text-gray-800">{{ $order->order_code }}</p>
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t border-dashed border-gray-300 text-xs text-gray-600 space-y-1">
                    <div class="flex justify-between">
                        <span>Pembeli</span>
                        <span class="font-medium text-gray-800">{{ $order->buyer_name ?: ($order->user?->username ?: 'Walk-in') }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Channel</span>
                        <span class="font-medium text-gray-800">{{ ucfirst($order->channel) }}</span>
                    </div>
                    @if($order->staff)
                        <div class="flex justify-between">
                            <span>Kasir</span>
                            <span class="font-medium text-gray-800">{{ $order->staff->username }}</span>
                        </div>
                    @endif
                    <div class="flex justify-between">
                        <span>Total</span>
                        <span class="font-semibold text-gray-900">Rp {{ number_format($order->total_price, 0, ',', '.') }}</span>
                    </div>
                    @if(session('cash_received') !== null)
                        <div class="flex justify-between">
                            <span>Tunai</span>
                            <span class="font-medium text-gray-800">Rp {{ number_format((int) session('cash_received'), 0, ',', '.') }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Kembalian</span>
                            <span class="font-medium text-gray-800">Rp {{ number_format((int) session('change'), 0, ',', '.') }}</span>
                        </div>
                    @endif
                </div>

                <p class="mt-3 text-[10px] text-gray-400 text-center">Tunjukkan tiket ini di pintu masuk. Satu tiket untuk satu kursi.</p>
            </div>
        @empty
            <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-5">
                Belum ada tiket untuk order ini.
            </div>
        @endforelse
    </div>
</div>

<style>
    @media print {
        .ticket-card {
            border: 1px dashed #000 !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
        }
    }
</style>

<script>
    // Print dialog opens automatically; the Print button stays for re-printing.
    (function () {
        let printed = false;
        const trigger = () => {
            if (printed) return;
            printed = true;
            window.print();
        };
        window.addEventListener('load', () => setTimeout(trigger, 200));
        window.addEventListener('afterprint', () => { printed = false; });
    })();
</script>
@endsection
