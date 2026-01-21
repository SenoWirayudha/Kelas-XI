<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        $films = $this->getDummyFilms();
        return view('admin.films.index', compact('films'));
    }

    public function create()
    {
        $genres = $this->getGenreOptions();
        $services = $this->getServiceOptions();
        return view('admin.films.form', compact('genres', 'services'));
    }

    public function show($id)
    {
        $films = $this->getDummyFilms();
        $film = collect($films)->firstWhere('id', (int)$id);
        
        if (!$film) {
            abort(404);
        }

        return view('admin.films.show', compact('film'));
    }

    public function edit($id)
    {
        $films = $this->getDummyFilms();
        $film = collect($films)->firstWhere('id', (int)$id);
        
        if (!$film) {
            abort(404);
        }

        $genres = $this->getGenreOptions();
        $services = $this->getServiceOptions();
        
        return view('admin.films.form', compact('film', 'genres', 'services'));
    }

    public function castCrew($id)
    {
        $films = $this->getDummyFilms();
        $film = collect($films)->firstWhere('id', (int)$id);
        
        if (!$film) {
            abort(404);
        }

        $castCrew = $this->getDummyCastCrew($id);
        
        return view('admin.films.cast-crew', compact('film', 'castCrew'));
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
}
