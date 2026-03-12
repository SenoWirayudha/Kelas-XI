@extends('layouts.admin')

@section('title', 'Ticket Scanner')
@section('page-title', 'Ticket Scanner')
@section('page-subtitle', 'Scan atau masukkan QR Code untuk memvalidasi tiket')

@section('content')
<div class="p-6 max-w-xl">

    {{-- Feedback alerts --}}
    @if(session('scan_success'))
        <div class="mb-5 px-4 py-3 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-2">
            <i class="fas fa-check-circle text-xl"></i>
            <span>{{ session('scan_success') }}</span>
        </div>
    @endif

    @if(session('scan_error'))
        <div class="mb-5 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <i class="fas fa-exclamation-circle text-xl"></i>
            <span>{{ session('scan_error') }}</span>
        </div>
    @endif

    {{-- Scan Form --}}
    <div class="bg-white rounded-xl shadow p-6 mb-6">
        <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-qrcode text-blue-500 text-lg"></i> Masukkan QR Code
        </h3>
        <form action="{{ route('admin.tickets.scan') }}" method="POST">
            @csrf
            <div class="flex gap-3">
                <input type="text" name="qr_code"
                       value="{{ old('qr_code') }}"
                       placeholder="Contoh: ABCDEFGHIJKL-12-5"
                       autofocus
                       class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
                <button type="submit"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    <i class="fas fa-search mr-1"></i> Cari
                </button>
            </div>
            @error('qr_code')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </form>
    </div>

    {{-- Ticket Result --}}
    @isset($ticket)
    @php
        $schedule = $ticket->order->schedule;
        $cinema   = $schedule?->studio?->cinema;
        $movie    = $schedule?->movie;
    @endphp
    <div class="bg-white rounded-xl shadow overflow-hidden">
        {{-- Header strip --}}
        <div class="{{ $ticket->is_used ? 'bg-red-500' : 'bg-green-500' }} px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3 text-white">
                <i class="fas fa-ticket-alt text-2xl"></i>
                <div>
                    <p class="font-bold text-lg">{{ $ticket->is_used ? 'Tiket Sudah Digunakan' : 'Tiket Valid' }}</p>
                    <p class="text-sm opacity-90">QR: <span class="font-mono">{{ $ticket->qr_code }}</span></p>
                </div>
            </div>
            @if($ticket->is_used)
                <i class="fas fa-times-circle text-4xl text-white opacity-80"></i>
            @else
                <i class="fas fa-check-circle text-4xl text-white opacity-80"></i>
            @endif
        </div>

        {{-- Details --}}
        <div class="p-6 space-y-3 text-sm">
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Order Code</span>
                <span class="font-mono font-bold text-blue-700">{{ $ticket->order->order_code }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Film</span>
                <span class="font-medium text-gray-800">{{ $movie?->title ?? '-' }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Bioskop</span>
                <span class="text-gray-700">{{ $cinema?->cinema_name ?? '-' }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Studio</span>
                <span class="text-gray-700">{{ $schedule?->studio?->studio_name ?? '-' }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Tanggal &amp; Jam</span>
                <span class="text-gray-700">
                    {{ $schedule ? \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMM Y') : '-' }}
                    pukul {{ $schedule ? substr($schedule->show_time, 0, 5) : '-' }}
                </span>
            </div>
            <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">Kursi</span>
                <span class="font-bold text-gray-800">{{ $ticket->seat?->seat_code ?? '-' }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-500">Status Tiket</span>
                @if($ticket->is_used)
                    <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Sudah Digunakan</span>
                @else
                    <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Belum Digunakan</span>
                @endif
            </div>
        </div>

        {{-- Action --}}
        @if(!$ticket->is_used)
        <div class="px-6 pb-6">
            <form action="{{ route('admin.tickets.mark-used') }}" method="POST">
                @csrf
                <input type="hidden" name="ticket_id" value="{{ $ticket->id }}">
                <button type="submit"
                        onclick="return confirm('Tandai tiket ini sebagai sudah digunakan?')"
                        class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-check"></i> Validasi &amp; Tandai Sudah Digunakan
                </button>
            </form>
        </div>
        @else
        <div class="px-6 pb-6">
            <div class="w-full py-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg text-center">
                <i class="fas fa-ban mr-2"></i> Tiket ini tidak dapat digunakan kembali.
            </div>
        </div>
        @endif
    </div>
    @endisset

</div>
@endsection
