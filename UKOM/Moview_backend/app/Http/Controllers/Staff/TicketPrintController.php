<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Order;

class TicketPrintController extends Controller
{
    public function show(Order $order)
    {
        $order->load([
            'schedule.movie',
            'schedule.studio.cinema',
            'tickets.seat',
            'staff',
        ]);

        $this->authorizeCinema($order->schedule?->studio?->cinema_id);

        abort_unless($order->status === 'paid', 403, 'Tiket hanya dapat dicetak setelah pembayaran lunas.');

        return view('staff.tickets.print', compact('order'));
    }
}
