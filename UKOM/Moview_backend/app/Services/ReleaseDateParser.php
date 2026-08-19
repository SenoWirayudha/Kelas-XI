<?php

namespace App\Services;

use App\Models\Country;

/**
 * Parses free-form pasted release-date text into structured rows.
 *
 * Format (flat, one line):
 *   <title> Premiere <date> <country>[ <country>...][, <festival>] <date> ...
 *   Theatrical <date> <country>[ <country>...] ... Streaming ...
 * Format (per baris, tanggal diikuti beberapa baris "Negara, Nama"):
 *   Streaming <date>
 *   <country>, <platform>
 *   <country>, <platform>
 *   ... (semua baris memakai tanggal yang sama)
 *
 * Rules:
 *  - Section keywords: Premiere / Theatrical / Streaming (case-insensitive).
 *    Every entry after a keyword until the next keyword belongs to that type.
 *  - Dates are detected with the DD Mon YYYY pattern and act as separators.
 *  - Text between two dates is split into lines; each line holds one or more
 *    country names (matched against the countries table, longest-match).
 *    Consecutive countries with no separator means multiple countries on the
 *    same date.
 *  - A comma separates the country(ies) from the optional festival/platform
 *    name: "France, Cannes Film Festival" -> country France, name "Cannes
 *    Film Festival". Without a comma, trailing text that matches no country
 *    is still treated as the festival name for Premiere entries.
 *  - The title before the first section keyword is kept for visual
 *    confirmation only; it is never auto-matched to a movie.
 */
class ReleaseDateParser
{
    private const MONTHS = [
        'Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'May' => 5, 'Jun' => 6,
        'Jul' => 7, 'Aug' => 8, 'Sep' => 9, 'Oct' => 10, 'Nov' => 11, 'Dec' => 12,
    ];

    private const SECTION_KEYWORDS = ['premiere', 'theatrical', 'streaming'];

    /** Common aliases that are not present as-is in the countries table. */
    private const COUNTRY_ALIASES = [
        'uk' => 'United Kingdom',
        'u.k.' => 'United Kingdom',
        'usa' => 'United States',
        'us' => 'United States',
        'u.s.' => 'United States',
        'u.s.a.' => 'United States',
        'uae' => 'United Arab Emirates',
        'czechia' => 'Czech Republic',
        'macao' => 'Macau',
    ];

    /** @var array<string, array{name: string, code: string}> lowercased key => canonical entry */
    private array $countryLookup = [];

    public function __construct(?iterable $countries = null)
    {
        $countries ??= Country::select('name', 'code')->get();
        $this->buildCountryLookup($countries);
    }

    private function buildCountryLookup(iterable $countries): void
    {
        foreach ($countries as $c) {
            $name = trim((string) $c->name);
            $code = $c->code;
            if ($name === '' || !$code) {
                continue;
            }
            $this->countryLookup[mb_strtolower($name)] = ['name' => $name, 'code' => $code];
        }

        foreach (self::COUNTRY_ALIASES as $alias => $canonical) {
            $key = mb_strtolower($canonical);
            if (isset($this->countryLookup[$key])) {
                $this->countryLookup[mb_strtolower($alias)] = $this->countryLookup[$key];
            }
        }
    }

    /**
     * @return array{title: string, rows: array<int, array<string, mixed>>, warnings: array<int, array{type: string, raw: string, reason: string}>}
     */
    public function parse(string $text): array
    {
        $text = trim($text);
        if ($text === '') {
            return ['title' => '', 'rows' => [], 'warnings' => []];
        }

        $split = $this->splitSections($text);

        $rows = [];
        $warnings = [];

        foreach ($split['sections'] as $section) {
            $this->parseSection($section['type'], $section['content'], $rows, $warnings);
        }

        return [
            'title' => $split['title'],
            'rows' => $rows,
            'warnings' => $warnings,
        ];
    }

    /**
     * @return array{title: string, sections: array<int, array{type: string, content: string}>}
     */
    private function splitSections(string $text): array
    {
        $pattern = '/\b(' . implode('|', self::SECTION_KEYWORDS) . ')\b/i';
        preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE);

        if (empty($matches[1])) {
            return ['title' => $text, 'sections' => []];
        }

        $title = trim(substr($text, 0, $matches[1][0][1]));

        $sections = [];
        $count = count($matches[1]);
        for ($i = 0; $i < $count; $i++) {
            $start = $matches[1][$i][1] + strlen($matches[1][$i][0]);
            $end = ($i + 1 < $count) ? $matches[1][$i + 1][1] : strlen($text);
            $sections[] = [
                'type' => strtolower($matches[1][$i][0]),
                'content' => substr($text, $start, $end - $start),
            ];
        }

        return ['title' => $title, 'sections' => $sections];
    }

    private function parseSection(string $type, string $content, array &$rows, array &$warnings): void
    {
        $content = trim($content);
        if ($content === '') {
            return;
        }

        $datePattern = '/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i';
        preg_match_all($datePattern, $content, $matches, PREG_OFFSET_CAPTURE);

        if (empty($matches[0])) {
            $warnings[] = [
                'type' => $type,
                'raw' => $content,
                'reason' => 'Tidak ditemukan pola tanggal (DD Mon YYYY) pada section ' . ucfirst($type),
            ];
            return;
        }

        $leading = trim(substr($content, 0, $matches[0][0][1]));
        if ($leading !== '') {
            $warnings[] = [
                'type' => $type,
                'raw' => $leading,
                'reason' => 'Teks sebelum tanggal pertama tidak dikenali pada section ' . ucfirst($type),
            ];
        }

        $count = count($matches[0]);
        for ($i = 0; $i < $count; $i++) {
            $dateStr = $matches[0][$i][0];
            $day = (int) $matches[1][$i][0];
            $month = self::MONTHS[ucfirst($matches[2][$i][0])] ?? null;
            $year = (int) $matches[3][$i][0];

            if ($month === null) {
                continue;
            }
            $releaseDate = sprintf('%04d-%02d-%02d', $year, $month, $day);

            $dateEnd = $matches[0][$i][1] + strlen($dateStr);
            $nextStart = ($i + 1 < $count) ? $matches[0][$i + 1][1] : strlen($content);
            $context = trim(substr($content, $dateEnd, $nextStart - $dateEnd));

            $this->parseEntry($type, $releaseDate, $context, $rows, $warnings);
        }
    }

    private function parseEntry(string $type, string $releaseDate, string $context, array &$rows, array &$warnings): void
    {
        if (trim($context) === '') {
            $warnings[] = [
                'type' => $type,
                'raw' => $releaseDate,
                'reason' => 'Tidak ada negara setelah tanggal ' . $releaseDate,
            ];
            return;
        }

        // A single date can be followed by several lines, each holding one entry:
        //   "Germany, Netflix\nAustralia, Netflix\n..."  -> 10 entries, same date.
        // Each line may also hold several countries without separators:
        //   "Germany Netherlands, Netflix"  -> 2 countries, shared name + date.
        foreach (preg_split('/\R+/u', $context) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            // Comma separates country(ies) from the festival/platform name:
            //   "France, Cannes Film Festival"  -> country France, name "Cannes Film Festival"
            //   "Germany Netherlands, Netflix"  -> two countries, shared name "Netflix"
            $name = null;
            $countryText = $line;
            $commaPos = strpos($line, ',');
            if ($commaPos !== false) {
                $countryText = trim(substr($line, 0, $commaPos));
                $after = trim(substr($line, $commaPos + 1));
                if ($after !== '') {
                    $name = $after;
                }
            }

            $remaining = $countryText;
            $countries = [];
            while ($remaining !== '') {
                $match = $this->matchCountry($remaining);
                if ($match === null) {
                    break;
                }
                $countries[] = $match;
                $remaining = trim(substr($remaining, strlen($match['matched_text'])));
            }

            // Leftover that could not be matched as a country (and was not after a comma)
            // is treated as the festival name (Premiere) or platform name (Streaming);
            // Theatrical does not take a name, so flag it for manual review.
            $leftover = trim($remaining);
            if ($leftover !== '') {
                if ($type === 'theatrical') {
                    $warnings[] = [
                        'type' => $type,
                        'raw' => $leftover,
                        'reason' => 'Teks tidak dikenali untuk rilis theatrical pada ' . $releaseDate . ' (pisahkan festival/platform dengan koma, atau hapus teks ini)',
                    ];
                } elseif ($name === null) {
                    // No comma given but leftover doesn't match a country: treat as
                    // festival name (Premiere) / platform name (Streaming).
                    $name = $leftover;
                }
            }

            if (empty($countries)) {
                $warnings[] = [
                    'type' => $type,
                    'raw' => $line,
                    'reason' => 'Tidak ada negara yang dikenali pada tanggal ' . $releaseDate,
                ];
                continue;
            }

            foreach ($countries as $c) {
                $rows[] = [
                    'type' => $type,
                    'country_code' => $c['code'],
                    'country_name' => $c['name'],
                    'name' => $name,
                    'release_date' => $releaseDate,
                ];
            }
        }
    }

    /**
     * Longest-match a country (or alias) at the start of $text.
     *
     * @return array{matched_text: string, name: string, code: string}|null
     */
    private function matchCountry(string $text): ?array
    {
        $needle = mb_strtolower($text);
        $best = null;

        foreach ($this->countryLookup as $key => $entry) {
            if ($key === '' || !str_starts_with($needle, $key)) {
                continue;
            }
            $after = mb_substr($text, mb_strlen($key));
            if ($after !== '' && preg_match('/[\p{L}\p{N}]/u', mb_substr($after, 0, 1))) {
                continue;
            }
            $len = mb_strlen($key);
            if ($best === null || $len > $best['len']) {
                $best = [
                    'len' => $len,
                    'matched_text' => mb_substr($text, 0, $len),
                    'name' => $entry['name'],
                    'code' => $entry['code'],
                ];
            }
        }

        return $best;
    }
}
