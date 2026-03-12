<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Studio;
use Illuminate\Http\Request;

class StudioController extends Controller
{
    public function index(Request $request)
    {
        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);

        $query = Studio::with('cinema')->orderBy('studio_name');

        if ($request->filled('cinema_id')) {
            $query->where('cinema_id', $request->cinema_id);
        }

        $studios = $query->paginate(25)->withQueryString();

        return view('admin.studios.index', compact('studios', 'cinemas'));
    }

    public function create()
    {
        $cinemas = Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);

        return view('admin.studios.create', compact('cinemas'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cinema_id'   => 'required|exists:cinemas,id',
            'studio_name' => 'required|string|max:100',
        ]);

        $validated['total_seats'] = 0;

        $studio = Studio::create($validated);

        return redirect()->route('admin.seats.layout', $studio->id)
            ->with('success', 'Studio berhasil dibuat. Silakan atur layout kursi.');
    }

    public function destroy($id)
    {
        $studio = Studio::findOrFail($id);
        $studio->delete();

        return redirect()->route('admin.studios.index')
            ->with('success', 'Studio berhasil dihapus.');
    }
}
