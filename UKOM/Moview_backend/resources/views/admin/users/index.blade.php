@extends('layouts.admin')

@section('title', 'Users Management')
@section('page-title', 'Users Management')
@section('page-subtitle', 'Manage application users and permissions')

@section('content')
<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Total Users</p>
                <p class="text-3xl font-bold text-gray-800">{{ number_format($totalUsers) }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-users text-blue-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">Active Today</p>
                <p class="text-3xl font-bold text-green-600">{{ number_format($activeToday) }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-user-check text-green-600 text-2xl"></i>
            </div>
        </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-gray-500 text-sm">New This Month</p>
                <p class="text-3xl font-bold text-purple-600">{{ number_format($newThisMonth) }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-user-plus text-purple-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <form method="GET" action="{{ route('admin.users.index') }}" id="filterForm">
        <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
                <div class="relative">
                    <input type="text" 
                           name="search" 
                           value="{{ request('search') }}"
                           placeholder="Search users by name or email..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
            </div>
            <select name="status" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="">All Users</option>
                <option value="active" {{ request('status') == 'active' ? 'selected' : '' }}>Active</option>
                <option value="inactive" {{ request('status') == 'inactive' ? 'selected' : '' }}>Inactive</option>
                <option value="banned" {{ request('status') == 'banned' ? 'selected' : '' }}>Banned</option>
            </select>
            <select name="role" 
                    class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onchange="document.getElementById('filterForm').submit()">
                <option value="">All Roles</option>
                <option value="admin" {{ request('role') == 'admin' ? 'selected' : '' }}>Admin</option>
                <option value="user" {{ request('role') == 'user' ? 'selected' : '' }}>User</option>
            </select>
            <button type="submit" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-filter mr-2"></i>Filter
            </button>
            @if(request()->hasAny(['search', 'status', 'role']))
                <a href="{{ route('admin.users.index') }}" 
                   class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <i class="fas fa-times mr-2"></i>Clear
                </a>
            @endif
        </div>
    </form>
</div>

<!-- Active Filters Display -->
@if(request()->hasAny(['search', 'status', 'role']))
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-center flex-wrap gap-2">
        <span class="text-sm font-semibold text-blue-900">
            <i class="fas fa-filter mr-1"></i>Active Filters:
        </span>
        @if(request('search'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Search: {{ request('search') }}
                <a href="{{ request()->fullUrlWithQuery(['search' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('status'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Status: {{ ucfirst(request('status')) }}
                <a href="{{ request()->fullUrlWithQuery(['status' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        @if(request('role'))
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
                Role: {{ ucfirst(request('role')) }}
                <a href="{{ request()->fullUrlWithQuery(['role' => null]) }}" class="ml-2 hover:text-blue-200">
                    <i class="fas fa-times"></i>
                </a>
            </span>
        @endif
        <span class="text-sm text-blue-700 ml-auto">
            Showing {{ $users->total() }} result{{ $users->total() != 1 ? 's' : '' }}
        </span>
    </div>
</div>
@endif

<!-- Users Table -->
<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($users as $user)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {{ substr($user->username, 0, 1) }}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $user->username }}</div>
                            <div class="text-sm text-gray-500">{{ $user->email ?? 'No email' }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $user->role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }}">
                        {{ ucfirst($user->role) }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $user->status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">
                        {{ ucfirst($user->status) }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ $user->reviews_count }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ $user->joined_at ? $user->joined_at->format('M d, Y') : ($user->created_at ? $user->created_at->format('M d, Y') : 'N/A') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        @if($user->status !== 'banned')
                        <form action="{{ route('admin.users.ban', $user->id) }}" method="POST" style="display: inline;">
                            @csrf
                            @method('POST')
                            <button type="submit" 
                                    class="text-red-600 hover:text-red-900" 
                                    title="Ban User" 
                                    onclick="return confirm('Are you sure you want to ban this user?')">
                                <i class="fas fa-ban"></i>
                            </button>
                        </form>
                        @else
                        <span class="text-gray-400" title="Already Banned">
                            <i class="fas fa-ban"></i>
                        </span>
                        @endif
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>No users found</p>
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6">
    <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
            Showing {{ $users->firstItem() ?? 0 }} to {{ $users->lastItem() ?? 0 }} of {{ $users->total() }} users
        </p>
        <div>
            {{ $users->links() }}
        </div>
    </div>
</div>
@endsection
