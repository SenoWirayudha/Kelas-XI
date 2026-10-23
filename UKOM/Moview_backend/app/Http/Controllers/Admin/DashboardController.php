<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function admin()
    {
        return view('admin.dashboard');
    }

    public function manager()
    {
        return view('manager.dashboard', [
            'cinemaName' => session('admin_cinema_name'),
        ]);
    }

    public function staff()
    {
        return view('staff.dashboard', [
            'cinemaName' => session('admin_cinema_name'),
        ]);
    }
}
