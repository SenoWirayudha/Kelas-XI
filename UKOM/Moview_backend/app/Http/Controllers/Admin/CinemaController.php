<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Service;
use Illuminate\Http\Request;

class CinemaController extends Controller
{
    public function index()
    {
        $cinemas = Cinema::with('service')
            ->orderBy('cinema_name')
            ->paginate(20);

        return view('admin.cinemas.index', compact('cinemas'));
    }

    public function create()
    {
        // Only show theatrical services (XXI, CGV, CINEPOLIS, etc.)
        $services = Service::where('type', 'theatrical')
            ->orderBy('name')
            ->get(['id', 'name']);

        return view('admin.cinemas.create', compact('services'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'  => 'nullable|exists:services,id',
            'cinema_name' => 'required|string|max:150',
            'city'        => 'required|string|max:100',
            'address'     => 'required|string|max:255',
        ]);

        Cinema::create($validated);

        return redirect()->route('admin.cinemas.index')
            ->with('success', 'Bioskop berhasil ditambahkan.');
    }

    public function destroy($id)
    {
        $cinema = Cinema::findOrFail($id);
        $cinema->delete();

        return redirect()->route('admin.cinemas.index')
            ->with('success', 'Bioskop berhasil dihapus.');
    }
}
