<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Marche;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MarcheController extends Controller
{
    public function index()
    {
        return response()->json(Marche::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulaire' => 'required|string|max:255',
            'id_fournisseur' => 'required|integer',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
        ]);

        // Default values for mocked UI features
        $data = $request->all();
        if (!isset($data['budget'])) {
            $data['budget'] = rand(20000, 150000); // Random budget for demonstration
        }
        if (!isset($data['consomme'])) {
            $data['consomme'] = rand(0, 100); // Random consumption percentage
        }
        if (!isset($data['statut'])) {
            $data['statut'] = 'En cours';
        }

        $marche = Marche::create($data);

        return response()->json($marche, 201);
    }
}
