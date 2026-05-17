<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyMenu;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DailyMenuController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyMenu::query()->orderBy('date');

        if ($request->filled('week_start')) {
            $monday = Carbon::parse($request->week_start)->startOfDay();
            $sunday = $monday->copy()->addDays(6)->endOfDay();
            $query->whereBetween('date', [$monday->toDateString(), $sunday->toDateString()]);
        } elseif ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $menu = DailyMenu::findOrFail($id);
        return response()->json($menu);
    }

    public function update(Request $request, $id)
    {
        $menu = DailyMenu::findOrFail($id);

        $validated = $request->validate([
            'petit_dejeuner' => 'sometimes|string',
            'dejeuner' => 'sometimes|string',
            'diner' => 'sometimes|string',
            'residents' => 'sometimes|integer|min:1',
            'kcal_pd' => 'sometimes|integer|min:0',
            'kcal_dej' => 'sometimes|integer|min:0',
            'kcal_din' => 'sometimes|integer|min:0',
        ]);

        $menu->update($validated);

        return response()->json([
            'message' => 'Menu mis à jour avec succès',
            'menu' => $menu->fresh(),
        ]);
    }
}
