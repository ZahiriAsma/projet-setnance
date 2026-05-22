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
        // Ajouter type aux bons de commande
        if (Schema::hasTable('bon_commandes')) {
            Schema::table('bon_commandes', function (Blueprint $table) {
                if (!Schema::hasColumn('bon_commandes', 'type')) {
                    $table->string('type')->nullable()->comment('Type de produit: gaz, pain, etc.');
                }
            });
        }

        // Ajouter type aux bons de livraison
        if (Schema::hasTable('bons_livraison')) {
            Schema::table('bons_livraison', function (Blueprint $table) {
                if (!Schema::hasColumn('bons_livraison', 'type')) {
                    $table->string('type')->nullable()->comment('Type de produit: gaz, pain, etc.');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('bon_commandes')) {
            Schema::table('bon_commandes', function (Blueprint $table) {
                if (Schema::hasColumn('bon_commandes', 'type')) {
                    $table->dropColumn('type');
                }
            });
        }

        if (Schema::hasTable('bons_livraison')) {
            Schema::table('bons_livraison', function (Blueprint $table) {
                if (Schema::hasColumn('bons_livraison', 'type')) {
                    $table->dropColumn('type');
                }
            });
        }
    }
};
