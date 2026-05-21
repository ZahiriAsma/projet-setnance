<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BonLivraison;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class BonLivraisonController extends Controller
{
    public function index()
    {
        return response()->json(BonLivraison::with('fournisseurModel')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_bl' => 'required|string|unique:bons_livraison,numero_bl',
            'date_bl' => 'required|date',
            'fournisseur' => 'nullable|string',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'reference_bc' => 'nullable|string',
            'client' => 'nullable|string',
            'total_ht' => 'nullable|numeric',
            'total_tva' => 'nullable|numeric',
            'total_ttc' => 'nullable|numeric',
            'items' => 'nullable|array',
            'statut' => 'nullable|string'
        ]);

        // Secure automatic totals computation if not fully calculated on client-side
        if (!isset($validated['total_ht']) && is_array($request->input('items'))) {
            $ht = 0;
            $tva = 0;
            foreach ($request->input('items') as $item) {
                $qty = (float)($item['qty'] ?? ($item['quantity'] ?? 0));
                $pu = (float)($item['unit_price_ht'] ?? ($item['price'] ?? ($item['unit_price'] ?? ($item['pu'] ?? 0))));
                $rate = (float)($item['vat_rate'] ?? 20);
                $lineHt = $qty * $pu;
                $ht += $lineHt;
                $tva += $lineHt * ($rate / 100);
            }
            $validated['total_ht'] = $ht;
            $validated['total_tva'] = $tva;
            $validated['total_ttc'] = $ht + $tva;
        }

        $bonLivraison = BonLivraison::create($validated);
        return response()->json($bonLivraison->load('fournisseurModel'), 201);
    }

    public function show($id)
    {
        $bonLivraison = BonLivraison::with('fournisseurModel')->findOrFail($id);
        return response()->json($bonLivraison);
    }

    public function update(Request $request, $id)
    {
        $bonLivraison = BonLivraison::findOrFail($id);

        $validated = $request->validate([
            'numero_bl' => 'required|string|unique:bons_livraison,numero_bl,' . $id,
            'date_bl' => 'required|date',
            'fournisseur' => 'nullable|string',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'reference_bc' => 'nullable|string',
            'client' => 'nullable|string',
            'total_ht' => 'nullable|numeric',
            'total_tva' => 'nullable|numeric',
            'total_ttc' => 'nullable|numeric',
            'items' => 'nullable|array',
            'statut' => 'nullable|string'
        ]);

        if (!isset($validated['total_ht']) && is_array($request->input('items'))) {
            $ht = 0;
            $tva = 0;
            foreach ($request->input('items') as $item) {
                $qty = (float)($item['qty'] ?? ($item['quantity'] ?? 0));
                $pu = (float)($item['unit_price_ht'] ?? ($item['price'] ?? ($item['unit_price'] ?? ($item['pu'] ?? 0))));
                $rate = (float)($item['vat_rate'] ?? 20);
                $lineHt = $qty * $pu;
                $ht += $lineHt;
                $tva += $lineHt * ($rate / 100);
            }
            $validated['total_ht'] = $ht;
            $validated['total_tva'] = $tva;
            $validated['total_ttc'] = $ht + $tva;
        }

        $bonLivraison->update($validated);
        return response()->json($bonLivraison->load('fournisseurModel'));
    }

    public function destroy($id)
    {
        $bonLivraison = BonLivraison::findOrFail($id);
        $bonLivraison->delete();
        return response()->json(['message' => 'Bon de livraison supprimé avec succès']);
    }

    public function export($id)
    {
        $bl = BonLivraison::with('fournisseurModel')->findOrFail($id);
        $items = $bl->items ?? [];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Bon de Livraison');

        // Page setup & gridlines
        $sheet->setShowGridlines(true);
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
        $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);

        // Column widths - N°, Désignations et références, Qté, Unité, PU HT, Total HT
        $sheet->getColumnDimension('A')->setWidth(6);   // N°
        $sheet->getColumnDimension('B')->setWidth(50);  // Désignations et références
        $sheet->getColumnDimension('C')->setWidth(10);  // Qté
        $sheet->getColumnDimension('D')->setWidth(10);  // Unité
        $sheet->getColumnDimension('E')->setWidth(14);  // PU HT
        $sheet->getColumnDimension('F')->setWidth(16);  // Total HT

        // Default Font
        $sheet->getStyle('A1:F200')->getFont()->setName('Arial')->setSize(10);

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
        $sheet->mergeCells('C2:E3');
        $sheet->setCellValue('C2', 'BON DE LIVRAISON');
        $sheet->getStyle('C2')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('C2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('C2:E3')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THICK);

        $sheet->mergeCells('C4:E4');
        $sheet->setCellValue('C4', 'N° : ' . ($bl->numero_bl ?: ''));
        $sheet->getStyle('C4')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('C4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // --- Right Header Block ---
        $fourn = $bl->fournisseurModel;
        if ($fourn) {
            $sheet->setCellValue('F1', 'STE ' . ($fourn->raisonSociale ?? ''));
            $sheet->setCellValue('F2', ($fourn->adresse ?? ''));
            $sheet->setCellValue('F3', 'RC : ' . ($fourn->rc ?? '') . ' ERRACHIDIA');
            $sheet->setCellValue('F4', 'PATENTE : ' . ($fourn->patente ?? '') . '   CNSS : ' . ($fourn->cnss ?? ''));
            $sheet->setCellValue('F5', 'IF : ' . ($fourn->if ?? '') . '   ICE : ' . ($fourn->ice ?? ''));
            $sheet->setCellValue('F6', 'RIB : ' . ($fourn->rib ?? ''));
            if (!empty($fourn->bank)) {
                $sheet->setCellValue('F7', ($fourn->bank ?? ''));
            }
        } else {
            // Fallback default details from image
            $sheet->setCellValue('F1', 'STE BIHAMID TRAV SARL');
            $sheet->setCellValue('F2', 'BLOC 23 N°07 AIT BAMOUIHA ERRACHIDIA');
            $sheet->setCellValue('F3', 'RC : 12253 ERRACHIDIA');
            $sheet->setCellValue('F4', 'PATENTE : 19203273   CNSS : 5793387');
            $sheet->setCellValue('F5', 'IF : 25090312   ICE : 002031857000054');
            $sheet->setCellValue('F6', 'RIB : 007 210 000 770 900 000 021 657');
            $sheet->setCellValue('F7', 'ATTIJARIWAFA Bank ERRACHIDIA');
        }
        $sheet->getStyle('F1')->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('F2:F7')->getFont()->setSize(8);
        $sheet->getStyle('F1:F7')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        // --- Metadata Block (Row 9 to 11) ---
        // Left Box (Client Info)
        $sheet->setCellValue('A9', 'Client');
        $sheet->mergeCells('B9:C9');
        $sheet->setCellValue('B9', $bl->client ?: 'OFPPT / ISTA OUARZAZATE');

        $sheet->setCellValue('A10', 'Lieu de livraison');
        $sheet->mergeCells('B10:C10');
        $sheet->setCellValue('B10', $bl->client ?: 'ISTA OUARZAZATE');

        $sheet->setCellValue('A11', 'ICE Client');
        $sheet->mergeCells('B11:C11');
        $sheet->setCellValue('B11', '001674314000081'); // Standard default or dynamic if we want

        // Right Box (Order Info)
        $sheet->setCellValue('D9', 'Réf. BC');
        $sheet->mergeCells('E9:F9');
        $sheet->setCellValue('E9', $bl->reference_bc ?: 'BON DE COMMANDE N° PA 43/2025');

        $sheet->setCellValue('D10', 'Date');
        $sheet->mergeCells('E10:F10');
        $sheet->setCellValue('E10', date('d/m/Y', strtotime($bl->date_bl)));

        $sheet->setCellValue('D11', 'Lieu de livraison');
        $sheet->mergeCells('E11:F11');
        $sheet->setCellValue('E11', 'Ouarzazate');

        // Format metadata headers
        $sheet->getStyle('A9:A11')->getFont()->setBold(true)->setSize(8);
        $sheet->getStyle('D9:D11')->getFont()->setBold(true)->setSize(8);
        $sheet->getStyle('A9:F11')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A9:F11')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF2F5F8');
        $sheet->getStyle('B9:C11')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('E9:F11')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A9:F11')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A9:F11')->getFont()->setSize(9);

        // Row heights
        $sheet->getRowDimension('9')->setRowHeight(20);
        $sheet->getRowDimension('10')->setRowHeight(20);
        $sheet->getRowDimension('11')->setRowHeight(20);

        // --- Main Items Table Headers (Row 13) ---
        $sheet->setCellValue('A13', 'N°');
        $sheet->setCellValue('B13', 'Désignations et références');
        $sheet->setCellValue('C13', 'Qté');
        $sheet->setCellValue('D13', 'Unité');
        $sheet->setCellValue('E13', 'P.U HT');
        $sheet->setCellValue('F13', 'Total HT');

        $sheet->getStyle('A13:F13')->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('A13:F13')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A13:F13')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A13:F13')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFD6E2E6');
        $sheet->getStyle('A13:F13')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_MEDIUM);
        $sheet->getRowDimension('13')->setRowHeight(25);

        // --- Items Data Rows ---
        $currentRow = 14;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $currentRow, $item['price_number'] ?? ($item['id'] ?? ''));
            $sheet->setCellValue('B' . $currentRow, $item['service_description'] ?? ($item['designation'] ?? ($item['label'] ?? '')));
            $sheet->setCellValue('C' . $currentRow, $item['qty'] ?? ($item['quantity'] ?? 0));
            $sheet->setCellValue('D' . $currentRow, $item['unit_of_measure'] ?? ($item['unit'] ?? 'Unité'));
            $sheet->setCellValue('E' . $currentRow, $item['unit_price_ht'] ?? ($item['price'] ?? ($item['unit_price'] ?? ($item['pu'] ?? 0))));
            
            // Formula for Total HT (C * E)
            $sheet->setCellValue('F' . $currentRow, '=C' . $currentRow . '*E' . $currentRow);

            // Alignments
            $sheet->getStyle('A' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('C' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('F' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Formats
            $sheet->getStyle('E' . $currentRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');
            $sheet->getStyle('F' . $currentRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');

            // Borders
            $sheet->getStyle('A' . $currentRow . ':F' . $currentRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            
            $sheet->getRowDimension($currentRow)->setRowHeight(20);
            $currentRow++;
        }

        // --- Totals Block ---
        $lastDataRow = $currentRow - 1;
        $totalsStartRow = $currentRow + 1;

        // Calculate exact TVA categories in PHP
        $tva9 = 0;
        $tva10 = 0;
        $tva20 = 0;
        foreach ($items as $item) {
            $qty = (float)($item['qty'] ?? ($item['quantity'] ?? 0));
            $pu = (float)($item['unit_price_ht'] ?? ($item['price'] ?? ($item['unit_price'] ?? ($item['pu'] ?? 0))));
            $vatRate = (float)(isset($item['vat_rate']) ? $item['vat_rate'] : 20);
            $lineHt = $qty * $pu;
            if ($vatRate == 9) {
                $tva9 += $lineHt * 0.09;
            } else if ($vatRate == 10) {
                $tva10 += $lineHt * 0.10;
            } else if ($vatRate == 20) {
                $tva20 += $lineHt * 0.20;
            }
        }

        // Total H.T
        $sheet->mergeCells('D' . $totalsStartRow . ':E' . $totalsStartRow);
        $sheet->setCellValue('D' . $totalsStartRow, 'Total H.T');
        $sheet->setCellValue('F' . $totalsStartRow, '=SUM(F14:F' . $lastDataRow . ')');

        // TVA 9%
        $tva9Row = $totalsStartRow + 1;
        $sheet->mergeCells('D' . $tva9Row . ':E' . $tva9Row);
        $sheet->setCellValue('D' . $tva9Row, 'TVA 9%');
        $sheet->setCellValue('F' . $tva9Row, $tva9);

        // TVA 10%
        $tva10Row = $totalsStartRow + 2;
        $sheet->mergeCells('D' . $tva10Row . ':E' . $tva10Row);
        $sheet->setCellValue('D' . $tva10Row, 'TVA 10%');
        $sheet->setCellValue('F' . $tva10Row, $tva10);

        // TVA 20%
        $tva20Row = $totalsStartRow + 3;
        $sheet->mergeCells('D' . $tva20Row . ':E' . $tva20Row);
        $sheet->setCellValue('D' . $tva20Row, 'TVA 20%');
        $sheet->setCellValue('F' . $tva20Row, $tva20);

        // Total T.T.C
        $ttcRow = $totalsStartRow + 4;
        $sheet->mergeCells('D' . $ttcRow . ':E' . $ttcRow);
        $sheet->setCellValue('D' . $ttcRow, 'Total T.T.C');
        $sheet->setCellValue('F' . $ttcRow, '=F' . $totalsStartRow . '+F' . $tva9Row . '+F' . $tva10Row . '+F' . $tva20Row);

        // Format Totals Box
        $totalBoxRange = 'D' . $totalsStartRow . ':F' . $ttcRow;
        $sheet->getStyle($totalBoxRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle($totalBoxRange)->getFont()->setBold(true)->setSize(9);
        
        $sheet->getStyle('F' . $totalsStartRow . ':F' . $ttcRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('F' . $totalsStartRow . ':F' . $ttcRow)->getNumberFormat()->setFormatCode('#,##0.00" MAD"');
        $sheet->getStyle('D' . $totalsStartRow . ':D' . $ttcRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Styling the TTC row
        $sheet->getStyle('D' . $ttcRow . ':F' . $ttcRow)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE);
        $sheet->getStyle('D' . $ttcRow . ':F' . $ttcRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFECFDF5');
        $sheet->getStyle('D' . $ttcRow . ':F' . $ttcRow)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_DARKGREEN));

        // --- Signatures ---
        $signatureRow = $ttcRow + 3;
        $sheet->setCellValue('A' . $signatureRow, 'Réf. Bon de Commande : ' . ($bl->reference_bc ?: 'Non spécifié'));
        $sheet->setCellValue('A' . ($signatureRow + 1), 'Date : ' . date('d/m/Y', strtotime($bl->date_bl)));
        $sheet->getStyle('A' . $signatureRow . ':A' . ($signatureRow + 1))->getFont()->setItalic(true)->setSize(8);

        $sheet->mergeCells('C' . ($signatureRow + 1) . ':D' . ($signatureRow + 1));
        $sheet->setCellValue('C' . ($signatureRow + 1), 'LE FOURNISSEUR');
        $sheet->getStyle('C' . ($signatureRow + 1))->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('C' . ($signatureRow + 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('E' . ($signatureRow + 1) . ':F' . ($signatureRow + 1));
        $sheet->setCellValue('E' . ($signatureRow + 1), 'LE CLIENT / OFPPT');
        $sheet->getStyle('E' . ($signatureRow + 1))->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle('E' . ($signatureRow + 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $writer = new Xlsx($spreadsheet);
        $filename = 'Bon_de_Livraison_' . str_replace('/', '_', $bl->numero_bl) . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
