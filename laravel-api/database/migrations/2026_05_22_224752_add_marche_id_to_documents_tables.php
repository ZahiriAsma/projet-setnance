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
        Schema::table('bordereau_headers', function (Blueprint $table) {
            $table->unsignedBigInteger('marche_id')->nullable();
            $table->foreign('marche_id')->references('id')->on('marches')->onDelete('cascade');
        });

        Schema::table('bon_commandes', function (Blueprint $table) {
            $table->unsignedBigInteger('marche_id')->nullable();
            $table->foreign('marche_id')->references('id')->on('marches')->onDelete('cascade');
        });

        Schema::table('bons_livraison', function (Blueprint $table) {
            $table->unsignedBigInteger('marche_id')->nullable();
            $table->foreign('marche_id')->references('id')->on('marches')->onDelete('cascade');
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->unsignedBigInteger('marche_id')->nullable();
            $table->foreign('marche_id')->references('id')->on('marches')->onDelete('cascade');
        });

        Schema::table('attachments_bc', function (Blueprint $table) {
            $table->unsignedBigInteger('marche_id')->nullable();
            $table->foreign('marche_id')->references('id')->on('marches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bordereau_headers', function (Blueprint $table) {
            $table->dropForeign(['marche_id']);
            $table->dropColumn('marche_id');
        });

        Schema::table('bon_commandes', function (Blueprint $table) {
            $table->dropForeign(['marche_id']);
            $table->dropColumn('marche_id');
        });

        Schema::table('bons_livraison', function (Blueprint $table) {
            $table->dropForeign(['marche_id']);
            $table->dropColumn('marche_id');
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->dropForeign(['marche_id']);
            $table->dropColumn('marche_id');
        });

        Schema::table('attachments_bc', function (Blueprint $table) {
            $table->dropForeign(['marche_id']);
            $table->dropColumn('marche_id');
        });
    }
};
