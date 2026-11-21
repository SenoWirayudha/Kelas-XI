<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class MovieService extends Model
{
    protected $table = 'movie_services';

    public $timestamps = false;

    /** Row created by the release-track sync (safe to refresh automatically). */
    public const SOURCE_AUTO = 'auto';

    /** Row created or edited by an admin: the automatic sync must never touch it. */
    public const SOURCE_MANUAL = 'manual';

    /** Availability types are stored lowercase: stream, rent, buy, theatrical. */
    public const AVAILABILITY_TYPES = ['stream', 'rent', 'buy', 'theatrical'];

    protected $fillable = [
        'movie_id',
        'service_id',
        'availability_type',
        'release_date',
        'is_coming_soon',
        'source',
    ];

    protected $attributes = [
        'source' => self::SOURCE_MANUAL,
    ];

    /**
     * Single normalization point so no caller can persist the wrong casing or
     * the legacy "streaming" wording (the source of the stray "STREAM" value).
     */
    public static function normalizeAvailabilityType(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $normalized = strtolower(trim($value));
        // Legacy rows were stored with the SQL quoting included ("'stream'").
        $normalized = trim($normalized, "'\"`");
        $normalized = trim($normalized);
        if ($normalized === 'streaming') {
            $normalized = 'stream';
        }
        return $normalized === '' ? null : $normalized;
    }

    protected function availabilityType(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => self::normalizeAvailabilityType($value),
            set: fn ($value) => self::normalizeAvailabilityType($value),
        );
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
