<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TechnicalSheet extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
        'max_quantity' => 'decimal:2',
        'calculated_quantity' => 'decimal:2',
        'pu_r' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function bordereau()
    {
        return $this->belongsTo(Bordereau::class);
    }
}
