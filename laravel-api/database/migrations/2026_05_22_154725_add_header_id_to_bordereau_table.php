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
        // Nettoyer la table bordereau existante pour éviter les conflits de clés étrangères
        \Illuminate\Support\Facades\DB::table('bordereau')->truncate();

        Schema::table('bordereau', function (Blueprint $table) {
            $table->foreignId('bordereau_header_id')->constrained('bordereau_headers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bordereau', function (Blueprint $table) {
            $table->dropForeign(['bordereau_header_id']);
            $table->dropColumn('bordereau_header_id');
        });
    }
};
