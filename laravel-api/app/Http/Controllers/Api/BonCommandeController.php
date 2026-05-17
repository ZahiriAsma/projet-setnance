<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BonCommande;
use Illuminate\Http\Request;

class BonCommandeController extends Controller
{
    public function index()
    {
        return response()->json(BonCommande::with('fournisseur')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'numeroBC' => 'required|string|unique:bon_commandes,numeroBC',
            'dateEmission' => 'required|date',
            'budget' => 'nullable|string',
            'exercice' => 'nullable|integer',
            'rubrique' => 'nullable|string',
            'referenceMarcheCadre' => 'nullable|string',
            'lieuLivraison' => 'nullable|string',
            'conditionsGenerales' => 'nullable|string',
            'conditionsParticulieres' => 'nullable|string',
            'montantHT' => 'nullable|numeric',
            'montantTVA' => 'nullable|numeric',
            'montantTTC' => 'nullable|numeric',
            'statut' => 'nullable|string',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id'
        ]);

        // Automatically compute TTC if HT is provided and TTC is not
        if ($request->filled('montantHT')) {
            $ht = (float) $request->input('montantHT');
            if (!$request->filled('montantTVA')) {
                $validated['montantTVA'] = $ht * 0.20;
            }
            if (!$request->filled('montantTTC')) {
                $validated['montantTTC'] = $ht + (float)($validated['montantTVA'] ?? ($ht * 0.20));
            }
        }

        $bonCommande = BonCommande::create($validated);
        return response()->json($bonCommande->load('fournisseur'), 201);
    }

    public function show($id)
    {
        $bonCommande = BonCommande::with('fournisseur')->findOrFail($id);
        return response()->json($bonCommande);
    }

    public function update(Request $request, $id)
    {
        $bonCommande = BonCommande::findOrFail($id);

        $validated = $request->validate([
            'numeroBC' => 'required|string|unique:bon_commandes,numeroBC,' . $id,
            'dateEmission' => 'required|date',
            'budget' => 'nullable|string',
            'exercice' => 'nullable|integer',
            'rubrique' => 'nullable|string',
            'referenceMarcheCadre' => 'nullable|string',
            'lieuLivraison' => 'nullable|string',
            'conditionsGenerales' => 'nullable|string',
            'conditionsParticulieres' => 'nullable|string',
            'montantHT' => 'nullable|numeric',
            'montantTVA' => 'nullable|numeric',
            'montantTTC' => 'nullable|numeric',
            'statut' => 'nullable|string',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id'
        ]);

        if ($request->filled('montantHT')) {
            $ht = (float) $request->input('montantHT');
            if (!$request->filled('montantTVA')) {
                $validated['montantTVA'] = $ht * 0.20;
            }
            if (!$request->filled('montantTTC')) {
                $validated['montantTTC'] = $ht + (float)($validated['montantTVA'] ?? ($ht * 0.20));
            }
        }

        $bonCommande->update($validated);
        return response()->json($bonCommande->load('fournisseur'));
    }

    public function destroy($id)
    {
        $bonCommande = BonCommande::findOrFail($id);
        $bonCommande->delete();
        return response()->json(['message' => 'Bon de commande supprimé avec succès']);
    }
}
