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

        // Serialize existing layout into the visual-builder payload format (preload)
        $gridPayload = $rows->map(function ($rowSeats) use ($studio) {
            $byX = $rowSeats->sortBy('position_x')->keyBy('position_x');
            $maxX = $rowSeats->max('position_x');
            $cells = [];
            for ($x = 0; $x <= $maxX; $x++) {
                if (!$byX->has($x)) {
                    $cells[] = ['type' => 'empty', 'group' => null];
                    continue;
                }
                $seat = $byX[$x];
                $cellType = $seat->seat_type;
                if (!$seat->is_active && $studio->isSellableKey($seat->seat_type)) {
                    $cellType = 'unavailable';
                }
                $cells[] = [
                    'type'  => $cellType,
                    'group' => $seat->seat_group,
                ];
            }
            return [
                'label' => $rowSeats->first()->seat_row,
                'cells' => $cells,
            ];
        })->values();

        $seatTypeDefinitions = $studio->seat_type_definitions ?? [];

        return view('admin.seats.layout', compact('studio', 'seats', 'rows', 'aisles', 'entranceConfig', 'gridPayload', 'seatTypeDefinitions'));

        return view('admin.seats.layout', compact('studio', 'seats', 'rows', 'aisles', 'entranceConfig', 'gridPayload'));
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
            // Clear existing unbooked seats (keep booked seats + their couple partners)
            $bookedSeatIds = $this->bookedSeatIdsForStudio($studio);

            $keepSeatIds = $bookedSeatIds;
            if (!empty($bookedSeatIds)) {
                $partnerGroups = Seat::whereIn('id', $bookedSeatIds)
                    ->whereNotNull('seat_group')
                    ->pluck('seat_group')
                    ->unique()
                    ->all();
                if (!empty($partnerGroups)) {
                    $partnerIds = Seat::where('studio_id', $studio->id)
                        ->whereIn('seat_group', $partnerGroups)
                        ->pluck('id')
                        ->all();
                    $keepSeatIds = array_values(array_unique(array_merge($bookedSeatIds, $partnerIds)));
                }
            }

            Seat::where('studio_id', $studio->id)
                ->when(!empty($keepSeatIds), fn($q) => $q->whereNotIn('id', $keepSeatIds))
                ->delete();

            // Map kept seats by (row:seat_number) so regenerated slots can be
            // updated in place instead of duplicating the unique constraint.
            // seat_row is char(2) so it may carry trailing spaces from padding.
            $keptSeatKeys = [];
            if (!empty($keepSeatIds)) {
                foreach (Seat::whereIn('id', $keepSeatIds)->get(['id', 'seat_row', 'seat_number']) as $ks) {
                    $keptSeatKeys[trim($ks->seat_row) . ':' . $ks->seat_number] = $ks->id;
                }
            }

            $insert  = [];
            $updates = [];

            for ($r = 0; $r < $rowsCount; $r++) {
                $rowLabel       = chr(65 + $r);
                $rowHasEntrance = $hasEntranceFeature && $rowLabel >= $entranceStartRow;
                $colIndex       = 0;

                for ($s = 1; $s <= $seatsPerRow; $s++) {
                    // Insert aisle placeholder(s) just before seat $s where needed
                    foreach ($aisles as $aisleAfter) {
                        if ($s === $aisleAfter + 1) {
                            // Use 200+colIndex as seat_number (unique per row, above max seats_per_row of 50)
                            $key = $rowLabel . ':' . (200 + $colIndex);
                            if (isset($keptSeatKeys[$key])) {
                                $updates[$keptSeatKeys[$key]] = [
                                    'position_x' => $colIndex,
                                    'position_y' => $r,
                                    'seat_code'  => '',
                                    'seat_type'  => 'aisle',
                                    'is_active'  => false,
                                ];
                            } else {
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
                            }
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

                    $key = $rowLabel . ':' . $s;
                    if (isset($keptSeatKeys[$key])) {
                        $updates[$keptSeatKeys[$key]] = [
                            'position_x' => $colIndex,
                            'position_y' => $r,
                            'seat_code'  => $type === 'seat' ? $rowLabel . $s : '',
                            'seat_type'  => $type,
                            'is_active'  => $type === 'seat',
                        ];
                        if ($type === 'seat') {
                            $totalActualSeats++;
                        }
                        $colIndex++;
                        continue;
                    }

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

            foreach ($updates as $id => $attrs) {
                Seat::where('id', $id)->update($attrs);
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
     * Save a visual grid layout for a studio (from the interactive builder).
     *
     * Payload (JSON):
     * {
     *   "row_direction": "front_to_back",
     *   "rows": [
     *     { "label": "A", "cells": [
     *         { "type": "seat" },
     *         { "type": "couple", "group": "CP1" },
     *         { "type": "couple", "group": "CP1" },
     *         { "type": "aisle" }
     *     ] }
     *   ]
     * }
     *
     * - Cell types are dynamic: any key from the studio's seat_type_definitions,
     *   plus "empty". Types with purchase_mode = paired must share a seat_group
     *   (>= 2 cells per group).
     * - Booked seats and their group partners are never deleted.
     */
    public function saveLayout(Request $request, $studioId)
    {
        $studio = Studio::findOrFail($studioId);
        $definitionsByKey = $studio->definitionsByKey();
        $allowedTypes = array_values(array_unique(array_merge($studio->seatTypeKeys(), ['empty'])));

        $validated = $request->validate([
            'row_direction' => 'required|in:front_to_back,back_to_front',
            'rows'          => 'required|array|min:1|max:26',
            'rows.*.label'  => 'required|string|max:2',
            'rows.*.cells'  => 'required|array|min:1|max:60',
            'rows.*.cells.*.type'  => 'required|string|max:20',
            'rows.*.cells.*.group' => 'nullable|string|max:20',
        ]);

        $rowsPayload = $validated['rows'];

        // ---- Normalize stale cell types (e.g. a type deleted mid-session) to empty ----
        foreach ($rowsPayload as &$row) {
            foreach ($row['cells'] as &$cell) {
                if (!in_array($cell['type'], $allowedTypes, true)) {
                    $cell['type'] = 'empty';
                    $cell['group'] = null;
                }
            }
        }
        unset($row, $cell);

        // ---- Validate paired grouping: every paired cell must have a group with >= 2 cells ----
        $groupCounts = [];
        foreach ($rowsPayload as $row) {
            foreach ($row['cells'] as $cell) {
                $mode = $definitionsByKey[$cell['type']]['purchase_mode'] ?? null;
                if ($mode !== 'paired') {
                    continue;
                }
                $group = $cell['group'] ?? '';
                if ($group === '') {
                    abort(422, "Sel bertipe '{$cell['type']}' di baris {$row['label']} harus memiliki group.");
                }
                $groupCounts[$group] = ($groupCounts[$group] ?? 0) + 1;
            }
        }
        foreach ($groupCounts as $group => $count) {
            if ($count < 2) {
                abort(422, "Group '{$group}' harus berisi minimal 2 sel (ditemukan {$count}).");
            }
        }

        $totalActualSeats = 0;

        DB::transaction(function () use ($studio, $rowsPayload, $validated, &$totalActualSeats) {
            // Preserve booked seats + their couple partners
            $keepSeatIds = $this->bookedSeatIdsForStudio($studio);
            if (!empty($keepSeatIds)) {
                $partnerGroups = Seat::whereIn('id', $keepSeatIds)
                    ->whereNotNull('seat_group')
                    ->pluck('seat_group')
                    ->unique()
                    ->all();
                if (!empty($partnerGroups)) {
                    $partnerIds = Seat::where('studio_id', $studio->id)
                        ->whereIn('seat_group', $partnerGroups)
                        ->pluck('id')
                        ->all();
                    $keepSeatIds = array_values(array_unique(array_merge($keepSeatIds, $partnerIds)));
                }
            }

            Seat::where('studio_id', $studio->id)
                ->when(!empty($keepSeatIds), fn($q) => $q->whereNotIn('id', $keepSeatIds))
                ->delete();

            // Map kept seats by (row:seat_number) so rebuilt slots can be
            // updated in place instead of duplicating the unique constraint.
            // seat_row is char(2) so it may carry trailing spaces from padding.
            $keptSeatKeys = [];
            if (!empty($keepSeatIds)) {
                foreach (Seat::whereIn('id', $keepSeatIds)->get(['id', 'seat_row', 'seat_number']) as $ks) {
                    $keptSeatKeys[trim($ks->seat_row) . ':' . $ks->seat_number] = $ks->id;
                }
            }

            $insert  = [];
            $updates = [];
            $positionY = 0;
            foreach ($rowsPayload as $row) {
                $rowLabel = strtoupper($row['label']);
                $positionX = 0;
                $seatCounter = 1;
                foreach ($row['cells'] as $cell) {
                    $type  = $cell['type'];
                    $group = $cell['group'] ?? null;
                    if ($type === 'empty') {
                        $positionX++;
                        continue;
                    }
                    $isPlaceholder = in_array($type, Studio::PLACEHOLDER_TYPE_KEYS);
                    $isUnavailable = $type === 'unavailable';
                    $isSellable    = $studio->isSellableKey($type);

                    $seatNumber  = $isPlaceholder ? (200 + $positionX) : $seatCounter;
                    $seatCode    = $isPlaceholder ? '' : $rowLabel . $seatCounter;
                    $attrs       = [
                        'seat_code'  => $seatCode,
                        'seat_type'  => $type,
                        'seat_group' => $group,
                        'position_x' => $positionX,
                        'position_y' => $positionY,
                        'is_active'  => $isSellable,
                    ];

                    $key = $rowLabel . ':' . $seatNumber;
                    if (isset($keptSeatKeys[$key])) {
                        $updates[$keptSeatKeys[$key]] = $attrs;
                        if ($isSellable) {
                            $totalActualSeats++;
                        }
                        if ($isSellable || $isUnavailable) {
                            $seatCounter++;
                        }
                        $positionX++;
                        continue;
                    }

                    $insert[] = array_merge([
                        'studio_id'   => $studio->id,
                        'seat_row'    => $rowLabel,
                        'seat_number' => $seatNumber,
                    ], $attrs);

                    if ($isSellable || $isUnavailable) {
                        $seatCounter++;
                    }
                    if ($isSellable) {
                        $totalActualSeats++;
                    }
                    $positionX++;
                }
                $positionY++;
            }

            foreach ($updates as $id => $attrs) {
                Seat::where('id', $id)->update($attrs);
            }
            foreach (array_chunk($insert, 200) as $chunk) {
                Seat::insert($chunk);
            }

            $studio->update([
                'total_seats'   => $totalActualSeats,
                'row_direction' => $validated['row_direction'],
            ]);
        });

        $msg = "Layout berhasil disimpan: {$totalActualSeats} kursi, " . count($rowsPayload) . ' baris.';

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

    private function bookedSeatIdsForStudio(Studio $studio): array
    {
        return DB::table('order_seats')
            ->whereIn('schedule_id', function ($q) use ($studio) {
                $q->select('id')->from('schedules')->where('studio_id', $studio->id);
            })
            ->pluck('seat_id')
            ->unique()
            ->all();
    }
}
