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
        Schema::create('bordereau', function (Blueprint $table) {
            $table->id();
            $table->string('price_number')->nullable();
            $table->text('service_description')->nullable();
            $table->string('unit_of_measure')->nullable();
            $table->decimal('unit_price_ht', 15, 2)->nullable();
            $table->decimal('vat_rate', 5, 2)->nullable();
            $table->decimal('minimum_quantity', 15, 2)->nullable();
            $table->decimal('maximum_quantity', 15, 2)->nullable();
            $table->decimal('minimum_total_price_ht', 15, 2)->nullable();
            $table->decimal('minimum_vat_amount', 15, 2)->nullable();
            $table->decimal('minimum_total_price_ttc', 15, 2)->nullable();
            $table->decimal('maximum_total_price_ht', 15, 2)->nullable();
            $table->decimal('maximum_vat_amount', 15, 2)->nullable();
            $table->decimal('maximum_total_price_ttc', 15, 2)->nullable();
            $table->decimal('current_quantity', 15, 2)->default(0);
            $table->decimal('alert_threshold', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bordereau');
    }
};
