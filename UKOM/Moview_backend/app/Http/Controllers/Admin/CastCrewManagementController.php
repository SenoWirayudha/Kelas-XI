<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CastCrewManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Person::query();

        // Search by name
        if ($request->has('search') && $request->search) {
            $query->where('full_name', 'like', '%' . $request->search . '%');
        }

        // Filter by role (primary_role)
        if ($request->has('role') && $request->role && $request->role !== 'all') {
            $query->where('primary_role', $request->role);
        }

        // Sorting
        $sortBy = $request->get('sort', 'name_asc');
        switch ($sortBy) {
            case 'name_desc':
                $query->orderBy('full_name', 'desc');
                break;
            case 'recent':
                $query->orderBy('created_at', 'desc');
                break;
            case 'name_asc':
            default:
                $query->orderBy('full_name', 'asc');
                break;
        }

        $people = $query->withCount('moviePersons')->paginate(20);

        // Count stats
        $totalPeople = Person::count();
        $actorsCount = Person::where('primary_role', 'Actor')->count();
        $directorsCount = Person::where('primary_role', 'Director')->count();
        $writersCount = Person::where('primary_role', 'Writer')->count();

        return view('admin.cast-crew.index', compact(
            'people',
            'totalPeople',
            'actorsCount',
            'directorsCount',
            'writersCount'
        ));
    }

    public function create()
    {
        return view('admin.cast-crew.add');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'primary_role' => 'required|string|max:100',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'bio' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'nationality' => 'nullable|string|max:100',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('persons', 'public');
            $validated['photo_path'] = $path;
            unset($validated['photo']);
        }

        Person::create($validated);

        return redirect()->route('admin.cast-crew.index')
            ->with('success', 'Person berhasil ditambahkan!');
    }

    public function edit($id)
    {
        $person = Person::findOrFail($id);
        return view('admin.cast-crew.edit', compact('person'));
    }

    public function show($id)
    {
        $person = Person::with(['moviePersons.movie'])->findOrFail($id);
        return view('admin.cast-crew.show', compact('person'));
    }

    public function update(Request $request, $id)
    {
        $person = Person::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'primary_role' => 'required|string|max:100',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'bio' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'nationality' => 'nullable|string|max:100',
        ]);

        // Update basic fields
        $person->full_name = $validated['full_name'];
        $person->primary_role = $validated['primary_role'];
        $person->bio = $validated['bio'];
        $person->date_of_birth = $validated['date_of_birth'];
        $person->nationality = $validated['nationality'];

        // Handle photo upload only if new photo is provided
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($person->photo_path && Storage::disk('public')->exists($person->photo_path)) {
                Storage::disk('public')->delete($person->photo_path);
            }
            $path = $request->file('photo')->store('persons', 'public');
            $person->photo_path = $path;
        }

        $person->save();

        return redirect()->route('admin.cast-crew.index')
            ->with('success', 'Person berhasil diperbarui!');
    }

    public function destroy($id)
    {
        $person = Person::findOrFail($id);

        // Delete photo if exists
        if ($person->photo_path && Storage::disk('public')->exists($person->photo_path)) {
            Storage::disk('public')->delete($person->photo_path);
        }

        $person->delete();

        return redirect()->route('admin.cast-crew.index')
            ->with('success', 'Person berhasil dihapus!');
    }
}
