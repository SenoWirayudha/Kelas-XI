<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force Connection: close on all API responses.
 *
 * PHP's built-in dev server (php artisan serve) uses HTTP/1.1 keep-alive by
 * default.  OkHttp re-uses pooled connections, but the dev server can close
 * the socket between requests which causes an EOFException when the next
 * request tries to reuse the same connection.  Sending Connection: close
 * tells OkHttp to discard the connection after each response instead of
 * returning it to the pool.
 */
class ForceConnectionClose
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('Connection', 'close');
        return $response;
    }
}
