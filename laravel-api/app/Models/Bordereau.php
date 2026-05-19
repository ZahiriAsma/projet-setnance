<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bordereau extends Model
{
    use HasFactory;

    protected $table = 'bordereau';

    protected $fillable = [
        'price_number',
        'service_description',
        'unit_of_measure',
        'unit_price_ht',
        'vat_rate',
        'minimum_quantity',
        'maximum_quantity',
        'minimum_total_price_ht',
        'minimum_vat_amount',
        'minimum_total_price_ttc',
        'maximum_total_price_ht',
        'maximum_vat_amount',
        'maximum_total_price_ttc',
        'current_quantity',
        'alert_threshold'
    ];
}
