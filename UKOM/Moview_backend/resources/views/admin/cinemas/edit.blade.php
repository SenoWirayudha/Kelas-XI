@extends('layouts.admin')

@section('title', 'Edit Bioskop')
@section('page-title', 'Edit Bioskop')
@section('page-subtitle', $cinema->cinema_name)

@section('content')
@php
    $returnUrl = \App\Support\ReturnUrl::fromRequest(request());
    $backUrl = $returnUrl ?? route($panelPrefix.'.cinemas.index');
@endphp
<div class="max-w-xl p-0 sm:p-6">

    <div class="mb-4">
        <a href="{{ $backUrl }}" data-no-history
           class="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Bioskop
        </a>
    </div>

    <div class="bg-white rounded-xl shadow p-6">

        @if($errors->any())
            <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                <ul class="list-disc list-inside space-y-1">
                    @foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route($panelPrefix.'.cinemas.update', $cinema->id) }}" method="POST">
            @csrf
            @method('PUT')
            <input type="hidden" name="return" value="{{ $returnUrl }}">

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Service / Brand <span class="text-red-500">*</span>
                </label>
                <select name="service_id" required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Service --</option>
                    @foreach($services as $service)
                        <option value="{{ $service->id }}" {{ old('service_id', $cinema->service_id) == $service->id ? 'selected' : '' }}>
                            {{ $service->name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bioskop <span class="text-red-500">*</span>
                </label>
                <input type="text" name="cinema_name" required maxlength="150"
                       value="{{ old('cinema_name', $cinema->cinema_name) }}"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Kota <span class="text-red-500">*</span>
                </label>
                <input type="text" name="city" required maxlength="100"
                       value="{{ old('city', $cinema->city) }}"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Alamat <span class="text-red-500">*</span>
                </label>
                <input type="text" name="address" required maxlength="255"
                       value="{{ old('address', $cinema->address) }}"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit"
                        class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    <i class="fas fa-save mr-2"></i> Simpan Perubahan
                </button>
                <a href="{{ $backUrl }}"
                   data-no-history
                   class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection
