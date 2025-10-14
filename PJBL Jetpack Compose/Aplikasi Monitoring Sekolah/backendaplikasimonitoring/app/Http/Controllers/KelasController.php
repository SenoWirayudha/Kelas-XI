<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Http\Requests\StoreKelasRequest;
use App\Http\Requests\UpdateKelasRequest;

class KelasController extends Controller
{
    public function index()
    {
        $kelas = Kelas::all();
        return response()->json([
            'success' => true,
            'data' => $kelas
        ], 200);
    }

    public function store(StoreKelasRequest $request)
    {
        $kelas = Kelas::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil ditambahkan',
            'data' => $kelas
        ], 201);
    }

    public function show(Kelas $kela)
    {
        return response()->json([
            'success' => true,
            'data' => $kela->load('jadwals')
        ], 200);
    }

    public function update(UpdateKelasRequest $request, Kelas $kela)
    {
        $kela->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diupdate',
            'data' => $kela
        ], 200);
    }

    public function destroy(Kelas $kela)
    {
        $kela->delete();
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus'
        ], 200);
    }
}
