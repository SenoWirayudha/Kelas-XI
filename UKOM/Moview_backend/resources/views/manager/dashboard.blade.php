@extends('layouts.admin')

@section('title', 'Dashboard Manager')
@section('page-title', 'Dashboard Manager')
@section('page-subtitle', $cinemaName ?? 'Bioskop belum terhubung')

@section('content')
<div class="mv-dash-fade space-y-6">

    {{-- Greeting --}}
    <section class="mv-dash-hero rounded-2xl p-6 lg:p-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Ringkasan Operasional</p>
                <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    {{ $greeting }}, {{ session('admin_user_name', 'Manager') }}
                </h1>
                <p class="mt-2 text-sm text-gray-300">
                    <i class="fas fa-location-dot mr-1.5 text-blue-300"></i>
                    {{ $cinemaName ?? 'Bioskop belum terhubung' }}
                    <span class="mx-2 text-gray-500">•</span>
                    {{ $today->copy()->locale('id')->isoFormat('dddd, D MMMM Y') }}
                </p>
            </div>
            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <span class="relative flex h-2.5 w-2.5">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"></span>
                    <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400"></span>
                </span>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-300">Data hari ini</p>
                    <p class="text-xs text-gray-400">{{ $schedules->count() }} jadwal tayang aktif</p>
                </div>
            </div>
        </div>
    </section>

    {{-- KPI cards --}}
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="mv-dash-kpi rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm text-gray-400">Pendapatan hari ini</p>
                    <p class="mt-2 truncate text-2xl font-bold text-white" title="Rp {{ number_format($revenueToday, 0, ',', '.') }}">
                        Rp {{ number_format($revenueToday, 0, ',', '.') }}
                    </p>
                    <p class="mt-2 text-xs text-gray-500">
                        Online Rp {{ number_format($onlineRevenue, 0, ',', '.') }}
                        <span class="mx-1">•</span>
                        Offline Rp {{ number_format($offlineRevenue, 0, ',', '.') }}
                    </p>
                </div>
                <span class="mv-dash-icon"><i class="fas fa-wallet"></i></span>
            </div>
        </div>

        <div class="mv-dash-kpi is-green rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-400">Tiket terjual</p>
                    <p class="mt-2 text-2xl font-bold text-white">{{ number_format($ticketsToday, 0, ',', '.') }}</p>
                    <p class="mt-2 text-xs text-gray-500">Dari order berstatus paid</p>
                </div>
                <span class="mv-dash-icon is-green"><i class="fas fa-ticket"></i></span>
            </div>
        </div>

        <div class="mv-dash-kpi is-gold rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-400">Order hari ini</p>
                    <p class="mt-2 text-2xl font-bold text-white">{{ number_format($ordersToday, 0, ',', '.') }}</p>
                    <p class="mt-2 text-xs text-gray-500">Transaksi yang berhasil dibayar</p>
                </div>
                <span class="mv-dash-icon is-gold"><i class="fas fa-receipt"></i></span>
            </div>
        </div>

        <div class="mv-dash-kpi is-orange rounded-xl p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <p class="text-sm text-gray-400">Kanal penjualan</p>
                    <div class="mt-3 space-y-2">
                        <div class="flex items-center justify-between gap-3 text-sm">
                            <span class="flex items-center gap-2 text-gray-300">
                                <span class="h-2 w-2 rounded-full bg-blue-500"></span> Online
                            </span>
                            <span class="font-semibold text-white">{{ number_format($onlineOrdersToday, 0, ',', '.') }} order</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 text-sm">
                            <span class="flex items-center gap-2 text-gray-300">
                                <span class="h-2 w-2 rounded-full bg-green-500"></span> Offline
                            </span>
                            <span class="font-semibold text-white">{{ number_format($offlineOrdersToday, 0, ',', '.') }} order</span>
                        </div>
                    </div>
                </div>
                <span class="mv-dash-icon is-orange"><i class="fas fa-store"></i></span>
            </div>
        </div>
    </section>

    {{-- Revenue trend + top films --}}
    <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg xl:col-span-2">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <i class="fas fa-chart-column text-blue-500"></i>
                        Pendapatan 7 Hari Terakhir
                    </h2>
                    <p class="mt-1 text-xs text-gray-500">Akumulasi order paid per hari</p>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-blue-500"></span> Online</span>
                    <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-green-500"></span> Offline</span>
                </div>
            </div>

            <div class="mt-6">
                @if($revenueTrend->sum('total') === 0)
                    <div class="flex h-[230px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-700/60 text-center">
                        <i class="fas fa-chart-simple text-3xl text-gray-600"></i>
                        <p class="mt-3 text-sm font-medium text-gray-400">Belum ada pendapatan</p>
                        <p class="mt-1 text-xs text-gray-500">Data akan muncul setelah ada order yang dibayar.</p>
                    </div>
                @else
                    <div class="mv-dash-chart">
                        <div class="mv-dash-chart-grid"></div>
                        @foreach($revenueTrend as $day)
                            @php
                                $total = (int) $day['total'];
                                $barHeight = $total > 0 ? max(4, (int) round(($total / $revenueTrendMax) * 100)) : 2;
                                $offlineShare = $total > 0 ? (int) round(($day['offline'] / $total) * 100) : 0;
                                $onlineShare = $total > 0 ? 100 - $offlineShare : 0;
                                $tooltip = $day['full_label'] . ' • Online Rp ' . number_format($day['online'], 0, ',', '.') . ' • Offline Rp ' . number_format($day['offline'], 0, ',', '.');
                            @endphp
                            <div class="mv-dash-chart-col group">
                                <div class="mv-dash-chart-barwrap">
                                    <div class="mv-dash-chart-bar cursor-default"
                                         style="height: {{ $barHeight }}%;"
                                         title="{{ $tooltip }}">
                                        @if($total === 0)
                                            <span class="mv-dash-chart-zero h-full w-full"></span>
                                        @else
                                            <span class="mv-dash-chart-offline" style="height: {{ $offlineShare }}%;"></span>
                                            <span class="mv-dash-chart-online" style="height: {{ $onlineShare }}%;"></span>
                                        @endif
                                    </div>
                                    <span class="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 w-44 -translate-x-1/2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-center text-[11px] leading-4 text-gray-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                        <span class="block font-semibold text-white">{{ $day['full_label'] }}</span>
                                        <span class="block text-blue-300">Online Rp {{ number_format($day['online'], 0, ',', '.') }}</span>
                                        <span class="block text-green-300">Offline Rp {{ number_format($day['offline'], 0, ',', '.') }}</span>
                                    </span>
                                </div>
                                <span class="mv-dash-chart-label">{{ $day['label'] }}</span>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <i class="fas fa-fire text-orange-500"></i>
                        Top 5 Film
                    </h2>
                    <p class="mt-1 text-xs text-gray-500">Berdasarkan tiket terjual hari ini</p>
                </div>
            </div>

            <div class="mt-5 space-y-4">
                @forelse($topFilms as $index => $film)
                    @php $sold = (int) $film->tickets_sold; @endphp
                    <div>
                        <div class="flex items-center gap-3">
                            <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold {{ $index === 0 ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-600' }}">
                                {{ $index + 1 }}
                            </span>
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-gray-800" title="{{ $film->title }}">{{ $film->title }}</p>
                                <div class="mv-dash-progress mt-2">
                                    <span style="width: {{ max(4, (int) round(($sold / $topFilmMax) * 100)) }}%;"></span>
                                </div>
                            </div>
                            <span class="whitespace-nowrap text-xs font-semibold text-gray-500">{{ number_format($sold, 0, ',', '.') }} tiket</span>
                        </div>
                    </div>
                @empty
                    <div class="flex flex-col items-center justify-center py-14 text-center">
                        <i class="fas fa-film text-3xl text-gray-600"></i>
                        <p class="mt-3 text-sm font-medium text-gray-400">Belum ada tiket terjual</p>
                        <p class="mt-1 text-xs text-gray-500">Top film akan muncul otomatis.</p>
                    </div>
                @endforelse
            </div>
        </div>
    </section>

    {{-- Today's schedules + latest orders --}}
    <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="overflow-hidden rounded-xl border border-gray-700/60 bg-white shadow-lg xl:col-span-2">
            <div class="flex items-center justify-between border-b border-gray-700/60 px-5 py-4">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <i class="fas fa-calendar-day text-blue-500"></i>
                        Jadwal Hari Ini
                    </h2>
                    <p class="mt-1 text-xs text-gray-500">Okupansi dihitung dari kursi pada order paid</p>
                </div>
                <a href="{{ route('manager.schedules.index') }}" class="text-sm font-medium text-blue-400 hover:text-blue-300">
                    Lihat semua <i class="fas fa-arrow-right ml-1 text-xs"></i>
                </a>
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
                                <td class="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">
                                    {{ substr($schedule->show_time, 0, 5) }}
                                </td>
                                <td class="px-5 py-4">
                                    <p class="max-w-[220px] truncate font-medium text-gray-800" title="{{ $schedule->movie?->title }}">
                                        {{ $schedule->movie?->title ?? '-' }}
                                    </p>
                                </td>
                                <td class="whitespace-nowrap px-5 py-4 text-gray-500">
                                    {{ $schedule->studio?->studio_name ?? '-' }}
                                </td>
                                <td class="min-w-[170px] px-5 py-4">
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
                                    <p class="mt-1 text-xs text-gray-500">Tambahkan jadwal tayang untuk melihat okupansi.</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-700/60 bg-white shadow-lg">
            <div class="flex items-center justify-between border-b border-gray-700/60 px-5 py-4">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <i class="fas fa-clock-rotate-left text-blue-500"></i>
                        Order Terbaru
                    </h2>
                    <p class="mt-1 text-xs text-gray-500">5 transaksi terakhir</p>
                </div>
                <a href="{{ route('manager.orders.index') }}" class="text-sm font-medium text-blue-400 hover:text-blue-300">
                    Kelola <i class="fas fa-arrow-right ml-1 text-xs"></i>
                </a>
            </div>

            <div class="divide-y divide-gray-700/50">
                @forelse($latestOrders as $order)
                    @php
                        $statusStyle = match($order->status) {
                            'paid' => 'bg-green-100 text-green-700',
                            'pending' => 'bg-yellow-100 text-yellow-700',
                            'cancelled' => 'bg-red-100 text-red-700',
                            default => 'bg-gray-100 text-gray-500',
                        };
                    @endphp
                    <a href="{{ route('manager.orders.show', $order->id) }}"
                       class="block px-5 py-4 transition hover:bg-gray-50">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="truncate font-mono text-sm font-medium text-blue-400">{{ $order->order_code }}</p>
                                <p class="mt-1 truncate text-sm text-gray-700">{{ $order->schedule?->movie?->title ?? '-' }}</p>
                                <p class="mt-1 text-xs text-gray-500">
                                    {{ $order->created_at ? \Carbon\Carbon::parse($order->created_at)->isoFormat('D MMM, HH:mm') : '-' }}
                                    <span class="mx-1">•</span>
                                    {{ $order->schedule?->studio?->studio_name ?? '-' }}
                                </p>
                            </div>
                            <div class="flex flex-shrink-0 flex-col items-end gap-2">
                                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase {{ $statusStyle }}">{{ $order->status }}</span>
                                <span class="text-xs font-semibold text-gray-700">Rp {{ number_format($order->total_price, 0, ',', '.') }}</span>
                                <span class="text-[10px] uppercase tracking-wide {{ $order->channel === 'offline' ? 'text-green-400' : 'text-blue-400' }}">
                                    {{ $order->channel }}
                                </span>
                            </div>
                        </div>
                    </a>
                @empty
                    <div class="flex flex-col items-center justify-center px-5 py-14 text-center">
                        <i class="fas fa-receipt text-3xl text-gray-600"></i>
                        <p class="mt-3 text-sm font-medium text-gray-400">Belum ada order</p>
                        <p class="mt-1 text-xs text-gray-500">Order terbaru akan tampil di sini.</p>
                    </div>
                @endforelse
            </div>
        </div>
    </section>
</div>
@endsection
