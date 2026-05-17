<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Point password reset link to React frontend
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return 'http://localhost:5173/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    Schema::defaultStringLength(191);
}
}