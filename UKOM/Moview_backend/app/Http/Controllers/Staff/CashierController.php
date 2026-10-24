<?php

namespace App\Http\Controllers\Staff;

use App\Exceptions\BookingException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Schedule;
use App\Services\MidtransService;
use App\Services\TicketOrderService;
use App\Support\ScheduleRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class CashierController extends Controller
{
    public function index()
    {
        $cinemaId = $this->cinemaId();

        $schedules = Schedule::with(['movie', 'studio'])
            ->whereHas('studio', fn ($q) => $q->where('cinema_id', $cinemaId))
            ->whereDate('show_date', now()->toDateString())
            ->openForOffline()
            ->orderBy('show_time')
            ->get();

        $films = $schedules
            ->groupBy('movie_id')
            ->map(function ($movieSchedules) {
                $movie = $movieSchedules->first()->movie;

                $studios = $movieSchedules
                    ->groupBy('studio_id')
                    ->map(function ($studioSchedules) {
                        $studio = $studioSchedules->first()->studio;

                        return [
                            'name' => $studio?->studio_name ?? '-',
                            'type' => $studio?->studio_type ?? '',
                            'schedules' => $studioSchedules->map(fn (Schedule $schedule) => [
                                'id' => $schedule->id,
                                'time' => substr((string) $schedule->show_time, 0, 5),
                                'price' => (int) $schedule->ticket_price,
                                'closes_at' => ScheduleRules::offlineClosesAt($schedule)->format('H:i'),
                            ])->values(),
                        ];
                    })
                    ->values();

                return [
                    'id' => (int) $movieSchedules->first()->movie_id,
                    'title' => $movie?->title ?? '-',
                    'poster_url' => $this->posterUrl($movie?->default_poster_path),
                    'studios' => $studios,
                ];
            })
            ->values();

        return view('staff.cashier.index', [
            'films' => $films,
            'totalFilms' => $films->count(),
            'totalSchedules' => $schedules->count(),
        ]);
    }

    /**
     * Step 3: seat map page. The map itself is fetched from seatData() so the
     * fixed bottom bar can stay visible while the layout is rendered.
     */
    public function seats(Request $request)
    {
        $schedule = $this->findSellableSchedule($request);

        if (! $schedule->isOfflineOpen()) {
            return redirect()
                ->route('staff.cashier.index')
                ->withErrors(['schedule' => 'Jadwal ini sudah ditutup untuk penjualan kasir.']);
        }

        $schedule->load(['movie', 'studio.cinema']);

        return view('staff.cashier.seats', compact('schedule'));
    }

    /**
     * JSON seat layout endpoint used by the cashier seat page.
     */
    public function seatData(Request $request)
    {
        $schedule = $this->findSellableSchedule($request);

        if (! $schedule->isOfflineOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal ini sudah ditutup untuk penjualan kasir.',
            ], 422);
        }

        $request->merge(['cashier' => true]);

        return app(\App\Http\Controllers\Api\SeatController::class)->layout($request);
    }

    /**
     * Step 4: cash is immediately paid; QRIS / card go through the existing
     * Midtrans Snap integration and stay pending until Midtrans confirms.
     */
    public function store(
        Request $request,
        TicketOrderService $ticketOrderService,
        MidtransService $midtransService
    ) {
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'seats' => 'required|array|min:1',
            'seats.*' => 'integer|exists:seats,id',
            'buyer_name' => 'nullable|string|max:100',
            'payment_method' => 'required|string|in:cash,qris,card',
            'cash_received' => 'required_if:payment_method,cash|nullable|integer|min:0',
        ]);

        $schedule = Schedule::with(['movie', 'studio'])->findOrFail($validated['schedule_id']);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        if (! $schedule->isOfflineOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal ini sudah ditutup untuk penjualan kasir.',
            ], 422);
        }

        $method = $validated['payment_method'];
        $buyerName = trim((string) ($validated['buyer_name'] ?? '')) ?: null;
        $staffId = (int) session('admin_user_id');

        try {
            $order = $ticketOrderService->create($schedule, $validated['seats'], [
                'status' => $method === 'cash' ? 'paid' : 'pending',
                'channel' => Order::CHANNEL_OFFLINE,
                'staff_id' => $staffId,
                'buyer_name' => $buyerName,
                'cash_received' => $method === 'cash' ? (int) $validated['cash_received'] : null,
            ]);
        } catch (BookingException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'seat_codes' => $e->seatCodes,
                'total' => $e->context['total'] ?? null,
            ], $e->status);
        }

        if ($method === 'cash') {
            session()->flash('cash_received', (int) $validated['cash_received']);
            session()->flash('change', (int) $validated['cash_received'] - (int) $order->total_price);

            return response()->json([
                'success' => true,
                'paid' => true,
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'redirect' => route('staff.tickets.print', $order),
            ]);
        }

        try {
            $snap = $midtransService->createSnap($order, $this->snapPayload($order, $schedule, $buyerName, $method));
        } catch (\Throwable $e) {
            $this->cancelPendingOrder($order);

            Log::error('Cashier Midtrans Snap creation failed', [
                'order_code' => $order->order_code,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e instanceof HttpExceptionInterface
                    ? $e->getMessage()
                    : 'Gagal membuat pembayaran Midtrans. Silakan coba lagi.',
            ], $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 502);
        }

        return response()->json([
            'success' => true,
            'paid' => false,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'snap_token' => $snap['token'],
            'redirect_url' => $snap['redirect_url'],
            'status_url' => route('staff.cashier.status'),
            'status' => 'pending',
        ]);
    }

    /**
     * Called by the cashier page after Snap callback / while waiting. The
     * authoritative status always comes from Midtrans and is synced back.
     */
    public function status(Request $request, MidtransService $midtransService)
    {
        $validated = $request->validate([
            'order_code' => 'required|string|max:100',
        ]);

        $order = Order::with(['schedule.studio'])
            ->where('order_code', $validated['order_code'])
            ->where('channel', Order::CHANNEL_OFFLINE)
            ->firstOrFail();

        $this->authorizeCinema($order->schedule?->studio?->cinema_id);

        try {
            $payload = $midtransService->fetchStatus($order);
            $status = $midtransService->syncFromPayload($order, $payload);
        } catch (\Throwable $e) {
            Log::error('Cashier payment status sync failed', [
                'order_code' => $order->order_code,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e instanceof HttpExceptionInterface
                    ? $e->getMessage()
                    : 'Gagal mengecek status pembayaran.',
            ], $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 502);
        }

        return response()->json([
            'success' => true,
            'order_code' => $order->order_code,
            'order_status' => $status['order_status'],
            'transaction_status' => $status['transaction_status'],
            'payment_type' => $status['payment_type'],
            'redirect' => $status['order_status'] === 'paid'
                ? route('staff.tickets.print', $order)
                : null,
        ]);
    }

    private function findSellableSchedule(Request $request): Schedule
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
        ]);

        $schedule = Schedule::with('studio')->findOrFail($validated['schedule_id']);
        $this->authorizeCinema($schedule->studio?->cinema_id);

        if ($schedule->show_date->toDateString() !== now()->toDateString()) {
            abort(422, 'Hanya jadwal hari ini yang dapat dijual di kasir.');
        }

        return $schedule;
    }

    private function snapPayload(Order $order, Schedule $schedule, ?string $buyerName, string $method): array
    {
        $order->loadMissing(['orderSeats.seat', 'schedule.movie']);

        $items = $order->orderSeats->map(fn ($orderSeat) => [
            'id' => (string) $orderSeat->id,
            'price' => (int) $orderSeat->price,
            'quantity' => 1,
            'name' => 'Tiket ' . ($orderSeat->seat?->seat_code ?? $orderSeat->seat_id),
        ])->values()->all();

        return [
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $buyerName ?: 'Walk-in Customer',
                'email' => session('admin_email') ?: 'staff@moview.com',
                'phone' => '081234567890',
            ],
            'credit_card' => [
                'secure' => true,
            ],
            'enabled_payments' => $method === 'qris'
                ? ['other_qris']
                : ['credit_card'],
            'custom_field1' => $method,
            'custom_field2' => (string) $schedule->movie?->title,
            'callbacks' => [
                'finish' => route('staff.cashier.index'),
            ],
        ];
    }

    private function cancelPendingOrder(Order $order): void
    {
        $order->update(['status' => 'cancelled']);
        OrderSeat::where('order_id', $order->id)->delete();
    }

    private function posterUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }

    private function cinemaId(): int
    {
        $cinemaId = (int) $this->scopedCinemaId();

        abort_if($cinemaId <= 0, 403, 'Akun Anda belum terhubung ke bioskop.');

        return $cinemaId;
    }
}