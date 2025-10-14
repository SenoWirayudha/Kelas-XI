<?php

namespace App\Http\Controllers;

use App\Models\Mapel;
use App\Http\Requests\StoreMapelRequest;
use App\Http\Requests\UpdateMapelRequest;

class MapelController extends Controller
{
    public function index()
    {
        $mapels = Mapel::all();
        return response()->json([
            'success' => true,
            'data' => $mapels
        ], 200);
    }

    public function store(StoreMapelRequest $request)
    {
        $mapel = Mapel::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Mapel berhasil ditambahkan',
            'data' => $mapel
        ], 201);
    }

    public function show(Mapel $mapel)
    {
        return response()->json([
            'success' => true,
            'data' => $mapel->load('jadwals')
        ], 200);
    }

    public function update(UpdateMapelRequest $request, Mapel $mapel)
    {
        $mapel->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Mapel berhasil diupdate',
            'data' => $mapel
        ], 200);
    }

    public function destroy(Mapel $mapel)
    {
        $mapel->delete();
        return response()->json([
            'success' => true,
            'message' => 'Mapel berhasil dihapus'
        ], 200);
    }
}
