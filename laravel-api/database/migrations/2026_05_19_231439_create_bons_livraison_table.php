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
        Schema::create('bons_livraison', function (Blueprint $table) {
            $table->id();
            $table->string('numero_bl', 50)->unique();
            $table->date('date_bl');
            $table->string('fournisseur', 255)->nullable();
            $table->unsignedBigInteger('fournisseur_id')->nullable();
            $table->string('reference_bc', 255)->nullable();
            $table->string('client', 255)->nullable();
            $table->decimal('total_ht', 15, 2)->default(0.00);
            $table->decimal('total_tva', 15, 2)->default(0.00);
            $table->decimal('total_ttc', 15, 2)->default(0.00);
            $table->longText('items')->nullable();
            $table->string('statut')->default('En cours');
            $table->timestamps();

            $table->foreign('fournisseur_id')->references('id')->on('fournisseurs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bons_livraison');
    }
};

