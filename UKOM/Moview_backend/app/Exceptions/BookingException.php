<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A booking rule was violated. Carries the HTTP status the caller should use
 * plus optional seat codes / context for the UI.
 */
class BookingException extends RuntimeException
{
    public function __construct(
        string $message,
        public int $status = 422,
        public array $seatCodes = [],
        public array $context = []
    ) {
        parent::__construct($message);
    }
}
