@extends('layouts.admin')

@section('title', 'Tambah Bioskop')
@section('page-title', 'Tambah Bioskop')
@section('page-subtitle', 'Daftarkan bioskop baru ke sistem')

@section('content')
<div class="p-6 max-w-xl">

    <div class="mb-4">
        <a href="{{ route('admin.cinemas.index') }}"
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

        <form action="{{ route('admin.cinemas.store') }}" method="POST">
            @csrf

            {{-- Service --}}
            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Service / Brand <span class="text-red-500">*</span>
                </label>
                <select name="service_id" required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Service --</option>
                    @foreach($services as $service)
                        <option value="{{ $service->id }}" {{ old('service_id') == $service->id ? 'selected' : '' }}>
                            {{ $service->name }}
                        </option>
                    @endforeach
                </select>
                <p class="text-xs text-gray-400 mt-1">Contoh: XXI, CGV, CINEPOLIS</p>
            </div>

            {{-- Nama Bioskop --}}
            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bioskop <span class="text-red-500">*</span>
                </label>
                <input type="text" name="cinema_name" required maxlength="150"
                       value="{{ old('cinema_name') }}"
                       placeholder="Contoh: Nagoya Hill XXI"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            {{-- Kota --}}
            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Kota <span class="text-red-500">*</span>
                </label>
                <input type="text" name="city" required maxlength="100"
                       value="{{ old('city') }}"
                       placeholder="Contoh: Batam"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            {{-- Alamat --}}
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Alamat <span class="text-red-500">*</span>
                </label>
                <input type="text" name="address" required maxlength="255"
                       value="{{ old('address') }}"
                       placeholder="Contoh: Nagoya Hill Mall Lt. 3"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="flex items-center gap-3">
                <button type="submit"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    <i class="fas fa-save mr-2"></i> Simpan Bioskop
                </button>
                <a href="{{ route('admin.cinemas.index') }}"
                   class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection
