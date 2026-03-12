@extends('layouts.admin')

@section('title', 'Manajemen Studio')
@section('page-title', 'Manajemen Studio')
@section('page-subtitle', 'Kelola studio per bioskop')

@section('content')
<div class="p-6">

    @if(session('success'))
        <div class="mb-4 px-4 py-3 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center gap-2">
            <i class="fas fa-check-circle"></i> {{ session('success') }}
        </div>
    @endif

    {{-- Filter by Cinema --}}
    <form method="GET" class="flex flex-wrap items-end gap-3 mb-6">
        <div>
            <label class="block text-xs text-gray-500 mb-1">Filter Bioskop</label>
            <select name="cinema_id"
                    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64">
                <option value="">Semua Bioskop</option>
                @foreach($cinemas as $cinema)
                    <option value="{{ $cinema->id }}" {{ request('cinema_id') == $cinema->id ? 'selected' : '' }}>
                        {{ $cinema->cinema_name }}{{ $cinema->city ? ' — ' . $cinema->city : '' }}
                    </option>
                @endforeach
            </select>
        </div>
        <button type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
            <i class="fas fa-filter mr-1"></i> Filter
        </button>
        @if(request('cinema_id'))
            <a href="{{ route('admin.studios.index') }}"
               class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">Reset</a>
        @endif
        <div class="ml-auto">
            <a href="{{ route('admin.studios.create') }}"
               class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                <i class="fas fa-plus mr-2"></i> Tambah Studio
            </a>
        </div>
    </form>

    <p class="text-sm text-gray-500 mb-3">Total: <strong>{{ $studios->total() }}</strong> studio</p>

    <div class="bg-white rounded-xl shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Bioskop</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Nama Studio</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Jumlah Kursi</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Layout Kursi</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($studios as $studio)
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 text-gray-400">{{ $loop->iteration + ($studios->currentPage() - 1) * $studios->perPage() }}</td>
                    <td class="px-4 py-3 text-gray-700">{{ $studio->cinema->cinema_name ?? '—' }}</td>
                    <td class="px-4 py-3 font-medium text-gray-800">{{ $studio->studio_name }}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                            {{ number_format($studio->total_seats) }} kursi
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        @php $seatCount = $studio->seats()->count(); @endphp
                        <a href="{{ route('admin.seats.layout', $studio->id) }}"
                           class="inline-flex items-center px-2 py-1 rounded text-xs transition
                                  {{ $seatCount > 0 ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'bg-orange-50 hover:bg-orange-100 text-orange-700' }}">
                            <i class="fas fa-chair mr-1"></i>
                            {{ $seatCount > 0 ? $seatCount . ' kursi' : 'Belum ada' }}
                        </a>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <form action="{{ route('admin.studios.destroy', $studio->id) }}" method="POST"
                              onsubmit="return confirm('Hapus studio {{ addslashes($studio->studio_name) }}? Data seats dan jadwal terkait ikut terhapus.')">
                            @csrf
                            @method('DELETE')
                            <button type="submit"
                                    class="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition">
                                <i class="fas fa-trash mr-1"></i> Hapus
                            </button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-4 py-10 text-center text-gray-400">
                        <i class="fas fa-door-open text-3xl mb-2 block"></i>
                        Belum ada data studio.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($studios->hasPages())
        <div class="mt-4">{{ $studios->links() }}</div>
    @endif

</div>
@endsection
