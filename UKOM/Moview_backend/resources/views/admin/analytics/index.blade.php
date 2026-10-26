@extends('layouts.admin')

@section('title', 'Analitik & Laporan')
@section('page-title', 'Analitik & Laporan')
@section('page-subtitle', 'Statistik aplikasi, penjualan tiket, dan tren sosial')

@section('content')
@php
    $periodLabels = ['today' => 'Hari ini', '7d' => '7 hari', '30d' => '30 hari', 'custom' => 'Kustom'];
    $rangeLabel = $period === 'today'
        ? $periodStart->translatedFormat('d M Y')
        : $periodStart->translatedFormat('d M Y') . ' – ' . $periodEnd->translatedFormat('d M Y');

    $changeIcon = fn (?float $value) => $value === null ? 'fa-minus' : ($value >= 0 ? 'fa-arrow-up' : 'fa-arrow-down');
    $changeText = fn (?float $value) => $value === null ? '—' : (($value >= 0 ? '+' : '') . number_format($value, 1) . '%');

    $revenueMax = 0;
    foreach ($revenueOverTime as $day) {
        $revenueMax = max($revenueMax, $day['online'] + $day['offline']);
    }
    $revenueMax = $revenueMax > 0 ? $revenueMax : 1;

    // Social line chart geometry (fixed viewBox so the SVG scales cleanly).
    $chartW = 700; $chartH = 220; $pad = 28;
    $socialDays = $socialTrend['days'];
    $socialMax = 1;
    foreach ($socialDays as $d) {
        $socialMax = max($socialMax, $d['reviews'], $d['logs'], $d['likes']);
    }
    $pointCount = count($socialDays);
    $xAt = function (int $i) use ($chartW, $pad, $pointCount) {
        if ($pointCount <= 1) return $chartW / 2;
        return $pad + ($i * ($chartW - 2 * $pad) / ($pointCount - 1));
    };
    $yAt = function (int $value) use ($chartH, $pad, $socialMax) {
        return $chartH - $pad - (($value / $socialMax) * ($chartH - 2 * $pad));
    };
    $reviewPoints = [];
    $logPoints = [];
    $likePoints = [];
    foreach ($socialDays as $i => $d) {
        $reviewPoints[] = round($xAt($i), 2) . ',' . round($yAt($d['reviews']), 2);
        $logPoints[] = round($xAt($i), 2) . ',' . round($yAt($d['logs']), 2);
        $likePoints[] = round($xAt($i), 2) . ',' . round($yAt($d['likes']), 2);
    }
    $socialFirstLabel = $socialDays[0]['label'] ?? '';
    $socialLastLabel = $socialDays ? $socialDays[count($socialDays) - 1]['label'] : '';
@endphp

<!-- Period filter -->
<form method="GET" action="{{ route('admin.analytics.index') }}"
      class="mb-6 bg-white rounded-lg shadow p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm font-semibold text-gray-600 mr-1">
            <i class="fas fa-calendar-day mr-1"></i> Periode
        </span>
        @foreach($periodLabels as $key => $label)
            @if($key !== 'custom')
                <a href="{{ route('admin.analytics.index', ['period' => $key]) }}"
                   class="px-4 py-2 rounded-lg text-sm font-medium transition
                          {{ $period === $key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                    {{ $label }}
                </a>
            @endif
        @endforeach
        <span class="text-xs text-gray-500 ml-1">{{ $rangeLabel }}</span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
        <input type="hidden" name="period" value="custom">
        <input type="date" name="start" value="{{ $periodStart->toDateString() }}"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700">
        <span class="text-gray-400">–</span>
        <input type="date" name="end" value="{{ $periodEnd->toDateString() }}"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700">
        <button type="submit"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-900">
            Terapkan
        </button>
        <a href="{{ route('admin.analytics.export', request()->only(['period', 'start', 'end'])) }}"
           class="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 inline-flex items-center">
            <i class="fas fa-file-csv mr-2"></i> Ekspor CSV
        </a>
    </div>
</form>

<!-- Ticket sales cards -->
<div class="stat-grid mb-6">
    <div class="mv-stat-card bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-indigo-100 text-sm mb-1">Pendapatan</p>
                @include('partials.stat-number', ['value' => $ticketStats['revenue'], 'prefix' => 'Rp ', 'class' => 'is-lg'])
                <p class="text-indigo-100 text-sm mt-2">
                    <i class="fas {{ $changeIcon($ticketStats['revenue_change']) }} mr-1"></i>
                    {{ $changeText($ticketStats['revenue_change']) }} vs periode sebelumnya
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-money-bill-wave text-3xl"></i>
            </div>
        </div>
    </div>

    <div class="mv-stat-card bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-teal-100 text-sm mb-1">Tiket Terjual</p>
                @include('partials.stat-number', ['value' => $ticketStats['tickets'], 'class' => 'is-lg'])
                <p class="text-teal-100 text-sm mt-2">
                    <i class="fas {{ $changeIcon($ticketStats['tickets_change']) }} mr-1"></i>
                    {{ $changeText($ticketStats['tickets_change']) }} vs periode sebelumnya
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-ticket-alt text-3xl"></i>
            </div>
        </div>
    </div>

    <div class="mv-stat-card bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-orange-100 text-sm mb-1">Jumlah Order</p>
                @include('partials.stat-number', ['value' => $ticketStats['orders'], 'class' => 'is-lg'])
                <p class="text-orange-100 text-sm mt-2">
                    <i class="fas {{ $changeIcon($ticketStats['orders_change']) }} mr-1"></i>
                    {{ $changeText($ticketStats['orders_change']) }} vs periode sebelumnya
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-receipt text-3xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Revenue per day (online vs offline) -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 class="text-lg font-bold flex items-center">
            <i class="fas fa-chart-column text-indigo-600 mr-2"></i>
            Pendapatan per Hari
        </h3>
        <div class="flex items-center gap-4 text-xs text-gray-600">
            <span class="inline-flex items-center"><span class="w-3 h-3 rounded-sm bg-blue-500 mr-1"></span> Online</span>
            <span class="inline-flex items-center"><span class="w-3 h-3 rounded-sm bg-emerald-500 mr-1"></span> Offline</span>
        </div>
    </div>

    @if($ticketStats['revenue'] <= 0)
        <div class="text-center text-gray-400 py-12">
            <i class="fas fa-chart-simple text-4xl mb-2"></i>
            <p class="text-sm">Belum ada penjualan pada periode ini.</p>
        </div>
    @else
        <div class="h-72 flex items-end justify-between gap-1 overflow-x-auto pb-6">
            @foreach($revenueOverTime as $day)
                @php
                    $total = $day['online'] + $day['offline'];
                    $onlinePct = ($day['online'] / $revenueMax) * 90;
                    $offlinePct = ($day['offline'] / $revenueMax) * 90;
                    $tip = $day['label'] . ' • Online Rp ' . number_format($day['online'], 0, ',', '.')
                        . ' • Offline Rp ' . number_format($day['offline'], 0, ',', '.');
                @endphp
                <div class="flex-1 min-w-[18px] flex flex-col items-center justify-end h-full"
                     data-chart-tip="{{ $tip }}" tabindex="0">
                    <div class="w-full flex flex-col justify-end" style="height: 100%;">
                        <div class="w-full bg-emerald-500 rounded-t-sm {{ $offlinePct > 0 ? '' : 'opacity-0' }}"
                             style="height: {{ max($offlinePct, 0) }}%;"></div>
                        <div class="w-full bg-blue-500 {{ $onlinePct > 0 ? '' : 'opacity-0' }} {{ $offlinePct > 0 ? '' : 'rounded-t-sm' }}"
                             style="height: {{ max($onlinePct, 0) }}%;"></div>
                    </div>
                    <p class="text-[10px] text-gray-600 mt-2 whitespace-nowrap">{{ $day['label'] }}</p>
                </div>
            @endforeach
        </div>
    @endif
</div>

<!-- Cinema ranking -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-bold mb-4 flex items-center">
        <i class="fas fa-ranking-star text-amber-600 mr-2"></i>
        Peringkat Bioskop
    </h3>

    @if(empty($cinemaRanking))
        <div class="text-center text-gray-400 py-10">
            <i class="fas fa-building text-4xl mb-2"></i>
            <p class="text-sm">Belum ada penjualan bioskop pada periode ini.</p>
        </div>
    @else
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm" id="cinema-ranking-table">
                <thead>
                    <tr class="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                        <th class="py-2 pr-4">Bioskop</th>
                        <th class="py-2 px-4 text-right cursor-pointer select-none hover:text-gray-800"
                            data-sort="revenue">Pendapatan <i class="fas fa-sort text-gray-300 ml-1"></i></th>
                        <th class="py-2 px-4 text-right cursor-pointer select-none hover:text-gray-800"
                            data-sort="tickets">Tiket Terjual <i class="fas fa-sort text-gray-300 ml-1"></i></th>
                        <th class="py-2 pl-4 text-right cursor-pointer select-none hover:text-gray-800"
                            data-sort="occupancy">Rata-rata Keterisian <i class="fas fa-sort text-gray-300 ml-1"></i></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($cinemaRanking as $cinema)
                        <tr class="border-b border-gray-100 hover:bg-gray-50"
                            data-revenue="{{ $cinema['revenue'] }}"
                            data-tickets="{{ $cinema['tickets'] }}"
                            data-occupancy="{{ $cinema['occupancy'] }}">
                            <td class="py-3 pr-4 font-medium text-gray-800">{{ $cinema['cinema_name'] }}</td>
                            <td class="py-3 px-4 text-right">Rp {{ number_format($cinema['revenue'], 0, ',', '.') }}</td>
                            <td class="py-3 px-4 text-right">{{ number_format($cinema['tickets'], 0, ',', '.') }}</td>
                            <td class="py-3 pl-4 text-right">{{ number_format($cinema['occupancy'], 1) }}%</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>

<!-- Films by tickets -->
@php $showWeekRanking = $period !== '7d'; @endphp
<div class="grid grid-cols-1 {{ $showWeekRanking ? 'lg:grid-cols-2' : '' }} gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-1 flex items-center">
            <i class="fas fa-ticket text-blue-600 mr-2"></i>
            Film Terlaris
        </h3>
        <p class="text-xs text-gray-500 mb-4">Berdasarkan tiket · {{ $rangeLabel }}</p>
        <div class="space-y-3">
            @forelse($topFilmsByTickets as $index => $film)
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {{ $index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate">{{ $film['title'] }}</p>
                        <p class="text-xs text-gray-500">{{ number_format($film['tickets'], 0, ',', '.') }} tiket</p>
                    </div>
                </div>
            @empty
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-film text-4xl mb-2"></i>
                    <p class="text-sm">Belum ada tiket terjual pada periode ini.</p>
                </div>
            @endforelse
        </div>
    </div>

    @if($showWeekRanking)
    {{-- Hidden on the default 7-day period: it would list exactly the same films as above. --}}
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-1 flex items-center">
            <i class="fas fa-calendar-week text-emerald-600 mr-2"></i>
            Peringkat Film Bioskop 7 Hari
        </h3>
        <p class="text-xs text-gray-500 mb-4">Berdasarkan tiket · 7 hari terakhir</p>
        <div class="space-y-3">
            @forelse($topFilmsLastWeek as $index => $film)
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {{ $index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate">{{ $film['title'] }}</p>
                        <p class="text-xs text-gray-500">{{ number_format($film['tickets'], 0, ',', '.') }} tiket</p>
                    </div>
                </div>
            @empty
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-film text-4xl mb-2"></i>
                    <p class="text-sm">Belum ada tiket terjual dalam 7 hari terakhir.</p>
                </div>
            @endforelse
        </div>
    </div>
    @endif
</div>

<!-- Social trends -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 class="text-lg font-bold flex items-center">
            <i class="fas fa-heart text-pink-600 mr-2"></i>
            Tren Sosial
        </h3>
        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <span class="inline-flex items-center"><span class="w-3 h-3 rounded-sm bg-purple-500 mr-1"></span> Ulasan</span>
            <span class="inline-flex items-center"><span class="w-3 h-3 rounded-sm bg-sky-500 mr-1"></span> Log Entry</span>
            <span class="inline-flex items-center"><span class="w-3 h-3 rounded-sm bg-pink-500 mr-1"></span> Like</span>
            <span class="inline-flex items-center">
                Rata-rata rating:
                <strong class="ml-1 text-gray-800">
                    {{ $socialTrend['average_rating'] !== null ? number_format($socialTrend['average_rating'], 2) : '—' }}
                </strong>
            </span>
        </div>
    </div>

    @if(!empty($socialTrend['fallback']))
        <p class="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <i class="fas fa-circle-info mr-1"></i>
            Tidak ada ulasan atau like pada periode terpilih. Menampilkan
            <strong>{{ $socialTrend['fallback_label'] }}</strong>.
        </p>
    @endif

    @if($socialTrend['total_reviews'] === 0 && $socialTrend['total_likes'] === 0 && $socialTrend['total_logs'] === 0)
        <div class="text-center text-gray-400 py-12">
            <i class="fas fa-chart-line text-4xl mb-2"></i>
            <p class="text-sm">Belum ada aktivitas ulasan atau like pada periode ini.</p>
        </div>
    @else
        <div class="overflow-x-auto">
            <svg viewBox="0 0 {{ $chartW }} {{ $chartH }}" class="w-full" style="min-width: 520px; height: 220px;"
                 role="img" aria-label="Grafik ulasan dan like per hari">
                <line x1="{{ $pad }}" y1="{{ $chartH - $pad }}" x2="{{ $chartW - $pad }}" y2="{{ $chartH - $pad }}"
                      stroke="#E5E7EB" stroke-width="1" />
                <polyline fill="none" stroke="#A855F7" stroke-width="2.5" stroke-linejoin="round"
                          points="{{ implode(' ', $reviewPoints) }}" />
                <polyline fill="none" stroke="#0EA5E9" stroke-width="2.5" stroke-linejoin="round"
                          points="{{ implode(' ', $logPoints) }}" />
                <polyline fill="none" stroke="#EC4899" stroke-width="2.5" stroke-linejoin="round"
                          points="{{ implode(' ', $likePoints) }}" />
                @foreach($socialDays as $i => $day)
                    <circle cx="{{ round($xAt($i), 2) }}" cy="{{ round($yAt($day['reviews']), 2) }}" r="3.5"
                            fill="#A855F7" data-chart-tip="{{ $day['label'] }} • {{ $day['reviews'] }} ulasan" tabindex="0" />
                    <circle cx="{{ round($xAt($i), 2) }}" cy="{{ round($yAt($day['logs']), 2) }}" r="3.5"
                            fill="#0EA5E9" data-chart-tip="{{ $day['label'] }} • {{ $day['logs'] }} log entry" tabindex="0" />
                    <circle cx="{{ round($xAt($i), 2) }}" cy="{{ round($yAt($day['likes']), 2) }}" r="3.5"
                            fill="#EC4899" data-chart-tip="{{ $day['label'] }} • {{ $day['likes'] }} like" tabindex="0" />
                @endforeach
            </svg>
        </div>
        <div class="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
            <span>{{ $socialFirstLabel }}</span>
            <span>{{ $socialLastLabel }}</span>
        </div>
    @endif
</div>

<!-- Existing key metrics -->
<div class="stat-grid mb-6">
    <div class="mv-stat-card bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-blue-100 text-sm mb-1">Total Tayangan</p>
                @include('partials.stat-number', ['value' => $totalViews, 'class' => 'is-lg'])
                <p class="text-blue-100 text-sm mt-2">
                    @if($viewsChange >= 0)
                        <i class="fas fa-arrow-up mr-1"></i>
                        +{{ number_format($viewsChange, 1) }}% dari bulan lalu
                    @else
                        <i class="fas fa-arrow-down mr-1"></i>
                        {{ number_format($viewsChange, 1) }}% dari bulan lalu
                    @endif
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-eye text-3xl"></i>
            </div>
        </div>
    </div>

    <div class="mv-stat-card bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-green-100 text-sm mb-1">Pengguna Aktif</p>
                @include('partials.stat-number', ['value' => $activeUsers, 'class' => 'is-lg'])
                <p class="text-green-100 text-sm mt-2">
                    <i class="fas fa-check-circle mr-1"></i>
                    Total pengguna terdaftar
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-users text-3xl"></i>
            </div>
        </div>
    </div>

    <div class="mv-stat-card bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-purple-100 text-sm mb-1">Ulasan Dipublikasikan</p>
                @include('partials.stat-number', ['value' => $reviewsPosted, 'class' => 'is-lg'])
                <p class="text-purple-100 text-sm mt-2">
                    @if($reviewsChange >= 0)
                        <i class="fas fa-arrow-up mr-1"></i>
                        +{{ number_format($reviewsChange, 1) }}% dari bulan lalu
                    @else
                        <i class="fas fa-arrow-down mr-1"></i>
                        {{ number_format($reviewsChange, 1) }}% dari bulan lalu
                    @endif
                </p>
            </div>
            <div class="bg-white bg-opacity-20 p-4 rounded-full">
                <i class="fas fa-comment text-3xl"></i>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Views chart (existing) -->
    <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-line text-blue-600 mr-2"></i>
            Tayangan 7 Hari Terakhir
        </h3>
        <div class="h-80">
            @php
                $counts = array_column($viewsOverTime, 'count');
                $maxCount = max($counts);
                if ($maxCount == 0) $maxCount = 1;
            @endphp
            <div class="h-full flex items-end justify-between space-x-2 pb-6">
                @foreach($viewsOverTime as $day)
                @php
                    if ($day['count'] == 0) {
                        $heightPercent = 2;
                        $opacity = 'opacity-20';
                    } else {
                        $heightPercent = ($day['count'] / $maxCount) * 90;
                        $opacity = '';
                    }
                @endphp
                <div class="flex-1 flex flex-col items-center justify-end" style="height: 100%;">
                    <div class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all duration-200 relative group {{ $opacity }}"
                         style="height: {{ $heightPercent }}%;">
                        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {{ $day['count'] }} {{ $day['count'] == 1 ? 'tayangan' : 'tayangan' }}
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-2">{{ $day['date'] }}</p>
                </div>
                @endforeach
            </div>
        </div>
    </div>

    <!-- Top films this week (existing) -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-fire text-orange-600 mr-2"></i>
            Film Teratas Minggu Ini
        </h3>
        <div class="space-y-4">
            @forelse($topFilms as $index => $film)
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {{ $index + 1 }}
                </div>
                <div class="flex-1">
                    <p class="font-medium text-sm">{{ $film->title }}</p>
                    <p class="text-xs text-gray-500">{{ $film->view_count }} tayangan</p>
                </div>
                <span class="text-xs font-semibold {{ $film->change >= 0 ? 'text-green-600' : 'text-red-600' }}">
                    {{ $film->change >= 0 ? '+' : '' }}{{ number_format($film->change, 0) }}%
                </span>
            </div>
            @empty
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-film text-4xl mb-2"></i>
                <p class="text-sm">Belum ada film yang ditonton minggu ini</p>
            </div>
            @endforelse
        </div>
    </div>
</div>

<!-- Recent activity (existing) -->
<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center">
        <i class="fas fa-history text-indigo-600 mr-2"></i>
        Aktivitas Terbaru
    </h3>
    <div class="space-y-3">
        @forelse($recentActivities as $activity)
        @php
            $styles = [
                'follow'         => ['icon' => 'fa-user-plus',  'color' => 'blue'],
                'like_review'    => ['icon' => 'fa-heart',      'color' => 'pink'],
                'comment_review' => ['icon' => 'fa-comment',    'color' => 'cyan'],
                'reply_comment'  => ['icon' => 'fa-reply',      'color' => 'teal'],
                'watched'        => ['icon' => 'fa-eye',        'color' => 'green'],
                'logged'         => ['icon' => 'fa-book',       'color' => 'purple'],
                'reviewed'       => ['icon' => 'fa-star',       'color' => 'yellow'],
                'watchlist'      => ['icon' => 'fa-bookmark',   'color' => 'orange'],
            ];
            $style = $styles[$activity->type] ?? ['icon' => 'fa-circle', 'color' => 'gray'];
        @endphp
        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-gradient-to-br from-{{ $style['color'] }}-400 to-{{ $style['color'] }}-600 rounded-full flex items-center justify-center text-white">
                <i class="fas {{ $style['icon'] }}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm">
                    <span class="font-medium">{{ $activity->user_name }}</span>
                    <span class="text-gray-600">{{ $activity->description }}</span>
                </p>
                <p class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($activity->created_at)->diffForHumans() }}</p>
            </div>
        </div>
        @empty
        <div class="text-center text-gray-400 py-8">
            <i class="fas fa-history text-4xl mb-2"></i>
            <p class="text-sm">Belum ada aktivitas terbaru</p>
        </div>
        @endforelse
    </div>
</div>

<!-- Export options (existing) -->
<div class="mt-6 bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-download text-blue-600 mr-2"></i>
        Ekspor Laporan
    </h3>
    <div class="flex flex-wrap gap-3">
        <button class="bg-gray-200 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed" disabled title="Belum tersedia">
            <i class="fas fa-file-pdf mr-2"></i>
            Ekspor PDF
        </button>
        <button class="bg-gray-200 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed" disabled title="Belum tersedia">
            <i class="fas fa-file-excel mr-2"></i>
            Ekspor Excel
        </button>
        <a href="{{ route('admin.analytics.export', request()->only(['period', 'start', 'end'])) }}"
           class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center">
            <i class="fas fa-file-csv mr-2"></i>
            Ekspor CSV
        </a>
        <button class="bg-gray-200 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed" disabled title="Belum tersedia">
            <i class="fas fa-calendar mr-2"></i>
            Jadwalkan Laporan
        </button>
    </div>
    <p class="text-xs text-gray-500 mt-3">
        CSV berisi laporan penjualan periode {{ $rangeLabel }} (UTF-8 + BOM, siap dibuka di Excel).
    </p>
</div>
@endsection

@push('scripts')
<script>
(function () {
    const table = document.getElementById('cinema-ranking-table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('th[data-sort]');
    let currentKey = 'revenue';
    let ascending = false;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    const apply = () => {
        const sorted = rows.slice().sort((a, b) => {
            const av = parseFloat(a.dataset[currentKey] || '0');
            const bv = parseFloat(b.dataset[currentKey] || '0');
            return ascending ? av - bv : bv - av;
        });
        sorted.forEach(row => tbody.appendChild(row));

        headers.forEach(th => {
            const icon = th.querySelector('i');
            if (!icon) return;
            icon.className = th.dataset.sort === currentKey
                ? 'fas fa-sort-' + (ascending ? 'up' : 'down') + ' ml-1 text-gray-700'
                : 'fas fa-sort text-gray-300 ml-1';
        });
    };

    headers.forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (currentKey === key) {
                ascending = !ascending;
            } else {
                currentKey = key;
                ascending = false;
            }
            apply();
        });
    });

    apply();
})();
</script>
@endpush
