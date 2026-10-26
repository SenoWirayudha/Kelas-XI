<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class TicketPrintController extends Controller
{
    public function show(Request $request, Order $order)
    {
        $order->load([
            'schedule.movie',
            'schedule.studio.cinema',
            'tickets.seat',
            'staff',
        ]);

        $this->authorizeCinema($order->schedule?->studio?->cinema_id);

        abort_unless($order->status === 'paid', 403, 'Tiket hanya dapat dicetak setelah pembayaran lunas.');

        // Opened from the ticket scanner ("?from=scan") vs the cashier: only the back button
        // target differs, so the operator returns to where they came from.
        $fromScan = $request->query('from') === 'scan';

        return view('staff.tickets.print', compact('order', 'fromScan'));
    }
}
