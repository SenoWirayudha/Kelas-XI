<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'status',
        'cinema_id',
    ];

    public const ROLE_ADMIN = 'admin';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_STAFF = 'staff';
    public const ROLE_USER = 'user';

    public const WEB_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_MANAGER,
        self::ROLE_STAFF,
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'joined_at' => 'datetime',
        ];
    }

    /**
     * Get the user profile associated with the user
     */
    public function userProfile()
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }

    /**
     * Get the user profile photo URL
     */
    public function profilePhotoUrl()
    {
        $profile = $this->userProfile;
        if ($profile && $profile->profile_photo) {
            return asset('storage/' . $profile->profile_photo);
        }
        return null;
    }

    /**
     * Get reviews written by the user
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get ratings given by the user
     */
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    /**
     * Get movie likes by the user
     */
    public function movieLikes()
    {
        return $this->hasMany(MovieLike::class);
    }

    /**
     * Get user activities
     */
    public function userActivities()
    {
        return $this->hasMany(UserActivity::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function cinema()
    {
        return $this->belongsTo(Cinema::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    public function isCinemaUser(): bool
    {
        return $this->isManager() || $this->isStaff();
    }

    public function dashboardRoute(): string
    {
        return match ($this->role) {
            self::ROLE_ADMIN => 'admin.dashboard',
            self::ROLE_MANAGER => 'manager.dashboard',
            self::ROLE_STAFF => 'staff.dashboard',
            default => 'admin.login',
        };
    }
}
