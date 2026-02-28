<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewComment extends Model
{
    protected $fillable = [
        'review_id',
        'user_id',
        'content',
        'parent_id',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the review this comment belongs to
     */
    public function review()
    {
        return $this->belongsTo(Review::class);
    }

    /**
     * Get the user who wrote this comment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get parent comment (for replies)
     */
    public function parent()
    {
        return $this->belongsTo(ReviewComment::class, 'parent_id');
    }

    /**
     * Get all replies to this comment
     */
    public function replies()
    {
        return $this->hasMany(ReviewComment::class, 'parent_id');
    }
}
