<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Event;
use App\Models\Movie;
use App\Models\Schedule;
use App\Models\Studio;
use App\Support\FestivalSchedule;
use App\Support\ReturnUrl;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    public function index()
    {
        $events = Event::with('cinema')
            ->withCount('sessions')
            ->forCinema($this->scopedCinemaId())
            ->orderByDesc('start_date')
            ->paginate(15)
            ->withQueryString();

        return view('admin.events.index', compact('events'));
    }

    public function create()
    {
        return view('admin.events.form', [
            'event' => new Event(),
            'cinemas' => $this->cinemas(),
            'isEdit' => false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateEvent($request);

        $this->authorizeCinema($validated['cinema_id']);

        if ($request->hasFile('banner')) {
            $validated['banner'] = $request->file('banner')->store('events', 'public');
        }

        $validated['is_published'] = $request->boolean('is_published');

        $event = Event::create($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('events.index')))
            ->with('success', 'Event berhasil dibuat. Silakan tambahkan sesi festival.');
    }

    public function edit($id)
    {
        $event = Event::with('cinema')->findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        return view('admin.events.form', [
            'event' => $event,
            'cinemas' => $this->cinemas(),
            'isEdit' => true,
        ]);
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $validated = $this->validateEvent($request);
        $this->authorizeCinema($validated['cinema_id']);

        // Sales may not open after the first session that already exists.
        $firstSession = $event->firstSessionStart();
        if ($firstSession && !empty($validated['sale_starts_at'])
            && FestivalSchedule::parse($validated['sale_starts_at'])->greaterThan($firstSession)) {
            throw ValidationException::withMessages([
                'sale_starts_at' => 'Waktu buka penjualan tidak boleh melewati sesi pertama ('
                    . $firstSession->translatedFormat('d M Y H:i') . ').',
            ]);
        }

        if ($request->hasFile('banner')) {
            if ($event->banner && Storage::disk('public')->exists($event->banner)) {
                Storage::disk('public')->delete($event->banner);
            }
            $validated['banner'] = $request->file('banner')->store('events', 'public');
        }

        $validated['is_published'] = $request->boolean('is_published');

        $event->update($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('events.index')))
            ->with('success', 'Event berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::with('sessions')->findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $hasOrders = $event->sessions->contains(fn (Schedule $session) => $session->orders()->exists());

        if ($hasOrders) {
            return back()->with('error', 'Event tidak dapat dihapus karena salah satu sesinya sudah memiliki order.');
        }

        DB::transaction(function () use ($event) {
            $event->sessions()->get()->each(function (Schedule $session) {
                $session->festivalMovies()->detach();
                $session->delete();
            });

            if ($event->banner && Storage::disk('public')->exists($event->banner)) {
                Storage::disk('public')->delete($event->banner);
            }

            $event->delete();
        });

        $return = ReturnUrl::resolve($request, route($this->panelRoute('events.index')));

        return redirect($return)->with('success', 'Event berhasil dihapus.');
    }

    // ---------------------------------------------------------------------
    // Sessions
    // ---------------------------------------------------------------------

    public function sessions($id)
    {
        $event = Event::with(['cinema', 'sessions.studio', 'sessions.festivalMovies'])->findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $sessions = $event->sessions->map(function (Schedule $session) {
            $session->ends_at = $session->endsAt();
            $session->has_orders = $session->orders()->exists();
            return $session;
        });

        return view('admin.events.sessions', compact('event', 'sessions'));
    }

    public function createSession($id)
    {
        $event = Event::with('cinema')->findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        return view('admin.events.session-form', [
            'event' => $event,
            'session' => new Schedule(),
            'studios' => $this->studiosFor($event->cinema_id),
            'movies' => $this->movies(),
            'selectedMovies' => [],
            'isEdit' => false,
        ]);
    }

    public function storeSession(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $validated = $this->validateSession($request, $event);

        $session = DB::transaction(function () use ($validated, $event) {
            $movieIds = $validated['movies'];
            unset($validated['movies']);

            $validated['event_id'] = $event->id;
            $validated['movie_id'] = $movieIds[0]; // first film keeps legacy relations working
            $validated['status'] = 'active';

            $session = Schedule::create($validated);
            $this->syncFilms($session, $movieIds);

            return $session;
        });

        return redirect(route($this->panelRoute('events.sessions'), $event->id))
            ->with('success', 'Sesi festival berhasil ditambahkan.');
    }

    public function editSession($id, $sessionId)
    {
        $event = Event::with('cinema')->findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $session = Schedule::with('festivalMovies')->where('event_id', $event->id)->findOrFail($sessionId);

        return view('admin.events.session-form', [
            'event' => $event,
            'session' => $session,
            'studios' => $this->studiosFor($event->cinema_id),
            'movies' => $this->movies(),
            'selectedMovies' => $session->festivalMovies->pluck('id')->all(),
            'isEdit' => true,
        ]);
    }

    public function updateSession(Request $request, $id, $sessionId)
    {
        $event = Event::findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $session = Schedule::with('festivalMovies')->where('event_id', $event->id)->findOrFail($sessionId);
        $hasOrders = $session->orders()->exists();

        $validated = $this->validateSession($request, $event, $session);

        if ($hasOrders) {
            // Time, studio and line-up are frozen once a ticket exists.
            $locked = $session->show_date->format('Y-m-d') !== $validated['show_date']
                || substr((string) $session->show_time, 0, 5) !== $validated['show_time']
                || (int) $session->studio_id !== (int) $validated['studio_id']
                || $this->filmSignature($session) !== $this->filmSignatureFromIds($validated['movies']);

            if ($locked) {
                throw ValidationException::withMessages([
                    'show_date' => 'Sesi ini sudah memiliki order: waktu, studio, dan daftar film tidak dapat diubah.',
                ]);
            }
        }

        DB::transaction(function () use ($validated, $session) {
            $movieIds = $validated['movies'];
            unset($validated['movies']);

            $validated['movie_id'] = $movieIds[0];

            $session->update($validated);
            $this->syncFilms($session, $movieIds);
        });

        return redirect(route($this->panelRoute('events.sessions'), $event->id))
            ->with('success', 'Sesi festival berhasil diperbarui.');
    }

    public function destroySession($id, $sessionId)
    {
        $event = Event::findOrFail($id);
        $this->authorizeCinema($event->cinema_id);

        $session = Schedule::where('event_id', $event->id)->findOrFail($sessionId);

        if ($session->orders()->exists()) {
            return back()->with('error', 'Sesi tidak dapat dihapus karena sudah memiliki order.');
        }

        DB::transaction(function () use ($session) {
            $session->festivalMovies()->detach();
            $session->delete();
        });

        return back()->with('success', 'Sesi festival berhasil dihapus.');
    }

    // ---------------------------------------------------------------------
    // Films (manual entry for festival line-ups)
    // ---------------------------------------------------------------------

    public function storeMovie(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'release_year' => 'required|integer|min:1800|max:' . ((int) FestivalSchedule::now()->format('Y') + 10),
            'duration' => 'required|integer|min:1|max:600',
            'director' => 'nullable|string|max:255',
            'synopsis' => 'nullable|string',
            'poster' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'backdrop' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ], [
            'duration.required' => 'Durasi film wajib diisi (menit).',
        ]);

        $movie = Movie::create([
            'title' => $validated['title'],
            'release_year' => $validated['release_year'],
            'duration' => $validated['duration'],
            'synopsis' => $validated['synopsis'] ?? null,
            'status' => 'published',
            'default_poster_path' => $request->hasFile('poster')
                ? $request->file('poster')->store('movies/posters', 'public')
                : null,
            'default_backdrop_path' => $request->hasFile('backdrop')
                ? $request->file('backdrop')->store('movies/backdrops', 'public')
                : null,
        ]);

        // Director is stored as a Person linked as crew, matching the film detail screen.
        if (!empty($validated['director'])) {
            $person = \App\Models\Person::firstOrCreate(
                ['full_name' => $validated['director'], 'primary_role' => 'Director']
            );

            $movie->moviePersons()->create([
                'person_id' => $person->id,
                'role_type' => 'crew',
                'job' => 'Director',
                'order_index' => 0,
            ]);
        }

        return response()->json([
            'success' => true,
            'movie' => [
                'id' => $movie->id,
                'title' => $movie->title,
                'release_year' => $movie->release_year,
                'duration' => $movie->duration,
            ],
        ]);
    }

    // ---------------------------------------------------------------------
    // Validation helpers
    // ---------------------------------------------------------------------

    private function validateEvent(Request $request): array
    {
        return $request->validate([
            'cinema_id' => 'required|exists:cinemas,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'sale_starts_at' => 'required|date',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ], [
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'sale_starts_at.required' => 'Waktu buka penjualan wajib diisi.',
        ]);
    }

    private function validateSession(Request $request, Event $event, ?Schedule $ignore = null): array
    {
        $validated = $request->validate([
            'studio_id' => 'required|exists:studios,id',
            'show_date' => 'required|date',
            'show_time' => 'required|date_format:H:i',
            'session_title' => 'nullable|string|max:255',
            'ticket_price' => 'required|numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'movies' => 'required|array|min:1',
            'movies.*' => 'integer|exists:movies,id',
        ], [
            'movies.required' => 'Minimal satu film harus dipilih untuk sesi ini.',
            'movies.min' => 'Minimal satu film harus dipilih untuk sesi ini.',
            'ticket_price.min' => 'Harga tiket tidak boleh negatif.',
            'quota.min' => 'Kuota minimal 1.',
        ]);

        $validated['movies'] = array_values(array_unique($validated['movies']));

        if (count($validated['movies']) !== count($request->input('movies', []))) {
            throw ValidationException::withMessages([
                'movies' => 'Film yang sama tidak boleh dipilih dua kali dalam satu sesi.',
            ]);
        }

        // Session length is derived from durations, so every film must have one.
        $missingDuration = Movie::whereIn('id', $validated['movies'])
            ->where(function ($query) {
                $query->whereNull('duration')->orWhere('duration', '<=', 0);
            })
            ->pluck('title');

        if ($missingDuration->isNotEmpty()) {
            throw ValidationException::withMessages([
                'movies' => 'Film berikut belum memiliki durasi: ' . $missingDuration->implode(', ') . '.',
            ]);
        }

        // Studio must belong to the event's cinema.
        $studio = Studio::findOrFail($validated['studio_id']);
        $this->authorizeCinema($studio->cinema_id);

        if ((int) $studio->cinema_id !== (int) $event->cinema_id) {
            throw ValidationException::withMessages([
                'studio_id' => 'Studio harus milik bioskop event ini.',
            ]);
        }

        // Session date within the event window.
        $date = FestivalSchedule::parse($validated['show_date'])->startOfDay();
        if ($date->lt($event->start_date->copy()->startOfDay())
            || $date->gt($event->end_date->copy()->endOfDay())) {
            throw ValidationException::withMessages([
                'show_date' => 'Tanggal sesi harus di dalam rentang event ('
                    . $event->start_date->translatedFormat('d M Y') . ' – '
                    . $event->end_date->translatedFormat('d M Y') . ').',
            ]);
        }

        // Sales must open before the first session.
        $startAt = $date->copy()->setTimeFromTimeString($validated['show_time']);
        if ($event->sale_starts_at && FestivalSchedule::parse($event->sale_starts_at->format('Y-m-d H:i:s'))->greaterThan($startAt)) {
            throw ValidationException::withMessages([
                'show_time' => 'Sesi tidak boleh dimulai sebelum waktu buka penjualan ('
                    . $event->sale_starts_at->copy()->setTimezone(FestivalSchedule::TIMEZONE)->translatedFormat('d M Y H:i') . ' WIB).',
            ]);
        }

        // Session title required when the line-up has more than one film.
        if (count($validated['movies']) > 1 && blank($validated['session_title'] ?? null)) {
            throw ValidationException::withMessages([
                'session_title' => 'Judul sesi wajib diisi jika film lebih dari satu.',
            ]);
        }

        // Quota within the studio capacity.
        $quota = $validated['quota'] ?? (int) $studio->total_seats;
        if ($quota > (int) $studio->total_seats) {
            throw ValidationException::withMessages([
                'quota' => 'Kuota tidak boleh melebihi kapasitas studio (' . (int) $studio->total_seats . ' kursi).',
            ]);
        }
        $validated['quota'] = $quota;

        // Overlap check, using the computed end time.
        $duration = (int) Movie::whereIn('id', $validated['movies'])->sum('duration');
        $endsAt = $startAt->copy()->addMinutes(max(1, $duration) + FestivalSchedule::GAP_MINUTES);

        $conflict = $this->findConflictingSession(
            (int) $validated['studio_id'],
            $date,
            $startAt,
            $endsAt,
            $ignore?->id
        );

        if ($conflict) {
            throw ValidationException::withMessages([
                'show_time' => 'Sesi bentrok dengan jadwal lain di studio yang sama: '
                    . $conflict['schedule']->show_date->format('d M Y') . ' '
                    . substr((string) $conflict['schedule']->show_time, 0, 5)
                    . ' – ' . $conflict['ends']->format('H:i') . '.',
            ]);
        }

        return $validated;
    }

    /** Returns the first overlapping schedule in the studio, if any. */
    private function findConflictingSession(
        int $studioId,
        Carbon $date,
        Carbon $startAt,
        Carbon $endsAt,
        ?int $ignoreId
    ): ?array {
        $candidates = Schedule::with(['movie', 'festivalMovies'])
            ->where('studio_id', $studioId)
            ->whereDate('show_date', $date->toDateString())
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get();

        foreach ($candidates as $candidate) {
            $candidateStart = $candidate->startsAt();
            $candidateEnd = $candidate->endsAt();

            if ($startAt->lt($candidateEnd) && $endsAt->gt($candidateStart)) {
                return ['schedule' => $candidate, 'ends' => $candidateEnd];
            }
        }

        return null;
    }

    private function syncFilms(Schedule $session, array $movieIds): void
    {
        $payload = [];
        foreach (array_values($movieIds) as $index => $movieId) {
            $payload[$movieId] = ['sort_order' => $index];
        }

        $session->festivalMovies()->sync($payload);
    }

    private function filmSignature(Schedule $session): string
    {
        return $this->filmSignatureFromIds($session->festivalMovies->pluck('id')->all());
    }

    private function filmSignatureFromIds(array $ids): string
    {
        $ids = array_map('intval', $ids);
        sort($ids);

        return implode(',', $ids);
    }

    private function cinemas()
    {
        $query = Cinema::orderBy('cinema_name');

        if ($this->isManager()) {
            $query->where('id', $this->scopedCinemaId());
        }

        return $query->get(['id', 'cinema_name', 'city']);
    }

    private function studiosFor(?int $cinemaId)
    {
        return Studio::where('cinema_id', $cinemaId)
            ->orderBy('studio_name')
            ->get(['id', 'studio_name', 'total_seats']);
    }

    private function movies()
    {
        return Movie::orderBy('title')->get(['id', 'title', 'release_year', 'duration']);
    }
}
