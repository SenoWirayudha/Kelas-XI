@extends('layouts.admin')

@section('title', 'Edit Person')
@section('page-title', 'Edit Person')
@section('page-subtitle', 'Update cast or crew member information')

@section('content')
<!-- Breadcrumb -->
<div class="mb-6">
    <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
                <a href="{{ route('admin.cast-crew.index') }}" class="inline-flex items-center text-sm text-gray-700 hover:text-blue-600">
                    <i class="fas fa-user-friends mr-2"></i>
                    Cast & Crew
                </a>
            </li>
            <li>
                <div class="flex items-center">
                    <i class="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <span class="text-sm font-medium text-gray-500">Edit {{ $person->full_name }}</span>
                </div>
            </li>
        </ol>
    </nav>
</div>

<!-- Edit Person Form -->
<div class="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
    <form action="{{ route('admin.cast-crew.update', $person->id) }}" method="POST" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-6">
                <!-- Full Name -->
                <div>
                    <label for="full_name" class="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="full_name" name="full_name" value="{{ old('full_name', $person->full_name) }}"
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
                        <option value="Actor" {{ old('primary_role', $person->primary_role) == 'Actor' ? 'selected' : '' }}>Actor</option>
                        <option value="Director" {{ old('primary_role', $person->primary_role) == 'Director' ? 'selected' : '' }}>Director</option>
                        <option value="Writer" {{ old('primary_role', $person->primary_role) == 'Writer' ? 'selected' : '' }}>Writer</option>
                        <option value="Producer" {{ old('primary_role', $person->primary_role) == 'Producer' ? 'selected' : '' }}>Producer</option>
                        <option value="Cinematographer" {{ old('primary_role', $person->primary_role) == 'Cinematographer' ? 'selected' : '' }}>Cinematographer</option>
                        <option value="Composer" {{ old('primary_role', $person->primary_role) == 'Composer' ? 'selected' : '' }}>Composer</option>
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
                    <input type="date" id="date_of_birth" name="date_of_birth" 
                           value="{{ old('date_of_birth', $person->date_of_birth ? $person->date_of_birth->format('Y-m-d') : '') }}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="mt-1 text-xs text-gray-500">Format: YYYY-MM-DD</p>
                </div>

                <!-- Nationality -->
                <div>
                    <label for="nationality" class="block text-sm font-semibold text-gray-700 mb-2">
                        Nationality <span class="text-gray-400">(Optional)</span>
                    </label>
                    <input type="text" id="nationality" name="nationality" value="{{ old('nationality', $person->nationality) }}"
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
                        <div id="preview-container" class="{{ $person->photo_path ? '' : 'hidden' }} mb-4">
                            <img id="photo-preview" 
                                 src="{{ $person->photo_path ? asset('storage/' . $person->photo_path) : '' }}" 
                                 alt="Preview" 
                                 class="max-w-full h-48 object-cover mx-auto rounded-lg shadow">
                        </div>
                        <div id="upload-placeholder" class="{{ $person->photo_path ? 'hidden' : '' }}">
                            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                            <p class="text-sm text-gray-600 mb-1">Click to upload new photo</p>
                            <p class="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                    <input type="file" id="photo" name="photo" accept="image/*" class="hidden"
                           onchange="previewPhoto(event)">
                    @error('photo')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @else
                        @if($person->photo_path)
                            <p class="mt-1 text-xs text-gray-500">Current photo will be replaced if you upload a new one</p>
                        @endif
                    @enderror
                </div>

                <!-- Bio -->
                <div>
                    <label for="bio" class="block text-sm font-semibold text-gray-700 mb-2">
                        Biography <span class="text-gray-400">(Optional)</span>
                    </label>
                    <textarea id="bio" name="bio" rows="8" 
                              placeholder="Write a biography about this person..."
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">{{ old('bio', $person->bio) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Enter a detailed biography</p>
                </div>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <a href="{{ route('admin.cast-crew.index') }}" 
               class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                <i class="fas fa-times mr-2"></i>
                Cancel
            </a>
            <button type="submit"
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                <i class="fas fa-save mr-2"></i>
                Update Person
            </button>
        </div>
    </form>

    <!-- Delete Form (Separate) -->
    <div class="mt-4">
        <form action="{{ route('admin.cast-crew.destroy', $person->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this person? This action cannot be undone.')">
            @csrf
            @method('DELETE')
            <button type="submit" 
                    class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                <i class="fas fa-trash mr-2"></i>
                Delete Person
            </button>
        </form>
    </div>
</div>
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
