@extends('layouts.admin')

@section('title', $isEdit ? 'Ubah Promo' : 'Buat Promo')
@section('page-title', $isEdit ? 'Ubah Promo' : 'Buat Promo')
@section('page-subtitle', 'Diskon dihitung di server saat checkout')

@section('content')

<div class="mx-auto max-w-2xl">
    <div class="mb-4">
        <a href="{{ route($panelPrefix.'.promos.index') }}" class="text-sm text-blue-600 hover:underline">
            <i class="fas fa-arrow-left mr-1"></i> Kembali ke daftar promo
        </a>
    </div>

    @if($errors->any())
        <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ul class="list-inside list-disc space-y-0.5">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST"
          action="{{ $isEdit ? route($panelPrefix.'.promos.update', $promo->id) : route($panelPrefix.'.promos.store') }}"
          class="space-y-5 rounded-xl bg-white p-6 shadow">
        @csrf
        @if($isEdit)
            @method('PUT')
        @endif

        <div class="grid gap-5 sm:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Kode</label>
                <input type="text" name="code" value="{{ old('code', $promo->code) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none"
                       maxlength="32" required>
                <p class="mt-1 text-xs text-gray-500">Huruf/angka, otomatis disimpan dalam huruf besar.</p>
            </div>

            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Tipe diskon</label>
                <select name="type" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="percent" @selected(old('type', $promo->type) === 'percent')>Persen (%)</option>
                    <option value="fixed" @selected(old('type', $promo->type) === 'fixed')>Nominal (Rp)</option>
                </select>
            </div>
        </div>

        <div>
            <label class="mb-1 block text-sm font-medium text-gray-800">Deskripsi</label>
            <input type="text" name="description" value="{{ old('description', $promo->description) }}"
                   class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                   maxlength="255">
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Nilai</label>
                <input type="number" name="value" min="1" value="{{ old('value', $promo->value) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required>
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Maksimum diskon (khusus persen)</label>
                <input type="number" name="max_discount" min="1" value="{{ old('max_discount', $promo->max_discount) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Minimal belanja (Rp)</label>
                <input type="number" name="min_purchase" min="0" value="{{ old('min_purchase', $promo->min_purchase ?? 0) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Batas per user</label>
                <input type="number" name="per_user_limit" min="1" value="{{ old('per_user_limit', $promo->per_user_limit ?? 1) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required>
            </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Berlaku dari</label>
                <input type="datetime-local" name="valid_from"
                       value="{{ old('valid_from', $promo->valid_from?->format('Y-m-d\TH:i')) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Berlaku sampai</label>
                <input type="datetime-local" name="valid_until"
                       value="{{ old('valid_until', $promo->valid_until?->format('Y-m-d\TH:i')) }}"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Kuota total</label>
                <input type="number" name="quota_total" min="1" value="{{ old('quota_total', $promo->quota_total) }}"
                       placeholder="Kosongkan untuk tanpa batas"
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Cakupan</label>
                @if($isManager)
                    <input type="hidden" name="scope" value="cinema">
                    <input type="text" value="{{ $cinemas->first()->cinema_name ?? 'Bioskop Anda' }}" disabled
                           class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    <input type="hidden" name="cinema_id" value="{{ $cinemas->first()->id ?? '' }}">
                @else
                    <select name="scope" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                        <option value="all" @selected(old('scope', $promo->scope) === 'all')>Semua tiket</option>
                        <option value="festival" @selected(old('scope', $promo->scope) === 'festival')>Festival saja</option>
                        <option value="cinema" @selected(old('scope', $promo->scope) === 'cinema')>Bioskop tertentu</option>
                    </select>
                @endif
            </div>
        </div>

        @unless($isManager)
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-800">Bioskop (jika cakupan bioskop tertentu)</label>
                <select name="cinema_id" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">— Pilih bioskop —</option>
                    @foreach($cinemas as $cinema)
                        <option value="{{ $cinema->id }}" @selected((int) old('cinema_id', $promo->cinema_id) === $cinema->id)>
                            {{ $cinema->cinema_name }}
                        </option>
                    @endforeach
                </select>
            </div>
        @endunless

        @if($isEdit)
            <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $promo->is_active))>
                Aktif
            </label>
        @endif

        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route($panelPrefix.'.promos.index') }}"
               class="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Batal
            </a>
            <button type="submit"
                    class="inline-flex min-h-[40px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {{ $isEdit ? 'Simpan Perubahan' : 'Buat Promo' }}
            </button>
        </div>
    </form>
</div>

@endsection
