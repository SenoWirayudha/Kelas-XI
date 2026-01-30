<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserActivitySeeder extends Seeder
{
    public function run()
    {
        $activities = [
            ['user_id' => 1, 'type' => 'watched', 'film_id' => 3, 'meta' => null, 'created_at' => '2026-01-21 14:28:42', 'updated_at' => '2026-01-21 14:28:42'],
            ['user_id' => 2, 'type' => 'logged', 'film_id' => 3, 'meta' => null, 'created_at' => '2026-01-21 14:15:33', 'updated_at' => '2026-01-21 14:15:33'],
            ['user_id' => 1, 'type' => 'reviewed', 'film_id' => 4, 'meta' => null, 'created_at' => '2026-01-21 14:32:15', 'updated_at' => '2026-01-21 14:32:15'],
            ['user_id' => 2, 'type' => 'watchlist', 'film_id' => 5, 'meta' => json_encode(['action' => 'Added']), 'created_at' => '2026-01-21 14:30:22', 'updated_at' => '2026-01-21 14:30:22'],
            ['user_id' => 3, 'type' => 'like', 'film_id' => 3, 'meta' => json_encode(['review_author' => 'Sarah Williams']), 'created_at' => '2026-01-21 19:40:15', 'updated_at' => '2026-01-21 19:40:15'],
            ['user_id' => 4, 'type' => 'comment', 'film_id' => 4, 'meta' => json_encode(['comment' => 'Great analysis! I totally agree with your perspective.']), 'created_at' => '2026-01-21 19:25:48', 'updated_at' => '2026-01-21 19:25:48'],
            ['user_id' => 3, 'type' => 'watched', 'film_id' => 5, 'meta' => null, 'created_at' => '2026-01-21 18:52:33', 'updated_at' => '2026-01-21 18:52:33'],
            ['user_id' => 4, 'type' => 'logged', 'film_id' => 3, 'meta' => null, 'created_at' => '2026-01-21 18:40:15', 'updated_at' => '2026-01-21 18:40:15'],
        ];

        DB::table('user_activities')->insert($activities);
        
        echo "Created " . count($activities) . " user activities\n";
    }
}
