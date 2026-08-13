<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LanguageSeeder extends Seeder
{
    private array $languages = [
        'Abkhazian', 'Afar', 'Afrikaans', 'Akan', 'Albanian', 'Amharic', 'Arabic', 'Aragonese',
        'Armenian', 'Assamese', 'Avaric', 'Avestan', 'Aymara', 'Azerbaijani', 'Bambara', 'Bashkir',
        'Basque', 'Belarusian', 'Bengali', 'Bihari', 'Bislama', 'Bosnian', 'Breton', 'Bulgarian',
        'Burmese', 'Catalan', 'Cantonese', 'Chamorro', 'Chechen', 'Chinese', 'Chuvash', 'Cornish',
        'Corsican', 'Cree', 'Croatian', 'Czech', 'Danish', 'Divehi', 'Dutch', 'Dzongkha', 'English',
        'Esperanto', 'Estonian', 'Ewe', 'Faroese', 'Fijian', 'Finnish', 'French', 'Frisian', 'Fulah',
        'Galician', 'Georgian', 'German', 'Greek', 'Guarani', 'Gujarati', 'Haitian', 'Hausa', 'Hebrew',
        'Herero', 'Hindi', 'Hiri Motu', 'Hungarian', 'Icelandic', 'Ido', 'Igbo', 'Indonesian',
        'Interlingua', 'Interlingue', 'Inuktitut', 'Inupiaq', 'Irish', 'Italian', 'Japanese',
        'Javanese', 'Kalaallisut', 'Kannada', 'Kanuri', 'Kashmiri', 'Kazakh', 'Khmer', 'Kikuyu',
        'Kinyarwanda', 'Kirghiz', 'Komi', 'Kongo', 'Korean', 'Kurdish', 'Kwanyama', 'Lao', 'Latin',
        'Latvian', 'Limburgish', 'Lingala', 'Lithuanian', 'Luba-Katanga', 'Luxembourgish',
        'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Manx', 'Maori', 'Marathi',
        'Marshallese', 'Mongolian', 'Nauru', 'Navajo', 'Ndonga', 'Nepali', 'North Ndebele',
        'Norwegian', 'Occitan', 'Ojibwa', 'Oromo', 'Ossetian', 'Pali', 'Panjabi', 'Pashto', 'Persian',
        'Polish', 'Portuguese', 'Quechua', 'Romanian', 'Romansh', 'Rundi', 'Russian', 'Samoan',
        'Sango', 'Sanskrit', 'Sardinian', 'Scots Gaelic', 'Serbian', 'Sesotho', 'Setswana', 'Shona',
        'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili',
        'Swati', 'Swedish', 'Tagalog', 'Tahitian', 'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai',
        'Tibetan', 'Tigrinya', 'Tonga', 'Tsonga', 'Tswana', 'Turkish', 'Turkmen', 'Twi', 'Ukrainian',
        'Urdu', 'Uyghur', 'Uzbek', 'Venda', 'Vietnamese', 'Volapük', 'Walloon', 'Welsh', 'Wolof',
        'Xhosa', 'Yiddish', 'Yoruba', 'Zhuang', 'Zulu',
    ];

    // Old (typo / non-standard) -> canonical name. Renamed in place so movie_languages stays valid.
    private array $renameMap = [
        'Cantonesse'       => 'Cantonese',
        'Persian (Farsi)'  => 'Persian',
        'Mandarin Chinese' => 'Chinese',
    ];

    public function run(): void
    {
        foreach ($this->renameMap as $old => $new) {
            $existing = DB::table('languages')->where('name', $old)->first();
            if ($existing && !DB::table('languages')->where('name', $new)->exists()) {
                DB::table('languages')->where('name', $old)->update(['name' => $new]);
            } elseif ($existing) {
                // Target name already exists: merge references then drop the dup
                DB::table('movie_languages')
                    ->where('language_id', $existing->id)
                    ->update(['language_id' => DB::table('languages')->where('name', $new)->value('id')]);
                DB::table('languages')->where('name', $old)->delete();
            }
        }

        $existing = DB::table('languages')
            ->pluck('name')
            ->map(fn ($n) => mb_strtolower(trim($n)))
            ->all();

        $added = 0;
        $skipped = [];

        foreach ($this->languages as $name) {
            $key = mb_strtolower(trim($name));
            if (in_array($key, $existing, true)) {
                $skipped[] = $name;
                continue;
            }
            DB::table('languages')->insert(['name' => $name]);
            $existing[] = $key;
            $added++;
        }

        $this->command->info("Languages: added {$added}, skipped (already exist) " . count($skipped));
        $this->command->info('Total in table: ' . DB::table('languages')->count());
    }
}