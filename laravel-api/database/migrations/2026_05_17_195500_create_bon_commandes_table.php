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
        Schema::create('bon_commandes', function (Blueprint $table) {
            $table->id();
            $table->string('numeroBC');
            $table->date('dateEmission');

            $table->string('budget')->nullable();
            $table->integer('exercice')->nullable();
            $table->string('rubrique')->nullable();

            $table->string('referenceMarcheCadre')->nullable();
            $table->string('lieuLivraison')->nullable();

            $table->text('conditionsGenerales')->nullable();
            $table->text('conditionsParticulieres')->nullable();

            $table->decimal('montantHT', 15, 2)->default(0);
            $table->decimal('montantTVA', 15, 2)->default(0);
            $table->decimal('montantTTC', 15, 2)->default(0);

            $table->string('statut')->default('En cours');

            $table->unsignedBigInteger('fournisseur_id')->nullable();
            $table->foreign('fournisseur_id')->references('id')->on('fournisseurs')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bon_commandes');
    }
};
