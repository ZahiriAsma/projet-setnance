<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function articles()
    {
        return $this->hasMany(FactureArticle::class);
    }

    public function marche()
    {
        return $this->belongsTo(Marche::class, 'marche_id');
    }
}
