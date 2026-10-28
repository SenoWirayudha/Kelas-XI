@extends('layouts.admin')

@section('title', $isEdit ? 'Ubah Event' : 'Buat Event')
@section('page-title', $isEdit ? 'Ubah Event' : 'Buat Event')
@section('page-subtitle', 'Data event festival film')

@section('content')
@php
    $returnUrl = \App\Support\ReturnUrl::fromRequest(request());
    $backUrl = $returnUrl ?? route($panelPrefix.'.events.index');
@endphp

<div class="max-w-3xl">
    <div class="mb-4">
        <a href="{{ $backUrl }}" data-no-history
           class="inline-flex items-center text-sm text-gray-500 transition hover:text-gray-800">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Event
        </a>
    </div>

    <div class="rounded-xl bg-white p-6 shadow">
        @if($errors->any())
            <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                <ul class="list-inside list-disc space-y-1">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST"
              action="{{ $isEdit ? route($panelPrefix.'.events.update', $event->id) : route($panelPrefix.'.events.store') }}"
              enctype="multipart/form-data">
            @csrf
            @if($isEdit) @method('PUT') @endif
            <input type="hidden" name="return" value="{{ $returnUrl }}">

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Judul Event <span class="text-red-500">*</span></label>
                <input type="text" name="title" required maxlength="255"
                       value="{{ old('title', $event->title) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Bioskop <span class="text-red-500">*</span></label>
                <x-admin.searchable-select
                    name="cinema_id"
                    :options="$cinemas->map(fn ($c) => ['id' => (int) $c->id, 'label' => $c->cinema_name . ($c->city ? ' — ' . $c->city : '')])->values()->all()"
                    :selected="(string) old('cinema_id', $event->cinema_id)"
                    placeholder="Cari bioskop..."
                    empty-text="Bioskop tidak ditemukan"
                />
            </div>

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea name="description" rows="4"
                          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{{ old('description', $event->description) }}</textarea>
            </div>

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Banner</label>
                @if($event->banner)
                    <div class="mb-2">
                        <img src="{{ asset('storage/' . $event->banner) }}" alt="Banner"
                             class="h-28 w-auto rounded-lg border border-gray-200 object-cover">
                    </div>
                @endif
                <input type="file" name="banner" accept="image/*"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <p class="mt-1 text-xs text-gray-500">Opsional. JPG/PNG/WebP maksimal 4 MB.</p>
            </div>

            <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tanggal Mulai <span class="text-red-500">*</span></label>
                    <input type="date" name="start_date" required
                           value="{{ old('start_date', optional($event->start_date)->format('Y-m-d')) }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tanggal Selesai <span class="text-red-500">*</span></label>
                    <input type="date" name="end_date" required
                           value="{{ old('end_date', optional($event->end_date)->format('Y-m-d')) }}"
                           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <div class="mb-5">
                <label class="mb-1 block text-sm font-medium text-gray-700">Waktu Buka Penjualan (WIB) <span class="text-red-500">*</span></label>
                <input type="datetime-local" name="sale_starts_at" required
                       value="{{ old('sale_starts_at', $event->sale_starts_at? $event->sale_starts_at->copy()->setTimezone(\App\Support\FestivalSchedule::TIMEZONE)->format('Y-m-d\TH:i') : '') }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p class="mt-1 text-xs text-gray-500">Waktu Indonesia Barat (WIB). Tidak boleh melewati sesi pertama event ini.</p>
            </div>

            <label class="mb-6 flex cursor-pointer items-center gap-3">
                <input type="checkbox" name="is_published" value="1"
                       {{ old('is_published', $event->is_published) ? 'checked' : '' }}
                       class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Terbitkan event</span>
            </label>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit"
                        class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    <i class="fas fa-save mr-2"></i> Simpan
                </button>
                <a href="{{ $backUrl }}" data-no-history
                   class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection