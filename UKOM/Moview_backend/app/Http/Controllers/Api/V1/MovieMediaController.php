<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class MovieMediaController extends Controller
{
    public function getMovieMedia($movieId)
    {
        try {
            $posters = DB::table('movie_media')
                ->where('movie_id', $movieId)
                ->where('media_type', 'poster')
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get(['id', 'media_path', 'is_default'])
                ->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'file_path' => $media->media_path,
                        'is_default' => (bool)$media->is_default
                    ];
                });

            $backdrops = DB::table('movie_media')
                ->where('movie_id', $movieId)
                ->where('media_type', 'backdrop')
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get(['id', 'media_path', 'is_default'])
                ->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'file_path' => $media->media_path,
                        'is_default' => (bool)$media->is_default
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'posters' => $posters,
                    'backdrops' => $backdrops
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch movie media: ' . $e->getMessage()
            ], 500);
        }
    }
}
