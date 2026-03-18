@extends('layouts.admin')

@section('title', 'Detail Order')
@section('page-title', 'Detail Order')
@section('page-subtitle', 'Informasi lengkap pemesanan tiket')

@section('content')
<div class="p-6 max-w-3xl">
    <div class="mb-4">
        <a href="{{ route('admin.orders.index') }}"
           class="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Order
        </a>
    </div>

    @php
        $schedule = $order->schedule;
        $statusColor = match($order->status) {
            'paid'      => 'bg-green-100 text-green-700 border-green-300',
            'pending'   => 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'cancelled' => 'bg-red-100 text-red-700 border-red-300',
            'expired'   => 'bg-gray-100 text-gray-500 border-gray-300',
            default     => 'bg-gray-100 text-gray-500 border-gray-300',
        };

        $formatDateTime = function ($value, string $format = 'D MMMM Y, HH:mm') {
            if (blank($value)) {
                return '-';
            }

            try {
                return $value instanceof \Carbon\CarbonInterface
                    ? $value->isoFormat($format)
                    : \Carbon\Carbon::parse($value)->isoFormat($format);
            } catch (\Throwable $e) {
                return (string) $value;
            }
        };
    @endphp

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        {{-- Order Info --}}
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i class="fas fa-receipt text-blue-500"></i> Informasi Order
            </h3>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <dt class="text-gray-500">Order Code</dt>
                    <dd class="font-mono font-bold text-blue-700">{{ $order->order_code }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Status</dt>
                    <dd><span class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase border {{ $statusColor }}">{{ $order->status }}</span></dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Total Harga</dt>
                    <dd class="font-bold text-gray-800">Rp {{ number_format($order->total_price, 0, ',', '.') }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Dibuat</dt>
                    <dd class="text-gray-600">{{ $formatDateTime($order->created_at) }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Expired At</dt>
                    <dd class="text-gray-600">{{ $formatDateTime($order->expired_at) }}</dd>
                </div>
            </dl>
        </div>

        {{-- Schedule Info --}}
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i class="fas fa-film text-blue-500"></i> Jadwal Tayang
            </h3>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <dt class="text-gray-500">Film</dt>
                    <dd class="font-medium text-gray-800">{{ $schedule?->movie?->title ?? '-' }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Bioskop</dt>
                    <dd class="text-gray-600">{{ $schedule?->studio?->cinema?->cinema_name ?? '-' }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Studio</dt>
                    <dd class="text-gray-600">{{ $schedule?->studio?->studio_name ?? '-' }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Tanggal</dt>
                    <dd class="text-gray-600">{{ $schedule ? \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMMM Y') : '-' }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Jam</dt>
                    <dd class="text-gray-600">{{ $schedule ? substr($schedule->show_time, 0, 5) : '-' }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-gray-500">Harga/Tiket</dt>
                    <dd class="text-gray-600">Rp {{ $schedule ? number_format($schedule->ticket_price, 0, ',', '.') : '-' }}</dd>
                </div>
            </dl>
        </div>

        {{-- Seats --}}
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i class="fas fa-chair text-blue-500"></i> Kursi Dipesan
            </h3>
            <div class="flex flex-wrap gap-2">
                @foreach($order->orderSeats as $os)
                    <span class="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-medium">
                        {{ $os->seat?->seat_code ?? '—' }}
                    </span>
                @endforeach
            </div>
        </div>

        {{-- Tickets --}}
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i class="fas fa-ticket-alt text-blue-500"></i> Tiket QR
            </h3>
            @forelse($order->tickets as $ticket)
                <div class="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span class="text-xs font-mono text-gray-600 break-all">{{ $ticket->qr_code }}</span>
                    @if($ticket->is_used)
                        <span class="ml-3 flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Digunakan</span>
                    @else
                        <span class="ml-3 flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">Valid</span>
                    @endif
                </div>
            @empty
                <p class="text-sm text-gray-400">Belum ada tiket terbuat.</p>
            @endforelse
        </div>

    </div>
</div>
@endsection
