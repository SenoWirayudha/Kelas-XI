<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Http\Requests\StoreGuruRequest;
use App\Http\Requests\UpdateGuruRequest;

class GuruController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $gurus = Guru::all();
        return response()->json([
            'success' => true,
            'data' => $gurus
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGuruRequest $request)
    {
        $guru = Guru::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil ditambahkan',
            'data' => $guru
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Guru $guru)
    {
        return response()->json([
            'success' => true,
            'data' => $guru->load('jadwals')
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGuruRequest $request, Guru $guru)
    {
        $guru->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil diupdate',
            'data' => $guru
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guru $guru)
    {
        $guru->delete();
        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil dihapus'
        ], 200);
    }
}
