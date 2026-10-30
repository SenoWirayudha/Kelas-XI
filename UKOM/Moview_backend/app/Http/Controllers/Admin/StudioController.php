<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Studio;
use App\Support\ReturnUrl;
use Illuminate\Http\Request;

class StudioController extends Controller
{
    private array $studioTypes = [
        'Regular 2D', '2D', '3D', 'IMAX',
        'Starium 2D', '4DX2D', 'ScreenX 2D', 'ScreenX Gold ScreenX 2D',
        'Satin 2D', 'Gold Class 2D', 'Velvet 2D', '(Mini) ScreenX 2D',
    ];

    public function index(Request $request)
    {
        $cinemasQuery = Cinema::orderBy('cinema_name');

        if ($this->isManager()) {
            $cinemasQuery->where('id', $this->scopedCinemaId());
        }

        $cinemas = $cinemasQuery->get(['id', 'cinema_name', 'city']);

        $studios = $this->filteredStudios($request)->paginate(25)->withQueryString();

        return view('admin.studios.index', compact('studios', 'cinemas'));
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function filteredStudios(Request $request)
    {
        $query = Studio::with('cinema')
            ->withCount(['seats as seat_layout_count' => fn($q) => $q->whereNotIn('seat_type', Studio::PLACEHOLDER_TYPE_KEYS)])
            ->orderBy('studio_name');

        if ($this->isManager()) {
            $query->where('cinema_id', $this->scopedCinemaId());
        } elseif ($request->filled('cinema_id')) {
            $query->where('cinema_id', $request->cinema_id);
        }

        return $query;
    }

    public function create()
    {
        $cinemasQuery = Cinema::orderBy('cinema_name');

        if ($this->isManager()) {
            $cinemasQuery->where('id', $this->scopedCinemaId());
        }

        $cinemas = $cinemasQuery->get(['id', 'cinema_name', 'city']);
        $studioTypes = $this->studioTypes;

        $isManager = $this->isManager();

        return view('admin.studios.create', compact('cinemas', 'studioTypes', 'isManager'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Managers are pinned to their own cinema below, so the field is optional for them.
            'cinema_id'   => ($this->isManager() ? 'nullable' : 'required') . '|exists:cinemas,id',
            'studio_name' => 'required|string|max:100',
            'studio_type' => 'required|in:' . implode(',', $this->studioTypes),
            'total_seats' => 'nullable|integer|min:0|max:999',
        ]);

        if ($this->isManager()) {
            $validated['cinema_id'] = $this->scopedCinemaId();
        }

        $validated['total_seats'] = $validated['total_seats'] ?? 0;

        $studio = Studio::create($validated);

        $return = ReturnUrl::fromRequest($request);

        return redirect(ReturnUrl::add(route($this->panelRoute('seats.layout'), $studio->id), $return))
            ->with('success', 'Studio berhasil dibuat. Silakan atur layout kursi.');
    }

    public function edit($id)
    {
        $studio = Studio::findOrFail($id);
        $this->authorizeCinema($studio->cinema_id);

        $cinemasQuery = Cinema::orderBy('cinema_name');

        if ($this->isManager()) {
            $cinemasQuery->where('id', $this->scopedCinemaId());
        }

        $cinemas = $cinemasQuery->get(['id', 'cinema_name', 'city']);
        $studioTypes = $this->studioTypes;

        $isManager = $this->isManager();

        return view('admin.studios.edit', compact('studio', 'cinemas', 'studioTypes', 'isManager'));
    }

    public function update(Request $request, $id)
    {
        $studio = Studio::findOrFail($id);
        $this->authorizeCinema($studio->cinema_id);

        $validated = $request->validate([
            'cinema_id'   => ($this->isManager() ? 'nullable' : 'required') . '|exists:cinemas,id',
            'studio_name' => 'required|string|max:100',
            'studio_type' => 'required|in:' . implode(',', $this->studioTypes),
            'total_seats' => 'required|integer|min:0|max:999',
        ]);

        if ($this->isManager()) {
            $validated['cinema_id'] = $this->scopedCinemaId();
        }

        $studio->update($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('studios.index')))
            ->with('success', 'Studio berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $studio = Studio::findOrFail($id);
        $this->authorizeCinema($studio->cinema_id);

        $studio->delete();

        $return = ReturnUrl::resolve($request, route($this->panelRoute('studios.index')));

        return redirect(ReturnUrl::fitPage(
            $return,
            $this->filteredStudios(ReturnUrl::request($return))->count(),
            25
        ))->with('success', 'Studio berhasil dihapus.');
    }
}
