<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Movie;
use App\Models\Schedule;
use App\Models\Studio;
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

        return view('admin.schedules.create', compact('movies', 'cinemas', 'studios'));
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

        return redirect()->route($this->panelRoute('schedules.index'))
            ->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function destroy($id)
    {
        $schedule = Schedule::with('studio')->findOrFail($id);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        $schedule->delete();

        return redirect()->route($this->panelRoute('schedules.index'))
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

        return view('admin.schedules.edit', compact('schedule', 'movies', 'cinemas', 'studios'));
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

        return redirect()->route($this->panelRoute('schedules.index'))
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
            ->get(['id', 'studio_name', 'total_seats']);

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
