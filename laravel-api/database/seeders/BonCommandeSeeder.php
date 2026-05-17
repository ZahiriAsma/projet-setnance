<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BonCommande;
use App\Models\Fournisseur;

class BonCommandeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fournisseur = Fournisseur::first();
        $fournisseurId = $fournisseur ? $fournisseur->id : null;

        BonCommande::create([
            'numeroBC' => 'BC-2024-089-001',
            'dateEmission' => '2024-01-15',
            'budget' => 'Budget de Fonctionnement',
            'exercice' => 2024,
            'rubrique' => 'Alimentation générale',
            'referenceMarcheCadre' => 'MC-2023-01',
            'lieuLivraison' => 'Internat OFPPT Casablanca',
            'conditionsGenerales' => 'Livraison sous 5 jours. Paiement à 60 jours.',
            'conditionsParticulieres' => 'Produits frais uniquement.',
            'montantHT' => 27650.00,
            'montantTVA' => 5530.00,
            'montantTTC' => 33180.00,
            'statut' => 'Validé',
            'fournisseur_id' => $fournisseurId,
        ]);

        BonCommande::create([
            'numeroBC' => 'BC-2024-089-002',
            'dateEmission' => '2024-01-20',
            'budget' => 'Budget d\'Investissement',
            'exercice' => 2024,
            'rubrique' => 'Produits Laitiers',
            'referenceMarcheCadre' => 'MC-2023-02',
            'lieuLivraison' => 'Internat OFPPT Casablanca',
            'conditionsGenerales' => 'Livraison sous 3 jours.',
            'conditionsParticulieres' => 'Emballage isotherme obligatoire.',
            'montantHT' => 12400.00,
            'montantTVA' => 2480.00,
            'montantTTC' => 14880.00,
            'statut' => 'En cours',
            'fournisseur_id' => $fournisseurId,
        ]);

        BonCommande::create([
            'numeroBC' => 'BC-2024-089-003',
            'dateEmission' => '2024-02-05',
            'budget' => 'Budget de Fonctionnement',
            'exercice' => 2024,
            'rubrique' => 'Viandes et Volailles',
            'referenceMarcheCadre' => 'MC-2023-03',
            'lieuLivraison' => 'Internat OFPPT Casablanca',
            'conditionsGenerales' => 'Respect strict de la chaîne de froid.',
            'conditionsParticulieres' => 'Certificat Halal requis.',
            'montantHT' => 45000.00,
            'montantTVA' => 9000.00,
            'montantTTC' => 54000.00,
            'statut' => 'Livré',
            'fournisseur_id' => $fournisseurId,
        ]);
    }
}
