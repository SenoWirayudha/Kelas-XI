@extends('layouts.guest')

@section('title', 'Moview - Sosial Film & Tiket Bioskop')

@section('content')
<div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 -z-10">
        <div class="absolute -left-32 top-10 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div class="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl"></div>
    </div>

    <header class="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="{{ route('home') }}" class="inline-flex items-center">
            <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-7 w-auto sm:h-8">
        </a>
        <a href="{{ route('admin.login') }}"
           class="inline-flex min-h-[40px] items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-400/50 hover:bg-blue-500/10">
            <i class="fas fa-right-to-bracket mr-2 text-blue-300"></i> Masuk
        </a>
    </header>

    <main class="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section class="grid items-center gap-12 py-10 lg:grid-cols-[1.1fr_.9fr] lg:py-16">
            <div>
                <span class="inline-flex items-center rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                    <i class="fas fa-clapperboard mr-2"></i> Media sosial film + tiket bioskop
                </span>

                <h1 class="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Tonton. Ulas.<br>
                    <span class="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Bagikan.</span>
                </h1>

                <p class="mt-5 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                    Temukan film, tulis ulasan dan rating, simpan favorit, lalu pesan tiket bioskop.
                    Moview menggabungkan komunitas film dan pengalaman nonton dalam satu aplikasi.
                </p>

                <div class="mt-7 flex flex-col gap-3 sm:flex-row">
                    <a href="{{ route('admin.login') }}"
                       class="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500">
                        <i class="fas fa-right-to-bracket mr-2"></i> Masuk
                    </a>

                    @if($apkExists)
                        <a href="{{ asset('downloads/moview.apk') }}" download
                           class="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:border-green-400/50 hover:bg-green-500/10">
                            <i class="fab fa-android mr-2 text-green-400"></i> Unduh Aplikasi Android
                        </a>
                    @else
                        <span class="inline-flex min-h-[48px] cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-500">
                            <i class="fab fa-android mr-2"></i> Segera hadir
                        </span>
                    @endif
                </div>

                <p class="mt-3 text-xs text-gray-500">
                    @if($apkExists)
                        APK Android {{ $apkSize }}. Aktifkan instal dari sumber tidak dikenal.
                    @else
                        APK Android belum tersedia.
                    @endif
                </p>
            </div>

            <div class="relative mx-auto w-full max-w-md">
                <div class="absolute -inset-5 rounded-[2.5rem] bg-blue-500/10 blur-3xl"></div>
                <div class="relative rounded-[2rem] border border-white/10 bg-[#121821] p-4 shadow-2xl shadow-black/40">
                    <div class="flex items-center justify-between px-1">
                        <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="h-5 w-auto">
                        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">M</span>
                    </div>

                    <div class="mt-4 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/30 via-[#16233b] to-[#121821] p-5">
                        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">Sedang tayang</p>
                        <h2 class="mt-2 text-xl font-bold text-white">Pilih film malam ini</h2>
                        <p class="mt-1 text-xs text-gray-300">Lihat jadwal bioskop, pilih kursi, lalu bawa tiketnya di aplikasi.</p>
                        <div class="mt-4 flex gap-2">
                            <span class="h-16 w-11 rounded-md bg-white/10"></span>
                            <span class="h-16 w-11 rounded-md bg-white/15"></span>
                            <span class="h-16 w-11 rounded-md bg-white/20"></span>
                            <span class="flex h-16 flex-1 items-center justify-center rounded-md border border-dashed border-white/20 text-[10px] text-gray-400">Poster film</span>
                        </div>
                    </div>

                    <div class="mt-3 rounded-xl border border-white/10 bg-[#171F2A] p-3">
                        <div class="flex items-center justify-between">
                            <p class="text-xs font-semibold text-white">Ulasan komunitas</p>
                            <span class="text-[11px] font-bold text-yellow-400"><i class="fas fa-star mr-1"></i>4,5</span>
                        </div>
                        <p class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                            Cerita, akting, dan sinematografinya bikin film ini layak dibahas bareng.
                        </p>
                    </div>

                    <div class="mt-3 rounded-xl border border-white/10 bg-[#171F2A] p-3">
                        <div class="flex items-center justify-between">
                            <p class="text-xs font-semibold text-white">Pilih kursi</p>
                            <span class="text-[10px] text-gray-500">Studio 1</span>
                        </div>
                        <div class="mt-3 grid grid-cols-8 gap-1.5">
                            @for($i = 0; $i < 16; $i++)
                                <span class="flex aspect-square items-center justify-center rounded border {{ $i === 5 || $i === 10 ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-600 bg-gray-700/50 text-gray-500' }} text-[8px] font-bold">
                                    {{ $i === 5 || $i === 10 ? 'A' : '' }}
                                </span>
                            @endfor
                        </div>
                        <div class="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                            <span class="text-[10px] text-gray-500">2 kursi</span>
                            <span class="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white">Lanjut</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="border-t border-white/10 py-12">
            <div class="max-w-2xl">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Dua sisi Moview</p>
                <h2 class="mt-2 text-2xl font-bold text-white sm:text-3xl">Bahas filmnya, lalu nonton bareng.</h2>
                <p class="mt-2 text-sm text-gray-400">Dari menemukan film dan berdiskusi, sampai memilih kursi dan membawa tiket QR.</p>
            </div>

            <div class="mt-6 grid gap-5 lg:grid-cols-2">
                <article class="rounded-2xl border border-white/10 bg-[#171F2A] p-5 shadow-lg sm:p-6">
                    <div class="flex items-center gap-3">
                        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                            <i class="fas fa-users"></i>
                        </span>
                        <div>
                            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Sisi sosial</p>
                            <h3 class="text-lg font-bold text-white">Komunitas film</h3>
                        </div>
                    </div>
                    <div class="mt-5 grid gap-3 sm:grid-cols-2">
                        @foreach([
                            ['fa-star', 'Ulasan & rating', 'Tulis pendapat dan beri nilai film.'],
                            ['fa-comments', 'Komentar & like', 'Tanggapi ulasan dan aktivitas pengguna lain.'],
                            ['fa-user-group', 'Profil & follow', 'Ikuti teman dan lihat aktivitas mereka.'],
                            ['fa-heart', 'Film favorit & watchlist', 'Simpan film favorit dan daftar tonton.'],
                            ['fa-book-open', 'Diary film', 'Catat film yang sudah kamu tonton.'],
                            ['fa-magnifying-glass', 'Pencarian', 'Cari film, orang, studio, dan pengguna.'],
                        ] as [$icon, $title, $copy])
                            <div class="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                                <p class="flex items-center gap-2 text-sm font-semibold text-white">
                                    <i class="fas {{ $icon }} text-xs text-blue-300"></i> {{ $title }}
                                </p>
                                <p class="mt-1 text-xs leading-relaxed text-gray-400">{{ $copy }}</p>
                            </div>
                        @endforeach
                    </div>
                </article>

                <article class="rounded-2xl border border-white/10 bg-[#171F2A] p-5 shadow-lg sm:p-6">
                    <div class="flex items-center gap-3">
                        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
                            <i class="fas fa-ticket"></i>
                        </span>
                        <div>
                            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">Sisi tiket</p>
                            <h3 class="text-lg font-bold text-white">Nonton di bioskop</h3>
                        </div>
                    </div>
                    <div class="mt-5 grid gap-3 sm:grid-cols-2">
                        @foreach([
                            ['fa-film', 'Film sedang tayang', 'Temukan film dan jadwal bioskop.'],
                            ['fa-couch', 'Pilih kursi', 'Pilih posisi duduk dari denah studio.'],
                            ['fa-credit-card', 'Pembayaran', 'Selesaikan pembayaran tiket di aplikasi.'],
                            ['fa-qrcode', 'Tiket QR', 'Akses riwayat dan tiket untuk check-in.'],
                        ] as [$icon, $title, $copy])
                            <div class="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                                <p class="flex items-center gap-2 text-sm font-semibold text-white">
                                    <i class="fas {{ $icon }} text-xs text-green-300"></i> {{ $title }}
                                </p>
                                <p class="mt-1 text-xs leading-relaxed text-gray-400">{{ $copy }}</p>
                            </div>
                        @endforeach
                    </div>

                    <div class="mt-5 rounded-xl border border-green-400/20 bg-green-500/5 p-4">
                        <p class="text-sm font-semibold text-white">Siap mencoba?</p>
                        <p class="mt-1 text-xs text-gray-400">
                            Unduh aplikasi Android{{ $apkExists ? ' (' . $apkSize . ')' : '' }} dan masuk dengan akun Moview.
                        </p>
                        @if($apkExists)
                            <a href="{{ asset('downloads/moview.apk') }}" download
                               class="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-500">
                                <i class="fab fa-android mr-2"></i> Unduh APK
                            </a>
                        @else
                            <span class="mt-3 inline-flex min-h-[40px] cursor-not-allowed items-center rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-gray-500">
                                Segera hadir
                            </span>
                        @endif
                    </div>
                </article>
            </div>
        </section>
    </main>

    <footer class="relative z-10 border-t border-white/10">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
                <p class="text-sm font-bold text-white">Moview</p>
                <p class="mt-1 text-xs text-gray-500">Sosial film dan tiket bioskop dalam satu aplikasi.</p>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <a href="{{ route('admin.login') }}" class="transition hover:text-white">Masuk</a>
                @if($apkExists)
                    <a href="{{ asset('downloads/moview.apk') }}" download class="transition hover:text-white">Unduh Android</a>
                @endif
                <span>&copy; {{ date('Y') }} Moview</span>
            </div>
        </div>
    </footer>
</div>
@endsection
