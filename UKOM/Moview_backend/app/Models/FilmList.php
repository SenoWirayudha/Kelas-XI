<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmList extends Model
{
    public const TYPE_RANKED = 'ranked';
    public const TYPE_PLAIN = 'plain';

    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_PRIVATE = 'private';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'visibility',
        'use_backdrop',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'use_backdrop' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(FilmListItem::class)->orderBy('position');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isRanked(): bool
    {
        return $this->type === self::TYPE_RANKED;
    }

    public function isVisibleTo(?int $viewerId): bool
    {
        return $this->visibility === self::VISIBILITY_PUBLIC
            || (int) $this->user_id === (int) $viewerId;
    }
}
