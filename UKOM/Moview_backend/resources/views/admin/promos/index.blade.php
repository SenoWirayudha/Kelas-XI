@extends('layouts.admin')

@section('title', 'Kode Promo')
@section('page-title', 'Kode Promo')
@section('page-subtitle', 'Kelola kode promo tiket')

@section('content')

@if(session('success'))
    <div class="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
        {{ session('success') }}
    </div>
@endif
@if(session('error'))
    <div class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ session('error') }}
    </div>
@endif

<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
        <h2 class="text-lg font-semibold text-gray-900">Daftar Promo</h2>
        <p class="text-sm text-gray-500">Diskon dihitung di server; Midtrans hanya menerima total akhir.</p>
    </div>
    <a href="{{ route($panelPrefix.'.promos.create') }}"
       class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        <i class="fas fa-plus mr-2"></i> Buat Promo
    </a>
</div>

<div class="overflow-hidden rounded-xl bg-white shadow">
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                    <th class="px-6 py-3">Kode</th>
                    <th class="px-6 py-3">Diskon</th>
                    <th class="px-6 py-3">Cakupan</th>
                    <th class="px-6 py-3">Berlaku</th>
                    <th class="px-6 py-3 text-center">Kuota</th>
                    <th class="px-6 py-3 text-center">Status</th>
                    <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse($promos as $promo)
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <p class="font-mono font-semibold text-gray-900">{{ $promo->code }}</p>
                            @if($promo->description)
                                <p class="mt-0.5 text-xs text-gray-500">{{ $promo->description }}</p>
                            @endif
                        </td>
                        <td class="px-6 py-4 text-gray-700">
                            @if($promo->type === 'percent')
                                {{ $promo->value }}%
                                @if($promo->max_discount)
                                    <span class="text-xs text-gray-500">(maks Rp{{ number_format($promo->max_discount, 0, ',', '.') }})</span>
                                @endif
                            @else
                                Rp{{ number_format($promo->value, 0, ',', '.') }}
                            @endif
                            @if($promo->min_purchase > 0)
                                <p class="text-xs text-gray-500">min. Rp{{ number_format($promo->min_purchase, 0, ',', '.') }}</p>
                            @endif
                        </td>
                        <td class="px-6 py-4 text-gray-700">
                            @if($promo->scope === 'cinema')
                                {{ $promo->cinema?->cinema_name ?? '-' }}
                            @elseif($promo->scope === 'festival')
                                Festival
                            @else
                                Semua tiket
                            @endif
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-600">
                            {{ $promo->valid_from?->translatedFormat('d M Y H:i') ?? '—' }}
                            <span class="text-gray-400">s/d</span>
                            {{ $promo->valid_until?->translatedFormat('d M Y H:i') ?? '—' }}
                        </td>
                        <td class="px-6 py-4 text-center text-gray-700">
                            {{ $promo->quota_total ?? '∞' }}
                            <p class="text-xs text-gray-500">{{ $promo->usages_count }} terpakai</p>
                        </td>
                        <td class="px-6 py-4 text-center">
                            @if($promo->is_active)
                                <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Aktif</span>
                            @else
                                <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Nonaktif</span>
                            @endif
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-wrap items-center justify-end gap-1.5">
                                <a href="{{ route($panelPrefix.'.promos.edit', $promo->id) }}"
                                   class="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200">
                                    <i class="fas fa-pen mr-1"></i> Ubah
                                </a>
                                <form method="POST" action="{{ route($panelPrefix.'.promos.destroy', $promo->id) }}"
                                      onsubmit="return confirm('Hapus kode promo ini?')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100">
                                        <i class="fas fa-trash mr-1"></i> Hapus
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" class="px-6 py-10 text-center text-sm text-gray-500">Belum ada kode promo.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<div class="mt-4">{{ $promos->links() }}</div>

@endsection
