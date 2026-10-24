@extends('layouts.admin')

@section('title', 'Statistik Bioskop')
@section('page-title', 'Statistik Bioskop')
@section('page-subtitle', session('admin_cinema_name', 'Bioskop Anda'))

@section('content')
@php
    $trendDays = $revenueTrend['days'];
    $trendMinWidth = max(100, $trendDays->count() * 40);
    $peakMinWidth = 24 * 38;
    $filmMax = max(1, (int) $topFilms->max('tickets_sold'));
@endphp

<style>
    .stats-chart-scroll {
        overflow-x: auto;
        padding-bottom: 0.35rem;
    }
</style>

<div class="space-y-6">
    <section class="rounded-xl border border-gray-700/60 bg-white p-4 shadow-lg sm:p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Periode</p>
                <h2 class="mt-1 text-lg font-semibold text-white">{{ $periodLabel }}</h2>
                <p class="mt-1 text-xs text-gray-500">
                    {{ $start->locale('id')->isoFormat('D MMM Y') }}
                    @if($start->toDateString() !== $end->toDateString())
                        – {{ $end->locale('id')->isoFormat('D MMM Y') }}
                    @endif
                </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div class="flex flex-wrap gap-2">
                    <a href="{{ route('manager.stats.index', ['period' => 'today']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === 'today' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        Hari ini
                    </a>
                    <a href="{{ route('manager.stats.index', ['period' => '7']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === '7' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        7 hari
                    </a>
                    <a href="{{ route('manager.stats.index', ['period' => '30']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === '30' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        30 hari
                    </a>
                </div>

                <form method="GET" action="{{ route('manager.stats.index') }}" class="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <input type="hidden" name="period" value="custom">
                    <div>
                        <label for="date" class="mb-1 block text-[11px] text-gray-500">Pilih tanggal</label>
                        <input type="date" id="date" name="date"
                               value="{{ $period === 'custom' ? $start->toDateString() : '' }}"
                               class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44">
                    </div>
                    <button type="submit"
                            class="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                        <i class="fas fa-calendar-day mr-2"></i> Tampilkan
                    </button>
                </form>
            </div>
        </div>
    </section>

    <div class="stat-grid">
        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <p class="text-sm text-gray-500">Pendapatan</p>
            <div class="mt-2">
                @include('partials.stat-number', ['value' => $totalRevenue, 'prefix' => 'Rp '])
            </div>
            <p class="mt-2 text-xs text-gray-500">Order paid pada periode ini</p>
        </div>

        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <p class="text-sm text-gray-500">Tiket terjual</p>
            <div class="mt-2">
                @include('partials.stat-number', ['value' => $ticketsSold])
            </div>
            <p class="mt-2 text-xs text-gray-500">Seluruh tiket pada order paid</p>
        </div>

        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <p class="text-sm text-gray-500">Jumlah order</p>
            <div class="mt-2">
                @include('partials.stat-number', ['value' => $ordersCount])
            </div>
            <p class="mt-2 text-xs text-gray-500">Transaksi berhasil dibayar</p>
        </div>

        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <p class="text-sm text-gray-500">Online vs offline</p>
            <div class="mt-3 grid grid-cols-2 gap-3">
                <div class="min-w-0 rounded-lg border border-gray-700/60 bg-[#171F2A] p-2.5">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-blue-400">Online</p>
                    <p class="mt-1 text-xs text-gray-400">{{ number_format($onlineOrders, 0, ',', '.') }} order</p>
                    <div class="mt-1">
                        @include('partials.stat-number', ['value' => $onlineRevenue, 'prefix' => 'Rp ', 'class' => 'is-sm'])
                    </div>
                </div>
                <div class="min-w-0 rounded-lg border border-gray-700/60 bg-[#171F2A] p-2.5">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-green-400">Offline</p>
                    <p class="mt-1 text-xs text-gray-400">{{ number_format($offlineOrders, 0, ',', '.') }} order</p>
                    <div class="mt-1">
                        @include('partials.stat-number', ['value' => $offlineRevenue, 'prefix' => 'Rp ', 'class' => 'is-sm'])
                    </div>
                </div>
            </div>
        </div>

        <div class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <p class="text-sm text-gray-500">Rata-rata keterisian</p>
            <div class="mt-2">
                @include('partials.stat-number', ['value' => $occupancy, 'suffix' => '%', 'decimals' => 1])
            </div>
            <p class="mt-2 text-xs text-gray-500">Kursi terjual / total kursi jadwal</p>
        </div>
    </div>

    <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                    <i class="fas fa-chart-column text-blue-400"></i>
                    Pendapatan per hari
                </h3>
                <p class="mt-1 text-xs text-gray-500">Online dan offline untuk periode {{ $periodLabel }}.</p>
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-blue-500"></span> Online</span>
                <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-green-500"></span> Offline</span>
            </div>
        </div>

        @if($totalRevenue === 0)
            <div class="mt-6 flex h-[230px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-700/60 text-center">
                <i class="fas fa-chart-simple text-3xl text-gray-600"></i>
                <p class="mt-3 text-sm font-medium text-gray-400">Belum ada pendapatan</p>
                <p class="mt-1 text-xs text-gray-500">Data akan muncul setelah ada order yang dibayar.</p>
            </div>
        @else
            <div class="stats-chart-scroll mt-6">
                <div class="mv-dash-chart" style="min-width: {{ $trendMinWidth }}px;">
                    <div class="mv-dash-chart-grid"></div>
                    @foreach($trendDays as $day)
                        @php
                            $barHeight = $day['total'] > 0 ? max(4, (int) round(($day['total'] / $revenueTrend['max']) * 100)) : 2;
                            $offlineShare = $day['total'] > 0 ? (int) round(($day['offline'] / $day['total']) * 100) : 0;
                            $onlineShare = $day['total'] > 0 ? 100 - $offlineShare : 0;
                        @endphp
                        <div class="mv-dash-chart-col">
                            <div class="mv-dash-chart-barwrap">
                                <div class="mv-dash-chart-bar chart-tip"
                                     tabindex="0"
                                     data-chart-tip="{{ $day['full_label'] }} · Total Rp {{ number_format($day['total'], 0, ',', '.') }} · Online Rp {{ number_format($day['online'], 0, ',', '.') }} · Offline Rp {{ number_format($day['offline'], 0, ',', '.') }}"
                                     style="height: {{ $barHeight }}%;"
                                     title="{{ $day['full_label'] }} · Online Rp {{ number_format($day['online'], 0, ',', '.') }} · Offline Rp {{ number_format($day['offline'], 0, ',', '.') }}">
                                    @if($day['total'] === 0)
                                        <span class="mv-dash-chart-zero h-full w-full"></span>
                                    @else
                                        <span class="mv-dash-chart-offline" style="height: {{ $offlineShare }}%;"></span>
                                        <span class="mv-dash-chart-online" style="height: {{ $onlineShare }}%;"></span>
                                    @endif
                                </div>
                            </div>
                            <span class="mv-dash-chart-label">{{ $day['label'] }}</span>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    </section>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg xl:col-span-2">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-clock text-blue-400"></i>
                Jam teramai
            </h3>
            <p class="mt-1 text-xs text-gray-500">Jumlah tiket berdasarkan jam pembelian.</p>

            @if($ticketsSold === 0)
                <div class="mt-6 flex h-[230px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-700/60 text-center">
                    <i class="fas fa-clock text-3xl text-gray-600"></i>
                    <p class="mt-3 text-sm font-medium text-gray-400">Belum ada tiket terjual</p>
                    <p class="mt-1 text-xs text-gray-500">Grafik jam teramai akan muncul di sini.</p>
                </div>
            @else
                <div class="stats-chart-scroll mt-6">
                    <div class="mv-dash-chart" style="min-width: {{ $peakMinWidth }}px;">
                        <div class="mv-dash-chart-grid"></div>
                        @foreach($peakHours['hours'] as $hour)
                            @php $barHeight = $hour['tickets'] > 0 ? max(4, (int) round(($hour['tickets'] / $peakHours['max']) * 100)) : 2; @endphp
                            <div class="mv-dash-chart-col">
                                <div class="mv-dash-chart-barwrap">
                                    <div class="mv-dash-chart-bar chart-tip"
                                         tabindex="0"
                                         data-chart-tip="Pukul {{ $hour['label'] }} · {{ number_format($hour['tickets'], 0, ',', '.') }} tiket"
                                         style="height: {{ $barHeight }}%;"
                                         title="Pukul {{ $hour['label'] }} · {{ number_format($hour['tickets'], 0, ',', '.') }} tiket">
                                        <span class="{{ $hour['tickets'] > 0 ? 'mv-dash-chart-online' : 'mv-dash-chart-zero' }} h-full w-full"></span>
                                    </div>
                                </div>
                                <span class="mv-dash-chart-label">{{ $hour['label'] }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </section>

        <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-credit-card text-blue-400"></i>
                Metode pembayaran
            </h3>
            <p class="mt-1 text-xs text-gray-500">Komposisi order pada periode ini.</p>

            @if($ordersCount === 0)
                <div class="mt-6 flex flex-col items-center justify-center py-10 text-center">
                    <i class="fas fa-receipt text-3xl text-gray-600"></i>
                    <p class="mt-3 text-sm font-medium text-gray-400">Belum ada order</p>
                </div>
            @else
                <div class="mt-5 space-y-4">
                    @foreach($paymentBreakdown as $payment)
                        @if($payment['key'] !== 'other' || $payment['orders'] > 0)
                            <div class="chart-tip"
                                 tabindex="0"
                                 data-chart-tip="{{ $payment['label'] }} · {{ number_format($payment['orders'], 0, ',', '.') }} order · {{ number_format($payment['percentage'], 1, ',', '.') }}% · Rp {{ number_format($payment['revenue'], 0, ',', '.') }}">
                                <div class="flex items-center justify-between gap-3 text-sm">
                                    <span class="text-gray-300">{{ $payment['label'] }}</span>
                                    <span class="font-semibold text-white">{{ number_format($payment['orders'], 0, ',', '.') }} order</span>
                                </div>
                                <div class="mt-2 flex items-center gap-3">
                                    <div class="mv-dash-progress flex-1">
                                        <span style="width: {{ $payment['percentage'] }}%;"></span>
                                    </div>
                                    <span class="w-12 text-right text-xs text-gray-500">{{ number_format($payment['percentage'], 1, ',', '.') }}%</span>
                                </div>
                                <p class="mt-1 text-[11px] text-gray-500">Rp {{ number_format($payment['revenue'], 0, ',', '.') }}</p>
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
        </section>
    </div>

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-fire text-blue-400"></i>
                Film paling banyak dibeli
            </h3>
            <p class="mt-1 text-xs text-gray-500">Top 5 berdasarkan tiket terjual.</p>
        </div>

        @if($topFilms->isEmpty())
            <div class="flex flex-col items-center justify-center px-5 py-12 text-center">
                <i class="fas fa-film text-3xl text-gray-600"></i>
                <p class="mt-3 text-sm font-medium text-gray-400">Belum ada film terjual</p>
                <p class="mt-1 text-xs text-gray-500">Data film akan muncul setelah ada order paid.</p>
            </div>
        @else
            <div class="overflow-x-auto">
                <table class="mv-table min-w-[520px]">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="w-16 text-left font-semibold text-gray-500">Rank</th>
                            <th class="text-left font-semibold text-gray-500">Film</th>
                            <th class="text-right font-semibold text-gray-500">Tiket</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach($topFilms as $index => $film)
                            <tr class="chart-tip"
                                tabindex="0"
                                data-chart-tip="{{ $film->title }} · {{ number_format($film->tickets_sold, 0, ',', '.') }} tiket · Rp {{ number_format($film->revenue ?? 0, 0, ',', '.') }}">
                                <td class="font-semibold text-blue-400">#{{ $index + 1 }}</td>
                                <td>
                                    <p class="font-medium text-white">{{ $film->title }}</p>
                                    <div class="mv-dash-progress mt-2 max-w-xs">
                                        <span style="width: {{ max(4, (int) round(($film->tickets_sold / $filmMax) * 100)) }}%;"></span>
                                    </div>
                                </td>
                                <td class="text-right text-gray-300">{{ number_format($film->tickets_sold, 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>
</div>
@endsection
