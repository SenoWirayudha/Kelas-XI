# Cara Menambahkan Logo Services (Streaming/Theatrical)

## Metode 1: Via Admin Panel (Recommended)

### 1. Tambah Route untuk Services Management

Edit `routes/web.php`:

```php
Route::middleware('admin.auth')->prefix('admin')->group(function () {
    // ... existing routes ...
    
    Route::resource('services', \App\Http\Controllers\Admin\ServiceController::class);
});
```

### 2. Buat View untuk Services

**File: `resources/views/admin/services/index.blade.php`**

```blade
@extends('layouts.admin')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Streaming Services</h2>
        <a href="{{ route('services.create') }}" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Service
        </a>
    </div>

    <div class="card">
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>Logo</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($services as $service)
                    <tr>
                        <td>
                            @if($service->logo_path)
                                <img src="{{ asset('storage/' . $service->logo_path) }}" 
                                     alt="{{ $service->name }}" 
                                     style="width: 50px; height: 50px; object-fit: contain;">
                            @else
                                <span class="text-muted">No logo</span>
                            @endif
                        </td>
                        <td>{{ $service->name }}</td>
                        <td><span class="badge bg-info">{{ $service->type }}</span></td>
                        <td>
                            <a href="{{ route('services.edit', $service) }}" class="btn btn-sm btn-warning">Edit</a>
                            <form action="{{ route('services.destroy', $service) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" 
                                        onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
```

**File: `resources/views/admin/services/create.blade.php`**

```blade
@extends('layouts.admin')

@section('content')
<div class="container-fluid">
    <h2>Add New Service</h2>

    <form action="{{ route('services.store') }}" method="POST" enctype="multipart/form-data">
        @csrf
        
        <div class="mb-3">
            <label for="name" class="form-label">Service Name</label>
            <input type="text" class="form-control @error('name') is-invalid @enderror" 
                   id="name" name="name" value="{{ old('name') }}" required>
            @error('name')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        <div class="mb-3">
            <label for="type" class="form-label">Service Type</label>
            <select class="form-select @error('type') is-invalid @enderror" id="type" name="type" required>
                <option value="streaming">Streaming</option>
                <option value="theatrical">Theatrical</option>
                <option value="tv">TV</option>
            </select>
            @error('type')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        <div class="mb-3">
            <label for="logo" class="form-label">Logo</label>
            <input type="file" class="form-control @error('logo') is-invalid @enderror" 
                   id="logo" name="logo" accept="image/*">
            <small class="form-text text-muted">
                Recommended: PNG with transparent background, 500x500px
            </small>
            @error('logo')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        <button type="submit" class="btn btn-primary">Create Service</button>
        <a href="{{ route('services.index') }}" class="btn btn-secondary">Cancel</a>
    </form>
</div>
@endsection
```

### 3. Update ServiceController

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index()
    {
        $services = Service::orderBy('name')->get();
        return view('admin.services.index', compact('services'));
    }

    public function create()
    {
        return view('admin.services.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:services,name',
            'type' => 'required|in:streaming,theatrical,tv',
            'logo' => 'nullable|image|max:2048'
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('services/logos', 'public');
        }

        Service::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'logo_path' => $logoPath,
        ]);

        return redirect()->route('services.index')
            ->with('success', 'Service created successfully');
    }

    public function edit(Service $service)
    {
        return view('admin.services.edit', compact('service'));
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:services,name,' . $service->id,
            'type' => 'required|in:streaming,theatrical,tv',
            'logo' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($service->logo_path) {
                Storage::disk('public')->delete($service->logo_path);
            }
            $logoPath = $request->file('logo')->store('services/logos', 'public');
            $service->logo_path = $logoPath;
        }

        $service->name = $validated['name'];
        $service->type = $validated['type'];
        $service->save();

        return redirect()->route('services.index')
            ->with('success', 'Service updated successfully');
    }

    public function destroy(Service $service)
    {
        if ($service->logo_path) {
            Storage::disk('public')->delete($service->logo_path);
        }
        
        $service->delete();

        return redirect()->route('services.index')
            ->with('success', 'Service deleted successfully');
    }
}
```

## Metode 2: Via Seeder (For Development)

### Create Service Seeder

```bash
php artisan make:seeder ServiceSeeder
```

**File: `database/seeders/ServiceSeeder.php`**

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            // Streaming Services
            ['name' => 'Netflix', 'type' => 'streaming', 'logo_path' => null],
            ['name' => 'Prime Video', 'type' => 'streaming', 'logo_path' => null],
            ['name' => 'Disney+', 'type' => 'streaming', 'logo_path' => null],
            ['name' => 'HBO Max', 'type' => 'streaming', 'logo_path' => null],
            ['name' => 'Apple TV+', 'type' => 'streaming', 'logo_path' => null],
            ['name' => 'YouTube', 'type' => 'streaming', 'logo_path' => null],
            
            // Theatrical
            ['name' => 'CGV', 'type' => 'theatrical', 'logo_path' => null],
            ['name' => 'Cinepolis', 'type' => 'theatrical', 'logo_path' => null],
            ['name' => 'XXI', 'type' => 'theatrical', 'logo_path' => null],
        ];

        foreach ($services as $service) {
            DB::table('services')->insert(array_merge($service, [
                'created_at' => now(),
            ]));
        }
    }
}
```

Run seeder:
```bash
php artisan db:seed --class=ServiceSeeder
```

## Metode 3: Manual via Database

```sql
INSERT INTO services (name, type, logo_path, created_at) 
VALUES ('Netflix', 'streaming', 'services/logos/netflix.png', NOW());
```

## Download Logos

Recommended sources for service logos:
1. **Official Brand Kits**: Visit each service's press/media page
2. **The Movie Database (TMDb)**: https://www.themoviedb.org/
3. **JustWatch**: https://www.justwatch.com/
4. **Wikimedia Commons**: https://commons.wikimedia.org/

## Logo Specifications

- **Format**: PNG with transparent background
- **Size**: 500x500px (will be scaled automatically)
- **File Size**: < 2MB
- **Location**: `storage/app/public/services/logos/`

## Menyambungkan Service dengan Film

### Via Admin Panel (Add to Film Edit Form)

```php
// In FilmController::edit()
$services = Service::orderBy('name')->get();
return view('admin.films.edit', compact('film', 'services'));
```

### Manual via Database

```sql
-- Add Netflix streaming for a movie (release immediately)
INSERT INTO movie_services (movie_id, service_id, availability_type, release_date)
VALUES (1, (SELECT id FROM services WHERE name = 'Netflix'), 'stream', NULL);

-- Add theatrical release (upcoming)
INSERT INTO movie_services (movie_id, service_id, availability_type, release_date)
VALUES (1, (SELECT id FROM services WHERE name = 'CGV'), NULL, '2026-02-15');
```

## Testing

Test API endpoint:
```bash
curl http://127.0.0.1:8000/api/v1/movies/1
```

Should return:
```json
{
  "success": true,
  "data": {
    "streaming_services": [
      {
        "id": 1,
        "name": "Netflix",
        "logo_url": "http://127.0.0.1:8000/storage/services/logos/netflix.png",
        "availability_type": "stream",
        "release_date": null
      }
    ],
    "theatrical_services": [
      {
        "id": 7,
        "name": "CGV",
        "logo_url": "http://127.0.0.1:8000/storage/services/logos/cgv.png",
        "release_date": "2026-02-15"
      }
    ]
  }
}
```

## Catatan Penting

1. **Storage Link**: Pastikan symbolic link sudah dibuat:
   ```bash
   php artisan storage:link
   ```

2. **Permissions**: Pastikan folder `storage` writable:
   ```bash
   chmod -R 775 storage
   ```

3. **File Validation**: Logo akan divalidasi (type: image, max: 2MB)

4. **URL**: Logo akan otomatis ter-convert ke full URL di API response
