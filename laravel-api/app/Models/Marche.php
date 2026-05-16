<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Marche extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulaire',
        'id_fournisseur',
        'date_debut',
        'date_fin',
        'budget',
        'consomme',
        'statut'
    ];
}
