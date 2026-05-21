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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero_facture')->unique();
            $table->date('date_facture');
            $table->string('client')->nullable();
            $table->string('reference_bl')->nullable();
            $table->decimal('total_ht', 15, 2)->default(0);
            $table->decimal('tva', 15, 2)->default(0);
            $table->decimal('total_ttc', 15, 2)->default(0);
            $table->string('statut')->default('En cours');
            $table->text('conditions_generales')->nullable();
            $table->text('conditions_particulieres')->nullable();
            $table->timestamps();
        });

        Schema::create('facture_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->onDelete('cascade');
            $table->integer('num_article')->nullable();
            $table->string('designation');
            $table->string('unite')->nullable();
            $table->decimal('qte', 10, 2)->default(0);
            $table->decimal('pu_ht', 15, 2)->default(0);
            $table->decimal('taux_tva', 5, 2)->default(20);
            $table->decimal('tva', 15, 2)->default(0);
            $table->decimal('total_ht', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facture_articles');
        Schema::dropIfExists('factures');
    }
};
