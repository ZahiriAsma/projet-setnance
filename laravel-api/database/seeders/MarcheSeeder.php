<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MarcheSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Marche::create([
            'titulaire' => 'Denrées alimentaires',
            'id_fournisseur' => 1,
            'date_debut' => '2024-01-01',
            'date_fin' => '2025-01-01',
            'budget' => 128000,
            'consomme' => 74,
            'statut' => 'Actif'
        ]);

        \App\Models\Marche::create([
            'titulaire' => 'Produits hygiéniques',
            'id_fournisseur' => 2,
            'date_debut' => '2024-02-15',
            'date_fin' => '2025-02-15',
            'budget' => 44500,
            'consomme' => 38,
            'statut' => 'En cours'
        ]);

        \App\Models\Marche::create([
            'titulaire' => 'Matériel d\'entretien',
            'id_fournisseur' => 3,
            'date_debut' => '2024-03-20',
            'date_fin' => '2025-03-20',
            'budget' => 22800,
            'consomme' => 12,
            'statut' => 'Préparation'
        ]);
    }
}
