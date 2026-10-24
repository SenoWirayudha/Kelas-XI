<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderSeat;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Thin wrapper around the existing Midtrans sandbox/production Snap API.
 * Both the Android checkout and the staff cashier go through the same
 * configuration (config/services.php) and persist into the same payments table.
 */
class MidtransService
{
    public function createSnap(Order $order, array $payload): array
    {
        $serverKey = (string) config('services.midtrans.server_key');

        if ($serverKey === '') {
            throw new HttpException(422, 'MIDTRANS_SERVER_KEY belum dikonfigurasi di backend.');
        }

        $isProduction = (bool) config('services.midtrans.is_production', false);
        $snapUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $payload['transaction_details'] = [
            'order_id' => $order->order_code,
            'gross_amount' => (int) $order->total_price,
        ];

        Log::info('Midtrans Snap payload prepared', [
            'order_code' => $order->order_code,
            'gross_amount' => (int) $order->total_price,
            'payment_methods' => $payload['enabled_payments'] ?? [],
        ]);

        $response = Http::withBasicAuth($serverKey, '')
            ->connectTimeout(15)
            ->timeout(30)
            ->retry(2, 400)
            ->acceptJson()
            ->post($snapUrl, $payload);

        if (! $response->successful()) {
            $message = $response->json('error_messages.0')
                ?? $response->json('status_message')
                ?? $response->body();

            throw new HttpException(502, 'Gagal membuat transaksi Midtrans: ' . $message);
        }

        $snapData = $response->json();
        $token = $snapData['token'] ?? null;

        if (empty($token)) {
            throw new HttpException(502, 'Snap token tidak diterima dari Midtrans.');
        }

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'midtrans_transaction_id' => null,
                'midtrans_order_id' => $order->order_code,
                'payment_type' => null,
                'transaction_status' => 'pending',
                'fraud_status' => null,
                'gross_amount' => (int) $order->total_price,
                'payment_time' => null,
                'midtrans_raw_response' => $snapData,
            ]
        );

        return [
            'token' => $token,
            'redirect_url' => $snapData['redirect_url'] ?? null,
            'raw' => $snapData,
        ];
    }

    public function fetchStatus(Order $order): array
    {
        $serverKey = (string) config('services.midtrans.server_key');

        if ($serverKey === '') {
            throw new HttpException(422, 'MIDTRANS_SERVER_KEY belum dikonfigurasi di backend.');
        }

        $isProduction = (bool) config('services.midtrans.is_production', false);
        $statusBaseUrl = $isProduction
            ? 'https://api.midtrans.com/v2/'
            : 'https://api.sandbox.midtrans.com/v2/';

        $response = Http::withBasicAuth($serverKey, '')
            ->connectTimeout(15)
            ->timeout(30)
            ->retry(2, 400)
            ->acceptJson()
            ->get($statusBaseUrl . $order->order_code . '/status');

        if (! $response->successful()) {
            $message = $response->json('status_message')
                ?? $response->json('error_messages.0')
                ?? 'Gagal mengambil status Midtrans.';

            throw new HttpException(502, $message);
        }

        return (array) $response->json();
    }

    public function syncFromPayload(Order $order, array $payload): array
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
                'payment_time' => in_array($transactionStatus, ['settlement', 'capture'], true) ? now() : null,
                'midtrans_raw_response' => $payload,
            ]
        );

        $newOrderStatus = $this->resolveOrderStatus($transactionStatus, $fraudStatus, $order->status);
        $order->update(['status' => $newOrderStatus]);

        if (in_array($newOrderStatus, ['cancelled', 'expired'], true)) {
            OrderSeat::where('order_id', $order->id)->delete();
        }

        return [
            'order_status' => $newOrderStatus,
            'transaction_status' => $transactionStatus,
            'payment_type' => $paymentType,
        ];
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
}