<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyMealEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'marche_id',
        'date',
        'meal_type',
        'people_count',
        'product_id',
        'designation',
        'unit',
        'r',
        'pu',
        'max_quantity',
        'max_people',
        'quantity',
        'pur',
        'amount',
    ];

    protected $casts = [
        'date' => 'date',
        'quantity' => 'float',
        'pur' => 'float',
        'amount' => 'float',
        'people_count' => 'integer',
        'max_people' => 'integer',
    ];

    public function marche()
    {
        return $this->belongsTo(Marche::class);
    }

    public function product()
    {
        return $this->belongsTo(BordereauItem::class, 'product_id');
    }
}
?>
