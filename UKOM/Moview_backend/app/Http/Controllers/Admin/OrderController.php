<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /** Ukuran batch streaming export (diubah pada uji batch kecil). */
    public static int $exportBatchSize = 500;

    public function index(Request $request)
    {
        $orders = Order::adminList($request->only(['status', 'search']))
            ->paginate(25)
            ->withQueryString();

        return view('admin.orders.index', compact('orders'));
    }

    public function export(Request $request)
    {
        $filters = $request->only(['status', 'search']);
        $filename = 'orders_' . now()->format('Ymd_Hi') . '.csv';

        return response()->streamDownload(function () use ($filters) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            $eol = "\r\n";
            $write = function (array $fields) use ($out, $eol) {
                fputcsv($out, $fields, ',', '"', '\\', $eol);
            };

            // Proteksi CSV injection (prefiks apostrof untuk sel AWAL = + - @):
            // DIPAKAI HANYA untuk sel teks dari input user (judul film,
            // nama bioskop/studio). Dikecualikan: order_code (sistem),
            // status (enum), kursi (kode), tanggal, Total (numerik), Dibuat (waktu).
            $guard = function (string $v): string {
                return ($v !== '' && in_array($v[0], ['=', '+', '-', '@'], true)) ? "'" . $v : $v;
            };

            $write(['Order Code', 'Film', 'Cinema', 'Studio', 'Kursi', 'Tanggal Tayang', 'Total', 'Status', 'Dibuat']);

            $batchSize = self::$exportBatchSize;
            $lastCreated = null;
            $lastId = null;

            while (true) {
                // Builder bersama dengan list (scope adminList) + kondisi
                // keyset EKSPLISIT per batch (bukan row-value comparison →
                // identik di pgsql dan sqlite).
                $batch = Order::adminList($filters);
                if ($lastCreated !== null) {
                    $batch->where(function (Builder $q) use ($lastCreated, $lastId) {
                        $q->where('created_at', '<', $lastCreated)
                            ->orWhere(function (Builder $q2) use ($lastCreated, $lastId) {
                                $q2->where('created_at', '=', $lastCreated)
                                    ->where('id', '<', $lastId);
                            });
                    });
                }

                $rows = $batch->limit($batchSize)->get();

                foreach ($rows as $order) {
                    $schedule = $order->schedule;
                    $seats = $order->orderSeats
                        ->map(fn ($os) => $os->seat?->seat_code)
                        ->filter()
                        ->implode(', ');
                    $showDate = $schedule
                        ? $schedule->show_date . ' ' . substr((string) $schedule->show_time, 0, 5)
                        : '';

                    $write([
                        $order->order_code,
                        $guard((string) ($schedule?->movie?->title ?? '')),
                        $guard((string) ($schedule?->studio?->cinema?->cinema_name ?? '')),
                        $guard((string) ($schedule?->studio?->studio_name ?? '')),
                        $seats,
                        $showDate,
                        $order->total_price !== null ? (float) $order->total_price : '',
                        $order->status,
                        $order->created_at !== null
                            ? Carbon::parse($order->created_at)->format('Y-m-d H:i:s')
                            : '',
                    ]);
                }

                if ($rows->count() < $batchSize) {
                    unset($rows, $batch);
                    break;
                }

                // Cursor: nilai created_at MENTAH dari DB (getRawOriginal,
                // tanpa cast → presisi mikrodetik tidak hilang) supaya baris
                // di batas batch tidak terlewat/dobel.
                $last = $rows->last();
                $lastCreated = $last->getRawOriginal('created_at');
                $lastId = $last->id;

                // Bebaskan memori antar batch.
                unset($rows, $batch, $last);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function show($id)
    {
        $order = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
            'payment',
            'tickets',
        ])->findOrFail($id);

        return view('admin.orders.show', compact('order'));
    }
}
