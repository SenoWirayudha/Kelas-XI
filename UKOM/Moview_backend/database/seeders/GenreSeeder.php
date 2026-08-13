<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GenreSeeder extends Seeder
{
    private array $genres = [
        'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Coming of Age', 'Crime',
        'Documentary', 'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror',
        'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Superhero', 'Thriller',
        'War', 'Western',
    ];

    public function run(): void
    {
        $existing = DB::table('genres')
            ->pluck('name')
            ->map(fn ($n) => mb_strtolower(trim($n)))
            ->all();

        $added = 0;
        $skipped = [];

        foreach ($this->genres as $name) {
            $key = mb_strtolower(trim($name));
            if (in_array($key, $existing, true)) {
                $skipped[] = $name;
                continue;
            }
            DB::table('genres')->insert(['name' => $name]);
            $existing[] = $key;
            $added++;
        }

        $this->command->info("Genres: added {$added}, skipped (already exist) " . count($skipped));
        $this->command->info('Total in table: ' . DB::table('genres')->count());
    }
}