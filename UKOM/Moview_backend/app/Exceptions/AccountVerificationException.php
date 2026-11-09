<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * A verification step (OTP / Google re-login) refused an account action.
 *
 * Carries the exact response the API should return, so the check can run
 * INSIDE the DB transaction and a failed write rolls back the consumed code
 * instead of burning it.
 */
class AccountVerificationException extends RuntimeException
{
    public function __construct(public JsonResponse $response)
    {
        parent::__construct('Account verification failed.');
    }
}
