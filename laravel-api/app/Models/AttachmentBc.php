<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttachmentBc extends Model
{
    use HasFactory;

    protected $table = 'attachments_bc';

    protected $fillable = [
        'bon_livraison_id',
        'numero_attachment',
        'budget',
        'exercice',
        'rubrique',
        'reference_marche',
        'lieu_livraison',
        'numero_article',
        'designation',
        'unite',
        'quantite',
        'taux_tva'
    ];

    public function bonLivraison()
    {
        return $this->belongsTo(BonLivraison::class, 'bon_livraison_id');
    }
}
