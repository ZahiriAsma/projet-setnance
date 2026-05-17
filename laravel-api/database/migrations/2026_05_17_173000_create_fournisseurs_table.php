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
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->string('raisonSociale');
            $table->string('ice');
            $table->string('patente')->nullable();
            $table->string('rc')->nullable();
            $table->string('if')->nullable();
            $table->string('cnss')->nullable();
            $table->string('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->string('rib')->nullable();
            $table->string('banque')->nullable();
            
            // UI support fields
            $table->string('categorie')->nullable()->default('Denrées alimentaires');
            $table->decimal('note', 3, 2)->default(5.00);
            $table->string('statut')->default('Actif'); // e.g., 'Actif', 'En retard'
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
