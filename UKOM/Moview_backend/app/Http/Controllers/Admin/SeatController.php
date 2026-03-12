<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Models\Studio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeatController extends Controller
{
    /**
     * Show the seat layout for a studio.
     */
    public function layout($studioId)
    {
        $studio = Studio::with('cinema')->findOrFail($studioId);

        $seats = Seat::where('studio_id', $studioId)
            ->orderBy('position_y')
            ->orderBy('position_x')
            ->get();

        $rows = $seats->groupBy('seat_row');

        // Detect aisle positions: count actual seats before each aisle record in the first row
        $aisles         = [];
        $entranceConfig = ['enabled' => false, 'start_row' => '', 'width' => 0, 'side' => 'left'];

        if ($seats->isNotEmpty()) {
            $firstRowLabel = $seats->first()->seat_row;
            $firstRow      = $seats->where('seat_row', $firstRowLabel)->sortBy('position_x');
            $seatsSeen     = 0;
            foreach ($firstRow as $seat) {
                if ($seat->seat_type === 'aisle') {
                    $aisles[] = $seatsSeen;
                } else {
                    $seatsSeen++;
                }
            }

            // Detect entrance area from existing data
            $entranceSeats = $seats->where('seat_type', 'entrance');
            if ($entranceSeats->isNotEmpty()) {
                $firstEntranceRowLabel = $entranceSeats->sortBy('position_y')->first()->seat_row;
                $entranceInRow         = $entranceSeats->where('seat_row', $firstEntranceRowLabel)->sortBy('position_x');
                $firstEntrance         = $entranceInRow->first();
                $allSeatsInRow         = $seats->where('seat_row', $firstEntranceRowLabel)->sortBy('position_x');
                $isLeft                = $firstEntrance->position_x === $allSeatsInRow->first()->position_x;
                $entranceConfig        = [
                    'enabled'   => true,
                    'start_row' => $firstEntranceRowLabel,
                    'width'     => $entranceInRow->count(),
                    'side'      => $isLeft ? 'left' : 'right',
                ];
            }
        }

        return view('admin.seats.layout', compact('studio', 'seats', 'rows', 'aisles', 'entranceConfig'));
    }

    /**
     * Generate seats for a studio.
     * Supports: double aisle, entrance area (cut-corner layout).
     */
    public function generate(Request $request, $studioId)
    {
        $studio = Studio::findOrFail($studioId);

        $validated = $request->validate([
            'rows_count'         => 'required|integer|min:1|max:26',
            'seats_per_row'      => 'required|integer|min:1|max:50',
            'aisle_after_1'      => 'nullable|integer|min:0|max:49',
            'aisle_after_2'      => 'nullable|integer|min:0|max:49',
            'entrance_start_row' => 'nullable|string|max:1|regex:/^[A-Z]$/i',
            'entrance_width'     => 'nullable|integer|min:1|max:25',
            'entrance_side'      => 'nullable|in:left,right',
        ]);

        $rowsCount   = (int) $validated['rows_count'];
        $seatsPerRow = (int) $validated['seats_per_row'];

        // Collect unique valid aisle positions (sorted ascending, within range)
        $rawAisles = array_values(array_filter(
            array_unique([
                (int) ($validated['aisle_after_1'] ?? 0),
                (int) ($validated['aisle_after_2'] ?? 0),
            ]),
            fn($a) => $a > 0 && $a < $seatsPerRow
        ));
        sort($rawAisles);
        $aisles = $rawAisles;

        // Entrance config
        $entranceStartRow = !empty($validated['entrance_start_row'])
            ? strtoupper(trim($validated['entrance_start_row']))
            : null;
        $entranceWidth      = (int) ($validated['entrance_width'] ?? 0);
        $entranceSide       = $validated['entrance_side'] ?? 'left';
        $hasEntranceFeature = $entranceStartRow && $entranceWidth > 0 && $entranceWidth < $seatsPerRow;

        $totalActualSeats = 0;

        DB::transaction(function () use (
            $studio, $rowsCount, $seatsPerRow, $aisles,
            $hasEntranceFeature, $entranceStartRow, $entranceWidth, $entranceSide,
            &$totalActualSeats
        ) {
            // Clear existing unbooked seats
            $bookedSeatIds = DB::table('order_seats')
                ->whereIn('schedule_id', function ($q) use ($studio) {
                    $q->select('id')->from('schedules')->where('studio_id', $studio->id);
                })
                ->pluck('seat_id')->unique()->all();

            Seat::where('studio_id', $studio->id)
                ->when(!empty($bookedSeatIds), fn($q) => $q->whereNotIn('id', $bookedSeatIds))
                ->delete();

            $insert = [];

            for ($r = 0; $r < $rowsCount; $r++) {
                $rowLabel       = chr(65 + $r);
                $rowHasEntrance = $hasEntranceFeature && $rowLabel >= $entranceStartRow;
                $colIndex       = 0;

                for ($s = 1; $s <= $seatsPerRow; $s++) {
                    // Insert aisle placeholder(s) just before seat $s where needed
                    foreach ($aisles as $aisleAfter) {
                        if ($s === $aisleAfter + 1) {
                            // Use 200+colIndex as seat_number (unique per row, above max seats_per_row of 50)
                            $insert[] = [
                                'studio_id'   => $studio->id,
                                'seat_row'    => $rowLabel,
                                'seat_number' => 200 + $colIndex,
                                'seat_code'   => '',
                                'seat_type'   => 'aisle',
                                'position_x'  => $colIndex,
                                'position_y'  => $r,
                                'is_active'   => false,
                            ];
                            $colIndex++;
                        }
                    }

                    // Determine seat type
                    $isEntrance = $rowHasEntrance && (
                        $entranceSide === 'left'
                            ? $s <= $entranceWidth
                            : $s > ($seatsPerRow - $entranceWidth)
                    );

                    $type = $isEntrance ? 'entrance' : 'seat';

                    $insert[] = [
                        'studio_id'   => $studio->id,
                        'seat_row'    => $rowLabel,
                        'seat_number' => $s,
                        'seat_code'   => $type === 'seat' ? $rowLabel . $s : '',
                        'seat_type'   => $type,
                        'position_x'  => $colIndex,
                        'position_y'  => $r,
                        'is_active'   => $type === 'seat',
                    ];

                    if ($type === 'seat') {
                        $totalActualSeats++;
                    }
                    $colIndex++;
                }
            }

            foreach (array_chunk($insert, 200) as $chunk) {
                Seat::insert($chunk);
            }

            $studio->update(['total_seats' => $totalActualSeats]);
        });

        $msg = "Layout berhasil di-generate: {$totalActualSeats} kursi, {$rowsCount} baris" .
               (count($aisles) > 0 ? ', ' . count($aisles) . ' lorong' : '') .
               ($hasEntranceFeature ? ', area entrance dari baris ' . $entranceStartRow : '') . '.';

        return redirect()->route('admin.seats.layout', $studioId)->with('success', $msg);
    }

    /**
     * Delete all seats for a studio.
     */
    public function destroyAll($studioId)
    {
        $studio = Studio::findOrFail($studioId);

        // Only delete seats that have no bookings
        $bookedSeatIds = DB::table('order_seats')
            ->whereIn('schedule_id', function ($q) use ($studio) {
                $q->select('id')->from('schedules')->where('studio_id', $studio->id);
            })
            ->pluck('seat_id')
            ->unique()
            ->all();

        $deleted = Seat::where('studio_id', $studio->id)
            ->when(!empty($bookedSeatIds), fn($q) => $q->whereNotIn('id', $bookedSeatIds))
            ->delete();

        $studio->update(['total_seats' => Seat::where('studio_id', $studio->id)->where('seat_type', 'seat')->count()]);

        return redirect()->route('admin.seats.layout', $studioId)
            ->with('success', "Berhasil menghapus {$deleted} kursi.");
    }
}
