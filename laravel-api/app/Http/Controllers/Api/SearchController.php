<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyMenu;
use App\Models\Fournisseur;
use App\Models\Marche;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->get('q', ''));
        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $like = '%' . $q . '%';
        $results = [];

        Fournisseur::query()
            ->where(function ($query) use ($like) {
                $query->where('raisonSociale', 'like', $like)
                    ->orWhere('categorie', 'like', $like)
                    ->orWhere('ice', 'like', $like);
            })
            ->limit(6)
            ->get()
            ->each(function ($f) use (&$results) {
                $results[] = [
                    'type' => 'fournisseur',
                    'tab' => 'fournisseurs',
                    'id' => $f->id,
                    'title' => $f->raisonSociale,
                    'subtitle' => $f->categorie . ' · ' . ($f->statut ?? 'Actif'),
                ];
            });

        Marche::query()
            ->where('titulaire', 'like', $like)
            ->limit(6)
            ->get()
            ->each(function ($m) use (&$results) {
                $results[] = [
                    'type' => 'marche',
                    'tab' => 'marches',
                    'id' => $m->id,
                    'title' => $m->titulaire,
                    'subtitle' => 'Budget ' . number_format((float) $m->budget, 0, ',', ' ') . ' MAD · ' . $m->statut,
                ];
            });

        DailyMenu::query()
            ->where(function ($query) use ($like) {
                $query->where('jour', 'like', $like)
                    ->orWhere('petit_dejeuner', 'like', $like)
                    ->orWhere('dejeuner', 'like', $like)
                    ->orWhere('diner', 'like', $like);
            })
            ->orderByDesc('date')
            ->limit(6)
            ->get()
            ->each(function ($menu) use (&$results) {
                $dateLabel = $menu->date
                    ? $menu->date->format('d/m/Y')
                    : $menu->jour;

                $results[] = [
                    'type' => 'menu',
                    'tab' => 'menus',
                    'id' => $menu->id,
                    'title' => $menu->jour . ' – ' . $dateLabel,
                    'subtitle' => 'Menu journalier',
                ];
            });

        return response()->json($results);
    }
}
