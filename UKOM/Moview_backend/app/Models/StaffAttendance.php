<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class StaffAttendance extends Model
{
    protected $fillable = [
        'staff_id',
        'cinema_id',
        'tanggal',
        'jam_masuk',
        'jam_pulang',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function cinema()
    {
        return $this->belongsTo(Cinema::class);
    }

    public function durationMinutes(): ?int
    {
        if (! $this->jam_masuk) {
            return null;
        }

        $date = $this->tanggal->format('Y-m-d');
        $start = Carbon::parse($date . ' ' . $this->jam_masuk, 'Asia/Jakarta');
        $end = $this->jam_pulang
            ? Carbon::parse($date . ' ' . $this->jam_pulang, 'Asia/Jakarta')
            : ($this->tanggal->isToday() ? now('Asia/Jakarta') : null);

        if (! $end) {
            return null;
        }

        return max(0, (int) $start->diffInMinutes($end));
    }
}
