<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Payment;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\Studio;
use App\Models\Ticket;
use App\Models\User;
use App\Services\PendingOrderCleanupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class PaymentController extends Controller
{
    public function __construct(private readonly PendingOrderCleanupService $pendingOrderCleanupService)
    {
    }

    private function resolveOrderStatus(string $transactionStatus, ?string $fraudStatus, string $currentStatus): string
    {
        return match ($transactionStatus) {
            'capture' => ($fraudStatus === 'accept') ? 'paid' : 'pending',
            'settlement' => 'paid',
            'pending' => 'pending',
            'expire', 'cancel', 'deny', 'failure' => 'cancelled',
            default => $currentStatus,
        };
    }

    private function savePaymentFromMidtrans(Order $order, array $payload): array
    {
        $transactionStatus = $payload['transaction_status'] ?? 'pending';
        $paymentType = $payload['payment_type'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;
        $midtransTransactionId = $payload['transaction_id'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? $order->total_price;

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'midtrans_transaction_id' => $midtransTransactionId,
                'midtrans_order_id' => $order->order_code,
                'payment_type' => $paymentType,
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'gross_amount' => $grossAmount,
                'payment_time' => in_array($transactionStatus, ['settlement', 'capture']) ? now() : null,
                'midtrans_raw_response' => $payload,
            ]
        );

        $newOrderStatus = $this->resolveOrderStatus($transactionStatus, $fraudStatus, $order->status);
        $order->update(['status' => $newOrderStatus]);

        return [
            'order_status' => $newOrderStatus,
            'transaction_status' => $transactionStatus,
            'payment_type' => $paymentType,
        ];
    }

    public function create(Request $request)
    {
        $this->pendingOrderCleanupService->cleanupExpiredPendingOrders();

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'schedule_id' => 'required|integer|exists:schedules,id',
            'selected_seats' => 'required|array|min:1',
            'selected_seats.*' => 'integer|exists:seats,id',
            'payment_method' => 'nullable|string|in:gopay,qris,bank_transfer',
        ]);

        $schedule = Schedule::with(['movie', 'studio.cinema.service'])->findOrFail($validated['schedule_id']);
        $user = User::findOrFail($validated['user_id']);
        $seatIds = $validated['selected_seats'];

        $serviceFeePerSeat = (int) config('services.booking.service_fee', 4000);
        $pendingTimeoutMinutes = (int) config('services.booking.pending_timeout_minutes', 7);
        $midtransServerKey = config('services.midtrans.server_key');
        $isProduction = (bool) config('services.midtrans.is_production', false);
        $snapUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        if (empty($midtransServerKey)) {
            return response()->json([
                'success' => false,
                'message' => 'MIDTRANS_SERVER_KEY belum dikonfigurasi di backend.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($schedule, $seatIds, $serviceFeePerSeat, $pendingTimeoutMinutes, $midtransServerKey, $snapUrl, $user, $validated) {
                $studio = $schedule->studio;

                // ── Row-level lock on seats table (consistent order → no deadlock) ──
                // Pre-read requested seats to discover couple groups, then lock every
                // involved seat (requested + partners) in a single sorted query so the
                // couple can never be half-sold and two users cannot overlap.
                $preSeats = Seat::whereIn('id', $seatIds)->get();
                if ($preSeats->count() !== count(array_unique($seatIds))) {
                    abort(422, 'Ada kursi yang tidak valid.');
                }

                $groups = $preSeats->pluck('seat_group')->filter()->unique()->all();
                $groupSeatIds = [];
                if (!empty($groups)) {
                    $groupSeatIds = Seat::where('studio_id', $schedule->studio_id)
                        ->whereIn('seat_group', $groups)
                        ->pluck('id')
                        ->all();
                }

                $allLockedIds = array_values(array_unique(array_merge($seatIds, $groupSeatIds)));
                $lockedSeats = Seat::whereIn('id', $allLockedIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
                $lockedById = $lockedSeats->keyBy('id');

                // Validate: all requested seats sellable, active, belong to this studio
                $invalid = collect($seatIds)->map(fn($id) => $lockedById->get($id))->filter()
                    ->filter(
                        fn($s) => $s->studio_id !== $schedule->studio_id
                            || !$studio->isSellableKey($s->seat_type)
                            || !$s->is_active
                    );
                if ($invalid->isNotEmpty()) {
                    $codes = $invalid->pluck('seat_code')->implode(', ');
                    abort(422, "Seat tidak dapat dijual: {$codes}");
                }

                // Paired atomicity: a requested paired seat group must include every member
                $pairedGroups = collect($seatIds)->map(fn($id) => $lockedById->get($id))->filter()
                    ->filter(fn($s) => $studio->purchaseModeFor($s->seat_type) === 'paired')
                    ->pluck('seat_group')
                    ->filter()
                    ->unique();
                foreach ($pairedGroups as $group) {
                    $memberIds = Seat::where('studio_id', $schedule->studio_id)
                        ->where('seat_group', $group)
                        ->pluck('id')
                        ->all();
                    if (count(array_intersect($memberIds, $seatIds)) !== count($memberIds)) {
                        abort(422, "Kursi berpasangan '{$group}' harus dibeli sekaligus (semua sel dalam grup).");
                    }
                }

                $alreadyBooked = OrderSeat::where('schedule_id', $schedule->id)
                    ->whereIn('seat_id', $allLockedIds)
                    ->whereHas('order', fn($q) => $q->whereIn('status', ['pending', 'paid']))
                    ->lockForUpdate()
                    ->pluck('seat_id')
                    ->all();

                if (!empty($alreadyBooked)) {
                    $codes = Seat::whereIn('id', $alreadyBooked)->pluck('seat_code')->implode(', ');
                    abort(409, "Seat(s) no longer available: {$codes}");
                }

                $ticketSubtotal = 0;
                foreach ($seatIds as $seatId) {
                    $ticketSubtotal += (int) round($schedule->ticket_price * $studio->priceMultiplierFor($lockedById->get($seatId)->seat_type));
                }
                $seatCount = count($seatIds);
                $serviceSubtotal = $serviceFeePerSeat * $seatCount;
                $grossAmount = $ticketSubtotal + $serviceSubtotal;

                $orderCode = 'ORD-' . date('YmdHis') . '-' . strtoupper(Str::random(6));

                $orderPayload = [
                    'schedule_id' => $schedule->id,
                    'user_id' => $user->id,
                    'order_code' => $orderCode,
                    'total_price' => $grossAmount,
                    'status' => 'pending',
                    'expired_at' => now()->addMinutes($pendingTimeoutMinutes),
                ];

                if (Schema::hasColumn('orders', 'ticket_code')) {
                    $orderPayload['ticket_code'] = Order::generateUniqueTicketCode();
                }

                if (Schema::hasColumn('orders', 'is_scanned')) {
                    $orderPayload['is_scanned'] = false;
                }

                if (Schema::hasColumn('orders', 'scanned_at')) {
                    $orderPayload['scanned_at'] = null;
                }

                $order = Order::create($orderPayload);

                foreach ($seatIds as $seatId) {
                    $price = (int) round($schedule->ticket_price * $studio->priceMultiplierFor($lockedById->get($seatId)->seat_type));
                    OrderSeat::create([
                        'order_id' => $order->id,
                        'seat_id' => $seatId,
                        'schedule_id' => $schedule->id,
                        'price' => $price,
                    ]);

                    Ticket::create([
                        'order_id' => $order->id,
                        'seat_id' => $seatId,
                        'qr_code' => strtoupper(Str::random(12)) . '-' . $order->id . '-' . $seatId,
                        'is_used' => false,
                    ]);
                }

                $seatCodes = Seat::whereIn('id', $seatIds)
                    ->orderBy('seat_code')
                    ->pluck('seat_code')
                    ->values()
                    ->all();

                $safeUsername = trim((string) ($user->username ?? 'User'));
                if ($safeUsername === '') {
                    $safeUsername = 'User';
                }

                $safeEmail = trim((string) ($user->email ?? 'user@example.com'));
                if ($safeEmail === '' || !filter_var($safeEmail, FILTER_VALIDATE_EMAIL)) {
                    $safeEmail = 'user@example.com';
                }

                $rawPhone = preg_replace('/[^0-9]/', '', (string) ($user->phone ?? ''));
                if (is_string($rawPhone) && str_starts_with($rawPhone, '62')) {
                    $rawPhone = '0' . substr($rawPhone, 2);
                }
                if (empty($rawPhone) || strlen((string) $rawPhone) < 10 || strlen((string) $rawPhone) > 13) {
                    $rawPhone = '081234567890';
                }
                $preferredPaymentMethod = $validated['payment_method'] ?? null;
                $enabledPayments = ['gopay', 'qris', 'bank_transfer'];
                if (!empty($preferredPaymentMethod)) {
                    $enabledPayments = [$preferredPaymentMethod];
                }

                // Aggregate ticket items by per-seat price so item_details sum
                // exactly to gross_amount (seats can have different prices by type).
                $ticketItems = collect($seatIds)
                    ->map(fn($seatId) => (int) round($schedule->ticket_price * $studio->priceMultiplierFor($lockedById->get($seatId)->seat_type)))
                    ->countBy()
                    ->map(function ($qty, $price) use ($schedule, $seatCodes) {
                        return [
                            'id' => 'TICKET-' . $schedule->id . '-' . $price,
                            'price' => (int) $price,
                            'quantity' => (int) $qty,
                            'name' => 'Tiket ' . ($schedule->movie->title ?? 'Movie') . ' (' . implode(', ', $seatCodes) . ')',
                        ];
                    })
                    ->values()
                    ->all();

                $payload = [
                    'transaction_details' => [
                        'order_id' => $orderCode,
                        'gross_amount' => $grossAmount,
                    ],
                    'customer_details' => [
                        'first_name' => mb_substr($safeUsername, 0, 50),
                        'email' => mb_substr($safeEmail, 0, 100),
                        'phone' => $rawPhone,
                    ],
                    'enabled_payments' => $enabledPayments,
                    'item_details' => array_merge($ticketItems, [[
                        'id' => 'SERVICE-FEE',
                        'price' => $serviceFeePerSeat,
                        'quantity' => $seatCount,
                        'name' => 'Biaya Layanan',
                    ]]),
                    'metadata' => [
                        'user_id' => $user->id,
                        'schedule_id' => $schedule->id,
                    ],
                ];

                Log::info('Midtrans create payload prepared', [
                    'order_code' => $orderCode,
                    'gross_amount' => $grossAmount,
                    'payment_methods' => $payload['enabled_payments'],
                ]);

                $snapResponse = Http::withBasicAuth($midtransServerKey, '')
                    ->connectTimeout(15)
                    ->timeout(30)
                    ->retry(2, 400)
                    ->acceptJson()
                    ->post($snapUrl, $payload);

                if (!$snapResponse->successful()) {
                    $midtransMessage = $snapResponse->json('error_messages.0')
                        ?? $snapResponse->json('status_message')
                        ?? $snapResponse->body();

                    abort(502, 'Gagal membuat transaksi Midtrans: ' . $midtransMessage);
                }

                $snapData = $snapResponse->json();
                $snapToken = $snapData['token'] ?? null;
                $redirectUrl = $snapData['redirect_url'] ?? null;

                if (empty($snapToken)) {
                    abort(502, 'Snap token tidak diterima dari Midtrans.');
                }

                Payment::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'midtrans_transaction_id' => null,
                        'midtrans_order_id' => $orderCode,
                        'payment_type' => null,
                        'transaction_status' => 'pending',
                        'fraud_status' => null,
                        'gross_amount' => $grossAmount,
                        'payment_time' => null,
                        'midtrans_raw_response' => $snapData,
                    ]
                );

                return [
                    'order' => $order,
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $result['order']->id,
                    'order_code' => $result['order']->order_code,
                    'snap_token' => $result['snap_token'],
                    'redirect_url' => $result['redirect_url'],
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (HttpExceptionInterface $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Permintaan pembayaran gagal.',
            ], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('Payment create failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->hasDebugModeEnabled()
                    ? ('Gagal membuat pembayaran: ' . $e->getMessage())
                    : 'Gagal membuat pembayaran.',
            ], 500);
        }
    }

    public function callback(Request $request)
    {
        $payload = $request->all();

        $orderCode = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;
        $statusCode = $payload['status_code'] ?? null;

        if (empty($orderCode) || empty($transactionStatus)) {
            return response()->json(['success' => false, 'message' => 'Payload tidak valid.'], 422);
        }

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (!empty($serverKey) && !empty($signatureKey) && !empty($statusCode) && !empty($grossAmount)) {
            $expected = hash('sha512', $orderCode . $statusCode . $grossAmount . $serverKey);
            if (!hash_equals($expected, $signatureKey)) {
                return response()->json(['success' => false, 'message' => 'Signature tidak valid.'], 403);
            }
        }

        $order = Order::where('order_code', $orderCode)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan.'], 404);
        }

        $this->savePaymentFromMidtrans($order, $payload);

        return response()->json(['success' => true]);
    }

    public function status(Request $request)
    {
        $validated = $request->validate([
            'order_code' => 'required|string|exists:orders,order_code',
        ]);

        $order = Order::where('order_code', $validated['order_code'])->firstOrFail();

        $midtransServerKey = config('services.midtrans.server_key');
        $isProduction = (bool) config('services.midtrans.is_production', false);
        $statusBaseUrl = $isProduction
            ? 'https://api.midtrans.com/v2/'
            : 'https://api.sandbox.midtrans.com/v2/';

        if (empty($midtransServerKey)) {
            return response()->json([
                'success' => false,
                'message' => 'MIDTRANS_SERVER_KEY belum dikonfigurasi di backend.',
            ], 422);
        }

        try {
            $response = Http::withBasicAuth($midtransServerKey, '')
                ->connectTimeout(15)
                ->timeout(30)
                ->retry(2, 400)
                ->acceptJson()
                ->get($statusBaseUrl . $order->order_code . '/status');

            if (!$response->successful()) {
                $message = $response->json('status_message')
                    ?? $response->json('error_messages.0')
                    ?? 'Gagal mengambil status Midtrans.';

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 502);
            }

            $midtransPayload = $response->json();
            $statusData = $this->savePaymentFromMidtrans($order, $midtransPayload);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_code' => $order->order_code,
                    'order_status' => $statusData['order_status'],
                    'transaction_status' => $statusData['transaction_status'],
                    'payment_type' => $statusData['payment_type'],
                    'actions' => $midtransPayload['actions'] ?? null,
                    'redirect_url' => $midtransPayload['redirect_url'] ?? null,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Payment status sync failed', [
                'order_code' => $validated['order_code'],
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->hasDebugModeEnabled()
                    ? ('Gagal sinkronisasi status pembayaran: ' . $e->getMessage())
                    : 'Gagal sinkronisasi status pembayaran.',
            ], 500);
        }
    }
}
