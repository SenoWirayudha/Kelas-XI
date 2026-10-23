@php($isEdit = isset($staff))

<div class="mb-5">
    <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
    <input type="text" id="username" name="username" required
           value="{{ old('username', $staff->username ?? '') }}"
           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
</div>

<div class="mb-5">
    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
    <input type="email" id="email" name="email" required
           value="{{ old('email', $staff->email ?? '') }}"
           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
</div>

<div class="mb-5">
    <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
        Password {{ $isEdit ? '(kosongkan bila tidak diubah)' : 'awal' }}
    </label>
    <input type="password" id="password" name="password" {{ $isEdit ? '' : 'required' }}
           autocomplete="new-password"
           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
    <p class="mt-1 text-xs text-gray-500">Minimal 6 karakter, disimpan dalam bentuk hash.</p>
</div>

<div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <p class="text-sm text-gray-600">
        <i class="fas fa-building mr-1"></i>
        Bioskop: <span class="font-semibold text-gray-800">{{ session('admin_cinema_name', '-') }}</span>
    </p>
    <p class="mt-1 text-xs text-gray-500">Akun staff otomatis terikat ke bioskop Anda.</p>
</div>
