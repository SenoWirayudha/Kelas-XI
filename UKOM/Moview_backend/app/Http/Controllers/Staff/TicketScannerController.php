<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\TicketController as ApiTicketController;
use Illuminate\Http\Request;

class TicketScannerController extends Controller
{
    public function index()
    {
        return view('admin.tickets.scanner');
    }

    public function preview(Request $request)
    {
        return app(ApiTicketController::class)->scanPreview($request, $this->cinemaId());
    }

    public function scan(Request $request)
    {
        return app(ApiTicketController::class)->scan($request, $this->cinemaId());
    }

    private function cinemaId(): int
    {
        $cinemaId = (int) session('admin_cinema_id');

        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        return $cinemaId;
    }
}
