<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\StaffAttendance;
use Illuminate\Database\QueryException;

class AttendanceController extends Controller
{
    public function index()
    {
        $staffId = (int) session('admin_user_id');
        $cinemaId = (int) session('admin_cinema_id');
        $today = now('Asia/Jakarta')->startOfDay();

        $attendance = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        $history = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereBetween('tanggal', [$today->copy()->subDays(6)->toDateString(), $today->toDateString()])
            ->orderByDesc('tanggal')
            ->get();

        return view('staff.attendance.index', [
            'attendance' => $attendance,
            'history' => $history,
            'today' => $today,
        ]);
    }

    public function checkIn()
    {
        $staffId = (int) session('admin_user_id');
        $cinemaId = (int) session('admin_cinema_id');
        $now = now('Asia/Jakarta');

        $exists = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->whereDate('tanggal', $now->toDateString())
            ->exists();

        if ($exists) {
            return back()->with('error', 'Anda sudah absen masuk hari ini.');
        }

        try {
            StaffAttendance::create([
                'staff_id' => $staffId,
                'cinema_id' => $cinemaId,
                'tanggal' => $now->toDateString(),
                'jam_masuk' => $now->format('H:i:s'),
            ]);
        } catch (QueryException $e) {
            if ((string) $e->getCode() !== '23505') {
                throw $e;
            }

            return back()->with('error', 'Absen masuk hari ini sudah tercatat.');
        }

        return back()->with('success', 'Absen masuk berhasil pada ' . $now->format('H:i') . ' WIB.');
    }

    public function checkOut()
    {
        $staffId = (int) session('admin_user_id');
        $cinemaId = (int) session('admin_cinema_id');
        $now = now('Asia/Jakarta');

        $updated = StaffAttendance::query()
            ->where('staff_id', $staffId)
            ->where('cinema_id', $cinemaId)
            ->whereDate('tanggal', $now->toDateString())
            ->whereNotNull('jam_masuk')
            ->whereNull('jam_pulang')
            ->update(['jam_pulang' => $now->format('H:i:s')]);

        if ($updated === 0) {
            return back()->with('error', 'Absen pulang tidak dapat dilakukan. Pastikan Anda sudah absen masuk dan belum absen pulang.');
        }

        return back()->with('success', 'Absen pulang berhasil pada ' . $now->format('H:i') . ' WIB.');
    }
}
