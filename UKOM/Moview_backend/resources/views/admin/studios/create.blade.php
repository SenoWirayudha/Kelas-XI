@extends('layouts.admin')

@section('title', 'Tambah Studio')
@section('page-title', 'Tambah Studio')
@section('page-subtitle', 'Tambahkan studio baru ke bioskop')

@section('content')
<div class="p-6 max-w-lg">

    <div class="mb-4">
        <a href="{{ route('admin.studios.index') }}"
           class="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition">
            <i class="fas fa-arrow-left mr-2"></i> Kembali ke Daftar Studio
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

        <form action="{{ route('admin.studios.store') }}" method="POST">
            @csrf

            {{-- Bioskop --}}
            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Bioskop <span class="text-red-500">*</span>
                </label>
                <select name="cinema_id" required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">-- Pilih Bioskop --</option>
                    @foreach($cinemas as $cinema)
                        <option value="{{ $cinema->id }}" {{ old('cinema_id') == $cinema->id ? 'selected' : '' }}>
                            {{ $cinema->cinema_name }}{{ $cinema->city ? ' — ' . $cinema->city : '' }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Nama Studio --}}
            <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nama Studio <span class="text-red-500">*</span>
                </label>
                <input type="text" name="studio_name" required maxlength="100"
                       value="{{ old('studio_name') }}"
                       placeholder="Contoh: Studio 1"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            </div>

            <div class="mb-5 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                <i class="fas fa-info-circle mr-2"></i>
                Jumlah kursi diatur otomatis melalui <strong>Layout Kursi</strong> setelah studio dibuat.
            </div>

            <div class="flex items-center gap-3">
                <button type="submit"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                    <i class="fas fa-arrow-right mr-2"></i> Simpan &amp; Atur Layout Kursi
                </button>
                <a href="{{ route('admin.studios.index') }}"
                   class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection
