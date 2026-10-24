@extends('layouts.admin')

@section('title', 'Absensi')
@section('page-title', 'Absensi')
@section('page-subtitle', 'Simulasi absensi staff dan riwayat 7 hari terakhir')

@section('content')
@php
    $masuk = $attendance?->jam_masuk ? substr((string) $attendance->jam_masuk, 0, 5) : null;
    $pulang = $attendance?->jam_pulang ? substr((string) $attendance->jam_pulang, 0, 5) : null;
    $duration = $attendance?->durationMinutes();
    $durationText = $duration === null ? '-' : intdiv($duration, 60) . ' jam ' . ($duration % 60) . ' menit';
@endphp

<div class="space-y-6">
    @if(session('success'))
        <div class="flex items-center gap-2 rounded-lg border border-green-400/40 bg-green-100 px-4 py-3 text-sm text-green-800" role="alert">
            <i class="fas fa-circle-check"></i> {{ session('success') }}
        </div>
    @endif
    @if(session('error'))
        <div class="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">
            <i class="fas fa-circle-exclamation"></i> {{ session('error') }}
        </div>
    @endif

    <section class="rounded-xl border border-gray-700/60 bg-white p-5 shadow-lg sm:p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Status hari ini</p>
        <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 class="text-2xl font-bold text-white sm:text-3xl">
                    @if(!$attendance)
                        Belum absen
                    @elseif(!$pulang)
                        Bertugas sejak {{ $masuk }}
                    @else
                        Selesai, durasi {{ $durationText }}
                    @endif
                </h2>
                <p class="mt-1 text-sm text-gray-400">{{ $today->locale('id')->isoFormat('dddd, D MMMM Y') }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
                @if(!$attendance)
                    <form action="{{ route('staff.attendance.check-in') }}" method="POST">
                        @csrf
                        <button type="submit" class="inline-flex min-h-[40px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                            <i class="fas fa-right-to-bracket mr-2"></i> Absen Masuk
                        </button>
                    </form>
                @elseif(!$pulang)
                    <form action="{{ route('staff.attendance.check-out') }}" method="POST">
                        @csrf
                        <button type="submit" class="inline-flex min-h-[40px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                            <i class="fas fa-right-from-bracket mr-2"></i> Absen Pulang
                        </button>
                    </form>
                @else
                    <span class="inline-flex min-h-[40px] items-center rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400">
                        <i class="fas fa-check mr-2"></i> Absensi selesai
                    </span>
                @endif
            </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Jam masuk</p>
                <p class="mt-1 text-lg font-bold text-white">{{ $masuk ?? '-' }}</p>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Jam pulang</p>
                <p class="mt-1 text-lg font-bold text-white">{{ $pulang ?? '-' }}</p>
            </div>
            <div class="rounded-lg border border-gray-700/60 bg-[#171F2A] p-4">
                <p class="text-xs text-gray-500">Durasi kerja</p>
                <p class="mt-1 text-lg font-bold text-white">{{ $durationText }}</p>
            </div>
        </div>
    </section>

    <section class="rounded-xl border border-gray-700/60 bg-white shadow-lg">
        <div class="border-b border-gray-700/60 px-5 py-4">
            <h3 class="text-sm font-semibold text-white">Riwayat 7 hari terakhir</h3>
        </div>
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
                    @forelse($history as $row)
                        @php
                            $rowDuration = $row->durationMinutes();
                            $rowDurationText = $rowDuration === null ? '-' : intdiv($rowDuration, 60) . ' jam ' . ($rowDuration % 60) . ' menit';
                        @endphp
                        <tr>
                            <td class="text-gray-700">{{ $row->tanggal->locale('id')->isoFormat('ddd, D MMM Y') }}</td>
                            <td class="font-medium text-white">{{ $row->jam_masuk ? substr((string) $row->jam_masuk, 0, 5) : '-' }}</td>
                            <td class="text-gray-300">{{ $row->jam_pulang ? substr((string) $row->jam_pulang, 0, 5) : '-' }}</td>
                            <td class="text-gray-300">{{ $rowDurationText }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="py-10 text-center text-gray-500">Belum ada riwayat absensi.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
</div>
@endsection
