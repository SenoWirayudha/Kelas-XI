<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use Illuminate\Support\Facades\DB;

class CinemaController extends Controller
{
    /**
     * GET /api/v1/cinema-cities
     * Returns distinct city names from cinemas table.
     */
    public function cities()
    {
        $cities = Cinema::query()
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->select(DB::raw('TRIM(city) as city'))
            ->distinct()
            ->orderBy('city')
            ->pluck('city')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $cities,
        ]);
    }
}
