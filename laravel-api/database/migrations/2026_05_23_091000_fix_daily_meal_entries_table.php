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
        // Drop the broken table if it exists
        Schema::dropIfExists('daily_meal_entries');

        Schema::create('daily_meal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marche_id')->constrained('marches')->cascadeOnDelete();
            $table->date('date');
            $table->enum('meal_type', ['breakfast', 'lunch', 'dinner']);
            $table->unsignedInteger('people_count')->default(0);
            // reference the existing bordereau table (items are stored there)
            $table->foreignId('product_id')->constrained('bordereau')->cascadeOnDelete();
            $table->string('designation');
            $table->string('unit');
            $table->decimal('r', 12, 4);
            $table->decimal('pu', 12, 4);
            $table->decimal('max_quantity', 12, 4);
            $table->unsignedInteger('max_people');
            $table->decimal('quantity', 12, 4)->nullable();
            $table->decimal('pur', 12, 6);
            $table->decimal('amount', 12, 4);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_meal_entries');
    }
};
