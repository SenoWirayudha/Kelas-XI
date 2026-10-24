@extends('layouts.guest')

@section('title', 'Moview - Media Sosial Film & Tiket Bioskop')

@section('content')
@php
    $heroPoster = $heroMovie?->default_poster_path ? asset('storage/' . $heroMovie->default_poster_path) : null;
    $heroTitle = $heroMovie?->title ?? 'Judul Film';
    $heroStudio = $heroSchedule?->studio?->studio_name ?? 'Studio 1';
    $heroTime = $heroSchedule ? substr((string) $heroSchedule->show_time, 0, 5) : '19:30';
    $heroDate = $heroSchedule?->show_date?->locale('id')->isoFormat('D MMM') ?? now()->locale('id')->isoFormat('D MMM');
    $reviewUser = $review?->user;
    $reviewMovie = $review?->movie;
    $reviewQuote = $review?->content
        ? trim(strip_tags($review->content))
        : '';
    if (mb_strlen($reviewQuote) < 20) {
        $reviewQuote = 'Film ini punya ritme yang tenang, tapi setiap adegannya terasa sengaja ditempatkan. Layak dibicarakan setelah lampu bioskop menyala.';
    } else {
        $reviewQuote = \Illuminate\Support\Str::limit($reviewQuote, 220);
    }
    $curatorName = $curator?->username ?? 'Moview';
    $curatorHandle = $curator?->username ? '@' . $curator->username : '@moview';
@endphp

<div class="landing-page">
    <header class="landing-wrap landing-nav">
        <a href="{{ route('home') }}" class="landing-logo-link" aria-label="Moview">
            <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="landing-logo">
        </a>

        <nav class="landing-nav-links" aria-label="Navigasi landing">
            <a href="#tiket">Tiket</a>
            <a href="#komunitas">Komunitas</a>
            <a href="#aplikasi">Aplikasi</a>
        </nav>

        <a href="{{ route('admin.login') }}" class="landing-login">Masuk</a>
    </header>

    <main>
        <section class="landing-wrap hero-grid">
            <div>
                <span class="landing-tag reveal" data-reveal style="--delay:40ms">
                    <i class="fas fa-clapperboard"></i> Media sosial film + tiket bioskop
                </span>

                <h1 class="display hero-title">
                    <span class="reveal" data-reveal style="--delay:100ms">Tonton.</span>
                    <span class="reveal" data-reveal style="--delay:170ms">Bicarakan.</span>
                    <span class="hero-title-last reveal" data-reveal style="--delay:240ms">Ambil kursi terbaikmu.</span>
                </h1>

                <p class="hero-copy reveal" data-reveal style="--delay:320ms">
                    Ruang berbagi ulasan jujur dari sesama penikmat film, terhubung langsung dengan pemesanan tiket bioskop.
                </p>

                <div class="hero-actions reveal" data-reveal style="--delay:400ms">
                    <a href="{{ route('admin.login') }}" class="landing-btn landing-btn-primary">
                        <i class="fas fa-right-to-bracket"></i> Masuk
                    </a>

                    @if($apkExists)
                        <a href="{{ asset('downloads/moview.apk') }}" download class="landing-btn landing-btn-outline">
                            <i class="fas fa-download"></i> Unduh Aplikasi Android
                        </a>
                    @else
                        <span class="landing-btn landing-btn-disabled">
                            <i class="fas fa-download"></i> Segera hadir
                        </span>
                    @endif
                </div>

                <p class="hero-note reveal" data-reveal style="--delay:460ms">
                    @if($apkExists)
                        APK {{ $apkSize }}. Aktifkan instal dari sumber tidak dikenal.
                    @else
                        APK Android belum tersedia.
                    @endif
                </p>

                @if($stats['reviews'] > 0 || $stats['cinemas'] > 0)
                    <div class="stat-chip reveal" data-reveal style="--delay:520ms">
                        @if($stats['reviews'] > 0)
                            <span><strong data-count="{{ $stats['reviews'] }}">{{ number_format($stats['reviews'], 0, ',', '.') }}</strong> ulasan tercatat</span>
                        @endif
                        @if($stats['reviews'] > 0 && $stats['cinemas'] > 0)
                            <span class="stat-dot">·</span>
                        @endif
                        @if($stats['cinemas'] > 0)
                            <span><strong data-count="{{ $stats['cinemas'] }}">{{ number_format($stats['cinemas'], 0, ',', '.') }}</strong> bioskop</span>
                        @endif
                    </div>
                @endif
            </div>

            <div class="poster-stage reveal" data-reveal style="--delay:300ms">
                <div class="poster-float">
                    @php
                        $ghostLeft = $heroPosters->get(1);
                        $ghostRight = $heroPosters->get(2);
                    @endphp
                    <div class="poster-ghost poster-ghost-left">
                        @if($ghostLeft)
                            <img src="{{ $ghostLeft['poster_url'] }}" alt="Poster {{ $ghostLeft['title'] }}">
                        @endif
                    </div>
                    <div class="poster-ghost poster-ghost-right">
                        @if($ghostRight)
                            <img src="{{ $ghostRight['poster_url'] }}" alt="Poster {{ $ghostRight['title'] }}">
                        @endif
                    </div>

                    <div class="poster-shell">
                        <div class="poster-frame">
                            @if($heroPoster)
                                <img src="{{ $heroPoster }}" alt="Poster {{ $heroTitle }}">
                            @else
                                <div class="poster-fallback">
                                    <i class="fas fa-film"></i>
                                    <span>Poster film</span>
                                </div>
                            @endif
                        </div>

                        <div class="poster-stub">
                            <span class="example-badge">Contoh tampilan</span>
                            <p class="ticket-brand">Tiket Moview</p>
                            <h2>{{ $heroTitle }}</h2>
                            <p class="ticket-meta">{{ $heroStudio }} <span>·</span> {{ $heroTime }} <span>·</span> {{ $heroDate }}</p>
                            <div class="ticket-seat-line">
                                <span>KURSI <strong>H15</strong></span>
                                <span class="ticket-barcode" aria-hidden="true"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="landing-wrap">
            @include('partials.popular-carousel', ['popularMovies' => $popularMovies])
        </div>

        <section id="tiket" class="landing-band">
            <div class="landing-wrap section-pad">
                <div class="section-head section-head-center reveal" data-reveal>
                    <p class="section-kicker">Mekanisme reservasi</p>
                    <h2 class="display section-title">Dari ulasan langsung ke depan layar</h2>
                    <p class="section-sub">Pesan kursi favorit tanpa antre, langsung dari aplikasi.</p>
                </div>

                <div class="ticket-card reveal" data-reveal="ticket">
                    <span class="example-badge ticket-example">Contoh tampilan</span>

                    <div class="ticket-main">
                        <p class="ticket-brand">Tiket Moview</p>
                        <h3 class="display ticket-movie">{{ $heroTitle }}</h3>

                        <div class="ticket-info">
                            <div><span>Tanggal</span><strong>{{ $heroDate }}</strong></div>
                            <div><span>Pukul</span><strong>{{ $heroTime }}</strong></div>
                            <div><span>Bioskop</span><strong>{{ $heroSchedule?->studio?->cinema?->cinema_name ?? 'Moview Cinema' }}</strong></div>
                            <div><span>Studio</span><strong>{{ $heroStudio }}</strong></div>
                        </div>

                        <div class="ticket-seats">
                            <span>KURSI</span>
                            <strong>H15 &amp; H16</strong>
                        </div>

                        <div class="seat-map">
                            <p>LAYAR</p>
                            <div class="seat-screen"></div>
                            <div class="seat-grid">
                                @for($i = 1; $i <= 8; $i++)
                                    <span class="seat {{ $i === 5 ? 'seat-lit' : '' }}">{{ $i === 5 ? 'H15' : '' }}</span>
                                @endfor
                                @for($i = 9; $i <= 16; $i++)
                                    <span class="seat {{ $i === 10 ? 'seat-lit' : '' }}">{{ $i === 10 ? 'H16' : '' }}</span>
                                @endfor
                            </div>
                        </div>

                        <div class="ticket-total">
                            <div>
                                <span>Total bayar</span>
                                <strong>Rp 50.000 <small>/ tiket (x2)</small></strong>
                            </div>
                            <span class="ticket-confirmed"><i class="fas fa-check"></i> Terkonfirmasi</span>
                        </div>
                    </div>

                    <div class="ticket-stub">
                        <p class="admit">Admit two</p>
                        <p class="ticket-code">#MVW-0000-XXX</p>

                        <div class="qr-box">
                            <div class="qr-grid" aria-hidden="true">
                                @for($i = 0; $i < 81; $i++)
                                    @php
                                        $row = intdiv($i, 9);
                                        $col = $i % 9;
                                        $finder = ($row < 3 && $col < 3)
                                            || ($row < 3 && $col > 5)
                                            || ($row > 5 && $col < 3);
                                        $on = $finder || (($row * 7 + $col * 5 + $i) % 4 === 0);
                                    @endphp
                                    <span class="qr-cell {{ $on ? 'qr-on' : '' }}"></span>
                                @endfor
                            </div>
                            <span class="scan-line" aria-hidden="true"></span>
                        </div>

                        <p class="stub-note">Tunjukkan kode ini kepada petugas bioskop</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="komunitas" class="landing-wrap section-pad">
            <div class="community-head">
                <div class="reveal" data-reveal>
                    <p class="section-kicker">Ruang kritik &amp; log film</p>
                    <h2 class="display community-title">Komunitas yang menilai dengan rasa, bukan algoritma</h2>
                </div>
                <p class="community-sub reveal" data-reveal style="--delay:100ms">
                    Diskusikan film, ritme cerita, dan sinematografi bersama sesama penonton.
                </p>
            </div>

            <div class="community-grid">
                <article class="review-card reveal" data-reveal style="--delay:80ms">
                    <span class="example-badge">Contoh tampilan</span>
                    <p class="review-kicker">Ulasan teramai</p>

                    <div class="review-user">
                        <span class="avatar">{{ strtoupper(substr($reviewUser?->username ?? 'M', 0, 1)) }}</span>
                        <div>
                            <p>{{ $reviewUser?->username ?? 'Penonton Moview' }}</p>
                            <span>{{ $reviewUser?->username ? '@' . $reviewUser->username : '@moview' }}</span>
                        </div>
                    </div>

                    <div class="review-movie">
                        <div class="review-poster"
                             @if($reviewCard) data-movie-card='@json($reviewCard)' tabindex="0" role="button" aria-label="Lihat info {{ $reviewCard['title'] }}" @endif>
                            @if($reviewMovie?->default_poster_path)
                                <img src="{{ asset('storage/' . $reviewMovie->default_poster_path) }}" alt="Poster {{ $reviewMovie->title }}">
                            @else
                                <i class="fas fa-film"></i>
                            @endif
                        </div>
                        <div class="review-movie-info">
                            <p>{{ $reviewMovie?->title ?? 'Judul film' }}</p>
                            <span>{{ $reviewMovie?->release_year ?? '2026' }}</span>
                        </div>
                        <p class="review-rating"><i class="fas fa-star"></i> {{ number_format((float) ($review?->rating ?? 4.5), 1, ',', '.') }}<small>/5,0</small></p>
                    </div>

                    <p class="review-quote">{{ $reviewQuote }}</p>

                    <div class="review-footer">
                        <span><i class="fas fa-heart"></i> {{ number_format($reviewStats['likes'], 0, ',', '.') }}</span>
                        <span><i class="fas fa-comment"></i> {{ number_format($reviewStats['comments'], 0, ',', '.') }}</span>
                        <span><i class="fas fa-bookmark"></i> {{ number_format($reviewStats['saved'], 0, ',', '.') }}</span>
                    </div>
                </article>

                <article class="profile-card reveal" data-reveal style="--delay:180ms">
                    <span class="example-badge">Contoh tampilan</span>
                    <p class="section-kicker">Profil kurator</p>
                    <h3 class="profile-name">{{ $curatorName }}</h3>
                    <p class="profile-handle">{{ $curatorHandle }}</p>
                    <p class="profile-bio">Mencatat film yang ditonton, menulis ulasan, dan menyimpan tontonan berikutnya.</p>

                    <p class="profile-label">Top 4 film favorit</p>
                    <div class="favorite-grid">
                        @for($i = 0; $i < 4; $i++)
                            @php
                                $favorite = $favoritePosters->get($i);
                                $favoriteCard = $favoriteCards->get($i);
                            @endphp
                            <div class="favorite-poster"
                                 @if($favoriteCard) data-movie-card='@json($favoriteCard)' tabindex="0" role="button" aria-label="Lihat info {{ $favoriteCard['title'] }}" @endif>
                                @if($favorite?->default_poster_path)
                                    <img src="{{ asset('storage/' . $favorite->default_poster_path) }}" alt="Poster {{ $favorite->title }}">
                                @else
                                    <span>MV</span>
                                @endif
                            </div>
                        @endfor
                    </div>

                    <div class="profile-stats">
                        <div><strong data-count="{{ $curatorStats['watched'] }}">{{ number_format($curatorStats['watched'], 0, ',', '.') }}</strong><span>Ditonton</span></div>
                        <div><strong data-count="{{ $curatorStats['reviews'] }}">{{ number_format($curatorStats['reviews'], 0, ',', '.') }}</strong><span>Ulasan</span></div>
                        <div><strong data-count="{{ $curatorStats['watchlist'] }}">{{ number_format($curatorStats['watchlist'], 0, ',', '.') }}</strong><span>Daftar</span></div>
                    </div>
                </article>
            </div>
        </section>

        <section id="aplikasi" class="landing-band">
            <div class="landing-wrap section-pad">
                <div class="download-card reveal" data-reveal>
                    <div class="download-copy">
                        <p class="section-kicker">Aplikasi Android</p>
                        <h2 class="display download-title">Bawa sinema dalam sakumu.</h2>
                        <p class="download-sub">Beli tiket dan berbagi ulasan film kapan saja lewat aplikasi Android.</p>
                    </div>

                    <div class="download-action">
                        @if($apkExists)
                            <a href="{{ asset('downloads/moview.apk') }}" download class="landing-btn landing-btn-primary">
                                <i class="fab fa-android"></i> Unduh APK Android{{ $appVersion ? ' (V' . $appVersion . ')' : '' }}
                            </a>
                        @else
                            <span class="landing-btn landing-btn-disabled"><i class="fab fa-android"></i> Segera hadir</span>
                        @endif
                        @if($minSdk)
                            <p class="compat"><i class="fas fa-mobile-screen"></i> Kompatibel dengan Android {{ $minSdk }} ke atas</p>
                        @endif
                    </div>
                </div>

                <div class="steps-grid">
                    <article class="step-card reveal" data-reveal style="--delay:80ms">
                        <span class="step-index">Langkah 1/3</span>
                        <p class="step-number">01</p>
                        <h3>Unduh berkas APK</h3>
                        <p>{{ $apkExists ? 'Berkas ' . $apkSize . ' tersedia untuk diunduh.' : 'Berkas APK belum tersedia.' }}</p>
                    </article>
                    <article class="step-card reveal" data-reveal style="--delay:180ms">
                        <span class="step-index">Langkah 2/3</span>
                        <p class="step-number">02</p>
                        <h3>Izinkan sumber luar</h3>
                        <p>Buka Pengaturan Android &gt; Keamanan, lalu aktifkan instal dari sumber tidak dikenal.</p>
                    </article>
                    <article class="step-card reveal" data-reveal style="--delay:280ms">
                        <span class="step-index">Langkah 3/3</span>
                        <p class="step-number">03</p>
                        <h3>Mulai catat &amp; pesan</h3>
                        <p>Masuk atau buat akun, pilih film, lalu pesan tiket bioskop.</p>
                    </article>
                </div>
            </div>
        </section>
    </main>

    <footer class="landing-footer">
        <div class="landing-wrap footer-inner">
            <a href="{{ route('home') }}" aria-label="Moview">
                <img src="{{ asset('text-logo-moview.png') }}" alt="Moview" class="footer-logo">
            </a>
            <p>&copy; {{ date('Y') }} Moview</p>
        </div>
    </footer>
</div>

<style>
    html { scroll-behavior: smooth; }
    .landing-page {
        --landing-band: #121821;
        background:
            radial-gradient(circle at 78% 12%, rgba(19, 91, 236, 0.13), transparent 28%),
            radial-gradient(circle at 8% 38%, rgba(19, 91, 236, 0.08), transparent 24%),
            var(--mv-background);
        color: var(--mv-text);
        overflow: hidden;
    }
    .landing-wrap {
        width: min(1180px, calc(100% - 40px));
        margin-inline: auto;
    }
    .landing-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding-block: 24px;
    }
    .landing-logo { height: 30px; width: auto; }
    .landing-logo-link { display: inline-flex; align-items: center; }
    .landing-nav-links { display: flex; align-items: center; gap: 30px; }
    .landing-nav-links a {
        color: var(--mv-text-secondary);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        transition: color 180ms ease;
    }
    .landing-nav-links a:hover { color: var(--mv-text); }
    .landing-login {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--mv-border);
        border-radius: 8px;
        padding: 0 18px;
        color: var(--mv-text);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        transition: border-color 180ms ease, background 180ms ease;
    }
    .landing-login:hover { border-color: var(--mv-primary); background: var(--mv-primary-soft); }

    .display {
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        font-weight: 800;
        letter-spacing: -0.055em;
        line-height: 0.94;
        text-transform: uppercase;
    }
    .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.12fr) minmax(300px, 0.88fr);
        align-items: center;
        gap: clamp(36px, 6vw, 80px);
        padding-block: clamp(34px, 5vw, 68px) clamp(58px, 7vw, 96px);
    }
    .landing-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(19, 91, 236, 0.32);
        border-radius: 999px;
        background: rgba(19, 91, 236, 0.1);
        padding: 7px 11px;
        color: #8db7ff;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }
    .hero-title {
        margin-top: 22px;
        font-size: clamp(2.55rem, 5.4vw, 5.15rem);
    }
    .hero-title > span { display: block; }
    .hero-title-last {
        font-size: 0.68em;
        letter-spacing: -0.06em;
        line-height: 0.98;
    }
    .hero-copy {
        max-width: 590px;
        margin-top: 24px;
        color: var(--mv-text-secondary);
        font-size: clamp(15px, 1.35vw, 18px);
        line-height: 1.7;
    }
    .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
    }
    .landing-btn {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border-radius: 9px;
        padding: 0 22px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }
    .landing-btn:hover { transform: translateY(-2px); }
    .landing-btn-primary {
        background: var(--mv-primary);
        color: #fff;
        box-shadow: 0 12px 30px rgba(19, 91, 236, 0.24);
    }
    .landing-btn-primary:hover { background: var(--mv-primary-hover); box-shadow: 0 16px 38px rgba(19, 91, 236, 0.32); }
    .landing-btn-outline {
        border: 1px solid var(--mv-border);
        background: rgba(255, 255, 255, 0.025);
        color: var(--mv-text);
    }
    .landing-btn-outline:hover { border-color: rgba(19, 91, 236, 0.6); background: var(--mv-primary-soft); }
    .landing-btn-disabled { border: 1px solid var(--mv-border-subtle); color: var(--mv-text-muted); cursor: not-allowed; }
    .hero-note { margin-top: 12px; color: var(--mv-text-muted); font-size: 10px; }
    .stat-chip {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 18px;
        border: 1px solid var(--mv-border-subtle);
        border-radius: 999px;
        background: rgba(30, 37, 48, 0.7);
        padding: 8px 12px;
        color: var(--mv-text-secondary);
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .stat-chip strong { color: var(--mv-text); font-size: 12px; }
    .stat-dot { color: var(--mv-border); }

    .poster-stage { position: relative; width: 100%; max-width: 390px; margin-inline: auto; }
    .poster-float { animation: posterFloat 10s ease-in-out infinite; }
    .poster-ghost {
        position: absolute;
        top: 34px;
        width: 64%;
        aspect-ratio: 2 / 3;
        border: 1px solid var(--mv-border);
        border-radius: 16px;
        background: linear-gradient(160deg, #202a38, #111821);
        opacity: 0.35;
    }
    .poster-ghost img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
    .poster-ghost-left { left: -7%; transform: rotate(-10deg); }
    .poster-ghost-right { right: -6%; transform: rotate(9deg); opacity: 0.24; }
    .poster-shell { position: relative; z-index: 2; }
    .poster-frame {
        position: relative;
        width: 100%;
        aspect-ratio: 2 / 3;
        overflow: hidden;
        border: 1px solid var(--mv-border);
        border-radius: 18px;
        background: linear-gradient(160deg, #263140, #111821);
        box-shadow: 0 30px 70px rgba(0, 0, 0, 0.48);
        transform: rotate(-3deg);
        transition: transform 320ms ease;
    }
    .poster-frame:hover { transform: rotate(0deg) translateY(-6px); }
    .poster-frame img { width: 100%; height: 100%; object-fit: cover; }
    .poster-fallback {
        display: flex;
        height: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--mv-text-muted);
        font-size: 10px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }
    .poster-fallback i { font-size: 42px; color: var(--mv-border); }
    .poster-stub {
        position: relative;
        z-index: 3;
        margin: -18px 14px 0;
        border: 1px solid var(--mv-border);
        border-radius: 0 0 13px 13px;
        background: var(--mv-card);
        padding: 16px 16px 14px;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
    }
    .poster-stub::before,
    .poster-stub::after {
        content: '';
        position: absolute;
        top: -9px;
        width: 18px;
        height: 18px;
        border: 1px solid var(--mv-border);
        border-radius: 50%;
        background: var(--mv-background);
    }
    .poster-stub::before { left: -10px; }
    .poster-stub::after { right: -10px; }
    .example-badge {
        display: inline-block;
        border: 1px solid var(--mv-border-subtle);
        border-radius: 999px;
        background: rgba(15, 20, 25, 0.55);
        padding: 3px 7px;
        color: var(--mv-text-muted);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }
    .poster-stub .example-badge { margin-bottom: 8px; }
    .ticket-brand {
        color: var(--mv-primary);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
    }
    .poster-stub h2 {
        margin-top: 4px;
        overflow-wrap: anywhere;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.03em;
        text-transform: uppercase;
    }
    .ticket-meta { margin-top: 3px; color: var(--mv-text-secondary); font-size: 10px; }
    .ticket-meta span { margin-inline: 3px; color: var(--mv-border); }
    .ticket-seat-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 10px;
        border-top: 1px dashed var(--mv-border);
        padding-top: 9px;
        color: var(--mv-text-muted);
        font-size: 8px;
        letter-spacing: 0.1em;
    }
    .ticket-seat-line strong { color: var(--mv-text); font-size: 11px; }
    .ticket-barcode {
        width: 72px;
        height: 16px;
        background: repeating-linear-gradient(90deg, var(--mv-text-secondary) 0 1px, transparent 1px 3px, var(--mv-text-secondary) 3px 5px, transparent 5px 7px);
        opacity: 0.7;
    }

    .landing-band {
        border-block: 1px solid var(--mv-border-subtle);
        background: var(--landing-band);
    }
    .section-pad { padding-block: clamp(58px, 7vw, 88px); }
    .section-head-center { max-width: 760px; margin-inline: auto; text-align: center; }
    .section-kicker {
        color: var(--mv-primary);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
    }
    .section-title { margin-top: 8px; font-size: clamp(1.9rem, 3.6vw, 3.3rem); }
    .section-sub { margin-top: 12px; color: var(--mv-text-secondary); font-size: 14px; line-height: 1.7; }

    .ticket-card {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        max-width: 1000px;
        margin: 32px auto 0;
        overflow: hidden;
        border: 1px solid var(--mv-border);
        border-radius: 22px;
        background: var(--mv-card);
        box-shadow: 0 30px 70px rgba(0, 0, 0, 0.28);
    }
    .ticket-card::before,
    .ticket-card::after {
        content: '';
        position: absolute;
        z-index: 4;
        top: 50%;
        width: 22px;
        height: 22px;
        border: 1px solid var(--mv-border);
        border-radius: 50%;
        background: var(--landing-band);
        transform: translateY(-50%);
    }
    .ticket-card::before { left: calc(100% - 280px - 11px); }
    .ticket-card::after { right: calc(280px - 11px); }
    .ticket-example { position: absolute; z-index: 5; top: 16px; right: 300px; }
    .ticket-main { padding: 28px; }
    .ticket-movie { margin-top: 4px; overflow-wrap: anywhere; font-size: clamp(1.7rem, 3vw, 2.5rem); }
    .ticket-info {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 22px;
        margin-top: 20px;
    }
    .ticket-info span { display: block; color: var(--mv-text-muted); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .ticket-info strong { display: block; margin-top: 2px; color: var(--mv-text); font-size: 12px; }
    .ticket-seats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 18px;
        border-top: 1px dashed var(--mv-border);
        padding-top: 14px;
        color: var(--mv-text-muted);
        font-size: 9px;
        letter-spacing: 0.12em;
    }
    .ticket-seats strong { color: var(--mv-text); font-size: 14px; letter-spacing: 0.04em; }
    .seat-map { margin-top: 16px; border: 1px solid var(--mv-border-subtle); border-radius: 10px; background: #0d131a; padding: 10px; }
    .seat-map > p { text-align: center; color: var(--mv-text-muted); font-size: 7px; font-weight: 700; letter-spacing: 0.25em; }
    .seat-screen { height: 3px; width: 54%; margin: 7px auto 12px; border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(19, 91, 236, 0.85), transparent); }
    .seat-grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 5px; }
    .seat {
        display: flex;
        aspect-ratio: 1;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--mv-border);
        border-radius: 3px;
        background: #19222e;
        color: transparent;
        font-size: 6px;
        font-weight: 700;
    }
    .seat-lit { border-color: var(--mv-primary); background: var(--mv-primary); color: #fff; }
    .ticket-total { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 16px; }
    .ticket-total span { display: block; color: var(--mv-text-muted); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .ticket-total strong { display: block; margin-top: 2px; color: var(--mv-text); font-size: 18px; }
    .ticket-total small { color: var(--mv-text-secondary); font-size: 10px; font-weight: 500; }
    .ticket-confirmed {
        display: inline-flex !important;
        align-items: center;
        gap: 5px;
        border: 1px solid rgba(76, 175, 80, 0.35);
        border-radius: 999px;
        background: rgba(76, 175, 80, 0.1);
        padding: 5px 8px;
        color: #74d478 !important;
        font-size: 7px !important;
        letter-spacing: 0.1em !important;
    }
    .ticket-stub {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-left: 1px dashed var(--mv-border);
        background: rgba(15, 20, 25, 0.36);
        padding: 28px 22px;
        text-align: center;
    }
    .admit { color: var(--mv-text-muted); font-size: 8px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; }
    .ticket-code { margin-top: 7px; color: var(--mv-text); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; }
    .qr-box {
        position: relative;
        width: 154px;
        height: 154px;
        margin-top: 20px;
        overflow: hidden;
        border-radius: 8px;
        background: #fff;
        padding: 10px;
    }
    .qr-grid { display: grid; width: 100%; height: 100%; grid-template-columns: repeat(9, 1fr); gap: 1px; }
    .qr-cell { background: transparent; }
    .qr-on { background: #0f1419; }
    .scan-line {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 1px;
        background: var(--mv-primary);
        box-shadow: 0 0 10px rgba(19, 91, 236, 0.9);
        opacity: 0;
    }
    .stub-note { max-width: 180px; margin-top: 16px; color: var(--mv-text-muted); font-size: 9px; line-height: 1.5; }

    .community-head {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.7fr);
        align-items: end;
        gap: 32px;
    }
    .community-title { margin-top: 8px; max-width: 760px; font-size: clamp(2rem, 4vw, 3.6rem); }
    .community-sub { color: var(--mv-text-secondary); font-size: 14px; line-height: 1.7; }
    .community-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.14fr) minmax(0, 0.86fr);
        gap: 20px;
        margin-top: 34px;
        align-items: start;
    }
    .review-card,
    .profile-card {
        position: relative;
        border: 1px solid var(--mv-border);
        border-radius: 18px;
        background: var(--mv-card);
        padding: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    }
    .review-card > .example-badge,
    .profile-card > .example-badge { position: absolute; top: 18px; right: 18px; }
    .review-kicker {
        color: var(--mv-primary);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }
    .review-kicker + .review-user { margin-top: 14px; }
    .review-user { display: flex; align-items: center; gap: 11px; padding-right: 90px; }
    .avatar {
        display: flex;
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--mv-primary-soft);
        color: #8db7ff;
        font-size: 16px;
        font-weight: 800;
    }
    .review-user p { font-size: 13px; font-weight: 700; }
    .review-user div span { color: var(--mv-text-muted); font-size: 10px; }
    .review-movie { display: flex; align-items: center; gap: 10px; margin-top: 20px; border-block: 1px solid var(--mv-border-subtle); padding-block: 12px; }
    .review-poster { display: flex; width: 38px; height: 54px; flex-shrink: 0; align-items: center; justify-content: center; overflow: hidden; border-radius: 5px; background: #121821; color: var(--mv-border); }
    .review-poster[data-movie-card] { cursor: pointer; }
    .review-poster[data-movie-card]:focus-visible { outline: 2px solid var(--mv-primary); outline-offset: 2px; }
    .review-poster img { width: 100%; height: 100%; object-fit: cover; }
    .review-movie-info { min-width: 0; flex: 1; }
    .review-movie-info p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 700; }
    .review-movie-info span { color: var(--mv-text-muted); font-size: 10px; }
    .review-rating { flex-shrink: 0; color: var(--mv-gold); font-size: 12px; font-weight: 800; }
    .review-rating small { color: var(--mv-text-muted); font-size: 8px; font-weight: 500; }
    .review-quote { margin-top: 16px; color: var(--mv-text-secondary); font-size: 13px; line-height: 1.7; }
    .review-footer { display: flex; gap: 18px; margin-top: 18px; border-top: 1px solid var(--mv-border-subtle); padding-top: 13px; color: var(--mv-text-muted); font-size: 10px; }
    .review-footer i { margin-right: 4px; }
    .profile-card { padding-top: 30px; }
    .profile-name { margin-top: 12px; overflow-wrap: anywhere; font-size: 23px; font-weight: 800; letter-spacing: -0.03em; }
    .profile-handle { color: var(--mv-primary); font-size: 11px; }
    .profile-bio { margin-top: 10px; color: var(--mv-text-secondary); font-size: 12px; line-height: 1.6; }
    .profile-label { margin-top: 20px; color: var(--mv-text-muted); font-size: 8px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
    .favorite-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }
    .favorite-poster {
        display: flex;
        aspect-ratio: 2 / 3;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid var(--mv-border-subtle);
        border-radius: 5px;
        background: #121821;
        color: var(--mv-border);
        font-size: 10px;
        font-weight: 800;
        transition: transform 200ms ease, border-color 200ms ease;
    }
    .favorite-poster[data-movie-card] { cursor: pointer; }
    .favorite-poster:hover,
    .favorite-poster:focus-visible { transform: translateY(-4px); border-color: var(--mv-primary); outline: none; }
    .favorite-poster img { width: 100%; height: 100%; object-fit: cover; }
    .profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 20px; border-top: 1px solid var(--mv-border-subtle); padding-top: 14px; text-align: center; }
    .profile-stats strong { display: block; font-size: 19px; font-weight: 800; }
    .profile-stats span { color: var(--mv-text-muted); font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; }

    .download-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        border: 1px solid rgba(19, 91, 236, 0.28);
        border-radius: 22px;
        background:
            radial-gradient(circle at 85% 15%, rgba(19, 91, 236, 0.22), transparent 34%),
            var(--mv-card);
        padding: clamp(24px, 4vw, 40px);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
    }
    .download-title { margin-top: 8px; font-size: clamp(2rem, 4vw, 3.4rem); }
    .download-sub { max-width: 560px; margin-top: 10px; color: var(--mv-text-secondary); font-size: 14px; line-height: 1.7; }
    .download-action { flex-shrink: 0; text-align: right; }
    .compat { margin-top: 10px; color: var(--mv-text-muted); font-size: 9px; }
    .compat i { margin-right: 4px; color: var(--mv-primary); }
    .steps-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .step-card { position: relative; border: 1px solid var(--mv-border-subtle); border-radius: 14px; background: rgba(30, 37, 48, 0.7); padding: 20px; }
    .step-index { color: var(--mv-text-muted); font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .step-number { margin-top: 14px; color: var(--mv-primary); font-size: 28px; font-weight: 800; letter-spacing: -0.04em; }
    .step-card h3 { margin-top: 4px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .step-card p:last-child { margin-top: 7px; color: var(--mv-text-secondary); font-size: 12px; line-height: 1.6; }

    .landing-footer { border-top: 1px solid var(--mv-border-subtle); }
    .footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-block: 28px; }
    .footer-logo { height: 24px; width: auto; }
    .footer-inner p { color: var(--mv-text-muted); font-size: 11px; }

    .landing-js .reveal {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 520ms ease, transform 520ms ease;
        transition-delay: var(--delay, 0ms);
    }
    .landing-js .reveal.is-visible { opacity: 1; transform: translateY(0); }
    .landing-js [data-reveal="ticket"] { transform: translateY(48px); }
    .landing-js [data-reveal="ticket"].is-visible { transform: translateY(0); }
    .ticket-card.is-visible .seat-lit { animation: seatPulse 1100ms ease 450ms 1; }
    .ticket-card.is-visible .scan-line { animation: scanSweep 1400ms ease 800ms 1; }
    @keyframes seatPulse {
        0%, 100% { box-shadow: none; }
        38% { box-shadow: 0 0 0 4px rgba(19, 91, 236, 0.2), 0 0 18px rgba(19, 91, 236, 0.8); }
    }
    @keyframes scanSweep {
        0% { transform: translateY(0); opacity: 0; }
        12% { opacity: 1; }
        82% { opacity: 1; }
        100% { transform: translateY(134px); opacity: 0; }
    }
    @keyframes posterFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
    }

    @media (max-width: 900px) {
        .landing-nav-links { display: none; }
        .hero-grid { grid-template-columns: 1fr; }
        .poster-stage { max-width: 360px; }
        .community-head { grid-template-columns: 1fr; gap: 12px; }
        .community-grid { grid-template-columns: 1fr; }
        .ticket-card { grid-template-columns: 1fr; }
        .ticket-card::before,
        .ticket-card::after { display: none; }
        .ticket-example { right: 16px; }
        .ticket-stub { border-top: 1px dashed var(--mv-border); border-left: 0; }
        .download-card { align-items: flex-start; flex-direction: column; }
        .download-action { text-align: left; }
        .steps-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
        .landing-wrap { width: min(1180px, calc(100% - 32px)); }
        .landing-nav { padding-block: 18px; }
        .landing-logo { height: 25px; }
        .landing-login { min-height: 40px; padding-inline: 14px; }
        .hero-grid { gap: 34px; padding-top: 26px; }
        .hero-title { font-size: clamp(2.3rem, 12vw, 3.5rem); }
        .hero-title-last { font-size: 0.64em; }
        .hero-copy { font-size: 14px; }
        .hero-actions .landing-btn { width: 100%; }
        .poster-stage { max-width: 310px; }
        .ticket-main,
        .ticket-stub { padding: 20px; }
        .ticket-info { gap: 10px 14px; }
        .ticket-movie { font-size: 1.6rem; }
        .ticket-total { align-items: flex-start; flex-direction: column; }
        .review-card,
        .profile-card { padding: 20px; }
        .review-user { padding-right: 80px; }
        .footer-inner { align-items: flex-start; flex-direction: column; gap: 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .reveal,
        [data-reveal="ticket"] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
        }
        .poster-float,
        .ticket-card.is-visible .seat-lit,
        .ticket-card.is-visible .scan-line { animation: none !important; }
        .poster-frame,
        .landing-btn,
        .favorite-poster { transition: none !important; }
        .poster-frame:hover,
        .landing-btn:hover,
        .favorite-poster:hover { transform: none !important; }
    }
</style>

<script>
(function () {
    document.documentElement.classList.add('landing-js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
    const counters = Array.from(document.querySelectorAll('[data-count]'));

    const setCounter = (el, value) => {
        el.textContent = new Intl.NumberFormat('id-ID').format(value);
    };

    const animateCounter = (el) => {
        if (el.dataset.counted === '1') return;
        el.dataset.counted = '1';

        const target = Number(el.dataset.count || 0);
        if (reduceMotion || target <= 0) {
            setCounter(el, target);
            return;
        }

        const duration = 900;
        const start = performance.now();
        el.textContent = '0';

        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounter(el, Math.round(target * eased));

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                setCounter(el, target);
            }
        };

        requestAnimationFrame(tick);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('is-visible'));
        counters.forEach((el) => setCounter(el, Number(el.dataset.count || 0)));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14 });

    reveals.forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    counters.forEach((el) => counterObserver.observe(el));
})();
</script>
@endsection
