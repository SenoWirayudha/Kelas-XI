<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * GET /api/v1/users/{userId}/tickets
     * Returns ticket purchase history for a user.
     */
    public function history(int $userId)
    {
        $orders = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
        ])
            ->where('user_id', $userId)
            ->whereHas('tickets')
            ->orderByDesc('id')
            ->get();

        $history = $orders->map(function (Order $order) {
            $schedule = $order->schedule;
            $movie = $schedule?->movie;
            $studio = $schedule?->studio;
            $cinema = $studio?->cinema;

            if (!$schedule || !$movie || !$studio || !$cinema) {
                return null;
            }

            return [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'order_status' => $order->status,
                'movie' => [
                    'id' => $movie->id,
                    'title' => $movie->title,
                    'poster_path' => $movie->default_poster_path,
                ],
                'cinema' => [
                    'name' => $cinema->cinema_name,
                ],
                'studio' => [
                    'name' => $studio->studio_name,
                    'type' => $studio->studio_type,
                ],
                'schedule' => [
                    'show_date' => optional($schedule->show_date)->format('Y-m-d'),
                    'show_time' => (string) $schedule->show_time,
                ],
                'seats' => $order->orderSeats
                    ->map(fn($orderSeat) => [
                        'seat_id' => $orderSeat->seat_id,
                        'seat_code' => $orderSeat->seat?->seat_code,
                    ])
                    ->filter(fn($seat) => !empty($seat['seat_code']))
                    ->values(),
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

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
            'order.user',
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
                'buyer'        => $ticket->order->user ? [
                    'user_id'  => $ticket->order->user->id,
                    'username' => $ticket->order->user->username,
                    'email'    => $ticket->order->user->email,
                ] : null,
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
