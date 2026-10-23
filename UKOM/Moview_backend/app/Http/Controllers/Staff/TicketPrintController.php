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

        return view('staff.tickets.print', compact('order'));
    }
}
