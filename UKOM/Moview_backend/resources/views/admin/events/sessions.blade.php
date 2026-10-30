@extends('layouts.admin')

@section('title', 'Kelola Sesi')
@section('page-title', 'Kelola Sesi — ' . $event->title)
@section('page-subtitle', 'Sesi festival berisi satu atau beberapa film')

@section('content')
@php
    $listReturn = \App\Support\ReturnUrl::current();

    // Date boxes: every date inside the event window (capped so a long event stays readable).
    $sessionDates = $sessions->groupBy(fn ($s) => $s->show_date->format('Y-m-d'));
    $dayCursor = $event->start_date->copy()->startOfDay();
    $lastDay = $event->end_date->copy()->startOfDay();
    $dateBoxes = [];
    while ($dayCursor->lte($lastDay) && count($dateBoxes) < 60) {
        $iso = $dayCursor->format('Y-m-d');
        $dateBoxes[] = [
            'iso' => $iso,
            'day' => strtoupper($dayCursor->translatedFormat('D')),
            'date' => $dayCursor->format('d'),
            'month' => $dayCursor->translatedFormat('M'),
            'count' => isset($sessionDates[$iso]) ? $sessionDates[$iso]->count() : 0,
        ];
        $dayCursor->addDay();
    }

    // Default selection: the first date that actually has a session.
    $defaultDate = null;
    foreach ($dateBoxes as $box) {
        if ($box['count'] > 0) { $defaultDate = $box['iso']; break; }
    }
    $defaultDate = $defaultDate ?? ($dateBoxes[0]['iso'] ?? $event->start_date->format('Y-m-d'));
@endphp

<div x-data="{ selectedDate: @js($defaultDate), counts: @js(collect($dateBoxes)->mapWithKeys(fn ($b) => [$b['iso'] => (int) $b['count']])->all()) }">

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <a href="{{ route($panelPrefix.'.events.index') }}" data-no-history
       class="inline-flex items-center text-sm text-gray-500 transition hover:text-gray-800">
        <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Event
    </a>
    <a :href="`{{ route($panelPrefix.'.events.sessions.create', $event->id) }}?date=${selectedDate}`"
       class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        <i class="fas fa-plus mr-2"></i> Tambah Sesi
    </a>
</div>

@if(session('success'))
    <div class="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">{{ session('success') }}</div>
@endif
@if(session('error'))
    <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{{ session('error') }}</div>
@endif

@if($event->banner)
    <div class="mb-4 overflow-hidden rounded-xl shadow">
        <img src="{{ asset('storage/' . $event->banner) }}" alt="Banner {{ $event->title }}"
             class="h-40 w-full object-cover">
    </div>
@endif

<div class="mb-6 rounded-xl bg-white p-5 shadow">
    <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">Bioskop</p>
            <p class="font-medium text-gray-900">{{ $event->cinema?->cinema_name ?? '-' }}</p>
        </div>
        <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">Rentang Event</p>
            <p class="font-medium text-gray-900">
                {{ $event->start_date->translatedFormat('d M Y') }} – {{ $event->end_date->translatedFormat('d M Y') }}
            </p>
        </div>
        <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">Buka Penjualan</p>
            <p class="font-medium text-gray-900">
                {{ $event->sale_starts_at ? $event->sale_starts_at->copy()->setTimezone(\App\Support\FestivalSchedule::TIMEZONE)->translatedFormat('d M Y H:i') . ' WIB' : '-' }}
            </p>
        </div>
    </div>
</div>

<!-- Date filter -->
<div class="mb-4">
    @if(count($dateBoxes) > 1)
        <div class="flex gap-2 overflow-x-auto pb-2">
            @foreach($dateBoxes as $box)
                <button type="button"
                        @click="selectedDate = @js($box['iso'])"
                        class="relative flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 transition"
                        :class="selectedDate === @js($box['iso'])
                            ? 'border-blue-600 bg-blue-600 text-white shadow'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'">
                    <span class="text-[10px] font-semibold uppercase tracking-wide"
                          :class="selectedDate === @js($box['iso']) ? 'text-blue-100' : 'text-gray-500'">{{ $box['day'] }}</span>
                    <span class="text-lg font-bold leading-tight">{{ $box['date'] }}</span>
                    <span class="text-[10px]"
                          :class="selectedDate === @js($box['iso']) ? 'text-blue-100' : 'text-gray-500'">{{ $box['month'] }}</span>
                    @if($box['count'] > 0)
                        <span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                              :class="selectedDate === @js($box['iso']) ? 'bg-white' : 'bg-blue-500'"></span>
                    @endif
                </button>
            @endforeach
        </div>
    @endif

    <div class="overflow-hidden rounded-xl bg-white shadow">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                        <th class="px-6 py-3">Tanggal &amp; Jam (WIB)</th>
                        <th class="px-6 py-3">Studio</th>
                        <th class="px-6 py-3">Judul Sesi</th>
                        <th class="px-6 py-3">Film</th>
                        <th class="px-6 py-3 text-right">Harga</th>
                        <th class="px-6 py-3 text-center">Kuota</th>
                        <th class="px-6 py-3">Jam Selesai (WIB)</th>
                        <th class="px-6 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @forelse($sessions as $session)
                        <tr class="hover:bg-gray-50"
                            x-show="selectedDate === @js($session->show_date->format('Y-m-d'))">
                            <td class="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                                {{ $session->show_date->translatedFormat('d M Y') }}
                                <span class="ml-1 text-gray-500">{{ substr((string) $session->show_time, 0, 5) }}</span>
                            </td>
                            <td class="px-6 py-4 text-gray-700">{{ $session->studio?->studio_name ?? '-' }}</td>
                            <td class="px-6 py-4 text-gray-700">{{ $session->session_title ?: '-' }}</td>
                            <td class="px-6 py-4">
                                <ol class="list-inside list-decimal space-y-0.5 text-gray-700">
                                    @foreach($session->festivalMovies as $film)
                                        <li>{{ $film->title }} <span class="text-xs text-gray-500">({{ (int) $film->duration }} mnt)</span></li>
                                    @endforeach
                                </ol>
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-right text-gray-700">
                                Rp {{ number_format((float) $session->ticket_price, 0, ',', '.') }}
                            </td>
                            <td class="px-6 py-4 text-center text-gray-700">{{ $session->quota ?? '-' }}</td>
                            <td class="whitespace-nowrap px-6 py-4 text-gray-700">
                                {{ $session->ends_at->format('H:i') }}
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex flex-wrap items-center justify-end gap-1.5">
                                    @if($session->has_orders)
                                        <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Sudah ada order</span>
                                    @endif
                                    <a href="{{ route($panelPrefix.'.events.sessions.edit', [$event->id, $session->id]) }}"
                                       class="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200">
                                        <i class="fas fa-pen mr-1"></i> Ubah
                                    </a>
                                    <form action="{{ route($panelPrefix.'.events.sessions.destroy', [$event->id, $session->id]) }}" method="POST" class="inline"
                                          onsubmit="return requireConfirm(event, 'Hapus sesi ini?', { form: this })">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" @disabled($session->has_orders)
                                                class="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition
                                                       {{ $session->has_orders ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-red-100 text-red-700 hover:bg-red-200' }}">
                                            <i class="fas fa-trash mr-1"></i> Hapus
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="h-[180px] px-6 py-0 text-center align-middle text-gray-500">
                                <div class="flex flex-col items-center justify-center">
                                    <i class="fas fa-clock mb-2 text-2xl text-gray-300"></i>
                                    <p class="text-sm">Belum ada sesi untuk event ini.</p>
                                </div>
                            </td>
                        </tr>
                    @endforelse

                    @if($sessions->isNotEmpty())
                        <tr x-show="!counts[selectedDate]">
                            <td colspan="8" class="h-[180px] px-6 py-0 text-center align-middle text-gray-500">
                                <div class="flex flex-col items-center justify-center">
                                    <i class="fas fa-calendar-day mb-2 text-2xl text-gray-300"></i>
                                    <p class="text-sm">Belum ada sesi pada tanggal ini.</p>
                                </div>
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>
</div>
</div>
@endsection