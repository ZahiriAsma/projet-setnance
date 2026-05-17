<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_menus', function (Blueprint $table) {
            $table->date('date')->nullable()->after('jour');
            $table->unique('date');
        });
    }

    public function down(): void
    {
        Schema::table('daily_menus', function (Blueprint $table) {
            $table->dropUnique(['date']);
            $table->dropColumn('date');
        });
    }
};
