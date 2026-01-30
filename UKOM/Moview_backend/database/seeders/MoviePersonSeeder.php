<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MoviePersonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, add more movies
        $movies = [
            [
                'title' => 'The Handmaiden',
                'release_year' => 2016,
                'duration' => 168,
                'age_rating' => 'NC-17',
                'synopsis' => '1930s Korea, in the period of Japanese occupation, a new girl, Sookee, is hired as a handmaiden to a Japanese heiress, Hideko, who lives a secluded life on a large countryside estate with her domineering Uncle Kouzuki.',
                'status' => 'published',
            ],
            [
                'title' => 'Perfect Days',
                'release_year' => 2023,
                'duration' => 123,
                'age_rating' => 'PG',
                'synopsis' => 'Hirayama seems utterly content with his simple life as a cleaner of toilets in Tokyo.',
                'status' => 'published',
            ],
            [
                'title' => 'Past Lives',
                'release_year' => 2023,
                'duration' => 105,
                'age_rating' => 'PG-13',
                'synopsis' => 'Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora\'s family emigrates from South Korea.',
                'status' => 'published',
            ],
            [
                'title' => 'Resurrection',
                'release_year' => 2018,
                'duration' => 138,
                'age_rating' => 'NR',
                'synopsis' => 'A father embarks on a journey to understand the afterlife.',
                'status' => 'published',
            ],
        ];

        foreach ($movies as $movieData) {
            if (!DB::table('movies')->where('title', $movieData['title'])->exists()) {
                DB::table('movies')->insert(array_merge($movieData, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
                echo "Added movie: {$movieData['title']}\n";
            }
        }

        // First, let's create some persons
        $persons = [
            ['full_name' => 'Park Chan-wook', 'primary_role' => 'Director', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Kim Tae-ri', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Kim Min-hee', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Ha Jung-woo', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Cho Jin-woong', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Kōji Yakusho', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'Japan'],
            ['full_name' => 'Greta Lee', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'United States'],
            ['full_name' => 'Teo Yoo', 'primary_role' => 'Actor', 'photo_path' => null, 'nationality' => 'Germany'],
            ['full_name' => 'Wim Wenders', 'primary_role' => 'Director', 'photo_path' => null, 'nationality' => 'Germany'],
            ['full_name' => 'Celine Song', 'primary_role' => 'Director', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Choi Seung-yun', 'primary_role' => 'Writer', 'photo_path' => null, 'nationality' => 'South Korea'],
            ['full_name' => 'Franz Lustig', 'primary_role' => 'Cinematographer', 'photo_path' => null, 'nationality' => 'Austria'],
            ['full_name' => 'Bi Gan', 'primary_role' => 'Director', 'photo_path' => null, 'nationality' => 'China'],
        ];

        $personIds = [];
        foreach ($persons as $person) {
            $existing = DB::table('persons')->where('full_name', $person['full_name'])->first();
            if ($existing) {
                $personIds[] = $existing->id;
            } else {
                $id = DB::table('persons')->insertGetId(array_merge($person, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
                $personIds[] = $id;
            }
        }

        // Get movie IDs
        $movieIds = DB::table('movies')->pluck('id', 'title')->toArray();

        // Movie persons data
        $moviePersons = [];

        // The Handmaiden
        if (isset($movieIds['The Handmaiden'])) {
            $movieId = $movieIds['The Handmaiden'];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[0],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[1],
                'role_type' => 'cast',
                'character_name' => 'Sook-hee',
                'job' => null,
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[2],
                'role_type' => 'cast',
                'character_name' => 'Lady Hideko',
                'job' => null,
                'order_index' => 1,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[3],
                'role_type' => 'cast',
                'character_name' => 'Count Fujiwara',
                'job' => null,
                'order_index' => 2,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[4],
                'role_type' => 'cast',
                'character_name' => 'Uncle Kouzuki',
                'job' => null,
                'order_index' => 3,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[10],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Screenplay',
                'order_index' => 0,
            ];
        }

        // Perfect Days
        if (isset($movieIds['Perfect Days'])) {
            $movieId = $movieIds['Perfect Days'];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[8],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[5],
                'role_type' => 'cast',
                'character_name' => 'Hirayama',
                'job' => null,
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[11],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Cinematographer',
                'order_index' => 0,
            ];
        }

        // Past Lives
        if (isset($movieIds['Past Lives'])) {
            $movieId = $movieIds['Past Lives'];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[9],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[6],
                'role_type' => 'cast',
                'character_name' => 'Nora',
                'job' => null,
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[7],
                'role_type' => 'cast',
                'character_name' => 'Hae Sung',
                'job' => null,
                'order_index' => 1,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[9],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Screenplay',
                'order_index' => 0,
            ];
        }

        // Resurrection
        if (isset($movieIds['Resurrection'])) {
            $movieId = $movieIds['Resurrection'];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[12],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Director',
                'order_index' => 0,
            ];
            $moviePersons[] = [
                'movie_id' => $movieId,
                'person_id' => $personIds[12],
                'role_type' => 'crew',
                'character_name' => null,
                'job' => 'Screenplay',
                'order_index' => 0,
            ];
        }

        // Insert all
        foreach ($moviePersons as $mp) {
            if (!DB::table('movie_persons')
                ->where('movie_id', $mp['movie_id'])
                ->where('person_id', $mp['person_id'])
                ->where('role_type', $mp['role_type'])
                ->where('job', $mp['job'])
                ->exists()) {
                DB::table('movie_persons')->insert($mp);
            }
        }

        echo "\nAdding production details...\n";
        
        // Add genres, countries, languages, production houses
        $this->addMovieMetadata($movieIds);
    }

    private function addMovieMetadata($movieIds)
    {
        // Add genres
        $genreMap = [
            'The Handmaiden' => ['Drama', 'Romance', 'Thriller'],
            'Perfect Days' => ['Drama'],
            'Past Lives' => ['Drama', 'Romance'],
            'Resurrection' => ['Drama', 'Fantasy'],
        ];

        foreach ($genreMap as $movieTitle => $genres) {
            if (isset($movieIds[$movieTitle])) {
                $movieId = $movieIds[$movieTitle];
                foreach ($genres as $genreName) {
                    $genre = DB::table('genres')->where('name', $genreName)->first();
                    if ($genre) {
                        if (!DB::table('movie_genres')
                            ->where('movie_id', $movieId)
                            ->where('genre_id', $genre->id)
                            ->exists()) {
                            DB::table('movie_genres')->insert([
                                'movie_id' => $movieId,
                                'genre_id' => $genre->id,
                            ]);
                        }
                    }
                }
            }
        }

        // Add production houses
        $phData = [
            'The Handmaiden' => ['Moho Film', 'Yong Film'],
            'Perfect Days' => ['Wenders Images'],
            'Past Lives' => ['A24', 'CJ Entertainment'],
            'Resurrection' => ['CJ Entertainment'],
        ];

        foreach ($phData as $movieTitle => $houses) {
            if (isset($movieIds[$movieTitle])) {
                $movieId = $movieIds[$movieTitle];
                foreach ($houses as $houseName) {
                    $house = DB::table('production_houses')->where('name', $houseName)->first();
                    if (!$house) {
                        $houseId = DB::table('production_houses')->insertGetId(['name' => $houseName]);
                    } else {
                        $houseId = $house->id;
                    }
                    
                    if (!DB::table('movie_production_houses')
                        ->where('movie_id', $movieId)
                        ->where('production_house_id', $houseId)
                        ->exists()) {
                        DB::table('movie_production_houses')->insert([
                            'movie_id' => $movieId,
                            'production_house_id' => $houseId,
                        ]);
                    }
                }
            }
        }

        // Add countries
        $countryData = [
            'The Handmaiden' => ['South Korea'],
            'Perfect Days' => ['Japan', 'Germany'],
            'Past Lives' => ['USA', 'South Korea'],
            'Resurrection' => ['China'],
        ];

        foreach ($countryData as $movieTitle => $countries) {
            if (isset($movieIds[$movieTitle])) {
                $movieId = $movieIds[$movieTitle];
                foreach ($countries as $countryName) {
                    $country = DB::table('countries')->where('name', $countryName)->first();
                    if (!$country) {
                        $countryId = DB::table('countries')->insertGetId(['name' => $countryName]);
                    } else {
                        $countryId = $country->id;
                    }
                    
                    if (!DB::table('movie_countries')
                        ->where('movie_id', $movieId)
                        ->where('country_id', $countryId)
                        ->exists()) {
                        DB::table('movie_countries')->insert([
                            'movie_id' => $movieId,
                            'country_id' => $countryId,
                        ]);
                    }
                }
            }
        }

        // Add languages
        $langData = [
            'The Handmaiden' => ['Korean', 'Japanese'],
            'Perfect Days' => ['Japanese'],
            'Past Lives' => ['English', 'Korean'],
            'Resurrection' => ['Mandarin Chinese'],
        ];

        foreach ($langData as $movieTitle => $languages) {
            if (isset($movieIds[$movieTitle])) {
                $movieId = $movieIds[$movieTitle];
                foreach ($languages as $langName) {
                    $lang = DB::table('languages')->where('name', $langName)->first();
                    if (!$lang) {
                        $langId = DB::table('languages')->insertGetId(['name' => $langName]);
                    } else {
                        $langId = $lang->id;
                    }
                    
                    if (!DB::table('movie_languages')
                        ->where('movie_id', $movieId)
                        ->where('language_id', $langId)
                        ->exists()) {
                        DB::table('movie_languages')->insert([
                            'movie_id' => $movieId,
                            'language_id' => $langId,
                        ]);
                    }
                }
            }
        }

        echo "Metadata added successfully!\n";
    }
}
