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
        Schema::create('technical_sheets', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('meal_type');
            $table->foreignId('bordereau_id')->constrained('bordereau')->onDelete('cascade');
            $table->decimal('max_quantity', 10, 2);
            $table->integer('max_people');
            $table->integer('present_people');
            $table->decimal('calculated_quantity', 10, 2);
            $table->decimal('pu_r', 10, 2);
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('technical_sheets');
    }
};
