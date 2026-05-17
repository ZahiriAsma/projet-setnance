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
        Schema::create('daily_menus', function (Blueprint $table) {
            $table->id();
            $table->string('jour');
            $table->text('petit_dejeuner');
            $table->text('dejeuner');
            $table->text('diner');
            $table->integer('residents')->default(450);
            $table->string('time_pd')->default('7h00 - 8h00');
            $table->string('time_dej')->default('12h30 - 13h30');
            $table->string('time_din')->default('19h00 - 20h00');
            $table->integer('kcal_pd')->default(620);
            $table->integer('kcal_dej')->default(820);
            $table->integer('kcal_din')->default(580);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_menus');
    }
};
