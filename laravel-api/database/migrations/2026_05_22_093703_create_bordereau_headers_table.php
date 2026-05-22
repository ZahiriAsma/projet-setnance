<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bordereau_headers', function (Blueprint $table) {
            $table->id();
            $table->string('market_name')->nullable();
            $table->decimal('total_ht_min', 15, 2)->default(0);
            $table->decimal('total_ht_max', 15, 2)->default(0);
            $table->decimal('total_ttc_min', 15, 2)->default(0);
            $table->decimal('total_ttc_max', 15, 2)->default(0);
            $table->decimal('tva_7', 15, 2)->default(0);
            $table->decimal('tva_10', 15, 2)->default(0);
            $table->decimal('tva_14', 15, 2)->default(0);
            $table->decimal('tva_20', 15, 2)->default(0);
            $table->text('amount_in_letters')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bordereau_headers');
    }
};
