<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cinema;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ManagerAccountController extends Controller
{
    public function index()
    {
        $managers = User::with('cinema')
            ->where('role', User::ROLE_MANAGER)
            ->orderBy('username')
            ->paginate(15);

        return view('admin.accounts.index', compact('managers'));
    }

    public function create()
    {
        return view('admin.accounts.create', [
            'cinemas' => $this->cinemas(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => User::ROLE_MANAGER,
            'status' => 'active',
            'cinema_id' => $data['cinema_id'],
        ]);

        return redirect()->route('admin.accounts.index')
            ->with('success', 'Akun manager berhasil dibuat.');
    }

    public function edit(User $account)
    {
        $this->ensureManager($account);

        return view('admin.accounts.edit', [
            'manager' => $account,
            'cinemas' => $this->cinemas(),
        ]);
    }

    public function update(Request $request, User $account)
    {
        $this->ensureManager($account);

        $data = $this->validated($request, $account);

        $account->fill([
            'username' => $data['username'],
            'email' => $data['email'],
            'cinema_id' => $data['cinema_id'],
        ]);

        if (!empty($data['password'])) {
            $account->password = Hash::make($data['password']);
        }

        $account->save();

        return redirect()->route('admin.accounts.index')
            ->with('success', 'Akun manager berhasil diperbarui.');
    }

    public function destroy(User $account)
    {
        $this->ensureManager($account);

        $account->delete();

        return redirect()->route('admin.accounts.index')
            ->with('success', 'Akun manager berhasil dihapus.');
    }

    private function ensureManager(User $account): void
    {
        abort_unless($account->role === User::ROLE_MANAGER, 404);
    }

    private function validated(Request $request, ?User $account = null): array
    {
        return $request->validate([
            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($account?->id),
            ],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($account?->id),
            ],
            'password' => [$account ? 'nullable' : 'required', 'string', 'min:6'],
            'cinema_id' => ['required', 'integer', 'exists:cinemas,id'],
        ]);
    }

    private function cinemas()
    {
        return Cinema::orderBy('cinema_name')->get(['id', 'cinema_name', 'city']);
    }
}
