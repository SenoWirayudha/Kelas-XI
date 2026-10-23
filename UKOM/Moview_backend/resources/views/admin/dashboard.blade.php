@extends('layouts.admin')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard')
@section('page-subtitle', 'Ringkasan panel admin')

@section('content')
<div class="bg-white rounded-lg shadow p-8">
    <h3 class="text-lg font-semibold text-gray-800">Selamat datang, {{ session('admin_user_name') }}</h3>
    <p class="mt-2 text-gray-600">
        Gunakan menu di samping untuk mengelola film, bioskop, dan akun manager.
    </p>
    <a href="{{ route('admin.accounts.index') }}"
       class="inline-flex items-center mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
        <i class="fas fa-user-tie mr-2"></i>
        Kelola Akun Manager
    </a>
</div>
@endsection
