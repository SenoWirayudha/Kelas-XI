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
        $schedules = Schedule::with(['movie', 'studio.cinema'])
            ->orderBy('show_date', 'desc')
            ->orderBy('show_time', 'desc')
            ->paginate(20);

        return view('admin.schedules.index', compact('schedules'));
    }

    public function create()
    {
        // Films with a theatrical service where is_coming_soon = 0.
        // release_date may be NULL (already showing) or filled (pre-order allowed).
        $movies = Movie::select(
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

        $cinemas = Cinema::with('service')->orderBy('cinema_name')->get(['id', 'cinema_name', 'city', 'service_id']);
        $studios = Studio::with('cinema')->orderBy('studio_name')->get();

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

        $validated['status'] = 'active';

        Schedule::create($validated);

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Jadwal berhasil dihapus.');
    }

    public function edit($id)
    {
        $schedule = Schedule::with(['studio.cinema', 'movie'])->findOrFail($id);

        $movies = Movie::select(
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

        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);
        $studios = Studio::with('cinema')->orderBy('studio_name')->get();

        return view('admin.schedules.edit', compact('schedule', 'movies', 'cinemas', 'studios'));
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);

        $validated = $request->validate([
            'movie_id'     => 'required|exists:movies,id',
            'studio_id'    => 'required|exists:studios,id',
            'show_date'    => 'required|date',
            'show_time'    => 'required|date_format:H:i',
            'ticket_price' => 'required|numeric|min:0',
        ]);

        $schedule->update($validated);

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Jadwal berhasil diperbarui.');
    }

    /**
     * AJAX: return studios that belong to the chosen cinema.
     */
    public function studiosByCinema($cinemaId)
    {
        $studios = Studio::where('cinema_id', $cinemaId)
            ->orderBy('studio_name')
            ->get(['id', 'studio_name', 'total_seats']);

        return response()->json($studios);
    }
}
