<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BordereauHeader extends Model
{
    use HasFactory;

    protected $fillable = [
        'market_name',
        'total_ht_min',
        'total_ht_max',
        'total_ttc_min',
        'total_ttc_max',
        'tva_7',
        'tva_10',
        'tva_14',
        'tva_20',
        'amount_in_letters',
    ];

    public function bordereaux()
    {
        return $this->hasMany(Bordereau::class, 'bordereau_header_id');
    }
}
