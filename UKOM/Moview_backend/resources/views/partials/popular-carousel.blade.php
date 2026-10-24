@php
    $carouselMovies = collect($popularMovies ?? []);
    $copies = max(1, (int) ceil(6 / max(1, $carouselMovies->count())));
    $carouselItems = collect();

    for ($copy = 0; $copy < $copies; $copy++) {
        $carouselItems = $carouselItems->concat($carouselMovies);
    }

    $duration = max(28, $carouselMovies->count() * 7);
@endphp

@if($carouselMovies->isNotEmpty())
    <section class="popular-section" aria-labelledby="popular-heading">
        <div class="popular-heading-row">
            <div>
                <p class="popular-kicker">Pilihan penonton</p>
                <h2 id="popular-heading" class="popular-heading">Film terpopuler minggu ini</h2>
            </div>
            <p class="popular-count">{{ $carouselMovies->count() }} film</p>
        </div>

        <div class="popular-carousel" data-popular-carousel>
            <div class="popular-track" data-popular-track style="--popular-duration: {{ $duration }}s">
                <div class="popular-group">
                    @foreach($carouselItems as $index => $movie)
                        <article class="popular-item">
                            <button type="button"
                                    class="popular-poster"
                                    data-movie-card='@json($movie)'
                                    aria-label="{{ $movie['title'] }}">
                                <span class="popular-number">{{ str_pad((string) (($index % $carouselMovies->count()) + 1), 2, '0', STR_PAD_LEFT) }}</span>
                                @if($movie['poster_url'])
                                    <img src="{{ $movie['poster_url'] }}" alt="Poster {{ $movie['title'] }}" loading="lazy">
                                @else
                                    <span class="popular-fallback"><i class="fas fa-film"></i></span>
                                @endif
                            </button>
                            <h3 class="popular-title">{{ $movie['title'] }}</h3>
                        </article>
                    @endforeach
                </div>

                <div class="popular-group" aria-hidden="true">
                    @foreach($carouselItems as $index => $movie)
                        <article class="popular-item">
                            <div class="popular-poster" data-movie-card='@json($movie)'>
                                <span class="popular-number">{{ str_pad((string) (($index % $carouselMovies->count()) + 1), 2, '0', STR_PAD_LEFT) }}</span>
                                @if($movie['poster_url'])
                                    <img src="{{ $movie['poster_url'] }}" alt="" loading="lazy">
                                @else
                                    <span class="popular-fallback"><i class="fas fa-film"></i></span>
                                @endif
                            </div>
                            <h3 class="popular-title">{{ $movie['title'] }}</h3>
                        </article>
                    @endforeach
                </div>
            </div>
        </div>
    </section>

    <div id="movie-hover-card" class="movie-hover-card" role="tooltip" aria-hidden="true">
        <div class="movie-hover-media"></div>
        <div class="movie-hover-body">
            <h3 class="movie-hover-title"></h3>
            <p class="movie-hover-meta"></p>
            <p class="movie-hover-director"></p>
            <p class="movie-hover-synopsis"></p>
        </div>
    </div>

    <style>
        .popular-section { margin-top: clamp(20px, 3vw, 34px); }
        .popular-heading-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 18px;
        }
        .popular-kicker {
            color: var(--mv-primary);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.2em;
            text-transform: uppercase;
        }
        .popular-heading {
            margin-top: 5px;
            color: var(--mv-text);
            font-size: clamp(1.25rem, 2.2vw, 1.9rem);
            font-weight: 800;
            letter-spacing: -0.04em;
            text-transform: uppercase;
        }
        .popular-count { flex-shrink: 0; color: var(--mv-text-muted); font-size: 10px; }
        .popular-carousel {
            position: relative;
            overflow: hidden;
            padding-block: 5px 12px;
            mask-image: linear-gradient(90deg, transparent, #000 2%, #000 98%, transparent);
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 2%, #000 98%, transparent);
        }
        .popular-track {
            display: flex;
            width: max-content;
            animation: popularMarquee var(--popular-duration, 42s) linear infinite;
            will-change: transform;
        }
        .popular-carousel:hover .popular-track,
        .popular-carousel:focus-within .popular-track { animation-play-state: paused; }
        .popular-group {
            display: flex;
            flex-shrink: 0;
            gap: 14px;
            padding-right: 14px;
        }
        .popular-item {
            width: clamp(126px, 13.5vw, 166px);
            flex-shrink: 0;
        }
        .popular-poster {
            position: relative;
            display: block;
            width: 100%;
            aspect-ratio: 2 / 3;
            overflow: hidden;
            border: 1px solid var(--mv-border);
            border-radius: 12px;
            background: linear-gradient(160deg, #263140, #111821);
            box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28);
            cursor: pointer;
            transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
        }
        button.popular-poster { padding: 0; text-align: left; }
        .popular-poster:hover,
        .popular-poster:focus-visible {
            transform: translateY(-5px);
            border-color: rgba(19, 91, 236, 0.7);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.36);
            outline: none;
        }
        .popular-poster img { width: 100%; height: 100%; object-fit: cover; }
        .popular-fallback {
            display: flex;
            height: 100%;
            align-items: center;
            justify-content: center;
            color: var(--mv-border);
            font-size: 28px;
        }
        .popular-number {
            position: absolute;
            z-index: 2;
            top: 8px;
            left: 8px;
            display: flex;
            min-width: 24px;
            height: 24px;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 6px;
            background: rgba(15, 20, 25, 0.78);
            color: var(--mv-text);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.04em;
            backdrop-filter: blur(6px);
        }
        .popular-title {
            display: -webkit-box;
            overflow: hidden;
            margin-top: 8px;
            color: var(--mv-text);
            font-size: 11px;
            font-weight: 600;
            line-height: 1.35;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
        @keyframes popularMarquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }

        .movie-hover-card {
            position: fixed;
            z-index: 120;
            width: 360px;
            max-width: calc(100vw - 24px);
            overflow: hidden;
            border: 1px solid var(--mv-border);
            border-radius: 28px;
            background: var(--mv-card);
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(5px) scale(0.96);
            transform-origin: center;
            transition: opacity 170ms ease, transform 170ms ease, visibility 170ms ease;
        }
        .movie-hover-card.is-visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0) scale(1);
        }
        .movie-hover-media {
            width: 100%;
            aspect-ratio: 16 / 9;
            background: linear-gradient(160deg, #263140, #111821);
        }
        .movie-hover-media img { width: 100%; height: 100%; object-fit: cover; }
        .movie-hover-body { padding: 15px 18px 18px; }
        .movie-hover-title {
            color: var(--mv-text);
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.035em;
            line-height: 1.12;
        }
        .movie-hover-title small {
            margin-left: 4px;
            color: var(--mv-text-muted);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0;
        }
        .movie-hover-meta {
            margin-top: 7px;
            color: var(--mv-text-secondary);
            font-size: 11px;
            line-height: 1.5;
        }
        .movie-hover-meta .hover-star { margin-right: 3px; color: #5B9BFF; }
        .movie-hover-director {
            margin-top: 8px;
            color: var(--mv-text);
            font-size: 11px;
            font-weight: 600;
        }
        .movie-hover-director span { color: var(--mv-text); font-weight: 600; }
        .movie-hover-synopsis {
            display: -webkit-box;
            overflow: hidden;
            margin-top: 7px;
            color: var(--mv-text-secondary);
            font-size: 11px;
            line-height: 1.55;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
        }
        .movie-hover-meta:empty,
        .movie-hover-director:empty,
        .movie-hover-synopsis:empty { display: none; }

        @media (hover: none) {
            .movie-hover-card { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
            .popular-carousel {
                overflow-x: auto;
                padding-bottom: 14px;
                mask-image: none;
                -webkit-mask-image: none;
            }
            .popular-track { animation: none !important; }
            .popular-group[aria-hidden="true"] { display: none; }
            .popular-poster,
            .movie-hover-card { transition: none !important; }
            .popular-poster:hover,
            .popular-poster:focus-visible { transform: none; }
        }
    </style>

    <script>
    (function () {
        const carousel = document.querySelector('[data-popular-carousel]');
        if (carousel && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            carousel.setAttribute('tabindex', '0');
            carousel.setAttribute('aria-label', 'Daftar film terpopuler, geser untuk melihat lainnya');
        }

        if (!window.matchMedia('(hover: hover)').matches) return;

        const card = document.getElementById('movie-hover-card');
        if (!card) return;

        const media = card.querySelector('.movie-hover-media');
        const title = card.querySelector('.movie-hover-title');
        const meta = card.querySelector('.movie-hover-meta');
        const director = card.querySelector('.movie-hover-director');
        const synopsis = card.querySelector('.movie-hover-synopsis');

        let showTimer = null;
        let hideTimer = null;
        let activeTarget = null;

        const clearTimers = () => {
            window.clearTimeout(showTimer);
            window.clearTimeout(hideTimer);
            showTimer = null;
            hideTimer = null;
        };

        const fillCard = (data) => {
            media.replaceChildren();

            const imageUrl = data.backdrop_url || data.poster_url;
            media.hidden = !imageUrl;
            if (imageUrl) {
                const image = document.createElement('img');
                image.src = imageUrl;
                image.alt = '';
                media.appendChild(image);
            }

            title.replaceChildren(document.createTextNode(data.title || ''));
            if (data.year) {
                const year = document.createElement('small');
                year.textContent = '(' + data.year + ')';
                title.appendChild(year);
            }

            meta.replaceChildren();
            const parts = [];
            if (Number(data.rating) > 0) {
                parts.push({ star: true, text: Number(data.rating).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '/5' });
            }
            if (Number(data.duration) > 0) parts.push({ text: data.duration + ' menit' });
            if (data.genres) parts.push({ text: data.genres });

            parts.forEach((part, index) => {
                if (index > 0) meta.appendChild(document.createTextNode(' • '));
                if (part.star) {
                    const star = document.createElement('span');
                    star.className = 'hover-star';
                    star.textContent = '★';
                    meta.appendChild(star);
                }
                meta.appendChild(document.createTextNode(part.text));
            });

            director.replaceChildren();
            if (data.director) {
                director.appendChild(document.createTextNode('Sutradara: '));
                const name = document.createElement('span');
                name.textContent = data.director;
                director.appendChild(name);
            }

            synopsis.textContent = data.synopsis || '';
        };

        const positionCard = (target) => {
            const rect = target.getBoundingClientRect();
            const margin = 12;
            const cardWidth = card.offsetWidth;
            const cardHeight = card.offsetHeight;
            let left = rect.right + margin;
            let top = rect.top + (rect.height / 2) - (cardHeight / 2);

            if (left + cardWidth > window.innerWidth - margin) {
                left = rect.left - cardWidth - margin;
            }

            if (left < margin) {
                left = Math.min(
                    Math.max(margin, rect.left + (rect.width / 2) - (cardWidth / 2)),
                    window.innerWidth - cardWidth - margin
                );
                top = rect.top - cardHeight - margin;
                if (top < margin) top = rect.bottom + margin;
            }

            top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));

            card.style.left = Math.round(left) + 'px';
            card.style.top = Math.round(top) + 'px';
        };

        const showCard = (target) => {
            if (activeTarget === target && (showTimer || card.classList.contains('is-visible'))) return;

            let data;
            try {
                data = JSON.parse(target.getAttribute('data-movie-card') || '{}');
            } catch (_) {
                return;
            }

            if (!data.title) return;

            clearTimers();
            activeTarget = target;
            fillCard(data);

            showTimer = window.setTimeout(() => {
                if (activeTarget !== target) return;
                card.classList.add('is-visible');
                card.setAttribute('aria-hidden', 'false');
                positionCard(target);
            }, 200);
        };

        const hideCard = () => {
            clearTimers();
            activeTarget = null;
            card.classList.remove('is-visible');
            card.setAttribute('aria-hidden', 'true');
        };

        const scheduleHide = () => {
            clearTimers();
            hideTimer = window.setTimeout(hideCard, 100);
        };

        document.addEventListener('pointerover', (event) => {
            const target = event.target.closest('[data-movie-card]');
            if (!target) return;
            showCard(target);
        });

        document.addEventListener('pointerout', (event) => {
            const target = event.target.closest('[data-movie-card]');
            if (!target || target !== activeTarget) return;
            if (event.relatedTarget && (target.contains(event.relatedTarget) || card.contains(event.relatedTarget))) return;
            scheduleHide();
        });

        document.addEventListener('focusin', (event) => {
            const target = event.target.closest('[data-movie-card]');
            if (target) showCard(target);
        });

        document.addEventListener('focusout', (event) => {
            const target = event.target.closest('[data-movie-card]');
            if (target && target === activeTarget) scheduleHide();
        });

        card.addEventListener('pointerenter', clearTimers);
        card.addEventListener('pointerleave', scheduleHide);
        window.addEventListener('scroll', hideCard, { passive: true });
        window.addEventListener('resize', hideCard);
    })();
    </script>
@endif
