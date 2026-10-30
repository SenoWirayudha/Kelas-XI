<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Movie;
use App\Models\Schedule;
use App\Models\Studio;
use App\Support\ReturnUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function index()
    {
        $query = Schedule::with(['movie', 'studio.cinema'])
            ->orderBy('show_date', 'desc')
            ->orderBy('show_time', 'desc');

        if ($this->isManager()) {
            $query->whereHas('studio', fn($q) => $q->where('cinema_id', $this->scopedCinemaId()));
        }

        $schedules = $query->paginate(20)->withQueryString();

        return view('admin.schedules.index', compact('schedules'));
    }

    public function create()
    {
        $movies = $this->theatricalMovies();

        $cinemasQuery = Cinema::with('service')->orderBy('cinema_name');

        if ($this->isManager()) {
            $cinemasQuery->where('id', $this->scopedCinemaId());
        }

        $cinemas = $cinemasQuery->get(['id', 'cinema_name', 'city', 'service_id']);

        $studiosQuery = Studio::with('cinema')->orderBy('studio_name');

        if ($this->isManager()) {
            $studiosQuery->where('cinema_id', $this->scopedCinemaId());
        }

        $studios = $studiosQuery->get();

        $isManager = $this->isManager();

        return view('admin.schedules.create', compact('movies', 'cinemas', 'studios', 'isManager'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'movie_id'     => 'required|exists:movies,id',
            'studio_id'    => 'required|exists:studios,id',
            'show_date'    => 'required|date|after_or_equal:today',
            'show_time'    => 'required|date_format:H:i',
            'ticket_price' => 'required|numeric|min:0',
        ]);

        $this->authorizeStudio($validated['studio_id']);

        $validated['status'] = 'active';

        Schedule::create($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('schedules.index')))
            ->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function destroy(Request $request, $id)
    {
        $schedule = Schedule::with('studio')->findOrFail($id);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        $schedule->delete();

        $return = ReturnUrl::resolve($request, route($this->panelRoute('schedules.index')));

        $countQuery = Schedule::query();

        if ($this->isManager()) {
            $countQuery->whereHas('studio', fn($q) => $q->where('cinema_id', $this->scopedCinemaId()));
        }

        return redirect(ReturnUrl::fitPage($return, $countQuery->count(), 20))
            ->with('success', 'Jadwal berhasil dihapus.');
    }

    public function edit($id)
    {
        $schedule = Schedule::with(['studio.cinema', 'movie'])->findOrFail($id);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        $movies = $this->theatricalMovies();

        $cinemasQuery = Cinema::orderBy('cinema_name');

        if ($this->isManager()) {
            $cinemasQuery->where('id', $this->scopedCinemaId());
        }

        $cinemas = $cinemasQuery->get(['id', 'cinema_name', 'city']);

        $studiosQuery = Studio::with('cinema')->orderBy('studio_name');

        if ($this->isManager()) {
            $studiosQuery->where('cinema_id', $this->scopedCinemaId());
        }

        $studios = $studiosQuery->get();

        $isManager = $this->isManager();

        return view('admin.schedules.edit', compact('schedule', 'movies', 'cinemas', 'studios', 'isManager'));
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::with('studio')->findOrFail($id);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        $validated = $request->validate([
            'movie_id'     => 'required|exists:movies,id',
            'studio_id'    => 'required|exists:studios,id',
            'show_date'    => 'required|date',
            'show_time'    => 'required|date_format:H:i',
            'ticket_price' => 'required|numeric|min:0',
        ]);

        $this->authorizeStudio($validated['studio_id']);

        $schedule->update($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('schedules.index')))
            ->with('success', 'Jadwal berhasil diperbarui.');
    }

    /**
     * AJAX: return studios that belong to the chosen cinema.
     */
    public function studiosByCinema($cinemaId)
    {
        $this->authorizeCinema($cinemaId);

        $studios = Studio::where('cinema_id', $cinemaId)
            ->orderBy('studio_name')
            ->get(['id', 'studio_name', 'total_seats', 'seat_type_definitions'])
            ->map(function (Studio $studio) {
                // Seat-type surcharges drive the price preview on the schedule form.
                $surcharges = [];
                foreach ($studio->sellableTypeKeys() as $key) {
                    $definition = $studio->definitionsByKey()[$key] ?? null;
                    $surcharges[] = [
                        'key' => $key,
                        'label' => $definition['label'] ?? ucfirst($key),
                        'surcharge' => $studio->priceSurchargeFor($key),
                    ];
                }

                return [
                    'id' => $studio->id,
                    'studio_name' => $studio->studio_name,
                    'total_seats' => $studio->total_seats,
                    'min_surcharge' => $studio->minSurcharge(),
                    'surcharges' => $surcharges,
                ];
            });

        return response()->json($studios);
    }

    private function authorizeStudio($studioId): void
    {
        $cinemaId = Studio::whereKey($studioId)->value('cinema_id');
        $this->authorizeCinema($cinemaId);
    }

    private function theatricalMovies()
    {
        return Movie::select(
                'movies.id',
                'movies.title',
                DB::raw('MIN(movie_services.release_date) as release_date')
            )
            ->join('movie_services', 'movies.id', '=', 'movie_services.movie_id')
            ->join('services', 'movie_services.service_id', '=', 'services.id')
            ->where('services.type', 'theatrical')
            ->where('movie_services.is_coming_soon', 0)
            ->groupBy('movies.id', 'movies.title')
            ->orderBy('movies.title')
            ->get();
    }
}
