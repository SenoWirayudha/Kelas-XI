@extends('layouts.admin')

@section('title', 'Add Person')
@section('page-title', 'Add Person')
@section('page-subtitle', 'Add new cast or crew member')

@section('content')
@php
    $returnUrl = \App\Support\ReturnUrl::fromRequest(request());
    $backUrl = $returnUrl ?? route('admin.cast-crew.index');
@endphp
<!-- Breadcrumb -->
<div class="mb-6">
    <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
                <a href="{{ $backUrl }}" data-no-history class="inline-flex items-center text-sm text-gray-700 hover:text-blue-600">
                    <i class="fas fa-user-friends mr-2"></i>
                    Cast & Crew
                </a>
            </li>
            <li>
                <div class="flex items-center">
                    <i class="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <span class="text-sm font-medium text-gray-500">Add Person</span>
                </div>
            </li>
        </ol>
    </nav>
</div>

<!-- Add Person Form -->
<div class="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
    <form action="{{ route('admin.cast-crew.store') }}" method="POST" enctype="multipart/form-data">
        @csrf
        <input type="hidden" name="return" value="{{ $returnUrl }}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-6">
                <!-- Full Name -->
                <div>
                    <label for="full_name" class="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="full_name" name="full_name" value="{{ old('full_name') }}"
                           placeholder="e.g., Leonardo DiCaprio" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent @error('full_name') border-red-500 @enderror">
                    @error('full_name')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @else
                        <p class="mt-1 text-xs text-gray-500">Enter the person's full legal name</p>
                    @enderror
                </div>

                <!-- Primary Role -->
                <div>
                    <label for="primary_role" class="block text-sm font-semibold text-gray-700 mb-2">
                        Primary Role <span class="text-red-500">*</span>
                    </label>
                    <select id="primary_role" name="primary_role" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent @error('primary_role') border-red-500 @enderror">
                        <option value="">Select Role</option>
                        <option value="Actor" {{ old('primary_role') == 'Actor' ? 'selected' : '' }}>Actor</option>
                        <option value="Director" {{ old('primary_role') == 'Director' ? 'selected' : '' }}>Director</option>
                        <option value="Writer" {{ old('primary_role') == 'Writer' ? 'selected' : '' }}>Writer</option>
                        <option value="Producer" {{ old('primary_role') == 'Producer' ? 'selected' : '' }}>Producer</option>
                        <option value="Cinematographer" {{ old('primary_role') == 'Cinematographer' ? 'selected' : '' }}>Cinematographer</option>
                        <option value="Composer" {{ old('primary_role') == 'Composer' ? 'selected' : '' }}>Composer</option>
                    </select>
                    @error('primary_role')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @else
                        <p class="mt-1 text-xs text-gray-500">Select the person's primary role in the industry</p>
                    @enderror
                </div>

                <!-- Date of Birth -->
                <div>
                    <label for="date_of_birth" class="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth <span class="text-gray-400">(Optional)</span>
                    </label>
                    <input type="date" id="date_of_birth" name="date_of_birth" value="{{ old('date_of_birth') }}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="mt-1 text-xs text-gray-500">Format: YYYY-MM-DD</p>
                </div>

                <!-- Nationality -->
                <div>
                    <label for="nationality" class="block text-sm font-semibold text-gray-700 mb-2">
                        Nationality <span class="text-gray-400">(Optional)</span>
                    </label>
                    <input type="text" id="nationality" name="nationality" value="{{ old('nationality') }}"
                           placeholder="e.g., American"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="mt-1 text-xs text-gray-500">Enter country or nationality</p>
                </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
                <!-- Photo Upload -->
                <div>
                    <label for="photo" class="block text-sm font-semibold text-gray-700 mb-2">
                        Photo Upload <span class="text-gray-400">(Optional)</span>
                    </label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer @error('photo') border-red-500 @enderror"
                         onclick="document.getElementById('photo').click()">
                        <div id="preview-container" class="hidden mb-4">
                            <img id="photo-preview" src="" alt="Preview" class="max-w-full h-48 object-cover mx-auto rounded-lg shadow">
                        </div>
                        <div id="upload-placeholder">
                            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                            <p class="text-sm text-gray-600 mb-1">Click to upload photo</p>
                            <p class="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                    <input type="file" id="photo" name="photo" accept="image/*" class="hidden"
                           onchange="previewPhoto(event)">
                    @error('photo')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Bio -->
                <div>
                    <label for="bio" class="block text-sm font-semibold text-gray-700 mb-2">
                        Biography <span class="text-gray-400">(Optional)</span>
                    </label>
                    <textarea id="bio" name="bio" rows="8" 
                              placeholder="Write a biography about this person..."
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">{{ old('bio') }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Enter a detailed biography</p>
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <a href="{{ $backUrl }}"
               data-no-history
               class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                <i class="fas fa-times mr-2"></i>
                Cancel
            </a>
            <button type="submit"
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                <i class="fas fa-save mr-2"></i>
                Save Person
            </button>
        </div>
    </form>
</div>

<!-- Help Section -->
<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl">
    <h4 class="font-semibold text-blue-900 mb-2 flex items-center">
        <i class="fas fa-info-circle mr-2"></i>
        Tips for Adding Cast & Crew
    </h4>
    <ul class="text-sm text-blue-800 space-y-1 ml-6 list-disc">
        <li>Use high-quality professional photos (minimum 400x600px recommended)</li>
        <li>Write a concise but informative biography highlighting key achievements</li>
        <li>Ensure all required fields are filled before saving</li>
        <li>Double-check spelling of names and biographical information</li>
    </ul>
</div>

<script>
function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photo-preview').src = e.target.result;
            document.getElementById('preview-container').classList.remove('hidden');
            document.getElementById('upload-placeholder').classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }
}
</script>

@endsection
