<?php

namespace App\Services;

use App\Models\Promo;
use App\Models\PromoUsage;
use App\Models\Schedule;
use Illuminate\Validation\ValidationException;

/**
 * All promo rules live here. The app never computes a discount: it may only ask
 * this service to price a code for a given schedule + seats.
 */
class PromoService
{
    /**
     * Validate a code for this user/session and return [promo, discount].
     * Discount is capped so the ticket subtotal can never go negative.
     */
    public function validateFor(string $code, int $userId, Schedule $schedule, int $ticketSubtotal): array
    {
        $normalized = Promo::normalize($code);

        $promo = Promo::whereRaw('UPPER(code) = ?', [$normalized])->first();

        if (!$promo) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo tidak ditemukan.']);
        }

        if (!$promo->is_active) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo tidak aktif.']);
        }

        $now = now();
        if ($promo->valid_from && $now->lt($promo->valid_from)) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo belum berlaku.']);
        }
        if ($promo->valid_until && $now->gt($promo->valid_until)) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo sudah kedaluwarsa.']);
        }

        if ($promo->quota_total !== null) {
            $used = PromoUsage::where('promo_id', $promo->id)->count();
            if ($used >= $promo->quota_total) {
                throw ValidationException::withMessages(['promo_code' => 'Kuota kode promo sudah habis.']);
            }
        }

        $userUsed = PromoUsage::where('promo_id', $promo->id)
            ->where('user_id', $userId)
            ->count();
        if ($userUsed >= $promo->per_user_limit) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo sudah pernah Anda pakai.']);
        }

        if ($ticketSubtotal < $promo->min_purchase) {
            throw ValidationException::withMessages([
                'promo_code' => 'Minimal belanja Rp' . number_format($promo->min_purchase, 0, ',', '.') . ' untuk kode ini.',
            ]);
        }

        $this->assertScope($promo, $schedule);

        $discount = $this->discountAmount($promo, $ticketSubtotal);

        if ($discount <= 0) {
            throw ValidationException::withMessages(['promo_code' => 'Kode promo tidak menghasilkan diskon.']);
        }

        return [$promo, $discount];
    }

    /** Percent of the ticket subtotal (capped), or a flat amount. */
    public function discountAmount(Promo $promo, int $ticketSubtotal): int
    {
        $discount = $promo->type === Promo::TYPE_FIXED
            ? $promo->value
            : (int) floor($ticketSubtotal * $promo->value / 100);

        if ($promo->type === Promo::TYPE_PERCENT && $promo->max_discount !== null) {
            $discount = min($discount, $promo->max_discount);
        }

        return max(0, min($discount, $ticketSubtotal));
    }

    /** Cinema scope wins over the session type; festival means event sessions. */
    private function assertScope(Promo $promo, Schedule $schedule): void
    {
        if ($promo->scope === Promo::SCOPE_CINEMA) {
            $cinemaId = (int) ($schedule->studio->cinema_id ?? 0);
            if ($promo->cinema_id === null || $cinemaId !== (int) $promo->cinema_id) {
                throw ValidationException::withMessages([
                    'promo_code' => 'Kode promo tidak berlaku untuk bioskop ini.',
                ]);
            }

            return;
        }

        if ($promo->scope === Promo::SCOPE_FESTIVAL && $schedule->event_id === null) {
            throw ValidationException::withMessages([
                'promo_code' => 'Kode promo hanya berlaku untuk tiket festival.',
            ]);
        }
    }

    /** Reserve a slot at order creation (pending payments count against quota). */
    public function reserve(Promo $promo, int $userId, int $orderId, int $discount): PromoUsage
    {
        return PromoUsage::create([
            'promo_id' => $promo->id,
            'user_id' => $userId,
            'order_id' => $orderId,
            'status' => PromoUsage::STATUS_RESERVED,
            'discount_amount' => $discount,
        ]);
    }

    /** Settlement finalises the usage; idempotent for repeated webhooks. */
    public function finalizeForOrder(int $orderId): void
    {
        PromoUsage::where('order_id', $orderId)
            ->where('status', PromoUsage::STATUS_RESERVED)
            ->update(['status' => PromoUsage::STATUS_USED, 'updated_at' => now()]);
    }

    /** Expire/cancel returns the quota to the pool. */
    public function releaseForOrder(int $orderId): void
    {
        PromoUsage::where('order_id', $orderId)->delete();
    }
}
