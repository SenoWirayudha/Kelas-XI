<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    private function resolveValidOrderForScan(string $ticketCode): array
    {
        $order = Order::with(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat'])
            ->where('ticket_code', $ticketCode)
            ->first();

        if (!$order || !$order->schedule) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Ticket not found',
                ], 404),
            ];
        }

        if ((bool) $order->is_scanned) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Ticket already used',
                ], 409),
            ];
        }

        $showDateRaw = $order->schedule->show_date;
        $showTime = (string) $order->schedule->show_time;

        if (empty($showDateRaw) || empty($showTime)) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Invalid show schedule',
                ], 422),
            ];
        }

        $showDateTime = Carbon::parse(trim(Carbon::parse($showDateRaw)->format('Y-m-d') . ' ' . $showTime));

        if (now()->greaterThan($showDateTime->copy()->addHour())) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Ticket expired',
                ], 422),
            ];
        }

        if (strtolower((string) $order->status) !== 'paid') {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Ticket is not paid yet',
                ], 422),
            ];
        }

        return [
            'order' => $order,
            'error' => null,
        ];
    }

    private function buildScanPayload(Order $order): array
    {
        $schedule = $order->schedule;
        $showDateRaw = $schedule?->show_date;

        return [
            'order_id' => $order->id,
            'ticket_code' => $order->ticket_code,
            'is_scanned' => (bool) $order->is_scanned,
            'scanned_at' => optional($order->scanned_at)?->toIso8601String(),
            'movie_title' => $schedule?->movie?->title,
            'cinema_name' => $schedule?->studio?->cinema?->cinema_name,
            'studio_name' => $schedule?->studio?->studio_name,
            'show_date' => $showDateRaw ? Carbon::parse($showDateRaw)->format('Y-m-d') : null,
            'show_time' => $schedule?->show_time,
            'seat_codes' => $order->tickets
                ->map(fn($ticket) => $ticket->seat?->seat_code)
                ->filter(fn($seatCode) => !empty($seatCode))
                ->values(),
        ];
    }

    private function resolvePaymentMethodLabel(?Payment $payment): string
    {
        if (!$payment) {
            return '-';
        }

        $paymentType = strtolower((string) $payment->payment_type);
        $raw = is_array($payment->midtrans_raw_response) ? $payment->midtrans_raw_response : [];

        if ($paymentType === 'bank_transfer') {
            $bank = null;

            if (!empty($raw['va_numbers'][0]['bank'])) {
                $bank = strtoupper((string) $raw['va_numbers'][0]['bank']);
            } elseif (!empty($raw['bank'])) {
                $bank = strtoupper((string) $raw['bank']);
            }

            return $bank ? "Bank Transfer ({$bank})" : 'Bank Transfer';
        }

        return match ($paymentType) {
            'gopay' => 'GoPay',
            'shopeepay' => 'ShopeePay',
            'qris' => 'QRIS',
            'credit_card' => 'Credit Card',
            default => $payment->payment_type ? ucwords(str_replace('_', ' ', (string) $payment->payment_type)) : '-',
        };
    }

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
            'payment',
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
                'ticket_code' => $order->ticket_code,
                'order_status' => $order->status,
                'total_price' => (float) $order->total_price,
                'payment_method' => $this->resolvePaymentMethodLabel($order->payment),
                'is_scanned' => (bool) $order->is_scanned,
                'scanned_at' => optional($order->scanned_at)?->toIso8601String(),
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
     * GET /api/v1/users/{userId}/tickets/{orderId}/qr?ticket_code=MOV-XXXXXX
     * Returns order-level QR ticket detail (1 QR for 1 order).
     */
    public function qrDetail(Request $request, int $userId, int $orderId)
    {
        $request->validate([
            'ticket_code' => 'required|string',
        ]);

        $order = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
        ])
            ->where('id', $orderId)
            ->where('user_id', $userId)
            ->where('ticket_code', $request->get('ticket_code'))
            ->first();

        if (!$order || !$order->schedule || !$order->schedule->movie || !$order->schedule->studio || !$order->schedule->studio->cinema) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket order not found.',
            ], 404);
        }

        $schedule = $order->schedule;
        $movie = $schedule->movie;
        $studio = $schedule->studio;
        $cinema = $studio->cinema;

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'ticket_code' => $order->ticket_code,
                'order_status' => $order->status,
                'is_scanned' => (bool) $order->is_scanned,
                'movie' => [
                    'id' => $movie->id,
                    'title' => $movie->title,
                    'poster_path' => $movie->default_poster_path,
                ],
                'cinema' => [
                    'name' => $cinema->cinema_name,
                    'location' => trim($cinema->city . ', ' . $cinema->address, ', '),
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
            ],
        ]);
    }

    /**
     * POST /api/v1/tickets/scan/preview
     * Body: { ticket_code: "MOV-XXXXXX" }
     */
    public function scanPreview(Request $request)
    {
        $validated = $request->validate([
            'ticket_code' => 'required|string',
        ]);

        $resolved = $this->resolveValidOrderForScan($validated['ticket_code']);
        if ($resolved['error']) {
            return $resolved['error'];
        }

        $order = $resolved['order'];

        return response()->json([
            'success' => true,
            'message' => 'Tiket valid. Silakan konfirmasi tiket masuk.',
            'data' => $this->buildScanPayload($order),
        ]);
    }

    /**
     * POST /api/v1/tickets/scan
     * Body: { ticket_code: "MOV-XXXXXX" }
     */
    public function scan(Request $request)
    {
        $validated = $request->validate([
            'ticket_code' => 'required|string',
        ]);

        $resolved = $this->resolveValidOrderForScan($validated['ticket_code']);
        if ($resolved['error']) {
            return $resolved['error'];
        }

        $order = $resolved['order'];

        DB::transaction(function () use ($order) {
            $order->update([
                'is_scanned' => true,
                'scanned_at' => now(),
            ]);

            $order->tickets()->update([
                'is_used' => true,
            ]);
        });

        $freshOrder = $order->fresh(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat']);

        return response()->json([
            'success' => true,
            'message' => 'Ticket berhasil dikonfirmasi',
            'data' => $this->buildScanPayload($freshOrder),
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
