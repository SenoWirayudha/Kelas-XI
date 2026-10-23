@extends('layouts.portal')

@section('title', 'Akun Staff')
@section('page-title', 'Akun Staff')
@section('page-subtitle', session('admin_cinema_name', '-'))

@section('content')
<div class="mb-6 flex items-center justify-between">
    <p class="text-gray-600">Total staff: <span class="font-semibold">{{ $staff->total() }}</span></p>
    <a href="{{ route('manager.staff.create') }}"
       class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
        <i class="fas fa-plus mr-2"></i>
        Tambah Staff
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="w-full text-left">
        <thead class="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
                <th class="px-6 py-3">Nama</th>
                <th class="px-6 py-3">Email</th>
                <th class="px-6 py-3">Bioskop</th>
                <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            @forelse($staff as $member)
            <tr>
                <td class="px-6 py-4 font-medium text-gray-800">{{ $member->username }}</td>
                <td class="px-6 py-4 text-gray-600">{{ $member->email }}</td>
                <td class="px-6 py-4 text-gray-600">{{ session('admin_cinema_name', '-') }}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                    <a href="{{ route('manager.staff.edit', $member) }}"
                       class="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">
                        <i class="fas fa-pen mr-1.5"></i> Edit
                    </a>
                    <form action="{{ route('manager.staff.destroy', $member) }}" method="POST" class="inline"
                          onsubmit="return confirm('Hapus akun staff ini?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit"
                                class="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded">
                            <i class="fas fa-trash mr-1.5"></i> Hapus
                        </button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="px-6 py-10 text-center text-gray-500">Belum ada akun staff.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">{{ $staff->links() }}</div>
@endsection
