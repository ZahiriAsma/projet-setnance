<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonCommande extends Model
{
    use HasFactory;

    protected $table = 'bon_commandes';

    protected $fillable = [
        'numeroBC',
        'dateEmission',
        'budget',
        'exercice',
        'rubrique',
        'referenceMarcheCadre',
        'lieuLivraison',
        'conditionsGenerales',
        'conditionsParticulieres',
        'montantHT',
        'montantTVA',
        'montantTTC',
        'statut',
        'type',
        'fournisseur_id',
        'items'
    ];

    protected $casts = [
        'items' => 'array'
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }
}
