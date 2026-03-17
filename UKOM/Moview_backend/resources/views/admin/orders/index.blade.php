@extends('layouts.admin')

@section('title', 'Manajemen Order')
@section('page-title', 'Manajemen Order')
@section('page-subtitle', 'Daftar semua order tiket bioskop')

@section('content')
<div class="p-6">

    {{-- Filters --}}
    <form method="GET" class="flex flex-wrap items-end gap-3 mb-6">
        <div>
            <label class="block text-xs text-gray-500 mb-1">Cari Order Code</label>
            <input type="text" name="search" value="{{ request('search') }}"
                   placeholder="ORD-..."
                   class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-52">
        </div>
        <div>
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select name="status"
                    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Semua</option>
                <option value="pending"   {{ request('status') === 'pending'   ? 'selected' : '' }}>Pending</option>
                <option value="paid"      {{ request('status') === 'paid'      ? 'selected' : '' }}>Paid</option>
                <option value="cancelled" {{ request('status') === 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                <option value="expired"   {{ request('status') === 'expired'   ? 'selected' : '' }}>Expired</option>
            </select>
        </div>
        <button type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
            <i class="fas fa-search mr-1"></i> Filter
        </button>
        @if(request()->hasAny(['search','status']))
            <a href="{{ route('admin.orders.index') }}"
               class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">
                Reset
            </a>
        @endif
    </form>

    <p class="text-sm text-gray-500 mb-3">Menampilkan <strong>{{ $orders->total() }}</strong> order</p>

    {{-- Table --}}
    <div class="bg-white rounded-xl shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Order Code</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Film</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Bioskop / Studio</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Kursi</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Tanggal Tayang</th>
                    <th class="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Dibuat</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Detail</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($orders as $order)
                @php
                    $schedule = $order->schedule;
                    $statusColor = match($order->status) {
                        'paid'      => 'bg-green-100 text-green-700',
                        'pending'   => 'bg-yellow-100 text-yellow-700',
                        'cancelled' => 'bg-red-100 text-red-700',
                        'expired'   => 'bg-gray-100 text-gray-500',
                        default     => 'bg-gray-100 text-gray-500',
                    };
                @endphp
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 font-mono font-medium text-blue-700">{{ $order->order_code }}</td>
                    <td class="px-4 py-3 text-gray-800">{{ $schedule?->movie?->title ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-600">
                        <span class="block font-medium">{{ $schedule?->studio?->cinema?->cinema_name ?? '-' }}</span>
                        <span class="text-xs text-gray-400">{{ $schedule?->studio?->studio_name ?? '-' }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">
                        @foreach($order->orderSeats as $os)
                            <span class="inline-block bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded mr-1">
                                {{ $os->seat?->seat_code }}
                            </span>
                        @endforeach
                    </td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {{ $schedule ? \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMM Y') : '-' }}
                        <span class="text-xs text-gray-400 block">{{ $schedule ? substr($schedule->show_time, 0, 5) : '' }}</span>
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                        Rp {{ number_format($order->total_price, 0, ',', '.') }}
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase {{ $statusColor }}">
                            {{ $order->status }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {{ $order->created_at ? \Carbon\Carbon::parse($order->created_at)->isoFormat('D MMM Y, HH:mm') : '-' }}
                    </td>
                    <td class="px-4 py-3 text-center">
                        <a href="{{ route('admin.orders.show', $order->id) }}"
                           class="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs transition">
                            <i class="fas fa-eye mr-1"></i> Lihat
                        </a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="px-4 py-10 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2 block"></i>
                        Tidak ada order ditemukan.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($orders->hasPages())
        <div class="mt-4">{{ $orders->links() }}</div>
    @endif

</div>
@endsection
