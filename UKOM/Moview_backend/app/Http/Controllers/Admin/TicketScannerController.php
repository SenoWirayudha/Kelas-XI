<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketScannerController extends Controller
{
    public function index()
    {
        return view('admin.tickets.scanner');
    }

    public function scan(Request $request)
    {
        $request->validate([
            'qr_code' => 'required|string',
        ]);

        $ticket = Ticket::with([
            'order.schedule.movie',
            'order.schedule.studio.cinema',
            'seat',
        ])->where('qr_code', $request->qr_code)->first();

        if (!$ticket) {
            return back()
                ->withInput()
                ->with('scan_error', 'Tiket tidak ditemukan. Periksa kembali QR Code.');
        }

        return view('admin.tickets.scanner', compact('ticket'));
    }

    public function markUsed(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
        ]);

        $ticket = Ticket::findOrFail($request->ticket_id);

        if ($ticket->is_used) {
            return back()->with('scan_error', 'Tiket sudah pernah digunakan.');
        }

        $ticket->update(['is_used' => true]);

        return back()->with('scan_success', 'Tiket berhasil divalidasi. Selamat menikmati film!');
    }
}
