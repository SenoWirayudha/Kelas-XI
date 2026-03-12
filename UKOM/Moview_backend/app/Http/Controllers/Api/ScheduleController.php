<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * GET /api/v1/schedules?movie_id=1
     * Returns all upcoming schedules for the given movie.
     */
    public function index(Request $request)
    {
        $request->validate([
            'movie_id' => 'required|integer|exists:movies,id',
        ]);

        $schedules = Schedule::with(['studio.cinema'])
            ->where('movie_id', $request->movie_id)
            ->where('show_date', '>=', now()->toDateString())
            ->orderBy('show_date')
            ->orderBy('show_time')
            ->get()
            ->map(fn($s) => [
                'schedule_id'     => $s->id,
                'cinema_name'     => $s->studio->cinema->cinema_name,
                'cinema_location' => trim($s->studio->cinema->city . ', ' . $s->studio->cinema->address, ', '),
                'studio_name'     => $s->studio->studio_name,
                'show_date'       => $s->show_date->format('Y-m-d'),
                'show_time'       => $s->show_time,
                'ticket_price'    => (float) $s->ticket_price,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $schedules,
        ]);
    }
}
