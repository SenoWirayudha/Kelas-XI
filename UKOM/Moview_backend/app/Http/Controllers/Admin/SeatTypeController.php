<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Models\Studio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeatTypeController extends Controller
{
    /**
     * List all seat type definitions for a studio (JSON for the admin UI).
     */
    public function index(Studio $studio)
    {
        return response()->json([
            'success'  => true,
            'data'     => $studio->seat_type_definitions ?? [],
            'sellable' => $studio->sellableTypeKeys(),
        ]);
    }

    /**
     * Store a new custom seat type definition.
     */
    public function store(Request $request, Studio $studio)
    {
        $validated = $this->validateDefinition($request, $studio, null);

        $definitions = $studio->seat_type_definitions ?? [];

        // Key uniqueness (case-insensitive)
        foreach ($definitions as $def) {
            if (strtolower($def['key']) === strtolower($validated['key'])) {
                abort(422, "Key tipe kursi '{$validated['key']}' sudah digunakan.");
            }
        }

        $definitions[] = [
            'key'              => $validated['key'],
            'label'            => $validated['label'],
            'color'            => $validated['color'],
            'price_multiplier' => $validated['is_placeholder'] ? null : (float) $validated['price_multiplier'],
            'purchase_mode'    => $validated['is_placeholder'] ? null : $validated['purchase_mode'],
            'is_builtin'       => false,
        ];

        $studio->update(['seat_type_definitions' => array_values($definitions)]);

        return response()->json([
            'success' => true,
            'message' => "Tipe kursi '{$validated['label']}' berhasil ditambahkan.",
            'data'    => $studio->fresh()->seat_type_definitions,
        ], 201);
    }

    /**
     * Update an existing seat type definition (custom fully editable, builtin limited).
     */
    public function update(Request $request, Studio $studio, string $key)
    {
        $definitions = $studio->seat_type_definitions ?? [];

        $index = null;
        foreach ($definitions as $i => $def) {
            if ($def['key'] === $key) {
                $index = $i;
                break;
            }
        }
        if ($index === null) {
            abort(404, "Tipe kursi '{$key}' tidak ditemukan.");
        }

        $existing = $definitions[$index];

        if (!empty($existing['is_builtin'])) {
            // Builtin: only label & color may change
            $validated = $request->validate([
                'label' => 'required|string|max:50',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);
            $definitions[$index]['label'] = $validated['label'];
            $definitions[$index]['color'] = $validated['color'];
        } else {
            $validated = $this->validateDefinition($request, $studio, $existing['key']);
            $definitions[$index] = [
                'key'              => $validated['key'],
                'label'            => $validated['label'],
                'color'            => $validated['color'],
                'price_multiplier' => $validated['is_placeholder'] ? null : (float) $validated['price_multiplier'],
                'purchase_mode'    => $validated['is_placeholder'] ? null : $validated['purchase_mode'],
                'is_builtin'       => false,
            ];
        }

        // Key rename: update seats referencing the old key
        if (($definitions[$index]['key'] ?? null) !== $key) {
            Seat::where('studio_id', $studio->id)
                ->where('seat_type', $key)
                ->update(['seat_type' => $definitions[$index]['key']]);
        }

        $studio->update(['seat_type_definitions' => array_values($definitions)]);

        return response()->json([
            'success' => true,
            'message' => "Tipe kursi '{$definitions[$index]['label']}' berhasil diperbarui.",
            'data'    => $studio->fresh()->seat_type_definitions,
        ]);
    }

    /**
     * Delete a custom seat type definition.
     */
    public function destroy(Studio $studio, string $key)
    {
        $definitions = $studio->seat_type_definitions ?? [];

        $index = null;
        foreach ($definitions as $i => $def) {
            if ($def['key'] === $key) {
                $index = $i;
                break;
            }
        }
        if ($index === null) {
            abort(404, "Tipe kursi '{$key}' tidak ditemukan.");
        }

        if (!empty($definitions[$index]['is_builtin'])) {
            abort(422, 'Tipe kursi builtin tidak dapat dihapus.');
        }

        $used = Seat::where('studio_id', $studio->id)->where('seat_type', $key)->exists();
        if ($used) {
            abort(422, "Tipe kursi '{$key}' masih dipakai oleh kursi. Ubah tipe kursi tersebut terlebih dahulu.");
        }

        unset($definitions[$index]);
        $studio->update(['seat_type_definitions' => array_values($definitions)]);

        return response()->json([
            'success' => true,
            'message' => "Tipe kursi '{$key}' berhasil dihapus.",
            'data'    => $studio->fresh()->seat_type_definitions,
        ]);
    }

    /**
     * Validate a custom definition payload.
     */
    private function validateDefinition(Request $request, Studio $studio, ?string $currentKey): array
    {
        $definitions = $studio->seat_type_definitions ?? [];
        $usedKeys = [];
        foreach ($definitions as $def) {
            if ($currentKey !== null && $def['key'] === $currentKey) {
                continue;
            }
            $usedKeys[] = strtolower($def['key']);
        }

        $validated = $request->validate([
            'key'              => 'required|string|max:50|regex:/^[a-z0-9_]+$/i',
            'label'            => 'required|string|max:50',
            'color'            => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'price_multiplier' => 'nullable|numeric|min:0|max:20',
            'purchase_mode'    => 'required|in:individual,paired',
            'is_placeholder'   => 'nullable|boolean',
        ]);

        if (in_array(strtolower($validated['key']), $usedKeys, true)) {
            abort(422, "Key tipe kursi '{$validated['key']}' sudah digunakan.");
        }
        if (in_array(strtolower($validated['key']), Studio::PLACEHOLDER_TYPE_KEYS, true)) {
            abort(422, "Key '{$validated['key']}' adalah reserved (placeholder builtin).");
        }

        return $validated;
    }
}