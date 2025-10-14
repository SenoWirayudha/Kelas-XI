<?php

namespace App\Http\Controllers;

use App\Models\Jadwal;
use App\Http\Requests\StoreJadwalRequest;
use App\Http\Requests\UpdateJadwalRequest;

class JadwalController extends Controller
{
    public function index()
    {
        $jadwals = Jadwal::with(['guru', 'mapel', 'tahunAjaran', 'kelas'])->get();
        return response()->json([
            'success' => true,
            'data' => $jadwals
        ], 200);
    }

    public function store(StoreJadwalRequest $request)
    {
        $jadwal = Jadwal::create($request->validated());
        $jadwal->load(['guru', 'mapel', 'tahunAjaran', 'kelas']);
        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil ditambahkan',
            'data' => $jadwal
        ], 201);
    }

    public function show(Jadwal $jadwal)
    {
        return response()->json([
            'success' => true,
            'data' => $jadwal->load(['guru', 'mapel', 'tahunAjaran', 'kelas', 'guruMengajars'])
        ], 200);
    }

    public function update(UpdateJadwalRequest $request, Jadwal $jadwal)
    {
        $jadwal->update($request->validated());
        $jadwal->load(['guru', 'mapel', 'tahunAjaran', 'kelas']);
        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diupdate',
            'data' => $jadwal
        ], 200);
    }

    public function destroy(Jadwal $jadwal)
    {
        $jadwal->delete();
        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus'
        ], 200);
    }

    /**
     * Get jadwal by kelas_id and hari
     * Menampilkan data jadwal lengkap dengan relasi
     * 
     * @param int $kelasId
     * @param string $hari
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByKelasAndHari($kelasId, $hari)
    {
        $jadwals = Jadwal::with(['guru', 'mapel', 'kelas', 'tahunAjaran'])
            ->where('kelas_id', $kelasId)
            ->where('hari', $hari)
            ->get();

        if ($jadwals->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada jadwal ditemukan untuk kelas dan hari tersebut'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $jadwals
        ], 200);
    }

    /**
     * Get jadwal details by hari and kelas_id
     * Menampilkan: Nama Guru, Mapel, Tahun Ajaran, Jam Ke
     * 
     * @param string $hari
     * @param int $kelasId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetailByHariAndKelas($hari, $kelasId)
    {
        $jadwals = Jadwal::with(['guru', 'mapel', 'tahunAjaran', 'kelas'])
            ->where('hari', $hari)
            ->where('kelas_id', $kelasId)
            ->get()
            ->map(function ($jadwal) {
                return [
                    'id' => $jadwal->id,
                    'nama_guru' => $jadwal->guru->nama_guru,
                    'mapel' => $jadwal->mapel->nama_mapel,
                    'tahun_ajaran' => $jadwal->tahunAjaran->tahun,
                    'jam_ke' => $jadwal->jam_ke,
                    'kelas' => $jadwal->kelas->nama_kelas,
                    'hari' => $jadwal->hari
                ];
            });

        if ($jadwals->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada jadwal ditemukan untuk hari dan kelas tersebut'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $jadwals
        ], 200);
    }

    /**
     * CASCADE FILTER ENDPOINTS FOR GANTI GURU FEATURE
     * These endpoints support dynamic filtering based on previous selections
     */

    /**
     * Get distinct kelas by hari
     * Returns unique kelas for selected hari
     * 
     * @param string $hari
     * @return \Illuminate\Http\JsonResponse
     */
    public function getKelasByHari($hari)
    {
        $kelas = Jadwal::with('kelas')
            ->where('hari', $hari)
            ->get()
            ->pluck('kelas')
            ->unique('id')
            ->values()
            ->map(function ($kelas) {
                return [
                    'id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diambil',
            'data' => $kelas
        ], 200);
    }

    /**
     * Get distinct guru by hari and kelas_id
     * Returns unique guru for selected hari and kelas
     * 
     * @param string $hari
     * @param int $kelasId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getGuruByHariAndKelas($hari, $kelasId)
    {
        $gurus = Jadwal::with('guru')
            ->where('hari', $hari)
            ->where('kelas_id', $kelasId)
            ->get()
            ->pluck('guru')
            ->unique('id')
            ->values()
            ->map(function ($guru) {
                return [
                    'id' => $guru->id,
                    'kode_guru' => $guru->kode_guru,
                    'nama_guru' => $guru->nama_guru
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil diambil',
            'data' => $gurus
        ], 200);
    }

    /**
     * Get distinct mapel by hari, kelas_id, and guru_id
     * Returns unique mapel for selected hari, kelas, and guru
     * 
     * @param string $hari
     * @param int $kelasId
     * @param int $guruId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMapelByHariKelasGuru($hari, $kelasId, $guruId)
    {
        $mapels = Jadwal::with('mapel')
            ->where('hari', $hari)
            ->where('kelas_id', $kelasId)
            ->where('guru_id', $guruId)
            ->get()
            ->pluck('mapel')
            ->unique('id')
            ->values()
            ->map(function ($mapel) {
                return [
                    'id' => $mapel->id,
                    'kode_mapel' => $mapel->kode_mapel,
                    'nama_mapel' => $mapel->nama_mapel
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Mapel berhasil diambil',
            'data' => $mapels
        ], 200);
    }

    /**
     * Get jadwal details by hari, kelas_id, guru_id, and mapel_id
     * Returns complete jadwal info including jam_ke
     * This is used to auto-fill jam_ke field
     * 
     * @param string $hari
     * @param int $kelasId
     * @param int $guruId
     * @param int $mapelId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getJadwalDetails($hari, $kelasId, $guruId, $mapelId)
    {
        $jadwal = Jadwal::with(['guru', 'mapel', 'kelas', 'tahunAjaran'])
            ->where('hari', $hari)
            ->where('kelas_id', $kelasId)
            ->where('guru_id', $guruId)
            ->where('mapel_id', $mapelId)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diambil',
            'data' => [
                'id' => $jadwal->id,
                'jadwal_id' => $jadwal->id,
                'hari' => $jadwal->hari,
                'jam_ke' => $jadwal->jam_ke,
                'kelas_id' => $jadwal->kelas_id,
                'kelas' => $jadwal->kelas->nama_kelas,
                'guru_id' => $jadwal->guru_id,
                'guru' => $jadwal->guru->nama_guru,
                'mapel_id' => $jadwal->mapel_id,
                'mapel' => $jadwal->mapel->nama_mapel,
                'tahun_ajaran_id' => $jadwal->tahun_ajaran_id,
                'tahun_ajaran' => $jadwal->tahunAjaran->tahun
            ]
        ], 200);
    }
}
