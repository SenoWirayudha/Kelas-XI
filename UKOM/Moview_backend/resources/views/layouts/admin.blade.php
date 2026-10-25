<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $mvPageTitle = trim(View::yieldContent('title'));
        $mvPageTitle = $mvPageTitle === ''
            ? 'Moview'
            : (str_contains($mvPageTitle, 'Moview') ? $mvPageTitle : $mvPageTitle . ' | Moview');
    @endphp
    <title>{{ $mvPageTitle }}</title>
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/moview-theme.css') }}">
    <style>
        [x-cloak] { display: none !important; }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .sidebar-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .sidebar-scroll::-webkit-scrollbar {
            display: none;
        }

        @media (max-width: 1023.98px) {
            .admin-sidebar {
                transform: translateX(-100%);
                transition: transform 200ms ease;
            }
            .admin-sidebar.is-open {
                transform: translateX(0);
            }
        }

        @media (min-width: 1024px) {
            .admin-sidebar {
                transform: none !important;
            }
        }

        html.cashier-fullscreen body aside,
        html.cashier-fullscreen body header {
            display: none !important;
        }
        html.cashier-fullscreen body main {
            padding: 0 !important;
        }
        #cashier-wide-exit {
            display: none;
        }
        html.cashier-fullscreen #cashier-wide-exit {
            display: inline-flex;
        }

        /* Staff focus mode: keep navigation present but inert and subtle. */
        html.staff-focus-mode body aside {
            width: 4rem;
            opacity: 0.35;
            overflow: hidden;
            pointer-events: none;
            transition: width 200ms ease, opacity 200ms ease;
        }
        html.staff-focus-mode body aside img {
            max-width: 2rem;
            height: 1.5rem;
            object-fit: contain;
            object-position: left;
        }
        html.staff-focus-mode body aside nav,
        html.staff-focus-mode body aside .border-t {
            display: none !important;
        }
        html.staff-focus-mode body header {
            opacity: 0.25;
            pointer-events: none;
        }
        html.staff-focus-mode body header > div {
            padding-top: 0.35rem;
            padding-bottom: 0.35rem;
        }
        html.staff-focus-mode body header h2 {
            font-size: 1rem;
        }
        html.staff-focus-mode body header p,
        html.staff-focus-mode body header form,
        html.staff-focus-mode body header .border-l,
        html.staff-focus-mode body header span {
            display: none !important;
        }
        html.staff-focus-mode body main {
            padding: 0.75rem !important;
        }

        /* Print: only the ticket area is printed (no sidebar/header). */
        @media print {
            body * {
                visibility: hidden;
            }

            #ticket-print-area, #ticket-print-area * {
                visibility: visible;
            }

            #ticket-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }

            .no-print {
                display: none !important;
            }
        }
    </style>
    @if(session('admin_role') === 'staff')
    <script>
    (function () {
        const key = 'moview_staff_focus_mode';
        const scanUrl = @json(route('staff.tickets.scanner'));
        const scanPath = new URL(scanUrl, window.location.href).pathname;

        const isActive = () => {
            try {
                return sessionStorage.getItem(key) === '1';
            } catch (_) {
                return false;
            }
        };

        const apply = () => {
            document.documentElement.classList.toggle('staff-focus-mode', isActive());
        };

        const redirect = () => {
            if (isActive() && window.location.pathname !== scanPath) {
                window.location.replace(scanUrl);
                return true;
            }
            return false;
        };

        window.moviewFocusMode = {
            key,
            scanUrl,
            scanPath,
            isActive,
            apply,
            redirect,
            setActive(active) {
                try {
                    active ? sessionStorage.setItem(key, '1') : sessionStorage.removeItem(key);
                } catch (_) {}
                apply();
            },
        };

        apply();
        redirect();

        window.addEventListener('pageshow', redirect);
        window.addEventListener('popstate', redirect);

        document.addEventListener('click', function (event) {
            if (!isActive()) return;

            const link = event.target.closest ? event.target.closest('a[href]') : null;
            if (!link) return;

            let url;
            try {
                url = new URL(link.getAttribute('href'), window.location.href);
            } catch (_) {
                return;
            }

            if (url.origin === window.location.origin && url.pathname === scanPath) return;

            event.preventDefault();
            event.stopPropagation();
            redirect();
        }, true);

        document.addEventListener('submit', function (event) {
            if (!isActive()) return;

            const action = event.target.getAttribute ? event.target.getAttribute('action') : null;
            if (!action) return;

            let url;
            try {
                url = new URL(action, window.location.href);
            } catch (_) {
                return;
            }

            if (url.origin === window.location.origin && url.pathname === scanPath) return;

            event.preventDefault();
            event.stopPropagation();
            redirect();
        }, true);
    })();
    </script>
    @endif
    @if(request()->routeIs('staff.cashier.*'))
    <script>
    (function () {
        try {
            if (sessionStorage.getItem('moview_cashier_wide') === '1') {
                document.documentElement.classList.add('cashier-fullscreen');
            }
        } catch (_) {}
    })();
    </script>
    @endif
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="moview-theme overflow-hidden bg-gray-100">
    <div class="h-[100dvh] overflow-hidden lg:flex"
         x-data="{ sidebarOpen: false }"
         @keydown.escape.window="sidebarOpen = false; window.moviewHistoryUI?.closeDrawer()"
         @resize.window="if (window.innerWidth >= 1024) { sidebarOpen = false; window.moviewHistoryUI?.closeDrawer(); }"
         @moview-drawer-open.window="sidebarOpen = true"
         @moview-drawer-close.window="sidebarOpen = false"
         x-effect="document.body.classList.toggle('admin-drawer-open', sidebarOpen)">
        <div x-show="sidebarOpen"
             x-cloak
             class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
             @click="sidebarOpen = false; window.moviewHistoryUI?.closeDrawer()"
             aria-hidden="true"></div>

        <!-- Sidebar -->
        <aside class="admin-sidebar fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-64 flex-shrink-0 flex-col bg-gray-900 text-white lg:static lg:h-full"
               :class="sidebarOpen ? 'is-open' : ''">
            <div class="flex flex-shrink-0 items-start justify-between gap-3 p-6">
                <div class="min-w-0">
                    <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-7 mb-2">
                    <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">{{ ucfirst(session('admin_role', 'Admin')) }}</p>
                </div>
                <button type="button"
                        @click="sidebarOpen = false; window.moviewHistoryUI?.closeDrawer()"
                        class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
                        aria-label="Tutup menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <nav class="sidebar-scroll flex-1 overflow-y-auto mt-2"
                 @click="if ($event.target.closest('a')) { sidebarOpen = false; window.moviewHistoryUI?.closeDrawer(); }">
                @if(session('admin_role') === 'manager')
                <a href="{{ route('manager.dashboard') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.dashboard') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-gauge-high mr-3"></i>
                    <span>Dashboard</span>
                </a>
                <a href="{{ route('manager.stats.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.stats.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-chart-line mr-3"></i>
                    <span>Statistik</span>
                </a>
                <a href="{{ route('manager.staff-stats.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.staff-stats.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-users-viewfinder mr-3"></i>
                    <span>Statistik Staff</span>
                </a>
                <a href="{{ route('manager.cinemas.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.cinemas.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-building mr-3"></i>
                    <span>Manajemen Bioskop</span>
                </a>
                <a href="{{ route('manager.studios.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.studios.*', 'manager.seats.*', 'manager.seat-types.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-door-open mr-3"></i>
                    <span>Manajemen Studio</span>
                </a>
                <a href="{{ route('manager.schedules.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.schedules.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-calendar-alt mr-3"></i>
                    <span>Jadwal Tayang</span>
                </a>
                <a href="{{ route('manager.orders.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.orders.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-shopping-cart mr-3"></i>
                    <span>Manajemen Order</span>
                </a>
                <a href="{{ route('manager.staff.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('manager.staff.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-user-tie mr-3"></i>
                    <span>Kelola Staff</span>
                </a>
                @elseif(session('admin_role') === 'staff')
                <a href="{{ route('staff.dashboard') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('staff.dashboard') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-gauge-high mr-3"></i>
                    <span>Dashboard</span>
                </a>
                <a href="{{ route('staff.cashier.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('staff.cashier.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-cash-register mr-3"></i>
                    <span>Kasir</span>
                </a>
                <a href="{{ route('staff.tickets.scanner') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('staff.tickets.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-qrcode mr-3"></i>
                    <span>Scan Tiket</span>
                </a>
                <a href="{{ route('staff.attendance.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('staff.attendance.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-clipboard-user mr-3"></i>
                    <span>Absensi</span>
                </a>
                <a href="{{ route('staff.stats.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('staff.stats.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-chart-line mr-3"></i>
                    <span>Statistik Saya</span>
                </a>
                @else
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
                <a href="{{ route('admin.accounts.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.accounts.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-user-tie mr-3"></i>
                    <span>Akun Manager</span>
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

                {{-- Cinema Booking --}}
                <div class="px-6 pt-4 pb-1">
                    <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Bioskop</p>
                </div>
                <a href="{{ route('admin.cinemas.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.cinemas.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-building mr-3"></i>
                    <span>Bioskop</span>
                </a>
                <a href="{{ route('admin.studios.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.studios.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-door-open mr-3"></i>
                    <span>Studio</span>
                </a>
                <a href="{{ route('admin.schedules.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.schedules.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-calendar-alt mr-3"></i>
                    <span>Jadwal Tayang</span>
                </a>
                <a href="{{ route('admin.orders.index') }}" class="flex items-center px-6 py-3 {{ request()->routeIs('admin.orders.*') ? 'bg-blue-600' : 'hover:bg-gray-800' }}">
                    <i class="fas fa-shopping-cart mr-3"></i>
                    <span>Order Tiket</span>
                </a>
                @endif
            </nav>

            <div class="flex-shrink-0 p-6 border-t border-gray-800">
                <div class="flex min-w-0 items-center">
                    <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                        <span class="font-bold">{{ strtoupper(substr(session('admin_user_name', 'A'), 0, 1)) }}</span>
                    </div>
                    <div class="ml-3 min-w-0 flex-1">
                        <p class="truncate font-medium" title="{{ session('admin_user_name', 'Admin User') }}">{{ session('admin_user_name', 'Admin User') }}</p>
                        <p class="truncate text-sm text-gray-400" title="{{ session('admin_user_email', 'admin@moview.com') }}">{{ session('admin_user_email', 'admin@moview.com') }}</p>
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
        <div class="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
            <!-- Top Navigation -->
            <header class="flex-shrink-0 bg-white shadow-sm">
                <div class="flex items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
                    <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                        <button type="button"
                                @click="sidebarOpen = true; window.moviewHistoryUI?.openDrawer()"
                                class="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 lg:hidden"
                                aria-label="Buka menu">
                            <i class="fas fa-bars text-lg"></i>
                        </button>
                        <div class="min-w-0">
                            <h2 class="truncate text-lg font-semibold text-gray-800 sm:text-2xl">@yield('page-title', 'Dashboard')</h2>
                            <p class="truncate text-xs text-gray-500 sm:text-sm">@yield('page-subtitle', '')</p>
                        </div>
                    </div>
                    <div class="flex flex-shrink-0 items-center justify-end gap-1 sm:gap-3">
                        @yield('header-actions')
                        @if(session('admin_role') === 'admin')
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
                                    class="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    aria-label="Notifikasi">
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
                                 class="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-lg shadow-xl z-50 border border-gray-200"
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
                        @endif
                        <div class="hidden items-center space-x-2 md:flex">
                            <span class="text-sm text-gray-600">{{ date('l, M d, Y') }}</span>
                        </div>
                        <div class="sm:border-l sm:pl-4">
                            <form action="{{ route('admin.logout') }}" method="POST" class="inline">
                                @csrf
                                <button type="submit"
                                        class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 sm:px-4">
                                    <i class="fas fa-sign-out-alt sm:mr-2"></i>
                                    <span class="hidden sm:inline">Logout</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
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

                <!-- Streaming Warning Message -->
                @if(session('streaming_warning'))
                <div x-data="{ show: true }" x-show="show" x-init="setTimeout(() => show = false, 8000)" class="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <span class="block sm:inline">{{ session('streaming_warning') }}</span>
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

    @if(request()->routeIs('staff.cashier.*'))
    <button type="button"
            id="cashier-wide-exit"
            class="fixed right-3 top-3 z-[80] min-h-[40px] items-center rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/80"
            aria-label="Keluar Layar Penuh">
        <i class="fas fa-compress mr-2"></i> Keluar Layar Penuh
    </button>
    <script>
    (function () {
        const key = 'moview_cashier_wide';
        const root = document.documentElement;
        const button = document.getElementById('cashier-wide-exit');

        const isActive = () => {
            try {
                return sessionStorage.getItem(key) === '1';
            } catch (_) {
                return false;
            }
        };

        const requestFullscreen = () => {
            if (document.fullscreenElement) return;
            try {
                const request = root.requestFullscreen?.();
                if (request && request.catch) request.catch(() => {});
            } catch (_) {}
        };

        const retryFullscreen = (event) => {
            if (!isActive() || document.fullscreenElement) return;
            if (event.target.closest && event.target.closest('#cashier-wide-exit')) return;
            requestFullscreen();
        };

        const apply = () => {
            const active = isActive();
            root.classList.toggle('cashier-fullscreen', active);

            if (active && !document.fullscreenElement) {
                document.addEventListener('click', retryFullscreen, { once: true, capture: true });
            }
        };

        const enter = () => {
            try {
                sessionStorage.setItem(key, '1');
            } catch (_) {}
            apply();
            requestFullscreen();
        };

        const exit = () => {
            try {
                sessionStorage.removeItem(key);
            } catch (_) {}
            apply();

            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    const request = document.exitFullscreen();
                    if (request && request.catch) request.catch(() => {});
                }
            } catch (_) {}
        };

        button?.addEventListener('click', exit);
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) apply();
        });

        window.moviewCashierWide = {
            toggle: () => isActive() ? exit() : enter(),
            enter,
            exit,
            isActive,
        };

        apply();
    })();
    </script>
    @endif

    <div id="stat-number-tooltip" class="stat-number-tooltip-global" role="tooltip" aria-hidden="true"></div>
    <div id="chart-tooltip" class="stat-number-tooltip-global" role="tooltip" aria-hidden="true"></div>

    {{-- Global Toast Container --}}
    <div x-data="globalToast" class="fixed right-4 top-4 z-[100] w-[calc(100vw-2rem)] max-w-sm space-y-3">
        <template x-for="t in toasts" :key="t.id">
            <div class="transform transition-all duration-300 bg-white rounded-lg shadow-lg border overflow-hidden"
                 :class="t.type === 'success' ? 'border-green-400' : t.type === 'error' ? 'border-red-400' : 'border-blue-400'">
                <div class="flex items-start p-4">
                    <i class="fas mt-0.5 mr-3"
                       :class="t.type === 'success' ? 'fa-check-circle text-green-500' : t.type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-info-circle text-blue-500'"></i>
                    <div class="flex-1 min-w-0">
                        <p x-text="t.msg" class="text-sm text-gray-800"></p>
                    </div>
                    <button @click="toasts = toasts.filter(x => x.id !== t.id)" class="text-gray-400 hover:text-gray-600 ml-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </template>
    </div>

    {{-- Global Confirm Modal --}}
    <div x-data="confirmModal" x-cloak>
        <div x-show="open" class="fixed inset-0 z-[110] flex items-center justify-center p-4" x-cloak>
            <div class="absolute inset-0 bg-black bg-opacity-50" @click="cancel()"></div>
            <div class="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                         :class="danger ? 'bg-red-100' : 'bg-blue-100'">
                        <i class="fas"
                           :class="danger ? 'fa-exclamation-triangle text-red-600' : 'fa-info-circle text-blue-600'"></i>
                    </div>
                    <div class="ml-4 flex-1">
                        <h3 class="text-lg font-semibold text-gray-900" x-text="message"></h3>
                        <p class="mt-1 text-sm text-gray-500" x-text="submessage" x-show="submessage"></p>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" @click="cancel()"
                            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="button" @click="confirmAction()"
                            :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
                            class="px-4 py-2 text-white rounded-lg"
                            x-text="confirmText"></button>
                </div>
            </div>
        </div>
    </div>

    @stack('scripts')

    <script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('globalToast', () => ({
            toasts: [],
            init() {
                // Show any toasts that were queued before a page reload.
                this.drainPending();
                window.__toast = (msg, type = 'success') => {
                    this.push(msg, type);
                };
            },
            push(msg, type = 'success') {
                const id = Date.now() + Math.random();
                this.toasts.push({ id, msg, type });
                setTimeout(() => this.toasts = this.toasts.filter(t => t.id !== id), 3500);
            },
            // Store a toast that should appear AFTER the current page reloads.
            // Used by actions that do an instant location.reload() to fetch fresh data.
            persist(msg, type = 'success') {
                const queue = JSON.parse(sessionStorage.getItem('moview_pending_toasts') || '[]');
                queue.push({ msg, type });
                sessionStorage.setItem('moview_pending_toasts', JSON.stringify(queue));
            },
            drainPending() {
                const queue = JSON.parse(sessionStorage.getItem('moview_pending_toasts') || '[]');
                if (queue.length === 0) return;
                sessionStorage.removeItem('moview_pending_toasts');
                queue.forEach(t => this.push(t.msg, t.type));
            }
        }));

        Alpine.data('confirmModal', () => ({
            open: false,
            message: '',
            submessage: '',
            confirmText: 'Ya, Lanjutkan',
            danger: true,
            callback: null,
            init() {
                window.addEventListener('moview-modal-close', () => {
                    this.open = false;
                    this.callback = null;
                });
            },
            show(opts) {
                this.message = opts.message || 'Konfirmasi';
                this.submessage = opts.submessage || '';
                this.confirmText = opts.confirmText || (opts.danger === false ? 'Ya, Lanjutkan' : 'Ya, Lanjutkan');
                this.danger = opts.danger !== false;
                this.callback = opts.callback || null;
                this.open = true;
                window.moviewHistoryUI?.openModal();
            },
            cancel() {
                this.open = false;
                if (this.callback && this.callback.onCancel) this.callback.onCancel();
                this.callback = null;
                window.moviewHistoryUI?.closeModal();
            },
            confirmAction() {
                this.open = false;
                if (this.callback && this.callback.onConfirm) this.callback.onConfirm();
                this.callback = null;
                window.moviewHistoryUI?.closeModal();
            }
        }));

        // Global helpers available to any page
        Alpine.magic('openConfirm', () => (opts) => {
            const modal = document.querySelector('[x-data="confirmModal"]');
            if (modal && modal._x_dataStack) {
                modal._x_dataStack[0].show(opts);
            }
        });

        // Legacy fallback: window.confirmAction() for inline onclick handlers
        window.confirmAction = (message, onConfirm, opts = {}) => {
            const modal = document.querySelector('[x-data="confirmModal"]');
            if (modal && modal._x_dataStack) {
                modal._x_dataStack[0].show({
                    message,
                    danger: opts.danger !== false,
                    confirmText: opts.confirmText,
                    submessage: opts.submessage,
                    callback: { onConfirm, onCancel: opts.onCancel }
                });
            }
        };

        window.showToast = (msg, type = 'success') => {
            if (window.__toast) window.__toast(msg, type);
        };

        // Show a toast that must survive an immediate page reload (upload/set default/delete).
        window.showToastAfterReload = (msg, type = 'success') => {
            const el = document.querySelector('[x-data="globalToast"]');
            if (el && el._x_dataStack) {
                el._x_dataStack[0].persist(msg, type);
            }
        };

        // Inline confirmation: use onsubmit for forms or onclick for buttons.
        // Elements: onsubmit="return requireConfirm(event, 'msg', { form: this })"
        // Buttons:  onclick="return requireConfirm(event, 'msg', { onConfirm: cb, danger: false })"
        window.requireConfirm = (event, message, opts = {}) => {
            event.preventDefault();
            event.stopPropagation();
            const form = opts.form || (event.target.closest ? event.target.closest('form') : null);
            window.confirmAction(message, () => {
                if (form) form.submit();
                else if (opts.onConfirm) opts.onConfirm();
            }, {
                confirmText: opts.confirmText,
                danger: opts.danger
            });
            return false;
        };
    });
    </script>

    <script>
    (function () {
        const tooltip = document.getElementById('stat-number-tooltip');
        const canHover = window.matchMedia('(hover: hover)').matches;
        let pinned = null;

        const positionTooltip = (el) => {
            if (!tooltip) return;

            const rect = el.getBoundingClientRect();
            const margin = 8;
            const width = tooltip.offsetWidth;
            const height = tooltip.offsetHeight;

            let left = rect.left + (rect.width / 2) - (width / 2);
            left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

            let top = rect.top - height - margin;
            if (top < margin) {
                top = rect.bottom + margin;
            }

            tooltip.style.left = Math.round(left) + 'px';
            tooltip.style.top = Math.round(top) + 'px';
        };

        const showTooltip = (el) => {
            if (!tooltip) return;

            tooltip.textContent = el.dataset.full || el.textContent.trim();
            tooltip.classList.add('is-visible');
            tooltip.setAttribute('aria-hidden', 'false');
            positionTooltip(el);
        };

        const hideTooltip = (force = false) => {
            if (!tooltip || (pinned && !force)) return;

            tooltip.classList.remove('is-visible');
            tooltip.setAttribute('aria-hidden', 'true');
        };

        const fitNumber = (el) => {
            const text = el.querySelector('.stat-number-text');
            if (!text || el.clientWidth <= 0) return;

            text.textContent = el.dataset.full;
            el.style.fontSize = '';

            let size = parseFloat(window.getComputedStyle(el).fontSize);
            const minimum = 13;

            while (el.scrollWidth > el.clientWidth + 1 && size > minimum) {
                size -= 1;
                el.style.fontSize = size + 'px';
            }

            if (el.scrollWidth > el.clientWidth + 1) {
                text.textContent = el.dataset.compact;
                el.style.fontSize = '';
            }
        };

        const fitAll = () => {
            document.querySelectorAll('[data-stat-number]').forEach(fitNumber);
        };

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            hideTooltip(true);
            resizeTimer = window.setTimeout(fitAll, 120);
        });
        window.addEventListener('load', fitAll);

        document.addEventListener('pointerover', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const el = event.target.closest('[data-stat-number]');
            if (el) showTooltip(el);
        });

        document.addEventListener('pointerout', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const el = event.target.closest('[data-stat-number]');
            if (!el || el.contains(event.relatedTarget)) return;
            hideTooltip();
        });

        document.addEventListener('focusin', (event) => {
            const el = event.target.closest('[data-stat-number]');
            if (el) showTooltip(el);
        });

        document.addEventListener('focusout', (event) => {
            const el = event.target.closest('[data-stat-number]');
            if (el) hideTooltip();
        });

        document.addEventListener('click', (event) => {
            const el = event.target.closest('[data-stat-number]');

            if (!el) {
                pinned = null;
                hideTooltip(true);
                return;
            }

            if (canHover) {
                showTooltip(el);
                return;
            }

            if (pinned === el) {
                pinned = null;
                hideTooltip(true);
            } else {
                pinned = el;
                showTooltip(el);
            }
        });

        window.addEventListener('scroll', () => {
            pinned = null;
            hideTooltip(true);
        }, { passive: true });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fitAll);
        } else {
            fitAll();
        }

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(fitAll).catch(() => {});
        }
    })();
    </script>

    <script>
    (function () {
        const tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) return;

        const canHover = window.matchMedia('(hover: hover)').matches;
        let pinned = null;

        const position = (x, y) => {
            const margin = 10;
            const width = tooltip.offsetWidth;
            const height = tooltip.offsetHeight;

            let left = x + 14;
            let top = y + 14;

            if (left + width > window.innerWidth - margin) {
                left = x - width - 14;
            }

            if (top + height > window.innerHeight - margin) {
                top = y - height - 14;
            }

            tooltip.style.left = Math.round(Math.max(margin, left)) + 'px';
            tooltip.style.top = Math.round(Math.max(margin, top)) + 'px';
        };

        const show = (el, x, y) => {
            tooltip.textContent = el.dataset.chartTip || '';
            tooltip.classList.add('is-visible');
            tooltip.setAttribute('aria-hidden', 'false');
            position(x, y);
        };

        const hide = (force = false) => {
            if (pinned && !force) return;
            tooltip.classList.remove('is-visible');
            tooltip.setAttribute('aria-hidden', 'true');
        };

        document.addEventListener('pointerover', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const el = event.target.closest('[data-chart-tip]');
            if (el) show(el, event.clientX, event.clientY);
        });

        document.addEventListener('pointermove', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const el = event.target.closest('[data-chart-tip]');
            if (el && tooltip.classList.contains('is-visible')) {
                position(event.clientX, event.clientY);
            }
        });

        document.addEventListener('pointerout', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const el = event.target.closest('[data-chart-tip]');
            if (!el || el.contains(event.relatedTarget)) return;
            hide();
        });

        document.addEventListener('focusin', (event) => {
            const el = event.target.closest('[data-chart-tip]');
            if (!el) return;
            const rect = el.getBoundingClientRect();
            show(el, rect.left + (rect.width / 2), rect.top + (rect.height / 2));
        });

        document.addEventListener('focusout', (event) => {
            if (event.target.closest('[data-chart-tip]')) hide();
        });

        document.addEventListener('click', (event) => {
            const el = event.target.closest('[data-chart-tip]');

            if (!el) {
                pinned = null;
                hide(true);
                return;
            }

            if (canHover) {
                show(el, event.clientX, event.clientY);
                return;
            }

            if (pinned === el) {
                pinned = null;
                hide(true);
            } else {
                pinned = el;
                show(el, event.clientX, event.clientY);
            }
        });

        window.addEventListener('scroll', () => {
            pinned = null;
            hide(true);
        }, { passive: true });

        window.addEventListener('resize', () => {
            pinned = null;
            hide(true);
        });
    })();
    </script>

    <script>
    (function () {
        const scrollPrefix = 'moview_scroll_';
        const flashPrefix = 'moview_flash_';

        window.moviewPageState = {
            saveScroll(key) {
                try {
                    const main = document.querySelector('main');
                    sessionStorage.setItem(scrollPrefix + key, JSON.stringify({
                        y: main ? main.scrollTop : (window.scrollY || window.pageYOffset || 0),
                        at: Date.now(),
                    }));
                } catch (_) {}
            },

            restoreScroll(key) {
                let saved = null;

                try {
                    saved = JSON.parse(sessionStorage.getItem(scrollPrefix + key) || 'null');
                    sessionStorage.removeItem(scrollPrefix + key);
                } catch (_) {}

                if (!saved || Date.now() - saved.at > 120000) return;

                if ('scrollRestoration' in history) {
                    history.scrollRestoration = 'manual';
                }

                const apply = () => requestAnimationFrame(() => {
                    const main = document.querySelector('main');

                    if (main) {
                        main.scrollTop = saved.y;
                    } else {
                        window.scrollTo(0, saved.y);
                    }
                });

                if (document.readyState === 'complete') {
                    apply();
                } else {
                    window.addEventListener('load', apply, { once: true });
                }
            },

            flash(key, message, type = 'success') {
                try {
                    sessionStorage.setItem(flashPrefix + key, JSON.stringify({ message, type, at: Date.now() }));
                } catch (_) {}
            },

            consumeFlash(key) {
                try {
                    const raw = sessionStorage.getItem(flashPrefix + key);
                    sessionStorage.removeItem(flashPrefix + key);
                    if (!raw) return null;

                    const data = JSON.parse(raw);
                    if (Date.now() - data.at > 120000) return null;

                    return data;
                } catch (_) {
                    return null;
                }
            },
        };
    })();
    </script>

    <script>
    (function () {
        let drawerOpen = false;
        let modalOpen = false;

        const without = (state, key) => {
            const next = Object.assign({}, state || {});
            delete next[key];
            return next;
        };

        window.moviewHistoryUI = {
            openDrawer() {
                if (drawerOpen) return;
                drawerOpen = true;
                if (!history.state || !history.state.moviewDrawer) {
                    history.pushState(Object.assign({}, history.state || {}, { moviewDrawer: true }), '', location.href);
                }
            },

            closeDrawer() {
                if (!drawerOpen) return;
                drawerOpen = false;
                if (history.state && history.state.moviewDrawer) {
                    history.replaceState(without(history.state, 'moviewDrawer'), '', location.href);
                }
            },

            openModal() {
                if (modalOpen) return;
                modalOpen = true;
                if (!history.state || !history.state.moviewModal) {
                    history.pushState(Object.assign({}, history.state || {}, { moviewModal: true }), '', location.href);
                }
            },

            closeModal() {
                if (!modalOpen) return;
                modalOpen = false;
                if (history.state && history.state.moviewModal) {
                    history.replaceState(without(history.state, 'moviewModal'), '', location.href);
                }
            },
        };

        window.moviewGoBack = function (fallback) {
            try {
                const referrer = document.referrer ? new URL(document.referrer) : null;

                if (referrer && referrer.origin === window.location.origin && history.length > 1) {
                    history.back();
                    return;
                }
            } catch (_) {}

            window.location.href = fallback;
        };

        window.addEventListener('popstate', function (event) {
            if (drawerOpen && !(event.state && event.state.moviewDrawer)) {
                drawerOpen = false;
                window.dispatchEvent(new Event('moview-drawer-close'));
            }

            if (modalOpen && !(event.state && event.state.moviewModal)) {
                modalOpen = false;
                window.dispatchEvent(new Event('moview-modal-close'));
            }
        });

        document.addEventListener('click', function (event) {
            const link = event.target.closest ? event.target.closest('a[href]') : null;
            if (!link || link.dataset.noHistory !== undefined) return;

            const label = (link.textContent || '').trim().toLowerCase();
            if (!label.startsWith('kembali') && !label.startsWith('pilih film lain')) return;

            try {
                const referrer = document.referrer ? new URL(document.referrer) : null;

                if (referrer && referrer.origin === window.location.origin && history.length > 1) {
                    event.preventDefault();
                    history.back();
                }
            } catch (_) {}
        });
    })();
    </script>
</body>
</html>
