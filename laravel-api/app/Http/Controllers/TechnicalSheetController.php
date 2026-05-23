<?php

namespace App\Http\Controllers;

use App\Models\TechnicalSheet;
use Illuminate\Http\Request;

class TechnicalSheetController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $sheets = TechnicalSheet::with('bordereau')
            ->where('date', $request->date)
            ->get();

        return response()->json($sheets);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'meal_type' => 'required|string',
            'bordereau_id' => 'required|exists:bordereau,id',
            'max_quantity' => 'required|numeric',
            'max_people' => 'required|integer',
            'present_people' => 'required|integer',
            'calculated_quantity' => 'required|numeric',
            'pu_r' => 'required|numeric',
            'amount' => 'required|numeric',
        ]);

        // We can either update or create
        $sheet = TechnicalSheet::updateOrCreate(
            [
                'date' => $request->date,
                'meal_type' => $request->meal_type,
                'bordereau_id' => $request->bordereau_id,
            ],
            [
                'max_quantity' => $request->max_quantity,
                'max_people' => $request->max_people,
                'present_people' => $request->present_people,
                'calculated_quantity' => $request->calculated_quantity,
                'pu_r' => $request->pu_r,
                'amount' => $request->amount,
            ]
        );

        return response()->json($sheet);
    }

    public function destroy($id)
    {
        $sheet = TechnicalSheet::findOrFail($id);
        $sheet->delete();
        
        return response()->json(['message' => 'Deleted successfully']);
    }
}
