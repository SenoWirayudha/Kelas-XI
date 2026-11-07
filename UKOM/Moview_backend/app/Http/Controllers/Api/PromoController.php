<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Seat;
use App\Services\PromoService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Preview endpoint for the checkout screen. It never creates anything: the
 * payment endpoint re-runs the same validation before charging.
 */
class PromoController extends Controller
{
    public function __construct(private readonly PromoService $promoService)
    {
    }

    public function validateCode(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'schedule_id' => 'required|integer|exists:schedules,id',
            'selected_seats' => 'required|array|min:1',
            'selected_seats.*' => 'integer|exists:seats,id',
            'promo_code' => 'required|string|max:32',
        ]);

        try {
            $schedule = Schedule::with('studio')->findOrFail($validated['schedule_id']);
            $seats = Seat::whereIn('id', $validated['selected_seats'])->get();

            if ($seats->count() !== count(array_unique($validated['selected_seats']))) {
                return response()->json(['success' => false, 'message' => 'Ada kursi yang tidak valid.'], 422);
            }

            if ($seats->contains(fn ($seat) => (int) $seat->studio_id !== (int) $schedule->studio_id)) {
                return response()->json(['success' => false, 'message' => 'Kursi bukan milik studio jadwal ini.'], 422);
            }

            $ticketSubtotal = $seats->sum(
                fn ($seat) => $schedule->studio->seatPrice((float) $schedule->ticket_price, $seat->seat_type)
            );

            [$promo, $discount] = $this->promoService->validateFor(
                $validated['promo_code'],
                (int) $validated['user_id'],
                $schedule,
                (int) $ticketSubtotal
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'code' => $promo->code,
                    'description' => $promo->description,
                    'discount_amount' => $discount,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first(),
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
