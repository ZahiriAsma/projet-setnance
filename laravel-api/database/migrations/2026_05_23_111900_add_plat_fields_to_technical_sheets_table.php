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
        Schema::table('technical_sheets', function (Blueprint $table) {
            $table->string('plat_name')->nullable()->after('meal_type');
            $table->decimal('quantity_per_person', 10, 4)->default(0)->after('bordereau_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('technical_sheets', function (Blueprint $table) {
            $table->dropColumn(['plat_name', 'quantity_per_person']);
        });
    }
};
