<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Studio;
use Illuminate\Http\Request;

class StudioController extends Controller
{
    private array $studioTypes = ['Regular 2D', '2D', '3D', 'IMAX'];

    public function index(Request $request)
    {
        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);

        $query = Studio::with('cinema')
            ->withCount(['seats as seat_layout_count' => fn($q) => $q->where('seat_type', 'seat')])
            ->orderBy('studio_name');

        if ($request->filled('cinema_id')) {
            $query->where('cinema_id', $request->cinema_id);
        }

        $studios = $query->paginate(25)->withQueryString();

        return view('admin.studios.index', compact('studios', 'cinemas'));
    }

    public function create()
    {
        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);
        $studioTypes = $this->studioTypes;

        return view('admin.studios.create', compact('cinemas', 'studioTypes'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cinema_id'   => 'required|exists:cinemas,id',
            'studio_name' => 'required|string|max:100',
            'studio_type' => 'required|in:' . implode(',', $this->studioTypes),
            'total_seats' => 'required|integer|min:0|max:999',
        ]);

        $studio = Studio::create($validated);

        return redirect()->route('admin.seats.layout', $studio->id)
            ->with('success', 'Studio berhasil dibuat. Silakan atur layout kursi.');
    }

    public function edit($id)
    {
        $studio = Studio::findOrFail($id);
        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);
        $studioTypes = $this->studioTypes;

        return view('admin.studios.edit', compact('studio', 'cinemas', 'studioTypes'));
    }

    public function update(Request $request, $id)
    {
        $studio = Studio::findOrFail($id);

        $validated = $request->validate([
            'cinema_id'   => 'required|exists:cinemas,id',
            'studio_name' => 'required|string|max:100',
            'studio_type' => 'required|in:' . implode(',', $this->studioTypes),
            'total_seats' => 'required|integer|min:0|max:999',
        ]);

        $studio->update($validated);

        return redirect()->route('admin.studios.index')
            ->with('success', 'Studio berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $studio = Studio::findOrFail($id);
        $studio->delete();

        return redirect()->route('admin.studios.index')
            ->with('success', 'Studio berhasil dihapus.');
    }
}
