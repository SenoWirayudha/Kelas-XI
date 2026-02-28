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
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-gray-900 text-white flex-shrink-0 h-screen sticky top-0">
            <div class="p-6">
                <h1 class="text-2xl font-bold text-blue-400">🎬 Moview Admin</h1>
            </div>
            
            <nav class="mt-6 flex-1 overflow-y-auto">
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
                <a href="{{ route('admin.comments.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.comments.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-comments mr-3"></i>
                    <span>Comments</span>
                </a>
                <a href="{{ route('admin.analytics.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.analytics.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-chart-bar mr-3"></i>
                    <span>Analytics</span>
                </a>
            </nav>

            <div class="absolute bottom-0 w-64 p-6 border-t border-gray-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="font-bold">{{ strtoupper(substr(session('admin_user_name', 'A'), 0, 1)) }}</span>
                        </div>
                        <div class="ml-3">
                            <p class="font-medium">{{ session('admin_user_name', 'Admin User') }}</p>
                            <p class="text-sm text-gray-400">{{ session('admin_user_email', 'admin@moview.com') }}</p>
                        </div>
                    </div>
                </div>
                <form action="{{ route('admin.logout') }}" method="POST" class="mt-4">
                    @csrf
                    <button type="submit" 
                            class="flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        <span>Logout</span>
                    </button>
                </form>
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
                        <div x-data="{ 
                            open: false, 
                            notifications: [],
                            count: 0,
                            loading: false,
                            async loadNotifications() {
                                if (this.loading) return;
                                this.loading = true;
                                try {
                                    const response = await fetch('{{ route('admin.comments.notifications') }}');
                                    const html = await response.text();
                                    this.$refs.dropdown.innerHTML = html;
                                } catch (e) {
                                    console.error('Failed to load notifications', e);
                                } finally {
                                    this.loading = false;
                                }
                            },
                            async init() {
                                // Load count on page load
                                try {
                                    const response = await fetch('{{ route('admin.comments.index') }}');
                                    const text = await response.text();
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(text, 'text/html');
                                    const flaggedCard = doc.querySelector('[data-flagged-count]');
                                    if (flaggedCard) {
                                        this.count = parseInt(flaggedCard.dataset.flaggedCount) || 0;
                                    }
                                } catch (e) {
                                    console.error('Failed to load count', e);
                                }
                            }
                        }" class="relative">
                            <button @click="open = !open; if(open && notifications.length === 0) loadNotifications()" 
                                    class="p-2 text-gray-600 hover:text-gray-900 relative">
                                <i class="fas fa-bell text-xl"></i>
                                <span x-show="count > 0" 
                                      x-text="count > 99 ? '99+' : count"
                                      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"></span>
                            </button>
                            
                            <!-- Notification Dropdown -->
                            <div x-show="open" 
                                 @click.away="open = false"
                                 x-transition:enter="transition ease-out duration-100"
                                 x-transition:enter-start="transform opacity-0 scale-95"
                                 x-transition:enter-end="transform opacity-100 scale-100"
                                 x-transition:leave="transition ease-in duration-75"
                                 x-transition:leave-start="transform opacity-100 scale-100"
                                 x-transition:leave-end="transform opacity-0 scale-95"
                                 class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200"
                                 x-cloak>
                                <div class="p-4 border-b border-gray-200">
                                    <h3 class="text-lg font-semibold text-gray-800">Flagged Comments</h3>
                                </div>
                                <div x-ref="dropdown" class="max-h-96 overflow-y-auto">
                                    <div class="p-8 text-center text-gray-500">
                                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                        <p>Loading...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-600">{{ date('l, M d, Y') }}</span>
                        </div>
                        <div class="border-l pl-4">
                            <form action="{{ route('admin.logout') }}" method="POST" class="inline">
                                @csrf
                                <button type="submit"
                                        class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium">
                                    <i class="fas fa-sign-out-alt mr-2"></i>
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto p-8">
                <!-- Success Message -->
                @if(session('success'))
                <div x-data="{ show: true }" x-show="show" x-init="setTimeout(() => show = false, 5000)" class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span class="block sm:inline">{{ session('success') }}</span>
                        <button @click="show = false" class="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                @endif

                <!-- Error Messages -->
                @if($errors->any())
                <div x-data="{ show: true }" x-show="show" class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-circle mr-2 mt-1"></i>
                        <div class="flex-1">
                            <strong class="font-bold">Ada kesalahan!</strong>
                            <ul class="mt-2 list-disc list-inside">
                                @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                        <button @click="show = false" class="ml-4">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>

    @stack('scripts')
</body>
</html>
