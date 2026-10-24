@extends('layouts.admin')

@section('title', 'Detail Statistik Staff')
@section('page-title', 'Detail Statistik Staff')
@section('page-subtitle', $staff->username . ' · ' . session('admin_cinema_name', 'Bioskop Anda'))

@section('content')
@php
    $backUrl = route('manager.staff-stats.index', request()->query());
    $dailyMinWidth = max(160, $dailyTickets['days']->count() * 42);
@endphp

<div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <a href="{{ $backUrl }}"
           class="inline-flex min-h-[40px] items-center text-sm text-gray-500 transition hover:text-gray-800">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Statistik Staff
        </a>

        <div class="flex flex-wrap gap-2">
            <a href="{{ route('manager.staff-stats.show', array_merge(['staff' => $staff->id, 'period' => 'today'])) }}"
               class="inline-flex min-h-[36px] items-center rounded-lg border px-3 py-1.5 text-xs font-semibold {{ $period === 'today' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                Hari ini
            </a>
            <a href="{{ route('manager.staff-stats.show', array_merge(['staff' => $staff->id, 'period' => '7'])) }}"
               class="inline-flex min-h-[36px] items-center rounded-lg border px-3 py-1.5 text-xs font-semibold {{ $period === '7' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                7 hari
            </a>
            <a href="{{ route('manager.staff-stats.show', array_merge(['staff' => $staff->id, 'period' => '30'])) }}"
               class="inline-flex min-h-[36px] items-center rounded-lg border px-3 py-1.5 text-xs font-semibold {{ $period === '30' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                30 hari
            </a>
        </div>
    </div>

    <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Ringkasan</p>
        <h2 class="mt-1 text-2xl font-bold text-white">{{ $staff->username }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ $staff->email ?? '-' }}</p>
        <p class="mt-2 text-xs text-gray-500">Periode {{ $periodLabel }}</p>

        <div class="stat-grid mt-5">
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Tiket terjual</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['tickets']])
                </div>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Jumlah order</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['orders']])
                </div>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Pendapatan</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['revenue'], 'prefix' => 'Rp '])
                </div>
                <p class="mt-1 text-[11px] text-gray-500">Tunai Rp {{ number_format($stats['cash_revenue'], 0, ',', '.') }}</p>
                <p class="text-[11px] text-gray-500">Non-tunai Rp {{ number_format($stats['non_cash_revenue'], 0, ',', '.') }}</p>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Tiket di-scan</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['scanned']])
                </div>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Hari hadir</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['attendance_days']])
                </div>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Total jam kerja</p>
                <div class="mt-2">
                    @include('partials.stat-number', ['value' => $stats['hours'], 'decimals' => 1, 'suffix' => ' jam'])
                </div>
            </div>
        </div>
    </section>

    <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg">
        <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
            <i class="fas fa-chart-column text-blue-400"></i>
            Tiket terjual per hari
        </h3>
        <p class="mt-1 text-xs text-gray-500">Periode {{ $periodLabel }}.</p>

        @if($stats['tickets'] === 0)
            <div class="mt-6 flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-700/60 text-center">
                <i class="fas fa-ticket text-3xl text-gray-600"></i>
                <p class="mt-3 text-sm font-medium text-gray-400">Belum ada tiket terjual</p>
                <p class="mt-1 text-xs text-gray-500">Grafik akan muncul setelah ada order paid.</p>
            </div>
        @else
            <div class="mt-6 overflow-x-auto pb-1">
                <div class="mv-dash-chart" style="min-width: {{ $dailyMinWidth }}px;">
                    <div class="mv-dash-chart-grid"></div>
                    @foreach($dailyTickets['days'] as $day)
                        @php
                            $barHeight = $day['tickets'] > 0
                                ? max(4, (int) round(($day['tickets'] / $dailyTickets['max']) * 100))
                                : 2;
                        @endphp
                        <div class="mv-dash-chart-col">
                            <div class="mv-dash-chart-barwrap">
                                <div class="mv-dash-chart-bar chart-tip"
                                     tabindex="0"
                                     data-chart-tip="{{ $day['full_label'] }} · {{ number_format($day['tickets'], 0, ',', '.') }} tiket"
                                     style="height: {{ $barHeight }}%;"
                                     title="{{ $day['full_label'] }} · {{ number_format($day['tickets'], 0, ',', '.') }} tiket">
                                    <span class="{{ $day['tickets'] > 0 ? 'mv-dash-chart-online' : 'mv-dash-chart-zero' }} h-full w-full"></span>
                                </div>
                            </div>
                            <span class="mv-dash-chart-label">{{ $day['label'] }}</span>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    </section>

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-clipboard-user text-blue-400"></i>
                Riwayat absensi
            </h3>
            <p class="mt-1 text-xs text-gray-500">Periode {{ $periodLabel }}.</p>
        </div>

        @if($attendanceHistory->isEmpty())
            <div class="px-5 py-10 text-center text-sm text-gray-500">Belum ada riwayat absensi pada periode ini.</div>
        @else
            <div class="overflow-x-auto">
                <table class="mv-table min-w-[640px]">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left font-semibold text-gray-500">Tanggal</th>
                            <th class="text-left font-semibold text-gray-500">Jam Masuk</th>
                            <th class="text-left font-semibold text-gray-500">Jam Pulang</th>
                            <th class="text-left font-semibold text-gray-500">Durasi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach($attendanceHistory as $attendance)
                            @php
                                $duration = $attendance->durationMinutes();
                                $durationText = $duration === null
                                    ? '-'
                                    : intdiv($duration, 60) . ' jam ' . ($duration % 60) . ' menit';
                            @endphp
                            <tr>
                                <td class="text-gray-700">{{ $attendance->tanggal->locale('id')->isoFormat('ddd, D MMM Y') }}</td>
                                <td class="font-medium text-white">{{ $attendance->jam_masuk ? substr((string) $attendance->jam_masuk, 0, 5) : '-' }}</td>
                                <td class="{{ $attendance->jam_pulang ? 'text-gray-300' : 'text-yellow-400' }}">
                                    {{ $attendance->jam_pulang ? substr((string) $attendance->jam_pulang, 0, 5) : 'Belum pulang' }}
                                </td>
                                <td class="text-gray-300">{{ $durationText }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>
</div>
@endsection
