<?php

namespace App\Http\Controllers;

use App\Models\GuruMengajar;
use App\Models\Jadwal;
use App\Http\Requests\StoreGuruMengajarRequest;
use App\Http\Requests\UpdateGuruMengajarRequest;
use Illuminate\Http\Request;

class GuruMengajarController extends Controller
{
    public function index()
    {
        $guruMengajars = GuruMengajar::with('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas', 'guruPengganti')->get();
        return response()->json([
            'success' => true,
            'data' => $guruMengajars
        ], 200);
    }

    public function store(StoreGuruMengajarRequest $request)
    {
        $guruMengajar = GuruMengajar::create($request->validated());
        $guruMengajar->load('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas');
        return response()->json([
            'success' => true,
            'message' => 'Data Guru Mengajar berhasil ditambahkan',
            'data' => $guruMengajar
        ], 201);
    }

    public function show(GuruMengajar $guruMengajar)
    {
        return response()->json([
            'success' => true,
            'data' => $guruMengajar->load('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas')
        ], 200);
    }

    public function update(UpdateGuruMengajarRequest $request, GuruMengajar $guruMengajar)
    {
        $guruMengajar->update($request->validated());
        $guruMengajar->load('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas');
        return response()->json([
            'success' => true,
            'message' => 'Data Guru Mengajar berhasil diupdate',
            'data' => $guruMengajar
        ], 200);
    }

    public function destroy(GuruMengajar $guruMengajar)
    {
        $guruMengajar->delete();
        return response()->json([
            'success' => true,
            'message' => 'Data Guru Mengajar berhasil dihapus'
        ], 200);
    }

    /**
     * Store guru mengajar by finding jadwal first
     * Cari jadwal_id berdasarkan hari, kelas_id, guru_id, mapel_id, jam_ke
     * Lalu simpan status dan keterangan
     */
    public function storeByJadwalParams(Request $request)
    {
        $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'kelas_id' => 'required|exists:kelas,id',
            'guru_id' => 'required|exists:gurus,id',
            'mapel_id' => 'required|exists:mapels,id',
            'jam_ke' => 'required|string',
            'status' => 'required|in:masuk,tidak_masuk,izin',
            'keterangan' => 'nullable|string'
        ]);

        // Cari jadwal berdasarkan parameter
        $jadwal = Jadwal::where('hari', $request->hari)
            ->where('kelas_id', $request->kelas_id)
            ->where('guru_id', $request->guru_id)
            ->where('mapel_id', $request->mapel_id)
            ->where('jam_ke', $request->jam_ke)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan dengan parameter tersebut'
            ], 404);
        }

        // Buat data guru mengajar
        $guruMengajar = GuruMengajar::create([
            'jadwal_id' => $jadwal->id,
            'guru_pengganti_id' => $request->guru_pengganti_id,
            'status' => $request->status,
            'keterangan' => $request->keterangan
        ]);

        $guruMengajar->load('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas');

        return response()->json([
            'success' => true,
            'message' => 'Data Guru Mengajar berhasil ditambahkan',
            'data' => $guruMengajar
        ], 201);
    }

    /**
     * Update guru mengajar by finding jadwal first
     * Cari jadwal_id berdasarkan hari, kelas_id, guru_id, mapel_id, jam_ke
     * Lalu update status dan keterangan
     */
    public function updateByJadwalParams(Request $request)
    {
        $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'kelas_id' => 'required|exists:kelas,id',
            'guru_id' => 'required|exists:gurus,id',
            'mapel_id' => 'required|exists:mapels,id',
            'jam_ke' => 'required|string',
            'status' => 'required|in:masuk,tidak_masuk,izin',
            'keterangan' => 'nullable|string'
        ]);

        // Cari jadwal berdasarkan parameter
        $jadwal = Jadwal::where('hari', $request->hari)
            ->where('kelas_id', $request->kelas_id)
            ->where('guru_id', $request->guru_id)
            ->where('mapel_id', $request->mapel_id)
            ->where('jam_ke', $request->jam_ke)
            ->first();

        if (!$jadwal) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan dengan parameter tersebut'
            ], 404);
        }

        // Cari atau buat data guru mengajar
        $guruMengajar = GuruMengajar::where('jadwal_id', $jadwal->id)->first();

        if ($guruMengajar) {
            // Update jika sudah ada
            $guruMengajar->update([
                'status' => $request->status,
                'keterangan' => $request->keterangan
            ]);
            $message = 'Data Guru Mengajar berhasil diupdate';
        } else {
            // Buat baru jika belum ada
            $guruMengajar = GuruMengajar::create([
                'jadwal_id' => $jadwal->id,
                'status' => $request->status,
                'keterangan' => $request->keterangan
            ]);
            $message = 'Data Guru Mengajar berhasil ditambahkan';
        }

        $guruMengajar->load('jadwal.guru', 'jadwal.mapel', 'jadwal.kelas');

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $guruMengajar
        ], 200);
    }

    /**
     * Get guru mengajar by hari and kelas_id
     * Menampilkan: id, nama_guru, mapel, status, keterangan
     */
    public function getByHariAndKelas($hari, $kelasId)
    {
        $guruMengajars = GuruMengajar::whereHas('jadwal', function ($query) use ($hari, $kelasId) {
            $query->where('hari', $hari)
                  ->where('kelas_id', $kelasId);
        })
        ->with(['jadwal.guru', 'jadwal.mapel', 'guruPengganti'])
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'nama_guru' => $item->jadwal->guru->nama_guru,
                'mapel' => $item->jadwal->mapel->nama_mapel,
                'jam_ke' => $item->jadwal->jam_ke,
                'status' => $item->status,
                'guru_pengganti' => $item->guruPengganti ? $item->guruPengganti->nama_guru : null,
                'status_guru_pengganti' => $item->status_guru_pengganti,
                'keterangan' => $item->keterangan
            ];
        });

        if ($guruMengajars->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data guru mengajar untuk hari dan kelas tersebut'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $guruMengajars
        ], 200);
    }

    /**
     * Get guru yang tidak masuk by hari, kelas_id, and status = tidak_masuk
     * Menampilkan: nama_guru, mapel, jam_ke, status, keterangan
     */
    public function getGuruTidakMasuk($hari, $kelasId)
    {
        $guruTidakMasuk = GuruMengajar::whereHas('jadwal', function ($query) use ($hari, $kelasId) {
            $query->where('hari', $hari)
                  ->where('kelas_id', $kelasId);
        })
        ->where('status', 'tidak_masuk')
        ->with(['jadwal.guru', 'jadwal.mapel', 'jadwal.kelas', 'guruPengganti'])
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'nama_guru' => $item->jadwal->guru->nama_guru,
                'mapel' => $item->jadwal->mapel->nama_mapel,
                'jam_ke' => $item->jadwal->jam_ke,
                'status' => $item->status,
                'guru_pengganti' => $item->guruPengganti ? $item->guruPengganti->nama_guru : null,
                'status_guru_pengganti' => $item->status_guru_pengganti,
                'keterangan' => $item->keterangan
            ];
        });

        if ($guruTidakMasuk->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada guru yang tidak masuk untuk hari dan kelas tersebut'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $guruTidakMasuk
        ], 200);
    }

    /**
     * POST method untuk get guru mengajar by hari and kelas_id
     * Alternative POST endpoint untuk mobile app compatibility
     * Request body: { "hari": "Senin", "kelas_id": 1 }
     * Response: id, nama_guru, mapel, status, keterangan
     */
    public function getByHariKelasPost(Request $request)
    {
        $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        $guruMengajars = GuruMengajar::whereHas('jadwal', function ($query) use ($request) {
            $query->where('hari', $request->hari)
                  ->where('kelas_id', $request->kelas_id);
        })
        ->with(['jadwal.guru', 'jadwal.mapel', 'guruPengganti'])
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'jadwal_id' => $item->jadwal_id,
                'nama_guru' => $item->jadwal->guru->nama_guru,
                'mapel' => $item->jadwal->mapel->nama_mapel,
                'jam_ke' => $item->jadwal->jam_ke,
                'status' => $item->status,
                'guru_pengganti' => $item->guruPengganti ? $item->guruPengganti->nama_guru : null,
                'status_guru_pengganti' => $item->status_guru_pengganti,
                'izin_mulai' => $item->izin_mulai ? $item->izin_mulai->format('d/m/Y') : null,
                'izin_selesai' => $item->izin_selesai ? $item->izin_selesai->format('d/m/Y') : null,
                'keterangan' => $item->keterangan
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data guru mengajar berhasil diambil',
            'data' => $guruMengajars
        ], 200);
    }

    /**
     * POST method untuk get guru tidak masuk by hari and kelas_id
     * Alternative POST endpoint untuk mobile app compatibility
     * Request body: { "hari": "Senin", "kelas_id": 1 }
     * Response: id, nama_guru, mapel, jam_ke, status, keterangan
     */
    public function getGuruTidakMasukPost(Request $request)
    {
        $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        return $this->getGuruTidakMasuk($request->hari, $request->kelas_id);
    }

    /**
     * Get kelas kosong (yang gurunya tidak masuk atau izin) berdasarkan hari
     * Request body: { "hari": "Senin" }
     * Response: Array of kelas with guru mengajar details (status tidak_masuk atau izin only, belum ada guru pengganti)
     */
    public function getKelasKosongByHari(Request $request)
    {
        $request->validate([
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'
        ]);
        
        // Ambil semua guru mengajar dengan status tidak_masuk atau izin DAN belum ada guru pengganti
        $kelasKosong = GuruMengajar::whereIn('status', ['tidak_masuk', 'izin'])
            ->whereNull('guru_pengganti_id')  // Hanya kelas yang belum ada guru pengganti
            ->whereHas('jadwal', function ($query) use ($request) {
                $query->where('hari', $request->hari);
            })
            ->with(['jadwal.guru', 'jadwal.mapel', 'jadwal.kelas'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jadwal_id' => $item->jadwal_id,
                    'kelas_id' => $item->jadwal->kelas_id,
                    'kelas_nama' => $item->jadwal->kelas->nama_kelas,
                    'guru_id' => $item->jadwal->guru_id,
                    'guru_nama' => $item->jadwal->guru->nama_guru,
                    'mapel_id' => $item->jadwal->mapel_id,
                    'mapel_nama' => $item->jadwal->mapel->nama_mapel,
                    'jam_ke' => $item->jadwal->jam_ke,
                    'status' => $item->status,
                    'keterangan' => $item->keterangan
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data kelas kosong berhasil diambil',
            'data' => $kelasKosong
        ], 200);
    }
}
