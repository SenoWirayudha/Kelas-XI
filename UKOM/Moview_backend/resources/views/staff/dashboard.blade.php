@extends('layouts.portal')

@section('title', 'Dashboard Staff')
@section('page-title', 'Dashboard Staff')
@section('page-subtitle', $cinemaName ?? 'Bioskop belum terhubung')

@section('content')
<div class="bg-white rounded-lg shadow p-8">
    <h3 class="text-lg font-semibold text-gray-800">Dashboard Staff</h3>
    <p class="mt-2 text-gray-600">
        Bioskop: <span class="font-medium">{{ $cinemaName ?? '-' }}</span>
    </p>
    <p class="mt-1 text-sm text-gray-500">Halaman ini masih kosong. Isinya akan dikerjakan pada tahap berikutnya.</p>
</div>
@endsection
