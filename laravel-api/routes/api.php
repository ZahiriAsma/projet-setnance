<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MarcheController;

Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',     [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout',  [AuthController::class, 'logout']);

    // Marches routes
    Route::get('/marches', [MarcheController::class, 'index']);
    Route::post('/marches', [MarcheController::class, 'store']);

    // Fournisseurs routes
    Route::apiResource('fournisseurs', \App\Http\Controllers\Api\FournisseurController::class);

    // Menus routes
    Route::apiResource('menus', \App\Http\Controllers\Api\DailyMenuController::class);
    Route::get('/bon-commandes/{id}/export', [\App\Http\Controllers\Api\BonCommandeController::class, 'export']);
    Route::apiResource('bon-commandes', \App\Http\Controllers\Api\BonCommandeController::class);

    // Bordereau routes
    Route::get('/bordereau', [\App\Http\Controllers\Api\BordereauController::class, 'index']);
    Route::post('/bordereau/import', [\App\Http\Controllers\Api\BordereauController::class, 'import']);

    // Factures routes
    Route::apiResource('factures', \App\Http\Controllers\FactureController::class);
});

