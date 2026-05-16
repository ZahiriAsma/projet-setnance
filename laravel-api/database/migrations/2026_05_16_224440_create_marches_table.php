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
        Schema::create('marches', function (Blueprint $table) {
            $table->id();
            $table->string('titulaire');
            $table->unsignedBigInteger('id_fournisseur');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('budget', 15, 2)->default(0);
            $table->decimal('consomme', 15, 2)->default(0);
            $table->string('statut')->default('Préparation');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marches');
    }
};
