@php($isEdit = isset($manager))

<div class="mb-5">
    <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
    <input type="text" id="username" name="username" required
           value="{{ old('username', $manager->username ?? '') }}"
           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
</div>

<div class="mb-5">
    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
    <input type="email" id="email" name="email" required
           value="{{ old('email', $manager->email ?? '') }}"
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

<div class="mb-6">
    <label for="cinema_id" class="block text-sm font-semibold text-gray-700 mb-2">Bioskop</label>
    <select id="cinema_id" name="cinema_id" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        <option value="">-- Pilih bioskop --</option>
        @foreach($cinemas as $cinema)
        <option value="{{ $cinema->id }}"
                @selected((string) old('cinema_id', $manager->cinema_id ?? '') === (string) $cinema->id)>
            {{ $cinema->cinema_name }}{{ $cinema->city ? ' - ' . $cinema->city : '' }}
        </option>
        @endforeach
    </select>
</div>
