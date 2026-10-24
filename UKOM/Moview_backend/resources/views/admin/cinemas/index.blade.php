@extends('layouts.admin')

@section('title', 'Manajemen Bioskop')
@section('page-title', 'Manajemen Bioskop')
@section('page-subtitle', 'Kelola data bioskop dan lokasinya')

@section('content')
<div class="p-0 sm:p-6">

    @if(session('success'))
        <div class="mb-4 px-4 py-3 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-2">
            <i class="fas fa-check-circle"></i> {{ session('success') }}
        </div>
    @endif

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-gray-500">Total: <strong>{{ $cinemas->total() }}</strong> bioskop</p>
        @if(session('admin_role') === 'admin')
        <a href="{{ route($panelPrefix.'.cinemas.create') }}"
           class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i> Tambah Bioskop
        </a>
        @endif
    </div>

    <div class="overflow-x-auto rounded-xl bg-white shadow">
        <table class="mv-table min-w-[760px] divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Nama Bioskop</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Kota</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Alamat</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Studio</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($cinemas as $cinema)
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 text-gray-400">{{ $loop->iteration + ($cinemas->currentPage() - 1) * $cinemas->perPage() }}</td>
                    <td class="px-4 py-3">
                        @if($cinema->service)
                            <span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {{ $cinema->service->name }}
                            </span>
                        @else
                            <span class="text-gray-400">—</span>
                        @endif
                    </td>
                    <td class="px-4 py-3 font-medium text-gray-800">{{ $cinema->cinema_name }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ $cinema->city }}</td>
                    <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ $cinema->address }}</td>
                    <td class="px-4 py-3 text-center">
                        <a href="{{ route($panelPrefix.'.studios.index', ['cinema_id' => $cinema->id]) }}"
                           class="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition">
                            <i class="fas fa-door-open mr-1"></i> Lihat Studio
                        </a>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            @if(Route::has($panelPrefix.'.cinemas.edit'))
                            <a href="{{ route($panelPrefix.'.cinemas.edit', $cinema->id) }}"
                               class="inline-flex items-center px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition">
                                <i class="fas fa-pen mr-1"></i> Edit
                            </a>
                            @endif
                            @if(session('admin_role') === 'admin')
                            <form action="{{ route('admin.cinemas.destroy', $cinema->id) }}" method="POST"
                                  onsubmit="return requireConfirm(event, 'Hapus bioskop {{ addslashes($cinema->cinema_name) }}? Semua studio dan jadwal terkait akan ikut terhapus.', { form: this })">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        class="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition">
                                    <i class="fas fa-trash mr-1"></i> Hapus
                                </button>
                            </form>
                            @endif
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="px-4 py-10 text-center text-gray-400">
                        <i class="fas fa-building text-3xl mb-2 block"></i>
                        Belum ada data bioskop.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($cinemas->hasPages())
        <div class="mt-4">{{ $cinemas->links() }}</div>
    @endif

</div>
@endsection
