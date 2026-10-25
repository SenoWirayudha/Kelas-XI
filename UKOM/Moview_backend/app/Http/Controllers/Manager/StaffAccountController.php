<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ReturnUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffAccountController extends Controller
{
    public function index()
    {
        $staff = User::where('role', User::ROLE_STAFF)
            ->where('cinema_id', $this->cinemaId())
            ->orderBy('username')
            ->paginate(15);

        return view('manager.staff.index', compact('staff'));
    }

    public function create()
    {
        return view('manager.staff.create');
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => User::ROLE_STAFF,
            'status' => 'active',
            'cinema_id' => $this->cinemaId(),
        ]);

        return ReturnUrl::redirect($request, route('manager.staff.index'))
            ->with('success', 'Akun staff berhasil dibuat.');
    }

    public function edit(User $staff)
    {
        $this->ensureOwnStaff($staff);

        return view('manager.staff.edit', compact('staff'));
    }

    public function update(Request $request, User $staff)
    {
        $this->ensureOwnStaff($staff);

        $data = $this->validated($request, $staff);

        $staff->fill([
            'username' => $data['username'],
            'email' => $data['email'],
        ]);

        if (!empty($data['password'])) {
            $staff->password = Hash::make($data['password']);
        }

        $staff->save();

        return ReturnUrl::redirect($request, route('manager.staff.index'))
            ->with('success', 'Akun staff berhasil diperbarui.');
    }

    public function destroy(Request $request, User $staff)
    {
        $this->ensureOwnStaff($staff);

        $staff->delete();

        $return = ReturnUrl::resolve($request, route('manager.staff.index'));
        $total = User::where('role', User::ROLE_STAFF)->where('cinema_id', $this->cinemaId())->count();

        return redirect(ReturnUrl::fitPage($return, $total, 15))
            ->with('success', 'Akun staff berhasil dihapus.');
    }

    private function ensureOwnStaff(User $staff): void
    {
        abort_unless($staff->role === User::ROLE_STAFF, 404);
        abort_unless((int) $staff->cinema_id === $this->cinemaId(), 403,
            'Anda hanya dapat mengelola staff di bioskop Anda sendiri.');
    }

    private function cinemaId(): int
    {
        return (int) session('admin_cinema_id');
    }

    private function validated(Request $request, ?User $staff = null): array
    {
        return $request->validate([
            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($staff?->id),
            ],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($staff?->id),
            ],
            'password' => [$staff ? 'nullable' : 'required', 'string', 'min:6'],
        ]);
    }
}
