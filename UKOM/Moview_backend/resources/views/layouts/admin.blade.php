<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Film Admin Dashboard')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        [x-cloak] { display: none !important; }
    </style>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-gray-900 text-white flex-shrink-0">
            <div class="p-6">
                <h1 class="text-2xl font-bold text-blue-400">🎬 Moview Admin</h1>
            </div>
            
            <nav class="mt-6">
                <a href="{{ route('admin.films.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.films.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-film mr-3"></i>
                    <span>Films</span>
                </a>
                <a href="{{ route('admin.cast-crew.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.cast-crew.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-user-friends mr-3"></i>
                    <span>Cast & Crew</span>
                </a>
                <a href="{{ route('admin.users.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.users.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-users mr-3"></i>
                    <span>Users</span>
                </a>
                <a href="{{ route('admin.activity.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.activity.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-history mr-3"></i>
                    <span>Activity</span>
                </a>
                <a href="{{ route('admin.reviews.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.reviews.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-star mr-3"></i>
                    <span>Reviews</span>
                </a>
                <a href="{{ route('admin.analytics.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.analytics.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-chart-bar mr-3"></i>
                    <span>Analytics</span>
                </a>
                <a href="#" class="flex items-center px-6 py-3 hover:bg-gray-800 text-gray-400">
                    <i class="fas fa-cog mr-3"></i>
                    <span>Settings</span>
                </a>
            </nav>

            <div class="absolute bottom-0 w-64 p-6 border-t border-gray-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="font-bold">A</span>
                        </div>
                        <div class="ml-3">
                            <p class="font-medium">Admin User</p>
                            <p class="text-sm text-gray-400">admin@moview.com</p>
                        </div>
                    </div>
                </div>
                <a href="{{ route('admin.login') }}" 
                   onclick="return confirm('Logout dari admin panel? (UI only)\n\nDalam production:\n- Destroy session\n- Redirect ke login page')"
                   class="mt-4 flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    <span>Logout</span>
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Top Navigation -->
            <header class="bg-white shadow-sm">
                <div class="flex items-center justify-between px-8 py-4">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-800">@yield('page-title', 'Dashboard')</h2>
                        <p class="text-sm text-gray-500">@yield('page-subtitle', '')</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="p-2 text-gray-600 hover:text-gray-900 relative">
                            <i class="fas fa-bell text-xl"></i>
                            <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-600">{{ date('l, M d, Y') }}</span>
                        </div>
                        <div class="border-l pl-4">
                            <a href="{{ route('admin.login') }}" 
                               onclick="return confirm('Logout dari admin panel? (UI only)\n\nDalam production:\n- Destroy session\n- Redirect ke login page')"
                               class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium">
                                <i class="fas fa-sign-out-alt mr-2"></i>
                                Logout
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto p-8">
                @yield('content')
            </main>
        </div>
    </div>

    @stack('scripts')
</body>
</html>
