<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonLivraison extends Model
{
    use HasFactory;

    protected $table = 'bons_livraison';

    protected $fillable = [
        'numero_bl',
        'date_bl',
        'fournisseur',
        'fournisseur_id',
        'reference_bc',
        'marche_id',
        'client',
        'total_ht',
        'total_tva',
        'total_ttc',
        'type',
        'items',
        'statut'
    ];

    protected $casts = [
        'items' => 'array'
    ];

    public function fournisseurModel()
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    public function attachmentsBc()
    {
        return $this->hasMany(AttachmentBc::class, 'bon_livraison_id');
    }

    public function marche()
    {
        return $this->belongsTo(Marche::class, 'marche_id');
    }
}
