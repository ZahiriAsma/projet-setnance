<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use Illuminate\Http\Request;

class FournisseurController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Fournisseur::orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'raisonSociale' => 'required|string|max:255',
            'ice'           => 'required|string|max:255',
            'patente'       => 'nullable|string|max:255',
            'rc'            => 'nullable|string|max:255',
            'if'            => 'nullable|string|max:255',
            'cnss'          => 'nullable|string|max:255',
            'adresse'       => 'nullable|string|max:255',
            'telephone'     => 'nullable|string|max:255',
            'rib'           => 'nullable|string|max:255',
            'banque'        => 'nullable|string|max:255',
            
            // UI Support
            'categorie'     => 'nullable|string|max:255',
            'note'          => 'nullable|numeric|min:0|max:5',
            'statut'        => 'nullable|string|max:255',
        ]);

        // Setup some default random UI helper attributes if not provided
        if (!isset($validated['categorie']) || !$validated['categorie']) {
            $categories = ['Denrées alimentaires', 'Produits hygiéniques', 'Fruits & légumes', 'Entretien & Matériels'];
            $validated['categorie'] = $categories[array_rand($categories)];
        }

        if (!isset($validated['note'])) {
            $validated['note'] = number_format(3.0 + (rand(0, 20) / 10), 1); // Random rating between 3.0 and 5.0
        }

        if (!isset($validated['statut']) || !$validated['statut']) {
            $validated['statut'] = rand(1, 10) > 8 ? 'En retard' : 'Actif'; // 80% Actif, 20% En retard
        }

        $fournisseur = Fournisseur::create($validated);

        return response()->json($fournisseur, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $fournisseur = Fournisseur::find($id);
        if (!$fournisseur) {
            return response()->json(['message' => 'Fournisseur non trouvé'], 404);
        }
        return response()->json($fournisseur);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $fournisseur = Fournisseur::find($id);
        if (!$fournisseur) {
            return response()->json(['message' => 'Fournisseur non trouvé'], 404);
        }

        $validated = $request->validate([
            'raisonSociale' => 'sometimes|required|string|max:255',
            'ice'           => 'sometimes|required|string|max:255',
            'patente'       => 'nullable|string|max:255',
            'rc'            => 'nullable|string|max:255',
            'if'            => 'nullable|string|max:255',
            'cnss'          => 'nullable|string|max:255',
            'adresse'       => 'nullable|string|max:255',
            'telephone'     => 'nullable|string|max:255',
            'rib'           => 'nullable|string|max:255',
            'banque'        => 'nullable|string|max:255',
            
            // UI Support
            'categorie'     => 'nullable|string|max:255',
            'note'          => 'nullable|numeric|min:0|max:5',
            'statut'        => 'nullable|string|max:255',
        ]);

        $fournisseur->update($validated);

        return response()->json($fournisseur);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $fournisseur = Fournisseur::find($id);
        if (!$fournisseur) {
            return response()->json(['message' => 'Fournisseur non trouvé'], 404);
        }
        
        $fournisseur->delete();

        return response()->json(['message' => 'Fournisseur supprimé avec succès']);
    }
}
