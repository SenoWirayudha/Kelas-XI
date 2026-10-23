<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function currentRole(): ?string
    {
        return session('admin_role');
    }

    protected function isManager(): bool
    {
        return $this->currentRole() === 'manager';
    }

    protected function isStaff(): bool
    {
        return $this->currentRole() === 'staff';
    }

    protected function isAdmin(): bool
    {
        return $this->currentRole() === 'admin';
    }

    /**
     * Cinema id the current back-office user is limited to.
     */
    protected function scopedCinemaId(): ?int
    {
        return $this->isManager() || $this->isStaff()
            ? (int) session('admin_cinema_id')
            : null;
    }

    /**
     * Route name prefix for the current role (admin/manager/staff).
     */
    protected function panelPrefix(): string
    {
        return match ($this->currentRole()) {
            'manager' => 'manager',
            'staff' => 'staff',
            default => 'admin',
        };
    }

    protected function panelRoute(string $name): string
    {
        return $this->panelPrefix() . '.' . $name;
    }

    /**
     * Reject access to data that belongs to another cinema.
     */
    protected function authorizeCinema($cinemaId): void
    {
        $scoped = $this->scopedCinemaId();

        if ($scoped !== null && (int) $cinemaId !== $scoped) {
            abort(403, 'Anda hanya dapat mengakses data bioskop Anda sendiri.');
        }
    }
}
