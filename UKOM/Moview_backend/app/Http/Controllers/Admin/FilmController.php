<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Person;
use App\Models\Genre;
use App\Models\Service;
use App\Models\Country;
use App\Models\Language;
use App\Models\ProductionHouse;
use Illuminate\Http\Request;

class FilmController extends Controller
{
    // Dummy data untuk simulasi
    private function getDummyFilms()
    {
        return [
            [
                'id' => 1,
                'title' => 'The Shawshank Redemption',
                'year' => 1994,
                'runtime' => 142,
                'age_rating' => 'R',
                'status' => 'Published',
                'rating_average' => 4.7,
                'total_reviews' => 2456,
                'synopsis' => 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
                'poster' => 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                'backdrop' => 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
                'genres' => ['Drama', 'Crime'],
                'services' => ['Netflix', 'Amazon Prime'],
            ],
            [
                'id' => 2,
                'title' => 'The Godfather',
                'year' => 1972,
                'runtime' => 175,
                'age_rating' => 'R',
                'status' => 'Published',
                'rating_average' => 4.6,
                'total_reviews' => 1823,
                'synopsis' => 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
                'poster' => 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
                'backdrop' => 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
                'genres' => ['Drama', 'Crime'],
                'services' => ['Paramount+'],
            ],
            [
                'id' => 3,
                'title' => 'The Dark Knight',
                'year' => 2008,
                'runtime' => 152,
                'age_rating' => 'PG-13',
                'status' => 'Published',
                'rating_average' => 4.5,
                'total_reviews' => 3201,
                'synopsis' => 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.',
                'poster' => 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                'backdrop' => 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
                'genres' => ['Action', 'Crime', 'Drama'],
                'services' => ['HBO Max', 'Netflix'],
            ],
            [
                'id' => 4,
                'title' => 'Inception',
                'year' => 2010,
                'runtime' => 148,
                'age_rating' => 'PG-13',
                'status' => 'Draft',
                'rating_average' => 4.4,
                'total_reviews' => 2987,
                'synopsis' => 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
                'poster' => 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                'backdrop' => 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
                'genres' => ['Action', 'Sci-Fi', 'Thriller'],
                'services' => ['Netflix', 'Amazon Prime'],
            ],
            [
                'id' => 5,
                'title' => 'Pulp Fiction',
                'year' => 1994,
                'runtime' => 154,
                'age_rating' => 'R',
                'status' => 'Published',
                'rating_average' => 4.5,
                'total_reviews' => 2134,
                'synopsis' => 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
                'poster' => 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                'backdrop' => 'https://image.tmdb.org/t/p/original/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
                'genres' => ['Crime', 'Drama'],
                'services' => ['Netflix'],
            ],
        ];
    }

    private function getDummyCastCrew($filmId)
    {
        return [
            'cast' => [
                ['id' => 1, 'name' => 'Tim Robbins', 'character' => 'Andy Dufresne', 'photo' => 'https://image.tmdb.org/t/p/w200/hsCuROGEzJAULGgxQS8Y9JzB0gH.jpg'],
                ['id' => 2, 'name' => 'Morgan Freeman', 'character' => 'Ellis Boyd Redding', 'photo' => 'https://image.tmdb.org/t/p/w200/jPsLqiYGSofU4s6BjrxnefMfabb.jpg'],
                ['id' => 3, 'name' => 'Bob Gunton', 'character' => 'Warden Norton', 'photo' => 'https://image.tmdb.org/t/p/w200/tL7v8KQVxYauPqFQ0qCKKhJPqCh.jpg'],
            ],
            'crew' => [
                ['id' => 1, 'name' => 'Frank Darabont', 'job' => 'Director', 'photo' => 'https://image.tmdb.org/t/p/w200/7LqmE3p1XTwCdNCOmBxovq210Qk.jpg'],
                ['id' => 2, 'name' => 'Thomas Newman', 'job' => 'Music', 'photo' => 'https://image.tmdb.org/t/p/w200/35WTad0JEMy31YcUuDFMCKkLOPi.jpg'],
                ['id' => 3, 'name' => 'Roger Deakins', 'job' => 'Cinematography', 'photo' => 'https://image.tmdb.org/t/p/w200/3qdFLPEaEj7RLfrhVJjqfMJD8Gd.jpg'],
            ],
        ];
    }

    private function getDummyReviews($filmId)
    {
        return [
            [
                'id' => 1,
                'user' => 'John Doe',
                'rating' => 5,
                'comment' => 'Masterpiece! One of the best films ever made.',
                'date' => '2024-01-15',
            ],
            [
                'id' => 2,
                'user' => 'Jane Smith',
                'rating' => 4.5,
                'comment' => 'Incredible storytelling and performances.',
                'date' => '2024-01-14',
            ],
            [
                'id' => 3,
                'user' => 'Mike Johnson',
                'rating' => 5,
                'comment' => 'A timeless classic that never gets old.',
                'date' => '2024-01-13',
            ],
            [
                'id' => 4,
                'user' => 'Sarah Williams',
                'rating' => 8,
                'comment' => 'Great film but a bit slow at times.',
                'date' => '2024-01-12',
            ],
        ];
    }

    private function getGenreOptions()
    {
        return ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'];
    }

    private function getServiceOptions()
    {
        return [
            ['name' => 'Netflix', 'icon' => '🎬'],
            ['name' => 'Amazon Prime', 'icon' => '📺'],
            ['name' => 'Disney+', 'icon' => '🏰'],
            ['name' => 'HBO Max', 'icon' => '🎭'],
            ['name' => 'Paramount+', 'icon' => '⛰️'],
            ['name' => 'Apple TV+', 'icon' => '🍎'],
        ];
    }

    public function index()
    {
        $films = Movie::with([
            'movieGenres.genre',
            'movieServices.service'
        ])->get();
        
        return view('admin.films.index', compact('films'));
    }

    public function create()
    {
        $genres = Genre::all();
        $services = Service::all();
        $countries = Country::all();
        $languages = Language::all();
        $productionHouses = ProductionHouse::all();
        return view('admin.films.form', compact('genres', 'services', 'countries', 'languages', 'productionHouses'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'release_year' => 'required|integer|min:1800|max:' . (date('Y') + 10),
            'duration' => 'required|integer|min:1',
            'age_rating' => 'nullable|string|max:10',
            'status' => 'required|in:draft,published',
            'synopsis' => 'nullable|string',
            'trailer_url' => 'nullable|url|max:500',
            'genres' => 'nullable|array',
            'genres.*' => 'exists:genres,id',
            'services' => 'nullable|array',
            'services.*' => 'exists:services,id',
            'countries' => 'nullable|array',
            'countries.*' => 'exists:countries,id',
            'languages' => 'nullable|array',
            'languages.*' => 'exists:languages,id',
            'production_houses' => 'nullable|array',
            'production_houses.*' => 'exists:production_houses,id',
        ]);

        $movie = Movie::create($validated);

        // Sync genres
        if ($request->has('genres')) {
            foreach ($request->genres as $genreId) {
                $movie->movieGenres()->create(['genre_id' => $genreId]);
            }
        }

        // Sync services
        if ($request->has('services')) {
            foreach ($request->services as $serviceId) {
                $movie->movieServices()->create(['service_id' => $serviceId]);
            }
        }

        // Sync countries
        if ($request->has('countries')) {
            foreach ($request->countries as $countryId) {
                $movie->movieCountries()->create(['country_id' => $countryId]);
            }
        }

        // Sync languages
        if ($request->has('languages')) {
            foreach ($request->languages as $languageId) {
                $movie->movieLanguages()->create(['language_id' => $languageId]);
            }
        }

        // Sync production houses
        if ($request->has('production_houses')) {
            foreach ($request->production_houses as $productionHouseId) {
                $movie->movieProductionHouses()->create(['production_house_id' => $productionHouseId]);
            }
        }

        return redirect()->route('admin.films.show', $movie->id)
            ->with('success', 'Film berhasil ditambahkan!');
    }

    public function show($id)
    {
        $movie = Movie::with([
            'movieMedia',
            'movieGenres.genre',
            'movieCountries.country',
            'movieLanguages.language',
            'movieProductionHouses.productionHouse',
            'movieServices.service',
            'moviePersons.person'
        ])->findOrFail($id);

        return view('admin.films.show', compact('movie'));
    }

    public function edit($id)
    {
        $film = Movie::findOrFail($id);
        $genres = Genre::all();
        $services = Service::all();
        $countries = Country::all();
        $languages = Language::all();
        $productionHouses = ProductionHouse::all();
        
        return view('admin.films.form', compact('film', 'genres', 'services', 'countries', 'languages', 'productionHouses'));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'release_year' => 'required|integer|min:1800|max:' . (date('Y') + 10),
            'duration' => 'required|integer|min:1',
            'age_rating' => 'nullable|string|max:10',
            'status' => 'required|in:draft,published',
            'synopsis' => 'nullable|string',
            'trailer_url' => 'nullable|url|max:500',
            'genres' => 'nullable|array',
            'genres.*' => 'exists:genres,id',
            'services' => 'nullable|array',
            'services.*' => 'exists:services,id',
            'countries' => 'nullable|array',
            'countries.*' => 'exists:countries,id',
            'languages' => 'nullable|array',
            'languages.*' => 'exists:languages,id',
            'production_houses' => 'nullable|array',
            'production_houses.*' => 'exists:production_houses,id',
        ]);

        $movie = Movie::findOrFail($id);
        $movie->update($validated);

        // Sync genres (delete old, add new)
        $movie->movieGenres()->delete();
        if ($request->has('genres')) {
            foreach ($request->genres as $genreId) {
                $movie->movieGenres()->create(['genre_id' => $genreId]);
            }
        }

        // Sync services (delete old, add new)
        $movie->movieServices()->delete();
        if ($request->has('services')) {
            foreach ($request->services as $serviceId) {
                $movie->movieServices()->create(['service_id' => $serviceId]);
            }
        }

        // Sync countries (delete old, add new)
        $movie->movieCountries()->delete();
        if ($request->has('countries')) {
            foreach ($request->countries as $countryId) {
                $movie->movieCountries()->create(['country_id' => $countryId]);
            }
        }

        // Sync languages (delete old, add new)
        $movie->movieLanguages()->delete();
        if ($request->has('languages')) {
            foreach ($request->languages as $languageId) {
                $movie->movieLanguages()->create(['language_id' => $languageId]);
            }
        }

        // Sync production houses (delete old, add new)
        $movie->movieProductionHouses()->delete();
        if ($request->has('production_houses')) {
            foreach ($request->production_houses as $productionHouseId) {
                $movie->movieProductionHouses()->create(['production_house_id' => $productionHouseId]);
            }
        }

        return redirect()->route('admin.films.show', $movie->id)
            ->with('success', 'Film berhasil diperbarui!');
    }

    public function toggleStatus($id)
    {
        $movie = Movie::findOrFail($id);
        
        $newStatus = $movie->status === 'published' ? 'draft' : 'published';
        $movie->update(['status' => $newStatus]);

        return redirect()->route('admin.films.show', $movie->id)
            ->with('success', 'Film status berhasil diubah menjadi ' . ucfirst($newStatus) . '!');
    }

    public function duplicate($id)
    {
        $originalMovie = Movie::with([
            'movieGenres',
            'movieServices',
            'movieCountries',
            'movieLanguages',
            'movieProductionHouses'
        ])->findOrFail($id);

        // Create duplicate movie
        $duplicateMovie = Movie::create([
            'title' => $originalMovie->title . ' (Copy)',
            'release_year' => $originalMovie->release_year,
            'duration' => $originalMovie->duration,
            'age_rating' => $originalMovie->age_rating,
            'synopsis' => $originalMovie->synopsis,
            'status' => 'draft', // Always create as draft
        ]);

        // Duplicate genres
        foreach ($originalMovie->movieGenres as $mg) {
            $duplicateMovie->movieGenres()->create(['genre_id' => $mg->genre_id]);
        }

        // Duplicate services
        foreach ($originalMovie->movieServices as $ms) {
            $duplicateMovie->movieServices()->create(['service_id' => $ms->service_id]);
        }

        // Duplicate countries
        foreach ($originalMovie->movieCountries as $mc) {
            $duplicateMovie->movieCountries()->create(['country_id' => $mc->country_id]);
        }

        // Duplicate languages
        foreach ($originalMovie->movieLanguages as $ml) {
            $duplicateMovie->movieLanguages()->create(['language_id' => $ml->language_id]);
        }

        // Duplicate production houses
        foreach ($originalMovie->movieProductionHouses as $mph) {
            $duplicateMovie->movieProductionHouses()->create(['production_house_id' => $mph->production_house_id]);
        }

        return redirect()->route('admin.films.edit', $duplicateMovie->id)
            ->with('success', 'Film berhasil diduplikasi! Silakan edit dan simpan.');
    }

    public function destroy($id)
    {
        $movie = Movie::findOrFail($id);
        
        // Delete all media files
        foreach ($movie->movieMedia as $media) {
            if (\Storage::disk('public')->exists($media->media_path)) {
                \Storage::disk('public')->delete($media->media_path);
            }
        }

        // Delete movie (cascade will delete all relationships)
        $movie->delete();

        return redirect()->route('admin.films.index')
            ->with('success', 'Film berhasil dihapus!');
    }

    public function castCrew($id)
    {
        $movie = Movie::with(['moviePersons.person', 'genres', 'movieMedia'])->findOrFail($id);
        
        // Get all cast (actors)
        $cast = $movie->moviePersons()->where('role_type', 'cast')->with('person')->get();
        
        // Get all crew (directors, writers, etc)
        $crew = $movie->moviePersons()->where('role_type', 'crew')->with('person')->get();
        
        // Get all available persons for dropdown
        $allPersons = Person::orderBy('full_name')->get();
        
        return view('admin.films.cast-crew', compact('movie', 'cast', 'crew', 'allPersons'));
    }

    public function reviews($id)
    {
        $films = $this->getDummyFilms();
        $film = collect($films)->firstWhere('id', (int)$id);
        
        if (!$film) {
            abort(404);
        }

        $reviews = $this->getDummyReviews($id);
        
        // Dummy rating distribution
        $ratingDistribution = [
            10 => 65,
            9 => 20,
            8 => 10,
            7 => 3,
            6 => 1,
            5 => 0.5,
            4 => 0.3,
            3 => 0.1,
            2 => 0.05,
            1 => 0.05,
        ];
        
        return view('admin.films.reviews', compact('film', 'reviews', 'ratingDistribution'));
    }

    public function updateServices(Request $request, $id)
    {
        $movie = Movie::findOrFail($id);
        
        // Debug: Log the incoming request data
        \Log::info('Services Update Request:', $request->all());
        
        // Delete all existing services for this movie
        $movie->movieServices()->delete();
        
        // Add selected services
        if ($request->has('services')) {
            foreach ($request->services as $serviceId => $availabilityTypes) {
                // Loop through each availability type (stream, rent, buy, theatrical)
                foreach ($availabilityTypes as $availType => $data) {
                    if (isset($data['enabled'])) {
                        $isComingSoon = isset($data['is_coming_soon']) && $data['is_coming_soon'] == '1' ? 1 : 0;
                        
                        \Log::info("Creating service: Service ID: $serviceId, Type: $availType, Coming Soon: $isComingSoon", $data);
                        
                        $movie->movieServices()->create([
                            'service_id' => $serviceId,
                            'availability_type' => $data['availability_type'] ?? $availType,
                            'release_date' => !empty($data['release_date']) ? $data['release_date'] : null,
                            'is_coming_soon' => $isComingSoon,
                        ]);
                    }
                }
            }
        }
        
        return redirect()->route('admin.films.show', $id)
            ->with('success', 'Services updated successfully!');
    }
}
