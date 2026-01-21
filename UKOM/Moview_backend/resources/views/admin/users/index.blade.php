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
                <p class="text-3xl font-bold text-gray-800">1,248</p>
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
                <p class="text-3xl font-bold text-green-600">342</p>
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
                <p class="text-3xl font-bold text-purple-600">89</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-user-plus text-purple-600 text-2xl"></i>
            </div>
        </div>
    </div>
</div>

<!-- Search & Filters -->
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
            <div class="relative">
                <input type="text" placeholder="Search users by name or email..." 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Users</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Banned</option>
        </select>
        <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Regular</option>
        </select>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg" onclick="alert('Add user (UI only)')">
            <i class="fas fa-plus mr-2"></i>
            Add User
        </button>
    </div>
</div>

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
            @php
                $dummyUsers = [
                    ['name' => 'John Doe', 'email' => 'john@example.com', 'role' => 'Admin', 'status' => 'Active', 'reviews' => 245, 'joined' => '2023-01-15'],
                    ['name' => 'Jane Smith', 'email' => 'jane@example.com', 'role' => 'Regular', 'status' => 'Active', 'reviews' => 189, 'joined' => '2023-03-22'],
                    ['name' => 'Mike Johnson', 'email' => 'mike@example.com', 'role' => 'Regular', 'status' => 'Active', 'reviews' => 67, 'joined' => '2024-05-10'],
                    ['name' => 'Sarah Williams', 'email' => 'sarah@example.com', 'role' => 'Admin', 'status' => 'Active', 'reviews' => 423, 'joined' => '2022-11-08'],
                    ['name' => 'David Brown', 'email' => 'david@example.com', 'role' => 'Regular', 'status' => 'Inactive', 'reviews' => 12, 'joined' => '2025-08-30'],
                ];
            @endphp
            
            @foreach($dummyUsers as $user)
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {{ substr($user['name'], 0, 1) }}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ $user['name'] }}</div>
                            <div class="text-sm text-gray-500">{{ $user['email'] }}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $user['role'] === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }}">
                        {{ $user['role'] }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {{ $user['status'] === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">
                        {{ $user['status'] }}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ $user['reviews'] }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ date('M d, Y', strtotime($user['joined'])) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button class="text-blue-600 hover:text-blue-900" title="View Profile" onclick="alert('View profile (UI only)')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-indigo-600 hover:text-indigo-900" title="Edit" onclick="alert('Edit user (UI only)')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-900" title="Ban/Delete" onclick="alert('Ban user (UI only)')">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- Pagination -->
<div class="mt-6 flex justify-between items-center">
    <p class="text-sm text-gray-600">Showing 1 to 5 of 1,248 results</p>
    <div class="flex space-x-2">
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" disabled>Previous</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">2</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">3</button>
        <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">Next</button>
    </div>
</div>
@endsection
