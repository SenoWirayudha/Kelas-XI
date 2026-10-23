<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') - Moview</title>
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <aside class="w-64 bg-gray-900 text-white flex-shrink-0 h-screen sticky top-0 flex flex-col">
            <div class="p-6">
                <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-7 mb-2">
                <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {{ ucfirst(session('admin_role', 'panel')) }}
                </p>
            </div>

            <nav class="flex-1 mt-2">
                <a href="{{ route(session('admin_role') === 'manager' ? 'manager.dashboard' : 'staff.dashboard') }}"
                   class="flex items-center px-6 py-3 {{ request()->routeIs('*.dashboard') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-gauge-high mr-3"></i>
                    <span>Dashboard</span>
                </a>

                @if(session('admin_role') === 'manager')
                <a href="{{ route('manager.staff.index') }}"
                   class="flex items-center px-6 py-3 {{ request()->routeIs('manager.staff.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-user-tie mr-3"></i>
                    <span>Akun Staff</span>
                </a>
                @endif
            </nav>

            <div class="p-6 border-t border-gray-800">
                <p class="font-medium">{{ session('admin_user_name') }}</p>
                <p class="text-sm text-gray-400">{{ session('admin_user_email') }}</p>
                <p class="mt-2 text-sm text-gray-300">
                    <i class="fas fa-building mr-1"></i>
                    {{ session('admin_cinema_name', 'Belum terhubung bioskop') }}
                </p>
                <form action="{{ route('admin.logout') }}" method="POST" class="mt-4">
                    @csrf
                    <button type="submit"
                            class="flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </aside>

        <div class="flex-1 flex flex-col">
            <header class="bg-white shadow-sm">
                <div class="px-8 py-4">
                    <h2 class="text-2xl font-semibold text-gray-800">@yield('page-title', 'Dashboard')</h2>
                    <p class="text-sm text-gray-500">@yield('page-subtitle', '')</p>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-8">
                @if(session('success'))
                <div class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <i class="fas fa-check-circle mr-2"></i>{{ session('success') }}
                </div>
                @endif

                @if(session('error'))
                <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <i class="fas fa-exclamation-circle mr-2"></i>{{ session('error') }}
                </div>
                @endif

                @if($errors->any())
                <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong class="font-bold">Ada kesalahan!</strong>
                    <ul class="mt-2 list-disc list-inside">
                        @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
