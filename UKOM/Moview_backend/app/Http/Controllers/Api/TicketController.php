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
    /** True when the show has already ended (same grace rule as scanning). */
    private function isOrderShowExpired(Order $order): bool
    {
        $schedule = $order->schedule;
        if (!$schedule || empty($schedule->show_date) || empty($schedule->show_time)) {
            return false;
        }

        $showDateTime = Carbon::parse(
            trim(Carbon::parse($schedule->show_date)->format('Y-m-d') . ' ' . $schedule->show_time)
        );

        return now()->greaterThan($showDateTime->copy()->addHour());
    }

    /**
     * Resolves the order behind a scanned QR payload.
     *
     * Accepts the opaque `qr_token` (what the app renders) and, for existing
     * printed tickets, the legacy `ticket_code` (MOV-XXXXXX). A bare numeric id
     * is deliberately NOT accepted.
     */
    private function resolveValidOrderForScan(string $payload, bool $lockForUpdate = false, ?int $cinemaId = null): array
    {
        $payload = trim($payload);
        $isLegacyCode = str_starts_with(strtoupper($payload), 'MOV-');

        $query = Order::with(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat'])
            ->when(
                $isLegacyCode,
                fn ($q) => $q->where('ticket_code', strtoupper($payload)),
                fn ($q) => $q->where('qr_token', $payload)
            );

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $order = $query->first();
        $ticket = null;

        // Printed tickets carry the per-seat QR code, not the order token.
        if (!$order) {
            $ticketQuery = Ticket::where('qr_code', $payload);
            if ($lockForUpdate) {
                $ticketQuery->lockForUpdate();
            }

            $ticket = $ticketQuery->first();

            if ($ticket) {
                $order = Order::with(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat'])
                    ->find($ticket->order_id);
            }
        }

        if (!$order || !$order->schedule) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Tiket tidak ditemukan.',
                ], 404),
            ];
        }

        // Staff may only validate tickets for their own cinema.
        if ($cinemaId !== null && (int) $order->schedule->studio?->cinema_id !== $cinemaId) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Tiket ini bukan milik bioskop Anda.',
                ], 403),
            ];
        }

        // A printed ticket is consumed individually; the order token (app QR)
        // consumes the whole order.
        if ($ticket) {
            if ($ticket->is_used) {
                $usedAt = $ticket->used_at
                    ? Carbon::parse($ticket->used_at)->format('d M Y H:i')
                    : null;

                return [
                    'order' => null,
                    'error' => response()->json([
                        'success' => false,
                        'message' => $usedAt
                            ? "Tiket sudah dipakai pada {$usedAt}."
                            : 'Tiket sudah dipakai.',
                    ], 409),
                ];
            }
        } elseif ((bool) $order->is_scanned) {
            $usedAt = $order->scanned_at
                ? Carbon::parse($order->scanned_at)->format('d M Y H:i')
                : null;

            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => $usedAt
                        ? "Tiket sudah dipakai pada {$usedAt}."
                        : 'Tiket sudah dipakai.',
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
                    'message' => 'Jadwal tayang tiket tidak valid.',
                ], 422),
            ];
        }

        if ($this->isOrderShowExpired($order)) {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Tiket sudah kedaluwarsa (jadwal tayang telah lewat).',
                ], 422),
            ];
        }

        if (strtolower((string) $order->status) !== 'paid') {
            return [
                'order' => null,
                'error' => response()->json([
                    'success' => false,
                    'message' => 'Tiket belum dibayar.',
                ], 422),
            ];
        }

        return [
            'order' => $order,
            'ticket' => $ticket,
            'error' => null,
        ];
    }

    /**
     * Seats consumed by this scan: one printed ticket, otherwise every seat of
     * the order (app QR token).
     */
    private function scannedSeats(Order $order, ?Ticket $ticket = null): array
    {
        if ($ticket) {
            return [$ticket->seat?->seat_code ?? '-'];
        }

        return $order->tickets
            ->map(fn ($t) => $t->seat?->seat_code)
            ->filter()
            ->values()
            ->all();
    }

    private function buildScanPayload(Order $order, ?Ticket $ticket = null): array
    {
        $schedule = $order->schedule;
        $showDateRaw = $schedule?->show_date;
        $used = $ticket ? (bool) $ticket->is_used : (bool) $order->is_scanned;
        $usedAt = $ticket ? $ticket->used_at : $order->scanned_at;

        return [
            'order_id' => $order->id,
            'ticket_code' => $order->ticket_code,
            'ticket_qr_code' => $ticket?->qr_code,
            'channel' => $order->channel,
            'buyer_name' => $order->buyer_name,
            'staff_name' => $order->staff?->username,
            'is_scanned' => $used,
            'scanned_at' => $usedAt ? Carbon::parse($usedAt)->toIso8601String() : null,
            'is_fully_scanned' => (bool) $order->is_scanned,
            'movie_title' => $schedule?->movie?->title,
            'cinema_name' => $schedule?->studio?->cinema?->cinema_name,
            'studio_name' => $schedule?->studio?->studio_name,
            'show_date' => $showDateRaw ? Carbon::parse($showDateRaw)->format('Y-m-d') : null,
            'show_time' => $schedule?->show_time,
            'seat_codes' => $this->scannedSeats($order, $ticket),
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
     * GET /api/v1/users/{userId}/tickets/{orderId}/qr?ticket_code=...
     *
     * Only the owner can read it (user_id + ticket_code must match). The
     * response carries the opaque qr_token that is rendered into the QR image,
     * plus the current usage/expiry state so the app can hide a dead ticket.
     */
    public function qrDetail(Request $request, int $userId, int $orderId)
    {
        $request->validate([
            'ticket_code' => 'nullable|string',
        ]);

        $order = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
        ])
            ->where('id', $orderId)
            ->where('user_id', $userId)
            ->when(
                $request->filled('ticket_code'),
                fn ($q) => $q->where('ticket_code', $request->get('ticket_code'))
            )
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
                'qr_token' => $order->ensureQrToken(),
                'order_status' => $order->status,
                'is_scanned' => (bool) $order->is_scanned,
                'is_used' => (bool) $order->is_scanned,
                'is_expired' => $this->isOrderShowExpired($order),
                'scanned_at' => optional($order->scanned_at)?->toIso8601String(),
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
     * Body: { qr_code: "<token>" }  (legacy: { ticket_code: "MOV-XXXXXX" })
     */
    public function scanPreview(Request $request, ?int $cinemaId = null)
    {
        $validated = $request->validate([
            'qr_code' => 'nullable|string',
            'ticket_code' => 'nullable|string',
        ]);

        $payload = $validated['qr_code'] ?? $validated['ticket_code'] ?? '';
        if (trim((string) $payload) === '') {
            return response()->json([
                'success' => false,
                'message' => 'Kode QR wajib diisi',
            ], 422);
        }

        $resolved = $this->resolveValidOrderForScan((string) $payload, false, $cinemaId);
        if ($resolved['error']) {
            return $resolved['error'];
        }

        $order = $resolved['order'];

        return response()->json([
            'success' => true,
            'message' => 'Tiket valid. Silakan konfirmasi tiket masuk.',
            'data' => $this->buildScanPayload($order, $resolved['ticket'] ?? null),
        ]);
    }

    /**
     * POST /api/v1/tickets/scan
     * Body: { qr_code: "<token>" }  (legacy: { ticket_code: "MOV-XXXXXX" })
     *
     * The ticket is claimed atomically: the UPDATE only succeeds while
     * is_scanned is still false, so two concurrent scans can never both win.
     */
    public function scan(Request $request, ?int $cinemaId = null)
    {
        $validated = $request->validate([
            'qr_code' => 'nullable|string',
            'ticket_code' => 'nullable|string',
        ]);

        $payload = trim((string) ($validated['qr_code'] ?? $validated['ticket_code'] ?? ''));
        if ($payload === '') {
            return response()->json([
                'success' => false,
                'message' => 'Kode QR wajib diisi',
            ], 422);
        }

        $result = DB::transaction(function () use ($payload, $cinemaId) {
            $resolved = $this->resolveValidOrderForScan($payload, true, $cinemaId);
            if ($resolved['error']) {
                return $resolved['error'];
            }

            $order = $resolved['order'];
            $ticket = $resolved['ticket'] ?? null;

            if ($ticket) {
                $claimed = Ticket::where('id', $ticket->id)
                    ->where('is_used', false)
                    ->update([
                        'is_used' => true,
                        'used_at' => now(),
                    ]);

                if ($claimed !== 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tiket sudah dipakai.',
                    ], 409);
                }

                // Order is only marked scanned when every ticket is used.
                if (!Ticket::where('order_id', $order->id)->where('is_used', false)->exists()) {
                    Order::where('id', $order->id)
                        ->where('is_scanned', false)
                        ->update([
                            'is_scanned' => true,
                            'scanned_at' => now(),
                        ]);
                }

                return [
                    'order'  => $order->fresh(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat', 'staff']),
                    'ticket' => $ticket->fresh(['seat']),
                ];
            }

            $claimed = Order::where('id', $order->id)
                ->where('is_scanned', false)
                ->update([
                    'is_scanned' => true,
                    'scanned_at' => now(),
                ]);

            if ($claimed !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tiket sudah dipakai.',
                ], 409);
            }

            $order->tickets()->update([
                'is_used' => true,
                'used_at' => now(),
            ]);

            return [
                'order'  => $order->fresh(['schedule.movie', 'schedule.studio.cinema', 'tickets.seat', 'staff']),
                'ticket' => null,
            ];
        });

        if ($result instanceof \Illuminate\Http\JsonResponse) {
            return $result;
        }

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dikonfirmasi.',
            'data' => $this->buildScanPayload($result['order'], $result['ticket']),
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
