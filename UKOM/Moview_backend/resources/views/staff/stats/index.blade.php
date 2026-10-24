@extends('layouts.admin')

@section('title', 'Statistik Saya')
@section('page-title', 'Statistik Saya')
@section('page-subtitle', 'Ringkasan penjualan dan absensi harian')

@section('content')
@php
    $durationText = $stats['duration_minutes'] === null
        ? '-'
        : intdiv($stats['duration_minutes'], 60) . ' jam ' . ($stats['duration_minutes'] % 60) . ' menit';
@endphp

<div class="space-y-6">
    <section class="rounded-xl border border-gray-700/60 bg-white p-4 shadow-lg sm:p-5">
        <form method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="w-full sm:w-auto">
                <label for="date" class="mb-1 block text-xs text-gray-500">Pilih tanggal</label>
                <input type="date" id="date" name="date" value="{{ $date->toDateString() }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-48">
            </div>
            <button type="submit" class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                <i class="fas fa-calendar-day mr-2"></i> Tampilkan
            </button>
            @if($date->toDateString() !== $today->toDateString())
                <a href="{{ route('staff.stats.index') }}" class="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200">
                    Hari ini
                </a>
            @endif
        </form>
    </section>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-500">Tiket terjual</p>
                    <p class="mt-2 text-3xl font-bold text-white">{{ number_format($stats['tickets_sold'], 0, ',', '.') }}</p>
                </div>
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><i class="fas fa-ticket"></i></span>
            </div>
        </div>
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-500">Jumlah order</p>
                    <p class="mt-2 text-3xl font-bold text-white">{{ number_format($stats['orders'], 0, ',', '.') }}</p>
                </div>
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><i class="fas fa-receipt"></i></span>
            </div>
        </div>
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm text-gray-500">Pendapatan</p>
                    <p class="mt-2 truncate text-2xl font-bold text-white">Rp {{ number_format($stats['revenue'], 0, ',', '.') }}</p>
                    <p class="mt-1 text-[11px] text-gray-500">Tunai Rp {{ number_format($stats['cash_revenue'], 0, ',', '.') }}</p>
                    <p class="text-[11px] text-gray-500">Non-tunai Rp {{ number_format($stats['non_cash_revenue'], 0, ',', '.') }}</p>
                </div>
                <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><i class="fas fa-wallet"></i></span>
            </div>
        </div>
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-500">Tiket di-scan</p>
                    <p class="mt-2 text-3xl font-bold text-white">{{ number_format($stats['scanned_tickets'], 0, ',', '.') }}</p>
                </div>
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><i class="fas fa-qrcode"></i></span>
            </div>
        </div>
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-500">Durasi kerja</p>
                    <p class="mt-2 text-xl font-bold text-white">{{ $durationText }}</p>
                </div>
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><i class="fas fa-clock"></i></span>
            </div>
        </div>
    </div>

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="text-sm font-semibold text-white">7 hari terakhir</h3>
            <p class="mt-1 text-xs text-gray-500">Statistik harian milik akun dan bioskop Anda.</p>
        </div>
        <div class="overflow-x-auto">
            <table class="mv-table min-w-[720px]">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left font-semibold text-gray-500">Tanggal</th>
                        <th class="text-left font-semibold text-gray-500">Tiket Terjual</th>
                        <th class="text-left font-semibold text-gray-500">Pendapatan</th>
                        <th class="text-left font-semibold text-gray-500">Tiket Di-scan</th>
                        <th class="text-left font-semibold text-gray-500">Durasi Kerja</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach($lastSevenDays as $day)
                        @php
                            $dayDuration = $day['duration_minutes'];
                            $dayDurationText = $dayDuration === null
                                ? '-'
                                : intdiv($dayDuration, 60) . ' jam ' . ($dayDuration % 60) . ' menit';
                        @endphp
                        <tr>
                            <td class="text-gray-700">{{ $day['date']->locale('id')->isoFormat('ddd, D MMM Y') }}</td>
                            <td class="font-medium text-white">{{ number_format($day['tickets_sold'], 0, ',', '.') }}</td>
                            <td class="text-gray-300">Rp {{ number_format($day['revenue'], 0, ',', '.') }}</td>
                            <td class="text-gray-300">{{ number_format($day['scanned_tickets'], 0, ',', '.') }}</td>
                            <td class="text-gray-300">{{ $dayDurationText }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </section>
</div>
@endsection
