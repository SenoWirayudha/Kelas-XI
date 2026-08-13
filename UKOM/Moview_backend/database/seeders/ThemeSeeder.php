<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ThemeSeeder extends Seeder
{
    private array $themes = [
        'Humanity and the world around us',
        'Moving relationship stories',
        'Erotic relationships and desire',
        'Enduring stories of family and marital drama',
        'Captivating relationships and charming romance',
        'Passion and romance',
        'Challenging or sexual themes & twists',
        'Intense violence and sexual transgression',
        'Surreal and thought-provoking visions of life and death',
        'Thought-provoking sci-fi action and future technology',
        'Disastrous voyages and heroic survival',
        'Politics and human rights',
        'Racism and the powerful fight for justice',
        'Faith and religion',
        'Religious faith, sin, and forgiveness',
        'Faith and spiritual journeys',
        'Emotional LGBTQ relationships',
        'Student coming-of-age challenges',
        'Emotional teen coming-of-age stories',
        'Teen friendship and coming-of-age',
        'Teen school antics and laughter',
        'Underdogs and coming of age',
        'Inspiring sports underdog stories',
        'Underdog fighting and boxing stories',
        'Relationship comedy',
        'Quirky and endearing relationships',
        'Laugh-out-loud relationship entanglements',
        'Crude humor and satire',
        'Amusing jokes and witty satire',
        'Gags, jokes, and slapstick humor',
        'Catchy songs and hilarious musical comedy',
        'Emotional and heartfelt family dramas',
        'Heartfelt and sentimental family stories',
        'Heartbreaking and moving family drama',
        'Powerful stories of heartbreak and suffering',
        'Tragic sadness and captivating beauty',
        'Powerful poetic and passionate drama',
        'Emotional and captivating fantasy storytelling',
        'Fascinating, emotional stories and documentaries',
        'Crime, drugs and gangsters',
        'Gritty crime and ruthless gangsters',
        'Violent action, guns, and crime',
        'Graphic violence and brutal revenge',
        'Adrenaline-fueled action and fast cars',
        'High speed and special ops',
    ];

    public function run(): void
    {
        DB::table('themes')->delete();

        foreach ($this->themes as $name) {
            DB::table('themes')->insert([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Themes reseeded: ' . count($this->themes));
        $this->command->info('Total in table: ' . DB::table('themes')->count());
    }
}