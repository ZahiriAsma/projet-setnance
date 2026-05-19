<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bordereau;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;

class BordereauController extends Controller
{
    public function index()
    {
        return response()->json(Bordereau::orderBy('price_number', 'asc')->get());
    }

    private function cleanString($str) {
        $str = mb_strtolower(trim($str));
        $accents = [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
            'ç' => 'c',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ñ' => 'n',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ý' => 'y', 'ÿ' => 'y'
        ];
        $str = strtr($str, $accents);
        return preg_replace('/[^a-z0-9]/', '', $str);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            if (empty($rows)) {
                return response()->json(['error' => 'Le fichier Excel est vide.'], 422);
            }

            // Scan the first 10 rows to build a robust column mapping and find data start index
            $mapping = [];
            $lastHeaderRowIndex = null;

            for ($rowIndex = 0; $rowIndex < min(10, count($rows)); $rowIndex++) {
                if (!isset($rows[$rowIndex])) continue;
                $row = $rows[$rowIndex];

                // If the first cell of the row is numeric, it is a data row. Stop header scanning immediately!
                $firstCell = reset($row);
                if ($firstCell !== null && is_numeric(trim($firstCell))) {
                    break;
                }

                $matchedInRow = false;
                $headerMatchesCount = 0;

                foreach ($row as $colLetter => $cellValue) {
                    if ($cellValue === null || $cellValue === '') continue;
                    $valClean = $this->cleanString($cellValue);

                    // Check if this looks like a header cell
                    $isHeaderKeyword = false;
                    if (
                        str_contains($valClean, 'prix') ||
                        str_contains($valClean, 'designation') ||
                        str_contains($valClean, 'unite') ||
                        str_contains($valClean, 'tva') ||
                        str_contains($valClean, 'quantite') ||
                        str_contains($valClean, 'qte') ||
                        str_contains($valClean, 'description') ||
                        str_contains($valClean, 'prestation') ||
                        str_contains($valClean, 'minimale') ||
                        str_contains($valClean, 'maximale') ||
                        str_contains($valClean, 'unitaire')
                    ) {
                        $isHeaderKeyword = true;
                        $headerMatchesCount++;
                    }

                    if ($isHeaderKeyword) {
                        $matchedInRow = true;

                        // Map fields if not already set
                        if (!isset($mapping['price_number'])) {
                            if (str_contains($valClean, 'prix') && (str_contains($valClean, 'n') || str_contains($valClean, 'num') || str_contains($valClean, 'no') || str_contains($valClean, 'code')) && !str_contains($valClean, 'unitaire') && !str_contains($valClean, 'total')) {
                                $mapping['price_number'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['service_description'])) {
                            if (str_contains($valClean, 'designation') || str_contains($valClean, 'description') || str_contains($valClean, 'prestation')) {
                                $mapping['service_description'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['unit_of_measure'])) {
                            if (str_contains($valClean, 'unite') || str_contains($valClean, 'um') || str_contains($valClean, 'mesure')) {
                                $mapping['unit_of_measure'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['vat_rate'])) {
                            if (str_contains($valClean, 'tva') && !str_contains($valClean, 'montant') && !str_contains($valClean, 'total') && !str_contains($valClean, 'prix')) {
                                $mapping['vat_rate'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['unit_price_ht'])) {
                            if (str_contains($valClean, 'unitaire') || str_contains($valClean, 'pu') || $valClean === 'prix') {
                                $mapping['unit_price_ht'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['minimum_quantity'])) {
                            if (str_contains($valClean, 'min') && !str_contains($valClean, 'total') && !str_contains($valClean, 'prix') && !str_contains($valClean, 'tva') && !str_contains($valClean, 'hors')) {
                                $mapping['minimum_quantity'] = $colLetter;
                            }
                        }
                        if (!isset($mapping['maximum_quantity'])) {
                            if (str_contains($valClean, 'max') && !str_contains($valClean, 'total') && !str_contains($valClean, 'prix') && !str_contains($valClean, 'tva') && !str_contains($valClean, 'hors')) {
                                $mapping['maximum_quantity'] = $colLetter;
                            }
                        }
                    }
                }

                // A row is only considered a header row if it matches at least 2 distinct keywords
                if ($matchedInRow && $headerMatchesCount >= 2) {
                    $lastHeaderRowIndex = $rowIndex;
                }
            }

            // Fallback sequential mapping if dynamic headers mapped less than 4 columns
            if (count($mapping) < 4) {
                $mapping = [];
                $firstRow = reset($rows);
                $letters = array_keys($firstRow);
                $cols = [
                    'price_number', 'service_description', 'unit_of_measure', 'minimum_quantity', 'maximum_quantity', 'vat_rate', 'unit_price_ht'
                ];
                foreach ($cols as $idx => $colName) {
                    if (isset($letters[$idx])) {
                        $mapping[$colName] = $letters[$idx];
                    }
                }
            }

            $importedData = [];
            $processedPriceNumbers = [];

            DB::beginTransaction();

            // Delete all old bordereau data
            Bordereau::query()->delete();

            $startIndex = $lastHeaderRowIndex !== null ? $lastHeaderRowIndex + 1 : 0;
            $rowNumber = 0;

            foreach ($rows as $index => $row) {
                if ($index < $startIndex) {
                    continue;
                }

                $priceNumber = isset($mapping['price_number']) ? trim($row[$mapping['price_number']]) : null;
                $description = isset($mapping['service_description']) ? trim($row[$mapping['service_description']]) : null;

                // Skip completely empty rows
                if (empty($priceNumber) && empty($description)) {
                    continue;
                }

                // Validation: Ignore rows where price number or description is empty
                if (empty($priceNumber) || empty($description)) {
                    continue;
                }

                // Prevent duplicate entries (price number must be unique in this import)
                if (in_array($priceNumber, $processedPriceNumbers)) {
                    continue; 
                }

                $processedPriceNumbers[] = $priceNumber;

                $parseNumber = function($val) {
                    if ($val === null || $val === '') return 0.0;
                    $val = str_replace(',', '.', trim($val));
                    $val = str_replace(' ', '', $val);
                    preg_match('/-?[0-9]+(\.[0-9]+)?/', $val, $matches);
                    if (!empty($matches[0])) {
                        return floatval($matches[0]);
                    }
                    return 0.0;
                };

                $unitPrice = isset($mapping['unit_price_ht']) ? $parseNumber($row[$mapping['unit_price_ht']]) : 0.0;
                $vatRate = isset($mapping['vat_rate']) ? $parseNumber($row[$mapping['vat_rate']]) : 0.0;
                $minQty = isset($mapping['minimum_quantity']) ? $parseNumber($row[$mapping['minimum_quantity']]) : 0.0;
                $maxQty = isset($mapping['maximum_quantity']) ? $parseNumber($row[$mapping['maximum_quantity']]) : 0.0;

                // Enforce non-negative logical constraints
                if ($unitPrice < 0 || $vatRate < 0 || $minQty < 0 || $maxQty < 0) {
                    continue;
                }

                // Automatic calculation formulas
                $minTotalHt = $minQty * $unitPrice;
                $minVat = $minTotalHt * ($vatRate / 100.0);
                $minTotalTtc = $minTotalHt + $minVat;

                $maxTotalHt = $maxQty * $unitPrice;
                $maxVat = $maxTotalHt * ($vatRate / 100.0);
                $maxTotalTtc = $maxTotalHt + $maxVat;

                $record = [
                    'price_number' => $priceNumber,
                    'service_description' => $description,
                    'unit_of_measure' => isset($mapping['unit_of_measure']) ? trim($row[$mapping['unit_of_measure']]) : null,
                    'unit_price_ht' => $unitPrice,
                    'vat_rate' => $vatRate,
                    'minimum_quantity' => $minQty,
                    'maximum_quantity' => $maxQty,
                    'minimum_total_price_ht' => $minTotalHt,
                    'minimum_vat_amount' => $minVat,
                    'minimum_total_price_ttc' => $minTotalTtc,
                    'maximum_total_price_ht' => $maxTotalHt,
                    'maximum_vat_amount' => $maxVat,
                    'maximum_total_price_ttc' => $maxTotalTtc,
                    'current_quantity' => 0.0,
                    'alert_threshold' => 0.0,
                ];

                $created = Bordereau::create($record);
                $importedData[] = $created;
                $rowNumber++;
            }

            DB::commit();

            return response()->json([
                'message' => "Importation réussie ! {$rowNumber} lignes ont été importées.",
                'data' => $importedData
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error("Import exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'error' => "Une erreur s'est produite lors de la lecture du fichier : " . $e->getMessage()
            ], 500);
        }
    }
}
