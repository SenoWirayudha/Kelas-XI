@extends('layouts.admin')

@section('title', 'Tambah Staff')
@section('page-title', 'Tambah Staff')
@section('page-subtitle', session('admin_cinema_name', '-'))

@section('content')
@php
    $returnUrl = \App\Support\ReturnUrl::fromRequest(request());
    $backUrl = $returnUrl ?? route('manager.staff.index');
@endphp
<div class="max-w-2xl rounded-lg bg-white p-5 shadow sm:p-8">
    <form action="{{ route('manager.staff.store') }}" method="POST">
        @csrf
        <input type="hidden" name="return" value="{{ $returnUrl }}">
        @include('manager.staff._form', ['staff' => null])

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit"
                    class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
                Simpan
            </button>
            <a href="{{ $backUrl }}" data-no-history
               class="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50">
                Batal
            </a>
        </div>
    </form>
</div>
@endsection
