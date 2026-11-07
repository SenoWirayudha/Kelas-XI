<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Promo;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Promo CRUD for the back office. Managers are limited to their own cinema and
 * may only create cinema-scoped codes.
 */
class PromoController extends Controller
{
    public function index()
    {
        $promos = Promo::with('cinema')
            ->withCount('usages')
            ->when($this->scopedCinemaId(), fn ($query, $cinemaId) => $query
                ->where('scope', Promo::SCOPE_CINEMA)
                ->where('cinema_id', $cinemaId))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.promos.index', [
            'promos' => $promos,
            'panelPrefix' => $this->panelPrefix(),
        ]);
    }

    public function create()
    {
        return view('admin.promos.form', $this->formData(new Promo([
            'type' => Promo::TYPE_PERCENT,
            'scope' => $this->isManager() ? Promo::SCOPE_CINEMA : Promo::SCOPE_ALL,
            'per_user_limit' => 1,
            'is_active' => true,
        ]), false));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePromo($request);
        $validated['code'] = Promo::normalize($validated['code']);

        Promo::create($validated + ['is_active' => true]);

        return redirect(route($this->panelRoute('promos.index')))
            ->with('success', 'Kode promo berhasil ditambahkan.');
    }

    public function edit($id)
    {
        $promo = Promo::findOrFail($id);
        $this->authorizePromo($promo);

        return view('admin.promos.form', $this->formData($promo, true));
    }

    public function update(Request $request, $id)
    {
        $promo = Promo::findOrFail($id);
        $this->authorizePromo($promo);

        $validated = $this->validatePromo($request, $promo);
        $validated['code'] = Promo::normalize($validated['code']);
        $validated['is_active'] = $request->boolean('is_active');

        $promo->update($validated);

        return redirect(route($this->panelRoute('promos.index')))
            ->with('success', 'Kode promo berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $promo = Promo::findOrFail($id);
        $this->authorizePromo($promo);

        $promo->delete();

        return redirect(route($this->panelRoute('promos.index')))
            ->with('success', 'Kode promo berhasil dihapus.');
    }

    private function validatePromo(Request $request, ?Promo $ignore = null): array
    {
        $rules = [
            'code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Za-z0-9]+$/',
                Rule::unique('promos', 'code')->ignore($ignore?->id),
            ],
            'description' => 'nullable|string|max:255',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|integer|min:1',
            'max_discount' => 'nullable|integer|min:1',
            'min_purchase' => 'nullable|integer|min:0',
            'quota_total' => 'nullable|integer|min:1',
            'per_user_limit' => 'required|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ];

        if ($this->isManager()) {
            // Managers can only target their own cinema.
            $rules['scope'] = 'required|in:cinema';
            $rules['cinema_id'] = 'nullable|integer';
        } else {
            $rules['scope'] = 'required|in:all,festival,cinema';
            $rules['cinema_id'] = 'required_if:scope,cinema|nullable|integer|exists:cinemas,id';
        }

        $validated = $request->validate($rules);

        if ($validated['type'] === Promo::TYPE_PERCENT && (int) $validated['value'] > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'value' => 'Diskon persen maksimal 100.',
            ]);
        }

        if ($this->isManager()) {
            $validated['cinema_id'] = $this->scopedCinemaId();
        }

        if ($validated['scope'] !== Promo::SCOPE_CINEMA) {
            $validated['cinema_id'] = null;
        }

        $validated['max_discount'] = $validated['max_discount'] ?? null;
        $validated['min_purchase'] = $validated['min_purchase'] ?? 0;
        $validated['quota_total'] = $validated['quota_total'] ?? null;

        return $validated;
    }

    private function formData(Promo $promo, bool $isEdit): array
    {
        return [
            'promo' => $promo,
            'isEdit' => $isEdit,
            'panelPrefix' => $this->panelPrefix(),
            'isManager' => $this->isManager(),
            'cinemas' => $this->isManager()
                ? Cinema::where('id', $this->scopedCinemaId())->get(['id', 'cinema_name'])
                : Cinema::orderBy('cinema_name')->get(['id', 'cinema_name']),
        ];
    }

    private function authorizePromo(Promo $promo): void
    {
        $scoped = $this->scopedCinemaId();

        if ($scoped === null) {
            return;
        }

        if ($promo->scope !== Promo::SCOPE_CINEMA || (int) $promo->cinema_id !== $scoped) {
            abort(403, 'Anda hanya dapat mengakses promo bioskop Anda sendiri.');
        }
    }
}
