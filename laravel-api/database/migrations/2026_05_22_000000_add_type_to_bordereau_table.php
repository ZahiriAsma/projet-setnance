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
        Schema::table('bordereau', function (Blueprint $table) {
            $table->string('type')->nullable()->after('price_number')->comment('Type de bordereau: gaz, pain, etc.');
            $table->string('marche_type')->nullable()->after('type')->comment('Type de marche pour categoriser les produits');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            $table->dropColumn(['type', 'marche_type']);
        });
    }
};
