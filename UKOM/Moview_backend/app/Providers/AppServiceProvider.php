<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Shared views are reused by the admin and manager panels; this tells
        // them which route-name prefix to link to.
        View::composer('*', function ($view) {
            $view->with('panelPrefix', match (session('admin_role')) {
                'manager' => 'manager',
                'staff' => 'staff',
                default => 'admin',
            });
        });
    }
}
