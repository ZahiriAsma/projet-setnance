<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BonCommande;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

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
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'items' => 'nullable|array'
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
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'items' => 'nullable|array'
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

    public function export($id)
    {
        $bc = BonCommande::with('fournisseur')->findOrFail($id);
        $items = $bc->items ?? [];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Bon de Commande');

        // Page setup & gridlines
        $sheet->setShowGridlines(true);
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
        $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(6);   // N°
        $sheet->getColumnDimension('B')->setWidth(40);  // Désignation
        $sheet->getColumnDimension('C')->setWidth(10);  // Unité
        $sheet->getColumnDimension('D')->setWidth(8);   // Qté
        $sheet->getColumnDimension('E')->setWidth(12);  // PU HT
        $sheet->getColumnDimension('F')->setWidth(10);  // Taux TVA
        $sheet->getColumnDimension('G')->setWidth(12);  // TVA
        $sheet->getColumnDimension('H')->setWidth(14);  // Total HT

        // Default Font
        $sheet->getStyle('A1:H200')->getFont()->setName('Arial')->setSize(10);

        // --- Left Header Block ---
        $sheet->setCellValue('A1', 'OFFICE DE LA FORMATION');
        $sheet->setCellValue('A2', 'PROFESSIONNELLE');
        $sheet->setCellValue('A3', 'ET DE LA PROMOTION DU TRAVAIL');
        $sheet->setCellValue('A4', 'Direction Régionale Draa Tafilalet');
        $sheet->setCellValue('A5', 'ISBTP QUARTIER EL MATAR');
        $sheet->setCellValue('A6', 'ERRACHIDIA');
        $sheet->setCellValue('A7', 'Tél : 0535572740');
        
        $sheet->getStyle('A1:A3')->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('A4:A7')->getFont()->setSize(8);

        // --- Middle Header Block ---
        $sheet->mergeCells('D2:F3');
        $sheet->setCellValue('D2', 'BON DE COMMANDE');
        $sheet->getStyle('D2')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('D2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('D2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        
        // Border for D2:F3
        $sheet->getStyle('D2:F3')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THICK);

        $sheet->mergeCells('D4:F4');
        $sheet->setCellValue('D4', 'B.C PA  ' . ($bc->numeroBC ?: ''));
        $sheet->getStyle('D4')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('D4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // --- Right Header Block ---
        $fourn = $bc->fournisseur;
        $sheet->setCellValue('G1', 'Références du Fournisseur');
        $sheet->setCellValue('G2', 'Sté ' . ($fourn->raisonSociale ?? ''));
        $sheet->setCellValue('G3', ($fourn->adresse ?? ''));
        $sheet->setCellValue('G4', 'PATENTE N° : ' . ($fourn->patente ?? '') . '   RC : ' . ($fourn->rc ?? ''));
        $sheet->setCellValue('G5', 'IF : ' . ($fourn->if ?? '') . '   ICE : ' . ($fourn->ice ?? ''));
        $sheet->setCellValue('G6', 'RIB : ' . ($fourn->rib ?? ''));

        $sheet->getStyle('G1')->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('G2:G6')->getFont()->setSize(8);
        $sheet->getStyle('G1:G6')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // --- Metadata Block (Row 8 to 10) ---
        // Left Box (Budget, Exercice, Rubrique)
        $sheet->setCellValue('A8', 'Budget');
        $sheet->mergeCells('B8:D8');
        $sheet->setCellValue('B8', $bc->budget ?: 'BF');

        $sheet->setCellValue('A9', 'Exercice');
        $sheet->mergeCells('B9:D9');
        $sheet->setCellValue('B9', $bc->exercice ?: date('Y'));

        $sheet->setCellValue('A10', 'Rubrique');
        $sheet->mergeCells('B10:D10');
        $sheet->setCellValue('B10', $bc->rubrique ?: '');

        // Right Box (Ref Marche Cadre, Lieu livraison, Date livraison)
        $sheet->setCellValue('E8', 'Réf. Marché Cadre');
        $sheet->mergeCells('F8:H8');
        $sheet->setCellValue('F8', $bc->referenceMarcheCadre ?: '');

        $sheet->setCellValue('E9', 'Lieu de livraison');
        $sheet->mergeCells('F9:H9');
        $sheet->setCellValue('F9', $bc->lieuLivraison ?: '');

        $sheet->setCellValue('E10', 'Date de livraison');
        $sheet->mergeCells('F10:H10');
        $sheet->setCellValue('F10', $bc->dateEmission ?: date('Y-m-d'));

        // Format metadata headers
        $sheet->getStyle('A8:A10')->getFont()->setBold(true)->setSize(8);
        $sheet->getStyle('E8:E10')->getFont()->setBold(true)->setSize(8);
        $sheet->getStyle('A8:H10')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A8:H10')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF2F5F8');
        $sheet->getStyle('B8:D10')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('F8:H10')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A8:H10')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A8:H10')->getFont()->setSize(9);

        // Row heights
        $sheet->getRowDimension('8')->setRowHeight(20);
        $sheet->getRowDimension('9')->setRowHeight(20);
        $sheet->getRowDimension('10')->setRowHeight(20);

        // --- Main Items Table Headers (Row 12) ---
        $sheet->setCellValue('A12', 'N°');
        $sheet->setCellValue('B12', 'Désignations et références');
        $sheet->setCellValue('C12', 'Unité');
        $sheet->setCellValue('D12', 'Qté');
        $sheet->setCellValue('E12', 'P.U HT');
        $sheet->setCellValue('F12', 'Taux TVA');
        $sheet->setCellValue('G12', 'TVA');
        $sheet->setCellValue('H12', 'Total HT');

        $sheet->getStyle('A12:H12')->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('A12:H12')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A12:H12')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A12:H12')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFD6E2E6');
        $sheet->getStyle('A12:H12')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_MEDIUM);
        $sheet->getRowDimension('12')->setRowHeight(25);

        // --- Items Data Rows ---
        $currentRow = 13;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $currentRow, $item['price_number'] ?? '');
            $sheet->setCellValue('B' . $currentRow, $item['service_description'] ?? ($item['designation'] ?? ($item['label'] ?? '')));
            $sheet->setCellValue('C' . $currentRow, $item['unit_of_measure'] ?? ($item['unit'] ?? 'Unité'));
            $sheet->setCellValue('D' . $currentRow, $item['qty'] ?? ($item['quantity'] ?? 0));
            $sheet->setCellValue('E' . $currentRow, $item['unit_price_ht'] ?? ($item['price'] ?? ($item['unit_price'] ?? ($item['pu'] ?? 0))));
            
            // Format VAT rate as numeric percentage
            $vatRate = isset($item['vat_rate']) ? (float)str_replace('%', '', $item['vat_rate']) : 20;
            $sheet->setCellValue('F' . $currentRow, $vatRate / 100);

            // Formulas for TVA and Total HT
            $sheet->setCellValue('G' . $currentRow, '=D' . $currentRow . '*E' . $currentRow . '*F' . $currentRow);
            $sheet->setCellValue('H' . $currentRow, '=D' . $currentRow . '*E' . $currentRow);

            // Alignments & formats
            $sheet->getStyle('A' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('C' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('F' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('G' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('H' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Formatting
            $sheet->getStyle('E' . $currentRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');
            $sheet->getStyle('F' . $currentRow)->getNumberFormat()->setFormatCode('0%');
            $sheet->getStyle('G' . $currentRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');
            $sheet->getStyle('H' . $currentRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');

            // Borders
            $sheet->getStyle('A' . $currentRow . ':H' . $currentRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            
            $sheet->getRowDimension($currentRow)->setRowHeight(20);
            $currentRow++;
        }

        // --- Totals Block ---
        $lastDataRow = $currentRow - 1;
        $totalsStartRow = $currentRow + 1;

        // Total H.T
        $sheet->mergeCells('E' . $totalsStartRow . ':G' . $totalsStartRow);
        $sheet->setCellValue('E' . $totalsStartRow, 'Total H.T');
        $sheet->setCellValue('H' . $totalsStartRow, '=SUM(H13:H' . $lastDataRow . ')');

        // VAT categories
        $vatRatesToCheck = [0, 9, 10, 20];
        $totalRowOffset = 1;
        foreach ($vatRatesToCheck as $rate) {
            $r = $totalsStartRow + $totalRowOffset;
            $sheet->mergeCells('E' . $r . ':G' . $r);
            $sheet->setCellValue('E' . $r, 'TVA ' . $rate . '%');
            // SUMIF over VAT Rate column
            $sheet->setCellValue('H' . $r, '=SUMIF(F13:F' . $lastDataRow . ', ' . ($rate / 100) . ', G13:G' . $lastDataRow . ')');
            $totalRowOffset++;
        }

        // Total T.T.C
        $ttcRow = $totalsStartRow + $totalRowOffset;
        $sheet->mergeCells('E' . $ttcRow . ':G' . $ttcRow);
        $sheet->setCellValue('E' . $ttcRow, 'Total T.T.C');
        // TTC = Total HT + SUM(TVA)
        $sheet->setCellValue('H' . $ttcRow, '=H' . $totalsStartRow . '+SUM(G13:G' . $lastDataRow . ')');

        // Formatting Totals Block
        $totalBoxRange = 'E' . $totalsStartRow . ':H' . $ttcRow;
        $sheet->getStyle($totalBoxRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle($totalBoxRange)->getFont()->setBold(true)->setSize(9);
        
        // Right align values
        $sheet->getStyle('H' . $totalsStartRow . ':H' . $ttcRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('H' . $totalsStartRow . ':H' . $ttcRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');
        
        // Left align descriptions
        $sheet->getStyle('E' . $totalsStartRow . ':E' . $ttcRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Double border for TTC row
        $sheet->getStyle('E' . $ttcRow . ':H' . $ttcRow)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE);
        
        // Background color for TTC cell
        $sheet->getStyle('E' . $ttcRow . ':H' . $ttcRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFECFDF5');
        $sheet->getStyle('E' . $ttcRow . ':H' . $ttcRow)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_DARKGREEN));

        // --- Signature and bottom info ---
        $signatureRow = $ttcRow + 3;
        $sheet->setCellValue('A' . $signatureRow, 'Nous vous prions de bien vouloir exécuter la');
        $sheet->setCellValue('A' . ($signatureRow + 1), 'présente commande aux conditions ci-après.');
        $sheet->getStyle('A' . $signatureRow . ':A' . ($signatureRow + 1))->getFont()->setItalic(true)->setSize(8);

        $sheet->mergeCells('F' . $signatureRow . ':H' . $signatureRow);
        $sheet->setCellValue('F' . $signatureRow, 'Errachidia, le ' . date('d/m/Y', strtotime($bc->dateEmission)));
        $sheet->getStyle('F' . $signatureRow)->getFont()->setSize(9);
        $sheet->getStyle('F' . $signatureRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('F' . ($signatureRow + 2) . ':H' . ($signatureRow + 2));
        $sheet->setCellValue('F' . ($signatureRow + 2), 'LE SOUS-ORDONNATEUR');
        $sheet->getStyle('F' . ($signatureRow + 2))->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('F' . ($signatureRow + 2))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Create Writer & Output stream
        $writer = new Xlsx($spreadsheet);
        $filename = 'Bon_de_Commande_' . str_replace('/', '_', $bc->numeroBC) . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
