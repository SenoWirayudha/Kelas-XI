@extends('layouts.admin')

@section('title', 'Jadwal Tayang')
@section('page-title', 'Jadwal Tayang')
@section('page-subtitle', 'Kelola jadwal penayangan film di bioskop')

@section('content')
<div class="p-6">

    {{-- Alert --}}
    @if(session('success'))
        <div class="mb-4 px-4 py-3 bg-green-100 border border-green-400 text-green-800 rounded-lg flex items-center">
            <i class="fas fa-check-circle mr-2"></i> {{ session('success') }}
        </div>
    @endif

    {{-- Header action --}}
    <div class="flex items-center justify-between mb-6">
        <p class="text-gray-500 text-sm">Total: <strong>{{ $schedules->total() }}</strong> jadwal</p>
        <a href="{{ route('admin.schedules.create') }}"
           class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <i class="fas fa-plus mr-2"></i> Tambah Jadwal
        </a>
    </div>

    {{-- Table --}}
    <div class="bg-white rounded-xl shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Film</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Bioskop</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Studio</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Studio Type</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Jam</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Harga</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($schedules as $schedule)
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 text-gray-400">{{ $loop->iteration + ($schedules->currentPage() - 1) * $schedules->perPage() }}</td>
                    <td class="px-4 py-3 font-medium text-gray-800">{{ $schedule->movie->title ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ $schedule->studio->cinema->cinema_name ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ $schedule->studio->studio_name ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ $schedule->studio->studio_type ?? 'Regular 2D' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMM Y') }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ substr($schedule->show_time, 0, 5) }}</td>
                    <td class="px-4 py-3 text-gray-700 font-medium">Rp {{ number_format($schedule->ticket_price, 0, ',', '.') }}</td>
                    <td class="px-4 py-3">
                        @if(($schedule->status ?? 'active') === 'active')
                            <span class="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">active</span>
                        @elseif(($schedule->status ?? 'active') === 'expired')
                            <span class="inline-flex px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold">expired</span>
                        @else
                            <span class="inline-flex px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">{{ $schedule->status }}</span>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <a href="{{ route('admin.schedules.edit', $schedule->id) }}"
                               class="inline-flex items-center px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition">
                                <i class="fas fa-pen mr-1"></i> Edit
                            </a>
                            <form action="{{ route('admin.schedules.destroy', $schedule->id) }}" method="POST"
                                  onsubmit="return confirm('Hapus jadwal ini?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        class="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition">
                                    <i class="fas fa-trash mr-1"></i> Hapus
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="10" class="px-4 py-10 text-center text-gray-400">
                        <i class="fas fa-calendar-times text-3xl mb-2 block"></i>
                        Belum ada jadwal tayang.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- Pagination --}}
    @if($schedules->hasPages())
        <div class="mt-4">{{ $schedules->links() }}</div>
    @endif

</div>
@endsection
