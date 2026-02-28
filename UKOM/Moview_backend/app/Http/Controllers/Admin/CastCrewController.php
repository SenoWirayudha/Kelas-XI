<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Person;
use App\Models\MoviePerson;
use Illuminate\Http\Request;

class CastCrewController extends Controller
{
    public function store(Request $request, $movieId)
    {
        $request->validate([
            'person_id' => 'required|exists:persons,id',
            'role_type' => 'required|in:cast,crew',
            'character_name' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:255',
        ]);

        $movie = Movie::findOrFail($movieId);

        // Create movie person relationship
        $movie->moviePersons()->create([
            'person_id' => $request->person_id,
            'role_type' => $request->role_type,
            'character_name' => $request->character_name,
            'job' => $request->job,
            'order_index' => $movie->moviePersons()->count(),
        ]);

        return redirect()->route('admin.films.cast-crew', $movieId)
            ->with('success', 'Cast/Crew berhasil ditambahkan!');
    }

    public function destroy($movieId, $moviePersonId)
    {
        $moviePerson = MoviePerson::findOrFail($moviePersonId);

        // Ensure movie person belongs to this movie
        if ($moviePerson->movie_id != $movieId) {
            abort(404);
        }

        $moviePerson->delete();

        return redirect()->route('admin.films.cast-crew', $movieId)
            ->with('success', 'Cast/Crew berhasil dihapus!');
    }

    public function update(Request $request, $movieId, $moviePersonId)
    {
        $request->validate([
            'character_name' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:255',
        ]);

        $moviePerson = MoviePerson::findOrFail($moviePersonId);

        // Ensure movie person belongs to this movie
        if ($moviePerson->movie_id != $movieId) {
            abort(404);
        }

        // Update character_name for cast or job for crew
        if ($moviePerson->role_type === 'cast') {
            $moviePerson->character_name = $request->character_name;
        } else {
            $moviePerson->job = $request->job;
        }
        $moviePerson->save();

        return redirect()->route('admin.films.cast-crew', $movieId)
            ->with('success', 'Cast/Crew berhasil diupdate!');
    }

    // Get all persons for dropdown
    public function getPersons(Request $request)
    {
        $search = $request->get('search', '');
        
        $persons = Person::when($search, function($query, $search) {
            return $query->where('full_name', 'like', "%{$search}%");
        })->limit(20)->get();

        return response()->json($persons);
    }
}
