<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Keeps a list URL (path + query) alive across detail, edit, create, save,
 * and delete flows through a validated "return" parameter.
 */
final class ReturnUrl
{
    public static function current(?Request $request = null): ?string
    {
        $request ??= request();

        return self::safe($request->getRequestUri());
    }

    public static function fromRequest(?Request $request = null): ?string
    {
        $request ??= request();

        return self::safe($request->input('return'));
    }

    public static function safe(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || $value[0] !== '/') {
            return null;
        }

        // Reject protocol-relative and backslash variants that browsers may
        // normalize into an external host.
        if (str_starts_with($value, '//') || str_starts_with($value, '/\\')) {
            return null;
        }

        if (preg_match('/[\\\\\x00-\x1F\x7F]/', $value)) {
            return null;
        }

        $parts = parse_url($value);

        if ($parts === false || isset($parts['scheme']) || isset($parts['host'])) {
            return null;
        }

        $path = $parts['path'] ?? '';

        if ($path === '' || !str_starts_with($path, '/')) {
            return null;
        }

        return $value;
    }

    public static function add(string $url, ?string $return): string
    {
        $return = self::safe($return);

        if ($return === null) {
            return $url;
        }

        $separator = str_contains($url, '?') ? '&' : '?';

        return $url . $separator . http_build_query(['return' => $return], '', '&', PHP_QUERY_RFC3986);
    }

    public static function resolve(?Request $request, string $fallback): string
    {
        return self::fromRequest($request) ?? $fallback;
    }

    public static function redirect(Request $request, string $fallback): RedirectResponse
    {
        return redirect(self::resolve($request, $fallback));
    }

    public static function query(string $url): array
    {
        $query = parse_url($url, PHP_URL_QUERY);

        if (!is_string($query) || $query === '') {
            return [];
        }

        parse_str($query, $params);

        return $params;
    }

    public static function request(string $url): Request
    {
        return Request::create($url, 'GET');
    }

    /**
     * Move to the previous page when the requested page no longer exists.
     */
    public static function fitPage(string $url, int $total, int $perPage): string
    {
        $params = self::query($url);
        $page = max(1, (int) ($params['page'] ?? 1));

        if ($page <= 1) {
            return $url;
        }

        $lastPage = max(1, (int) ceil($total / max(1, $perPage)));

        if ($page <= $lastPage) {
            return $url;
        }

        $params['page'] = $lastPage;

        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $fragment = parse_url($url, PHP_URL_FRAGMENT);
        $queryString = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

        return $path
            . ($queryString !== '' ? '?' . $queryString : '')
            . ($fragment ? '#' . $fragment : '');
    }
}
