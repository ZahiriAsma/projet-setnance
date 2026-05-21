<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Facture;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class FactureController extends Controller
{
    public function index()
    {
        return response()->json(Facture::with('articles')->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_facture' => 'required|string|unique:factures',
            'date_facture' => 'required|date',
            'client' => 'nullable|string',
            'reference_bl' => 'nullable|string',
            'total_ht' => 'nullable|numeric',
            'tva' => 'nullable|numeric',
            'total_ttc' => 'nullable|numeric',
            'statut' => 'nullable|string',
            'conditions_generales' => 'nullable|string',
            'conditions_particulieres' => 'nullable|string',
            'articles' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            $facture = Facture::create(Arr::except($validated, ['articles']));

            $articles = $request->input('articles', []);
            if (!empty($articles)) {
                foreach ($articles as $article) {
                    $facture->articles()->create($article);
                }
            }
            DB::commit();
            return response()->json($facture->load('articles'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $facture = Facture::findOrFail($id);

        $validated = $request->validate([
            'numero_facture' => 'required|string|unique:factures,numero_facture,' . $facture->id,
            'date_facture' => 'required|date',
            'client' => 'nullable|string',
            'reference_bl' => 'nullable|string',
            'total_ht' => 'nullable|numeric',
            'tva' => 'nullable|numeric',
            'total_ttc' => 'nullable|numeric',
            'statut' => 'nullable|string',
            'conditions_generales' => 'nullable|string',
            'conditions_particulieres' => 'nullable|string',
            'articles' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            $facture->update(Arr::except($validated, ['articles']));

            $articles = $request->input('articles');
            if (isset($articles)) {
                $facture->articles()->delete();
                foreach ($articles as $article) {
                    $facture->articles()->create($article);
                }
            }
            DB::commit();
            return response()->json($facture->load('articles'), 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $facture = Facture::findOrFail($id);
        $facture->delete();
        return response()->json(['message' => 'Facture deleted successfully']);
    }
}
