@extends('layouts.guest')

@section('title', 'Discover - Moview')

@section('content')
<div class="min-h-screen">
    <header class="border-b border-white/10 bg-[#121821]/90">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <a href="{{ route('home') }}" class="inline-flex items-center">
                <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-7 w-auto">
            </a>
            <div class="flex items-center gap-3">
                <span class="hidden text-sm text-gray-400 sm:inline">{{ $user->username }}</span>
                <form action="{{ route('admin.logout') }}" method="POST">
                    @csrf
                    <button type="submit"
                            class="inline-flex min-h-[40px] items-center rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20">
                        <i class="fas fa-right-from-bracket mr-2"></i> Logout
                    </button>
                </form>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <section class="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1B2432] via-[#151C27] to-[#111821] p-6 shadow-xl sm:p-8">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Discover</p>
            <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl">Halo, {{ $user->username }}.</h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                Lihat film yang sedang tayang dan ulasan teramai komunitas. Untuk menulis ulasan, menyimpan favorit,
                dan membeli tiket, lanjutkan di aplikasi Android Moview.
            </p>
        </section>

        <div class="mt-8">
            @if($popularMovies->isEmpty())
                <div class="rounded-xl border border-dashed border-gray-700 bg-[#171F2A] px-5 py-12 text-center">
                    <i class="fas fa-film text-3xl text-gray-600"></i>
                    <p class="mt-3 text-sm font-medium text-gray-300">Belum ada film yang sedang tayang.</p>
                    <p class="mt-1 text-xs text-gray-500">Cek kembali beberapa saat lagi.</p>
                </div>
            @else
                @include('partials.popular-carousel', ['popularMovies' => $popularMovies])
            @endif
        </div>

        @if($reviews->isNotEmpty())
            <section class="mt-10">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">Dari komunitas</p>
                    <h2 class="mt-1 text-xl font-bold text-white sm:text-2xl">Ulasan teramai</h2>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-3">
                    @foreach($reviews as $review)
                        <article class="rounded-xl border border-gray-700/60 bg-[#171F2A] p-4 shadow-lg">
                            <div class="flex items-center gap-3">
                                <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
                                    {{ strtoupper(substr($review->user?->username ?? 'M', 0, 1)) }}
                                </span>
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-white">{{ $review->user?->username ?? 'Pengguna Moview' }}</p>
                                    <p class="truncate text-[11px] text-gray-500">{{ $review->movie?->title ?? 'Film' }}</p>
                                </div>
                                <span class="flex-shrink-0 text-xs font-bold text-yellow-400">
                                    <i class="fas fa-star mr-1"></i>{{ number_format((float) $review->rating, 1, ',', '.') }}
                                </span>
                            </div>
                            <p class="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-300">
                                {{ \Illuminate\Support\Str::limit(strip_tags($review->content), 180) }}
                            </p>
                            <div class="mt-3 flex items-center gap-4 border-t border-white/5 pt-2 text-[11px] text-gray-500">
                                <span><i class="fas fa-heart mr-1"></i>{{ number_format((int) $review->likes_count, 0, ',', '.') }}</span>
                                <span><i class="fas fa-comment mr-1"></i>{{ number_format((int) $review->published_comments_count, 0, ',', '.') }}</span>
                            </div>
                        </article>
                    @endforeach
                </div>
            </section>
        @endif

        <section class="mt-10 rounded-2xl border border-green-400/20 bg-green-500/5 p-5 sm:p-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-lg font-bold text-white">Lanjutkan di aplikasi Moview</h2>
                    <p class="mt-1 max-w-xl text-sm text-gray-400">
                        Tulis ulasan, beri rating, simpan film favorit, ikuti teman, dan beli tiket bioskop dari aplikasi Android.
                    </p>
                    <p class="mt-2 text-xs text-gray-500">
                        @if($apkExists)
                            APK Android {{ $apkSize }}. Aktifkan instal dari sumber tidak dikenal.
                        @else
                            APK Android belum tersedia.
                        @endif
                    </p>
                </div>
                @if($apkExists)
                    <a href="{{ asset('downloads/moview.apk') }}" download
                       class="inline-flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-500">
                        <i class="fab fa-android mr-2"></i> Unduh Aplikasi Android
                    </a>
                @else
                    <span class="inline-flex min-h-[44px] flex-shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-white/5 px-5 py-2.5 text-sm font-bold text-gray-500">
                        Segera hadir
                    </span>
                @endif
            </div>
        </section>
    </main>

    <footer class="border-t border-white/10">
        <div class="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>&copy; {{ date('Y') }} Moview</span>
            <span>Sosial film dan tiket bioskop dalam satu aplikasi.</span>
        </div>
    </footer>
</div>
@endsection
