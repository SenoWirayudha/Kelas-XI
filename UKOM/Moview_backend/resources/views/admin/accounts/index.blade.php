@extends('layouts.admin')

@section('title', 'Akun Manager')
@section('page-title', 'Akun Manager')
@section('page-subtitle', 'Buat, ubah, dan hapus akun manager beserta bioskopnya')

@section('content')
<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-gray-600">Total manager: <span class="font-semibold">{{ $managers->total() }}</span></p>
    <a href="{{ route('admin.accounts.create') }}"
       class="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
        <i class="fas fa-plus mr-2"></i>
        Tambah Manager
    </a>
</div>

<div class="overflow-x-auto rounded-lg bg-white shadow">
    <table class="mv-table min-w-[640px] text-left">
        <thead class="bg-gray-50">
            <tr>
                <th class="text-left font-semibold text-gray-600">Nama</th>
                <th class="text-left font-semibold text-gray-600">Email</th>
                <th class="text-left font-semibold text-gray-600">Bioskop</th>
                <th class="text-right font-semibold text-gray-600">Aksi</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            @forelse($managers as $manager)
            <tr>
                <td class="font-medium text-gray-800">{{ $manager->username }}</td>
                <td class="text-gray-600">{{ $manager->email }}</td>
                <td class="text-gray-600">
                    {{ $manager->cinema?->cinema_name ?? '-' }}
                    @if($manager->cinema?->city)
                    <span class="text-sm text-gray-400">({{ $manager->cinema->city }})</span>
                    @endif
                </td>
                <td class="text-right">
                    <div class="flex items-center justify-end gap-2">
                        <a href="{{ route('admin.accounts.edit', $manager) }}"
                           class="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200">
                            <i class="fas fa-pen mr-1"></i> Edit
                        </a>
                        <form action="{{ route('admin.accounts.destroy', $manager) }}" method="POST" class="inline"
                              onsubmit="return confirm('Hapus akun manager ini?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit"
                                    class="inline-flex items-center rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200">
                                <i class="fas fa-trash mr-1"></i> Hapus
                            </button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="py-10 text-center text-gray-500">Belum ada akun manager.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">{{ $managers->links() }}</div>
@endsection
