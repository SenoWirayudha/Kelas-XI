@extends('layouts.admin')

@section('title', 'Tambah Manager')
@section('page-title', 'Tambah Manager')
@section('page-subtitle', 'Akun manager wajib terikat ke satu bioskop')

@section('content')
<div class="bg-white rounded-lg shadow p-8 max-w-2xl">
    <form action="{{ route('admin.accounts.store') }}" method="POST">
        @csrf
        @include('admin.accounts._form', ['manager' => null])

        <div class="flex items-center space-x-3">
            <button type="submit"
                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Simpan
            </button>
            <a href="{{ route('admin.accounts.index') }}"
               class="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                Batal
            </a>
        </div>
    </form>
</div>
@endsection
