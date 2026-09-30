<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GeoController extends Controller
{
    /**
     * GET /api/v1/geo/country
     * Detects the caller's country (ISO 3166-1 alpha-2).
     *
     * Resolution order:
     *  1. Public client IP -> ip-api.com geolocation (cached 24h).
     *  2. Accept-Language header region (e.g. "id-ID" -> ID, "en-US" -> US).
     *  3. Fallback "ID" (project default audience).
     */
    public function country(Request $request)
    {
        $code = null;
        $ip = $request->ip();

        if ($ip && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            $code = Cache::remember('geo_country:' . $ip, now()->addDay(), function () use ($ip) {
                $code = $this->lookupIpCountry($ip);
                return $code ?: '';
            });
            $code = $code ?: null;
        }

        if (!$code) {
            $code = $this->countryFromAcceptLanguage($request);
        }

        if (!$code) {
            $code = 'ID';
        }

        $name = Country::where('code', $code)->value('name') ?? $code;

        return response()->json([
            'success' => true,
            'data' => [
                'country_code' => $code,
                'country_name' => $name,
                'source' => 'geolocation',
            ],
        ]);
    }

    private function lookupIpCountry(string $ip): ?string
    {
        $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,countryCode';
        $ctx = stream_context_create([
            'http' => ['timeout' => 2, 'ignore_errors' => true],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        if (!$raw) {
            return null;
        }
        $json = json_decode($raw, true);
        if (!is_array($json) || ($json['status'] ?? '') !== 'success' || empty($json['countryCode'])) {
            return null;
        }
        return strtoupper((string) $json['countryCode']);
    }

    private function countryFromAcceptLanguage(Request $request): ?string
    {
        $header = trim((string) $request->header('Accept-Language'));
        if ($header === '') {
            return null;
        }

        $first = explode(',', $header)[0];
        $first = trim(explode(';', $first)[0]);
        if ($first === '') {
            return null;
        }

        if (str_contains($first, '-')) {
            $region = strtoupper(substr(strrchr($first, '-'), 1));
            if (strlen($region) === 2 && ctype_alpha($region)) {
                return $region;
            }
            $first = explode('-', $first)[0];
        }

        $languageMap = [
            'id' => 'ID', 'en' => 'US', 'ms' => 'MY', 'th' => 'TH', 'vi' => 'VN',
            'tl' => 'PH', 'ja' => 'JP', 'ko' => 'KR', 'zh' => 'CN', 'ar' => 'SA',
            'de' => 'DE', 'fr' => 'FR', 'es' => 'ES', 'pt' => 'BR', 'ru' => 'RU',
            'hi' => 'IN', 'tr' => 'TR', 'it' => 'IT', 'nl' => 'NL',
        ];

        return $languageMap[strtolower($first)] ?? null;
    }
}
