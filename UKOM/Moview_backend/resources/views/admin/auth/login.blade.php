@extends('layouts.guest')

@section('title', 'Masuk')

@section('content')
<div class="flex items-center justify-center min-h-screen px-4 py-10 sm:py-12">
    <div class="w-full max-w-md">
        <div class="mb-6">
            <a href="{{ route('home') }}"
               class="inline-flex min-h-[40px] items-center text-sm text-gray-500 transition hover:text-gray-800">
                <i class="fas fa-arrow-left mr-2"></i> Kembali ke beranda
            </a>
        </div>

        <!-- Logo & Header -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-7 w-auto">
            </div>
            <p class="text-gray-600">Ulasan film, komunitas, dan tiket bioskop dalam satu aplikasi.</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Masuk</h2>
            
            <!-- Error Messages -->
            @if($errors->any())
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
                    <div>
                        @foreach($errors->all() as $error)
                        <p class="text-sm text-red-800">{{ $error }}</p>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

            <!-- Login Form -->
            <form action="{{ route('admin.login.post') }}" method="POST"
                  x-data="{ submitting: false }"
                  @submit="submitting = true">
                @csrf
                
                <!-- Email Field -->
                <div class="mb-5">
                    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-envelope text-gray-400 mr-2"></i>
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value="{{ old('email') }}"
                        placeholder="nama@moview.com"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        required
                        autocomplete="email"
                    >
                </div>

                <!-- Password Field -->
                <div class="mb-5" x-data="{ showPassword: false }">
                    <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-lock text-gray-400 mr-2"></i>
                        Password
                    </label>
                    <div class="relative">
                        <input 
                            :type="showPassword ? 'text' : 'password'"
                            id="password" 
                            name="password" 
                            placeholder="Masukkan password"
                            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                            required
                            autocomplete="current-password"
                        >
                        <button 
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                        </button>
                    </div>
                </div>

                <!-- Remember Me -->
                <div class="mb-6 flex items-center">
                    <label class="flex items-center cursor-pointer group">
                        <input 
                            type="checkbox" 
                            name="remember" 
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        >
                        <span class="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            Remember me
                        </span>
                    </label>
                </div>

                <!-- Login Button -->
                <button 
                    type="submit"
                    :disabled="submitting"
                    class="inline-flex w-full items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                >
                    <span x-show="!submitting" class="inline-flex items-center">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Masuk
                    </span>
                    <span x-show="submitting" x-cloak class="inline-flex items-center">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        Memproses...
                    </span>
                </button>
            </form>

            <!-- Divider -->
            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-white text-gray-500">Admin, manager, staff &amp; pengguna</span>
                </div>
            </div>

            <!-- Additional Info -->
            <div class="text-center">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                    Gunakan akun yang sama dengan aplikasi Android.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
            <p class="text-sm text-gray-600">
                &copy; {{ date('Y') }}. All rights reserved.
            </p>
            <div class="mt-2 space-x-4">
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
                <span class="text-gray-400">•</span>
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
                <span class="text-gray-400">•</span>
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Support</a>
            </div>
        </div>
    </div>
</div>

<!-- Background Decoration -->
<div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    <div class="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div class="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    <div class="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
</div>

<style>
@keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
}
.animate-blob {
    animation: blob 7s infinite;
}
.animation-delay-2000 {
    animation-delay: 2s;
}
.animation-delay-4000 {
    animation-delay: 4s;
}
</style>
@endsection
