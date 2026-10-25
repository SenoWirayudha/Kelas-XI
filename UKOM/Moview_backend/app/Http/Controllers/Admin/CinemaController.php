<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\Service;
use App\Support\ReturnUrl;
use Illuminate\Http\Request;

class CinemaController extends Controller
{
    public function index()
    {
        $query = Cinema::with('service')->orderBy('cinema_name');

        if ($this->isManager()) {
            $query->where('id', $this->scopedCinemaId());
        }

        $cinemas = $query->paginate(20)->withQueryString();

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

        return ReturnUrl::redirect($request, route('admin.cinemas.index'))
            ->with('success', 'Bioskop berhasil ditambahkan.');
    }

    public function edit($id)
    {
        $cinema = Cinema::findOrFail($id);
        $this->authorizeCinema($cinema->id);

        $services = Service::where('type', 'theatrical')
            ->orderBy('name')
            ->get(['id', 'name']);

        return view('admin.cinemas.edit', compact('cinema', 'services'));
    }

    public function update(Request $request, $id)
    {
        $cinema = Cinema::findOrFail($id);
        $this->authorizeCinema($cinema->id);

        $validated = $request->validate([
            'service_id'  => 'nullable|exists:services,id',
            'cinema_name' => 'required|string|max:150',
            'city'        => 'required|string|max:100',
            'address'     => 'required|string|max:255',
        ]);

        $cinema->update($validated);

        return ReturnUrl::redirect($request, route($this->panelRoute('cinemas.index')))
            ->with('success', 'Bioskop berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $cinema = Cinema::findOrFail($id);
        $cinema->delete();

        $return = ReturnUrl::resolve($request, route('admin.cinemas.index'));

        return redirect(ReturnUrl::fitPage($return, Cinema::count(), 20))
            ->with('success', 'Bioskop berhasil dihapus.');
    }
}
