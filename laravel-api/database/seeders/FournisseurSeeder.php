<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Fournisseur;

class FournisseurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fournisseurs = [
            [
                'raisonSociale' => 'DISMA Maroc',
                'ice' => '001234567890123',
                'patente' => '12345678',
                'rc' => '98765',
                'if' => '45678901',
                'cnss' => '11223344',
                'adresse' => 'Denrées alimentaires · Casablanca',
                'telephone' => '0522123456',
                'rib' => '011223344556677889900112',
                'banque' => 'Attijariwafa Bank',
                'categorie' => 'Denrées alimentaires',
                'note' => 4.5,
                'statut' => 'Actif',
            ],
            [
                'raisonSociale' => 'AGRAM Casablanca',
                'ice' => '002234567890124',
                'patente' => '22345678',
                'rc' => '88765',
                'if' => '55678901',
                'cnss' => '22223344',
                'adresse' => 'Produits hygiéniques · Casa',
                'telephone' => '0522223456',
                'rib' => '022223344556677889900223',
                'banque' => 'BCP',
                'categorie' => 'Produits hygiéniques',
                'note' => 4.0,
                'statut' => 'Actif',
            ],
            [
                'raisonSociale' => 'SOPROPA',
                'ice' => '003234567890125',
                'patente' => '32345678',
                'rc' => '78765',
                'if' => '65678901',
                'cnss' => '33223344',
                'adresse' => 'Fruits & légumes · Rabat',
                'telephone' => '0537323456',
                'rib' => '033223344556677889900334',
                'banque' => 'BMCE',
                'categorie' => 'Fruits & légumes',
                'note' => 3.5,
                'statut' => 'En retard',
            ]
        ];

        foreach ($fournisseurs as $fournisseur) {
            Fournisseur::updateOrCreate(
                ['raisonSociale' => $fournisseur['raisonSociale']],
                $fournisseur
            );
        }
    }
}
