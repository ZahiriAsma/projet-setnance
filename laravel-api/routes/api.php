<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MarcheController;

Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',     [AuthController::class, 'user']);
    Route::post('/logout',  [AuthController::class, 'logout']);

    // Marches routes
    Route::get('/marches', [MarcheController::class, 'index']);
    Route::post('/marches', [MarcheController::class, 'store']);

    // Fournisseurs routes
    Route::apiResource('fournisseurs', \App\Http\Controllers\Api\FournisseurController::class);

    // Menus routes
    Route::apiResource('menus', \App\Http\Controllers\Api\DailyMenuController::class);

    Route::get('/search', [\App\Http\Controllers\Api\SearchController::class, 'index']);
});

