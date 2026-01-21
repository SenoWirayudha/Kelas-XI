@extends('layouts.guest')

@section('title', 'Admin Login')

@section('content')
<div class="flex items-center justify-center min-h-screen px-4 py-12">
    <div class="w-full max-w-md">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                <i class="fas fa-film text-white text-3xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Moview Admin</h1>
            <p class="text-gray-600">Sign in to manage your film database</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
            
            <!-- Alert Example (Hidden by default) -->
            <div class="hidden mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" id="error-alert">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
                    <p class="text-sm text-red-800">Invalid credentials. Please try again.</p>
                </div>
            </div>

            <!-- Login Form -->
            <form action="{{ route('admin.login.post') }}" method="POST">
                @csrf
                
                <!-- Email Field -->
                <div class="mb-5">
                    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-envelope text-gray-400 mr-2"></i>
                        Email Address
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="admin@moview.com"
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
                            placeholder="Enter your password"
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

                <!-- Remember Me & Forgot Password -->
                <div class="flex items-center justify-between mb-6">
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
                    
                    <a href="#" 
                       onclick="alert('Forgot Password (UI only)\n\nIn production: Redirect to password reset flow')" 
                       class="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot password?
                    </a>
                </div>

                <!-- Login Button -->
                <button 
                    type="submit"
                    class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Login to Dashboard
                </button>
            </form>

            <!-- Divider -->
            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-white text-gray-500">Admin Access Only</span>
                </div>
            </div>

            <!-- Additional Info -->
            <div class="text-center">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                    This is a restricted admin area
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
            <p class="text-sm text-gray-600">
                &copy; {{ date('Y') }} Moview Admin Panel. All rights reserved.
            </p>
            <div class="mt-2 space-x-4">
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
                <span class="text-gray-400">•</span>
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
                <span class="text-gray-400">•</span>
                <a href="#" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">Support</a>
            </div>
        </div>

        <!-- Demo Credentials Notice -->
        <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
                <i class="fas fa-lightbulb text-yellow-600 mr-3 mt-0.5"></i>
                <div class="text-sm text-yellow-800">
                    <p class="font-semibold mb-1">Demo Mode (UI Only)</p>
                    <p class="text-xs">This is a view-only demonstration. No actual authentication is performed.</p>
                    <p class="text-xs mt-2">
                        <strong>Example credentials:</strong><br>
                        Email: admin@moview.com<br>
                        Password: password123
                    </p>
                </div>
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
