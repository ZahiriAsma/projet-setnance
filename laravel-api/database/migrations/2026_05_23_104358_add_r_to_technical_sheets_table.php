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
        Schema::table('technical_sheets', function (Blueprint $table) {
            $table->decimal('r', 10, 4)->default(1.0000)->after('max_people');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('technical_sheets', function (Blueprint $table) {
            $table->dropColumn('r');
        });
    }
};
