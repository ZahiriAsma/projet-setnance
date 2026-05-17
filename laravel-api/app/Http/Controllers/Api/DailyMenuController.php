<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DailyMenu;
class DailyMenuController extends Controller
{
    public function index()
    {
        return response()->json(DailyMenu::all());
    }

    public function show($id)
    {
        $menu = DailyMenu::findOrFail($id);
        return response()->json($menu);
    }

    public function update(Request $request, $id)
    {
        $menu = DailyMenu::findOrFail($id);
        $menu->update($request->all());
        return response()->json([
            'message' => 'Menu mis à jour avec succès',
            'menu' => $menu
        ]);
    }
}
