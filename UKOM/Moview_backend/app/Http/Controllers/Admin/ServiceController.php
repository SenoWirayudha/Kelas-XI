<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    /**
     * Store a new streaming/theatrical service.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:streaming,theatrical',
            'logo' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ], [
            'name.required' => 'Service name is required.',
            'name.unique' => 'A service with this name already exists.',
            'logo.image' => 'Logo must be an image file.',
        ]);

        if (Service::whereRaw('LOWER(name) = ?', [mb_strtolower(trim($data['name']))])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A service with this name already exists.',
            ], 422);
        }

        $logoPath = null;
        try {
            if ($request->hasFile('logo')) {
                $logoPath = '/' . $request->file('logo')->store('logos', 'public');
            }
            $service = Service::create([
                'name' => trim($data['name']),
                'type' => $data['type'],
                'logo_path' => $logoPath,
            ]);
        } catch (\Throwable $e) {
            if ($logoPath && Storage::disk('public')->exists(ltrim($logoPath, '/'))) {
                Storage::disk('public')->delete(ltrim($logoPath, '/'));
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Service added successfully.',
            'service' => $this->servicePayload($service),
        ], 201);
    }

    /**
     * Update an existing service (name/type/logo).
     */
    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:streaming,theatrical',
            'logo' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $duplicate = Service::whereRaw('LOWER(name) = ?', [mb_strtolower(trim($data['name']))])
            ->where('id', '!=', $service->id)
            ->exists();
        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A service with this name already exists.',
            ], 422);
        }

        $oldLogo = $service->logo_path;
        $newLogo = null;
        if ($request->hasFile('logo')) {
            $newLogo = '/' . $request->file('logo')->store('logos', 'public');
        }

        try {
            $service->update([
                'name' => trim($data['name']),
                'type' => $data['type'],
                'logo_path' => $newLogo ?? $oldLogo,
            ]);
        } catch (\Throwable $e) {
            if ($newLogo && Storage::disk('public')->exists(ltrim($newLogo, '/'))) {
                Storage::disk('public')->delete(ltrim($newLogo, '/'));
            }
            throw $e;
        }

        if ($newLogo && $oldLogo && Storage::disk('public')->exists(ltrim($oldLogo, '/'))) {
            Storage::disk('public')->delete(ltrim($oldLogo, '/'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'service' => $this->servicePayload($service->fresh()),
        ]);
    }

    private function servicePayload(Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'type' => $service->type,
            'logo_url' => $service->logo_path ? url('storage/' . $service->logo_path) : null,
        ];
    }
}
