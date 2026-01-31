# Profile Photo Upload Feature

## Overview
Fitur upload foto profil sudah berhasil diimplementasikan. Pengguna sekarang dapat mengganti foto profil mereka melalui Edit Profile screen.

## Cara Menggunakan

### Dari Aplikasi Android
1. Buka aplikasi Moview
2. Login dengan akun Anda
3. Navigasi ke Profile screen (tab Profile)
4. Klik tombol "Edit Profile"
5. **Klik pada foto profil** untuk memilih gambar baru
6. Pilih gambar dari galeri
7. Foto akan langsung ter-upload dan tampil di profil Anda

### Backend Implementation

#### Endpoint
```
POST /api/users/{userId}/profile/photo
```

#### Request
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `photo`: File gambar (JPG, PNG, etc.)

#### Response (Success)
```json
{
    "success": true,
    "data": {
        "profile_photo_url": "http://10.0.2.2:8000/storage/profiles/profile_1_1234567890.jpg"
    }
}
```

#### File Storage
- Location: `storage/app/public/profiles/`
- Filename Format: `profile_{userId}_{timestamp}.{extension}`
- Public URL: `http://10.0.2.2:8000/storage/profiles/{filename}`
- Old photos are automatically deleted when uploading new ones

### Android Implementation

#### Components Modified

1. **MovieRepository.kt**
   - Method: `uploadProfilePhoto(userId, imageUri, context)`
   - Converts Uri to File → MultipartBody.Part
   - Uploads to backend
   - Returns full photo URL

2. **EditProfileViewModel.kt**
   - Method: `uploadProfilePhoto(imageUri)`
   - Calls repository upload
   - Saves photo URL to SharedPreferences
   - Updates loading state

3. **EditProfileFragment.kt**
   - Photo picker launcher using `ActivityResultContracts.GetContent()`
   - Click listener on profile image
   - Immediate UI update with selected image
   - Glide loads uploaded photo

4. **ProfileFragment.kt**
   - Already configured to load from `profilePhotoUrl`
   - Shows uploaded photo or default icon

### Database Schema

#### Table: `user_profiles`
```sql
- profile_photo VARCHAR(255) -- Stores relative path: "profiles/profile_1_1234567890.jpg"
```

### Features

✅ Upload photo from gallery
✅ Automatic file storage with unique filename
✅ Delete old photo when uploading new one
✅ Save URL to SharedPreferences for offline access
✅ Real-time UI update
✅ Circular crop for profile display
✅ Default icon fallback

### Technical Details

**Image Processing:**
- Selected image is copied to cache directory
- Converted to `MultipartBody.Part` for upload
- Temp file deleted after upload
- No compression applied (can be added if needed)

**Photo Display:**
- Edit Profile: Shows selected/uploaded photo
- Profile Screen: Loads from API response or SharedPreferences
- Circular crop using Glide `.circleCrop()`
- Placeholder and error handling

### Testing

**Backend Test:**
```bash
# Test upload endpoint
curl -X POST http://10.0.2.2:8000/api/users/1/profile/photo \
  -F "photo=@/path/to/image.jpg"
```

**Android Test:**
1. Build and install app: `.\gradlew assembleDebug`
2. Run on emulator/device
3. Login as user
4. Navigate to Edit Profile
5. Click profile photo
6. Select image
7. Verify upload success
8. Check Profile screen shows new photo
9. Restart app - photo should persist

### Troubleshooting

**Photo tidak muncul:**
- Cek network connection
- Cek Laravel storage link: `php artisan storage:link`
- Cek file permissions di folder `storage/app/public/profiles/`
- Cek URL di SharedPreferences (key: "profilePhotoUrl")

**Upload gagal:**
- Cek file size (max 2MB recommended)
- Cek format file (JPG, PNG supported)
- Cek backend logs: `tail -f storage/logs/laravel.log`

**Photo terhapus setelah restart app:**
- Cek SharedPreferences save successful
- Cek API response includes correct URL
- Cek ProfileViewModel loads from SharedPreferences

## Files Modified

### Backend
- `app/Http/Controllers/ProfileController.php` - Added uploadProfilePhoto()
- `routes/api.php` - Added POST /users/{userId}/profile/photo

### Android
- `data/api/MovieApiService.kt` - Added uploadProfilePhoto() endpoint
- `data/api/ApiModels.kt` - Added ProfilePhotoResponse DTO
- `data/repository/MovieRepository.kt` - Added uploadProfilePhoto() method + imports
- `ui/profile/EditProfileViewModel.kt` - Added uploadProfilePhoto() method
- `ui/profile/EditProfileFragment.kt` - Added photo picker launcher + imports

## Next Steps (Optional Enhancements)

1. **Image Compression** - Reduce file size before upload
2. **Camera Support** - Add option to take photo with camera
3. **Crop Tool** - Allow user to crop/resize photo before upload
4. **Progress Indicator** - Show upload progress percentage
5. **Error Messages** - Display user-friendly error messages
6. **Photo Preview** - Show fullscreen preview before upload
7. **File Size Validation** - Check file size before upload (e.g., max 5MB)
8. **Format Validation** - Only allow specific formats (JPG, PNG)
