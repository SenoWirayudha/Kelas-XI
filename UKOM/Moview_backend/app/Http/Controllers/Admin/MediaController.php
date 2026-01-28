<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\MovieMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function upload(Request $request, $movieId)
    {
        $request->validate([
            'media_type' => 'required|in:poster,backdrop',
            'media_file' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB max
        ]);

        $movie = Movie::findOrFail($movieId);

        // Upload file
        $file = $request->file('media_file');
        $path = $file->store('movies/' . $movieId . '/' . $request->media_type, 'public');

        // Create media record
        $media = $movie->movieMedia()->create([
            'media_type' => $request->media_type,
            'media_path' => $path,
            'is_default' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => ucfirst($request->media_type) . ' berhasil diupload!',
            'media' => $media,
            'url' => asset('storage/' . $path)
        ]);
    }

    public function setDefault(Request $request, $movieId, $mediaId)
    {
        $movie = Movie::findOrFail($movieId);
        $media = MovieMedia::findOrFail($mediaId);

        // Ensure media belongs to this movie
        if ($media->movie_id != $movieId) {
            return response()->json(['success' => false, 'message' => 'Media tidak ditemukan'], 404);
        }

        // Remove default from all media of same type
        $movie->movieMedia()
            ->where('media_type', $media->media_type)
            ->update(['is_default' => false]);

        // Set this as default
        $media->update(['is_default' => true]);

        // Update movie's default_poster_path or default_backdrop_path
        if ($media->media_type === 'poster') {
            $movie->update(['default_poster_path' => $media->media_path]);
        } elseif ($media->media_type === 'backdrop') {
            $movie->update(['default_backdrop_path' => $media->media_path]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Media berhasil diset sebagai default!'
        ]);
    }

    public function delete($movieId, $mediaId)
    {
        $media = MovieMedia::findOrFail($mediaId);

        // Ensure media belongs to this movie
        if ($media->movie_id != $movieId) {
            return response()->json(['success' => false, 'message' => 'Media tidak ditemukan'], 404);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($media->media_path)) {
            Storage::disk('public')->delete($media->media_path);
        }

        // Delete record
        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Media berhasil dihapus!'
        ]);
    }
}
