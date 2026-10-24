@extends('layouts.admin')

@section('title', 'Statistik Staff')
@section('page-title', 'Statistik Staff')
@section('page-subtitle', session('admin_cinema_name', 'Bioskop Anda'))

@section('content')
@php
    $sortLink = function (string $column) use ($sort, $direction) {
        $next = ($sort === $column && $direction === 'asc') ? 'desc' : 'asc';

        return route('manager.staff-stats.index', array_merge(request()->query(), [
            'sort' => $column,
            'dir' => $next,
        ]));
    };

    $arrow = function (string $column) use ($sort, $direction) {
        if ($sort !== $column) return 'fa-sort';
        return $direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    };
@endphp

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
                    <a href="{{ route('manager.staff-stats.index', ['period' => 'today']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === 'today' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        Hari ini
                    </a>
                    <a href="{{ route('manager.staff-stats.index', ['period' => '7']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === '7' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        7 hari
                    </a>
                    <a href="{{ route('manager.staff-stats.index', ['period' => '30']) }}"
                       class="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition {{ $period === '30' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' }}">
                        30 hari
                    </a>
                </div>

                <form method="GET" action="{{ route('manager.staff-stats.index') }}" class="flex flex-col gap-2 sm:flex-row sm:items-end">
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

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-user-check text-blue-400"></i>
                Kehadiran hari ini
            </h3>
            <p class="mt-1 text-xs text-gray-500">{{ $today->locale('id')->isoFormat('dddd, D MMMM Y') }}</p>
        </div>

        @if($rows->isEmpty())
            <div class="px-5 py-10 text-center text-sm text-gray-500">Belum ada akun staff di bioskop ini.</div>
        @else
            <div class="overflow-x-auto">
                <table class="mv-table min-w-[520px]">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left font-semibold text-gray-500">Staff</th>
                            <th class="text-left font-semibold text-gray-500">Status</th>
                            <th class="text-left font-semibold text-gray-500">Durasi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach($rows as $row)
                            <tr>
                                <td>
                                    <p class="font-medium text-white">{{ $row['name'] }}</p>
                                    <p class="text-xs text-gray-500">{{ $row['email'] ?? '-' }}</p>
                                </td>
                                <td>
                                    <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold {{ str_starts_with($row['today_status'], 'Belum') ? 'bg-yellow-100 text-yellow-800' : (str_starts_with($row['today_status'], 'Bertugas') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-800') }}">
                                        {{ $row['today_status'] }}
                                    </span>
                                </td>
                                <td class="text-gray-300">
                                    {{ $row['today_duration'] === null ? '-' : intdiv($row['today_duration'], 60) . ' jam ' . ($row['today_duration'] % 60) . ' menit' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg font-semibold text-white">
                <i class="fas fa-users-viewfinder text-blue-400"></i>
                Rekap staff
            </h3>
            <p class="mt-1 text-xs text-gray-500">Klik baris untuk melihat detail staff.</p>
        </div>

        @if($rows->isEmpty())
            <div class="px-5 py-10 text-center text-sm text-gray-500">Belum ada data staff.</div>
        @else
            <div class="overflow-x-auto">
                <table class="mv-table min-w-[980px]">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left font-semibold text-gray-500">
                                <a href="{{ $sortLink('name') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Nama <i class="fas {{ $arrow('name') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('tickets') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Tiket <i class="fas {{ $arrow('tickets') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('orders') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Order <i class="fas {{ $arrow('orders') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('revenue') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Pendapatan <i class="fas {{ $arrow('revenue') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('scanned') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Scan <i class="fas {{ $arrow('scanned') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('attendance_days') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Hadir <i class="fas {{ $arrow('attendance_days') }} text-[10px]"></i>
                                </a>
                            </th>
                            <th class="text-right font-semibold text-gray-500">
                                <a href="{{ $sortLink('hours') }}" class="inline-flex items-center gap-1 hover:text-white">
                                    Jam Kerja <i class="fas {{ $arrow('hours') }} text-[10px]"></i>
                                </a>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @foreach($rows as $row)
                            @php
                                $detailUrl = route('manager.staff-stats.show', array_merge(
                                    ['staff' => $row['staff_id']],
                                    request()->query()
                                ));
                            @endphp
                            <tr class="cursor-pointer transition hover:bg-gray-50"
                                tabindex="0"
                                onclick="window.location='{{ $detailUrl }}'"
                                onkeydown="if (event.key === 'Enter') window.location='{{ $detailUrl }}'">
                                <td>
                                    <p class="font-medium text-white">{{ $row['name'] }}</p>
                                    <p class="text-xs text-gray-500">{{ $row['email'] ?? '-' }}</p>
                                </td>
                                <td class="text-right font-semibold text-white">{{ number_format($row['tickets'], 0, ',', '.') }}</td>
                                <td class="text-right text-gray-300">{{ number_format($row['orders'], 0, ',', '.') }}</td>
                                <td class="text-right">
                                    <p class="font-semibold text-white">Rp {{ number_format($row['revenue'], 0, ',', '.') }}</p>
                                    <p class="text-[11px] text-gray-500">Tunai Rp {{ number_format($row['cash_revenue'], 0, ',', '.') }}</p>
                                    <p class="text-[11px] text-gray-500">Non-tunai Rp {{ number_format($row['non_cash_revenue'], 0, ',', '.') }}</p>
                                </td>
                                <td class="text-right text-gray-300">{{ number_format($row['scanned'], 0, ',', '.') }}</td>
                                <td class="text-right text-gray-300">{{ number_format($row['attendance_days'], 0, ',', '.') }} hari</td>
                                <td class="text-right font-semibold text-white">{{ number_format($row['hours'], 1, ',', '.') }} jam</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>
</div>
@endsection
