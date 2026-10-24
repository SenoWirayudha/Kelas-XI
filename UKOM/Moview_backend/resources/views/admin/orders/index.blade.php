@extends('layouts.admin')

@section('title', 'Manajemen Order')
@section('page-title', 'Manajemen Order')
@section('page-subtitle', 'Daftar semua order tiket bioskop')

@section('content')
<div class="p-0 sm:p-6">

    {{-- Filters --}}
    <form method="GET" class="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="w-full sm:w-auto">
            <label class="block text-xs text-gray-500 mb-1">Cari Order Code</label>
            <input type="text" name="search" value="{{ request('search') }}"
                   placeholder="ORD-..."
                   class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-52">
        </div>
        <div class="w-full sm:w-auto">
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select name="status"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto">
                <option value="">Semua</option>
                <option value="pending"   {{ request('status') === 'pending'   ? 'selected' : '' }}>Pending</option>
                <option value="paid"      {{ request('status') === 'paid'      ? 'selected' : '' }}>Paid</option>
                <option value="cancelled" {{ request('status') === 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                <option value="expired"   {{ request('status') === 'expired'   ? 'selected' : '' }}>Expired</option>
            </select>
        </div>
        <div class="w-full sm:w-auto">
            <label class="block text-xs text-gray-500 mb-1">Channel</label>
            <select name="channel"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto">
                <option value="">Semua</option>
                <option value="online"  {{ request('channel') === 'online'  ? 'selected' : '' }}>Online</option>
                <option value="offline" {{ request('channel') === 'offline' ? 'selected' : '' }}>Offline</option>
            </select>
        </div>
        <button type="submit"
                class="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 sm:w-auto">
            <i class="fas fa-search mr-1"></i> Filter
        </button>
        <a href="{{ route($panelPrefix.'.orders.export', request()->query()) }}"
           class="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700 sm:w-auto">
            <i class="fas fa-file-csv mr-1"></i> Export CSV
        </a>
        @if(request()->hasAny(['search','status','channel']))
            <a href="{{ route($panelPrefix.'.orders.index') }}"
               class="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200 sm:w-auto">
                Reset
            </a>
        @endif
    </form>

    <p class="text-sm text-gray-500 mb-3">Menampilkan <strong>{{ $orders->total() }}</strong> order</p>

    {{-- Mobile cards --}}
    <div class="space-y-3 md:hidden">
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
        <article class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="break-all font-mono text-xs font-semibold text-blue-700">{{ $order->order_code }}</p>
                    <p class="mt-1 font-semibold text-gray-800">{{ $schedule?->movie?->title ?? '-' }}</p>
                </div>
                <span class="inline-flex flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase {{ $statusColor }}">
                    {{ $order->status }}
                </span>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div class="min-w-0">
                    <p class="text-gray-400">Bioskop</p>
                    <p class="mt-0.5 break-words text-gray-700">{{ $schedule?->studio?->cinema?->cinema_name ?? '-' }}</p>
                </div>
                <div class="min-w-0">
                    <p class="text-gray-400">Studio</p>
                    <p class="mt-0.5 break-words text-gray-700">{{ $schedule?->studio?->studio_name ?? '-' }}</p>
                </div>
                <div>
                    <p class="text-gray-400">Tayang</p>
                    <p class="mt-0.5 text-gray-700">
                        {{ $schedule ? \Carbon\Carbon::parse($schedule->show_date)->isoFormat('D MMM Y') : '-' }}
                        <span class="block text-gray-400">{{ $schedule ? substr($schedule->show_time, 0, 5) : '' }}</span>
                    </p>
                </div>
                <div>
                    <p class="text-gray-400">Total</p>
                    <p class="mt-0.5 font-semibold text-gray-800">Rp {{ number_format($order->total_price, 0, ',', '.') }}</p>
                </div>
                <div>
                    <p class="text-gray-400">Channel</p>
                    <p class="mt-0.5 font-semibold uppercase {{ $order->channel === 'offline' ? 'text-purple-700' : 'text-blue-700' }}">
                        {{ $order->channel ?? 'online' }}
                    </p>
                </div>
                <div class="min-w-0">
                    <p class="text-gray-400">Staff</p>
                    <p class="mt-0.5 break-words text-gray-700">{{ $order->staff?->username ?? '-' }}</p>
                </div>
            </div>

            <div class="mt-3">
                <p class="text-xs text-gray-400">Kursi</p>
                <div class="mt-1 flex flex-wrap gap-1">
                    @foreach($order->orderSeats as $os)
                        <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{{ $os->seat?->seat_code }}</span>
                    @endforeach
                </div>
            </div>

            <a href="{{ route($panelPrefix.'.orders.show', $order->id) }}"
               class="mt-4 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
                <i class="fas fa-eye mr-2"></i> Lihat Detail
            </a>
        </article>
        @empty
        <div class="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-gray-400">
            <i class="fas fa-inbox mb-2 block text-3xl"></i>
            Tidak ada order ditemukan.
        </div>
        @endforelse
    </div>

    {{-- Table --}}
    <div class="hidden overflow-x-auto rounded-xl bg-white shadow md:block">
        <table class="min-w-[1100px] divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Order Code</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Film</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Bioskop / Studio</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Kursi</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Tanggal Tayang</th>
                    <th class="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600">Channel</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600">Staff</th>
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
                    <td class="px-4 py-3 text-center">
                        <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase {{ $order->channel === 'offline' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700' }}">
                            {{ $order->channel ?? 'online' }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">
                        {{ $order->staff?->username ?? '-' }}
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {{ $order->created_at ? \Carbon\Carbon::parse($order->created_at)->isoFormat('D MMM Y, HH:mm') : '-' }}
                    </td>
                    <td class="px-4 py-3 text-center">
                        <a href="{{ route($panelPrefix.'.orders.show', $order->id) }}"
                           class="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs transition">
                            <i class="fas fa-eye mr-1"></i> Lihat
                        </a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="11" class="px-4 py-10 text-center text-gray-400">
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
