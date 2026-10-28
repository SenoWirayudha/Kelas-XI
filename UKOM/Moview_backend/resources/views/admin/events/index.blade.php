@extends('layouts.admin')

@section('title', 'Event Festival')
@section('page-title', 'Event Festival')
@section('page-subtitle', 'Kelola event festival film dan sesinya')

@section('content')
@php $listReturn = \App\Support\ReturnUrl::current(); @endphp

<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
        <h2 class="text-lg font-semibold text-gray-900">Daftar Event</h2>
        <p class="text-sm text-gray-500">Satu sesi festival bisa berisi beberapa film.</p>
    </div>
    <a href="{{ \App\Support\ReturnUrl::add(route($panelPrefix.'.events.create'), $listReturn) }}"
       class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        <i class="fas fa-plus mr-2"></i> Buat Event
    </a>
</div>

@if(session('success'))
    <div class="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
        {{ session('success') }}
    </div>
@endif
@if(session('error'))
    <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ session('error') }}
    </div>
@endif

<div class="overflow-hidden rounded-xl bg-white shadow">
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                    <th class="px-6 py-3">Judul</th>
                    <th class="px-6 py-3">Rentang Tanggal</th>
                    <th class="px-6 py-3">Bioskop</th>
                    <th class="px-6 py-3 text-center">Sesi</th>
                    <th class="px-6 py-3 text-center">Status</th>
                    <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($events as $event)
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <p class="font-semibold text-gray-900">{{ $event->title }}</p>
                            @if($event->description)
                                <p class="mt-0.5 line-clamp-1 text-xs text-gray-500">{{ $event->description }}</p>
                            @endif
                        </td>
                        <td class="px-6 py-4 text-gray-700">
                            {{ $event->start_date->translatedFormat('d M Y') }}
                            <span class="text-gray-400">–</span>
                            {{ $event->end_date->translatedFormat('d M Y') }}
                        </td>
                        <td class="px-6 py-4 text-gray-700">{{ $event->cinema?->cinema_name ?? '-' }}</td>
                        <td class="px-6 py-4 text-center">
                            <span class="inline-flex min-w-[28px] items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {{ $event->sessions_count }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            @if($event->is_published)
                                <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Terbit</span>
                            @else
                                <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Draft</span>
                            @endif
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-wrap items-center justify-end gap-1.5">
                                <a href="{{ \App\Support\ReturnUrl::add(route($panelPrefix.'.events.sessions', $event->id), $listReturn) }}"
                                   class="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
                                    <i class="fas fa-list mr-1"></i> Kelola Sesi
                                </a>
                                <a href="{{ \App\Support\ReturnUrl::add(route($panelPrefix.'.events.edit', $event->id), $listReturn) }}"
                                   class="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200">
                                    <i class="fas fa-pen mr-1"></i> Ubah
                                </a>
                                <form action="{{ route($panelPrefix.'.events.destroy', $event->id) }}" method="POST" class="inline"
                                      onsubmit="return requireConfirm(event, 'Hapus event {{ addslashes($event->title) }} beserta semua sesinya?', { form: this })">
                                    @csrf
                                    @method('DELETE')
                                    <input type="hidden" name="return" value="{{ $listReturn }}">
                                    <button type="submit"
                                            class="inline-flex items-center rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200">
                                        <i class="fas fa-trash mr-1"></i> Hapus
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                            <i class="fas fa-calendar-xmark mb-2 text-3xl text-gray-300"></i>
                            <p class="text-sm">Belum ada event festival.</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div class="mt-4">{{ $events->links() }}</div>
@endsection