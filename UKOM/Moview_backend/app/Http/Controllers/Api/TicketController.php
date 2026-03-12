<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * GET /api/v1/ticket?qr_code=XXXX
     * Returns full ticket details for the given QR code.
     */
    public function show(Request $request)
    {
        $request->validate([
            'qr_code' => 'required|string',
        ]);

        $ticket = Ticket::with([
            'order.schedule.studio.cinema',
            'order.schedule.movie',
            'seat',
        ])->where('qr_code', $request->qr_code)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found.',
            ], 404);
        }

        $schedule = $ticket->order->schedule;
        $studio   = $schedule->studio;
        $cinema   = $studio->cinema;
        $movie    = $schedule->movie;

        return response()->json([
            'success' => true,
            'data'    => [
                'ticket_id'    => $ticket->id,
                'qr_code'      => $ticket->qr_code,
                'is_used'      => $ticket->is_used,
                'order_code'   => $ticket->order->order_code,
                'order_status' => $ticket->order->status,
                'seat'         => [
                    'seat_id'   => $ticket->seat->id,
                    'seat_code' => $ticket->seat->seat_code,
                ],
                'movie'        => [
                    'id'    => $movie->id,
                    'title' => $movie->title,
                ],
                'cinema'       => [
                    'name'     => $cinema->cinema_name,
                    'location' => trim($cinema->city . ', ' . $cinema->address, ', '),
                ],
                'studio_name'  => $studio->studio_name,
                'show_date'    => $schedule->show_date->format('Y-m-d'),
                'show_time'    => $schedule->show_time,
            ],
        ]);
    }
}
