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
        if (Schema::hasTable('attachments_bc')) {
            return;
        }
        Schema::create('attachments_bc', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bon_livraison_id')->nullable();
            
            $table->integer('numero_attachment');
            $table->string('budget');
            $table->year('exercice');
            $table->string('rubrique');
            $table->string('reference_marche')->nullable();
            $table->string('lieu_livraison');
            $table->integer('numero_article');
            $table->text('designation');
            $table->string('unite');
            $table->integer('quantite');
            $table->decimal('taux_tva', 5, 2);
            $table->timestamps();

            $table->foreign('bon_livraison_id')->references('id')->on('bons_livraison')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments_bc');
    }
};
