@extends('layouts.admin')

@section('title', 'Dashboard Staff')
@section('page-title', 'Dashboard Staff')
@section('page-subtitle', $cinemaName ?? 'Bioskop belum terhubung')

@section('content')
<div class="mv-dash-fade space-y-6">

    {{-- Greeting --}}
    <section class="mv-dash-hero rounded-2xl p-6 lg:p-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Shift Operasional</p>
                <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    {{ $greeting }}, {{ session('admin_user_name', 'Staff') }}
                </h1>
                <p class="mt-2 text-sm text-gray-300">
                    <i class="fas fa-location-dot mr-1.5 text-blue-300"></i>
                    {{ $cinemaName ?? 'Bioskop belum terhubung' }}
                    <span class="mx-2 text-gray-500">•</span>
                    {{ $today->copy()->locale('id')->isoFormat('dddd, D MMMM Y') }}
                </p>
            </div>
            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                    <i class="fas fa-user-check"></i>
                </span>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-300">Siap melayani</p>
                    <p class="text-xs text-gray-400">{{ $schedules->count() }} jadwal tayang hari ini</p>
                </div>
            </div>
        </div>
    </section>

    {{-- KPI cards --}}
    <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="mv-dash-kpi is-green rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-400">Tiket terjual oleh saya</p>
                    <p class="mt-2 text-3xl font-bold text-white">{{ number_format($ticketsSoldToday, 0, ',', '.') }}</p>
                    <p class="mt-2 text-xs text-gray-500">Order offline paid hari ini</p>
                </div>
                <span class="mv-dash-icon is-green"><i class="fas fa-ticket"></i></span>
            </div>
        </div>

        <div class="mv-dash-kpi is-gold rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm text-gray-400">Uang tunai diterima</p>
                    <p class="mt-2 truncate text-3xl font-bold text-white" title="Rp {{ number_format($cashToday, 0, ',', '.') }}">
                        Rp {{ number_format($cashToday, 0, ',', '.') }}
                    </p>
                    <p class="mt-2 text-xs text-gray-500">Pendapatan transaksi saya</p>
                </div>
                <span class="mv-dash-icon is-gold"><i class="fas fa-money-bill-wave"></i></span>
            </div>
        </div>

        <div class="mv-dash-kpi rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-400">Tiket discan hari ini</p>
                    <p class="mt-2 text-3xl font-bold text-white">{{ number_format($scannedToday, 0, ',', '.') }}</p>
                    <p class="mt-2 text-xs text-gray-500">Seluruh bioskop ini</p>
                </div>
                <span class="mv-dash-icon"><i class="fas fa-qrcode"></i></span>
            </div>
        </div>
    </section>

    {{-- Quick actions --}}
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <a href="{{ route('staff.cashier.index') }}" class="mv-dash-action group flex items-center gap-4 rounded-xl p-5">
            <span class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40">
                <i class="fas fa-cash-register text-2xl"></i>
            </span>
            <span class="min-w-0 flex-1">
                <span class="block text-base font-semibold text-white">Kasir</span>
                <span class="mt-1 block text-sm text-gray-400">Jual tiket dan proses pembayaran tunai</span>
            </span>
            <i class="fas fa-arrow-right text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-400"></i>
        </a>

        <a href="{{ route('staff.tickets.scanner') }}" class="mv-dash-action group flex items-center gap-4 rounded-xl p-5">
            <span class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-900/40">
                <i class="fas fa-qrcode text-2xl"></i>
            </span>
            <span class="min-w-0 flex-1">
                <span class="block text-base font-semibold text-white">Scan Tiket</span>
                <span class="mt-1 block text-sm text-gray-400">Validasi tiket penonton di pintu masuk</span>
            </span>
            <i class="fas fa-arrow-right text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-green-400"></i>
        </a>
    </section>

    {{-- Today's schedules --}}
    <section class="overflow-hidden rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="flex flex-col gap-2 border-b border-gray-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <i class="fas fa-calendar-day text-blue-500"></i>
                    Jadwal Tayang Hari Ini
                </h2>
                <p class="mt-1 text-xs text-gray-500">Pantau jam tayang dan keterisian studio</p>
            </div>
            <span class="inline-flex w-fit items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                <i class="fas fa-film"></i>
                {{ $schedules->count() }} jadwal
            </span>
        </div>

        <div class="overflow-x-auto">
            <table class="mv-table min-w-full divide-y divide-gray-700/60 text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-5 py-3 text-left font-semibold text-gray-500">Jam</th>
                        <th class="px-5 py-3 text-left font-semibold text-gray-500">Film</th>
                        <th class="px-5 py-3 text-left font-semibold text-gray-500">Studio</th>
                        <th class="px-5 py-3 text-left font-semibold text-gray-500">Okupansi</th>
                        <th class="px-5 py-3 text-right font-semibold text-gray-500">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50">
                    @forelse($schedules as $schedule)
                        <tr class="transition hover:bg-gray-50">
                            <td class="whitespace-nowrap px-5 py-4">
                                <span class="text-base font-bold text-white">{{ substr($schedule->show_time, 0, 5) }}</span>
                            </td>
                            <td class="px-5 py-4">
                                <p class="max-w-[260px] truncate font-medium text-gray-800" title="{{ $schedule->movie?->title }}">
                                    {{ $schedule->movie?->title ?? '-' }}
                                </p>
                            </td>
                            <td class="whitespace-nowrap px-5 py-4 text-gray-500">
                                {{ $schedule->studio?->studio_name ?? '-' }}
                            </td>
                            <td class="min-w-[180px] px-5 py-4">
                                <div class="flex items-center justify-between gap-2 text-xs">
                                    <span class="text-gray-500">{{ $schedule->sold_seats }} / {{ $schedule->total_seats }} kursi</span>
                                    <span class="font-semibold text-gray-700">{{ $schedule->occupancy }}%</span>
                                </div>
                                <div class="mv-dash-progress mt-2 {{ $schedule->occupancy >= 80 ? 'is-green' : '' }}">
                                    <span style="width: {{ $schedule->occupancy }}%;"></span>
                                </div>
                            </td>
                            <td class="whitespace-nowrap px-5 py-4 text-right">
                                @php
                                    $scheduleStatus = match($schedule->status) {
                                        'active' => 'bg-green-100 text-green-700',
                                        'expired' => 'bg-gray-100 text-gray-500',
                                        default => 'bg-red-100 text-red-700',
                                    };
                                @endphp
                                <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase {{ $scheduleStatus }}">
                                    {{ $schedule->status }}
                                </span>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-5 py-12 text-center">
                                <i class="fas fa-calendar-xmark text-3xl text-gray-600"></i>
                                <p class="mt-3 text-sm font-medium text-gray-400">Tidak ada jadwal hari ini</p>
                                <p class="mt-1 text-xs text-gray-500">Belum ada film yang dijadwalkan tayang.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
</div>
@endsection
