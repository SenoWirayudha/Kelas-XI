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
            'price_multiplier' => !empty($validated['is_placeholder']) ? null : (float) $validated['price_multiplier'],
            'purchase_mode'    => !empty($validated['is_placeholder']) ? null : $validated['purchase_mode'],
            'is_builtin'       => false,
        ];

        // Cinema scope: when another studio of the same cinema already defines
        // this key, import that canonical definition instead of creating a
        // divergent duplicate. Otherwise the new definition is shared with all
        // studios of this cinema (other cinemas are never touched).
        $peerWithKey = $studio->cinemaPeers()->first(function ($peer) use ($validated) {
            foreach (($peer->seat_type_definitions ?? []) as $d) {
                if (strcasecmp((string) ($d['key'] ?? ''), $validated['key']) === 0) {
                    return true;
                }
            }
            return false;
        });

        if ($peerWithKey) {
            $canonical = $definitions[count($definitions) - 1];
            foreach ($peerWithKey->seat_type_definitions as $d) {
                if (strcasecmp((string) ($d['key'] ?? ''), $validated['key']) === 0) {
                    $canonical = $d;
                    break;
                }
            }
            $definitions[count($definitions) - 1] = $canonical;
            $studio->update(['seat_type_definitions' => array_values($definitions)]);

            return response()->json([
                'success' => true,
                'message' => "Tipe kursi '{$canonical['label']}' sudah tersedia di bioskop ini dan ditambahkan ke studio ini.",
                'data'    => $studio->fresh()->seat_type_definitions,
            ], 201);
        }

        $studio->update(['seat_type_definitions' => array_values($definitions)]);
        $studio->syncDefinitionToPeers($definitions[count($definitions) - 1]);

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
                'price_multiplier' => !empty($validated['is_placeholder']) ? null : (float) $validated['price_multiplier'],
                'purchase_mode'    => !empty($validated['is_placeholder']) ? null : $validated['purchase_mode'],
                'is_builtin'       => false,
            ];
        }

        // Key rename: update seats.seat_type across every studio of this
        // cinema so no seat loses its type reference, then sync the
        // definition change (rename included) to the sibling studios.
        $finalDef  = $definitions[$index];
        $renamed   = ($finalDef['key'] ?? null) !== $key;

        if ($renamed) {
            Seat::whereIn('studio_id', $studio->cinemaStudioIds())
                ->where('seat_type', $key)
                ->update(['seat_type' => $finalDef['key']]);
        }

        $studio->update(['seat_type_definitions' => array_values($definitions)]);

        if ($renamed) {
            $studio->syncRenamedDefinitionToPeers($finalDef, $key);
        } else {
            $studio->syncDefinitionToPeers($finalDef);
        }

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

        // Cinema-wide usage check: never orphan seats of sibling studios.
        $used = Seat::whereIn('studio_id', $studio->cinemaStudioIds())->where('seat_type', $key)->exists();
        if ($used) {
            abort(422, "Tipe kursi '{$key}' masih dipakai oleh kursi. Ubah tipe kursi tersebut terlebih dahulu.");
        }

        $studio->removeDefinitionAcrossCinema($key);

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