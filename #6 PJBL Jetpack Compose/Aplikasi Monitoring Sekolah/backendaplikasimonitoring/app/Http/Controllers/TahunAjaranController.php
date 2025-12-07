<?php

namespace App\Http\Controllers;

use App\Models\TahunAjaran;
use App\Http\Requests\StoreTahunAjaranRequest;
use App\Http\Requests\UpdateTahunAjaranRequest;

class TahunAjaranController extends Controller
{
    public function index()
    {
        $tahunAjarans = TahunAjaran::all();
        return response()->json([
            'success' => true,
            'data' => $tahunAjarans
        ], 200);
    }

    public function store(StoreTahunAjaranRequest $request)
    {
        $tahunAjaran = TahunAjaran::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Tahun Ajaran berhasil ditambahkan',
            'data' => $tahunAjaran
        ], 201);
    }

    public function show(TahunAjaran $tahunAjaran)
    {
        return response()->json([
            'success' => true,
            'data' => $tahunAjaran->load('jadwals')
        ], 200);
    }

    public function update(UpdateTahunAjaranRequest $request, TahunAjaran $tahunAjaran)
    {
        $tahunAjaran->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Tahun Ajaran berhasil diupdate',
            'data' => $tahunAjaran
        ], 200);
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        $tahunAjaran->delete();
        return response()->json([
            'success' => true,
            'message' => 'Tahun Ajaran berhasil dihapus'
        ], 200);
    }
}
