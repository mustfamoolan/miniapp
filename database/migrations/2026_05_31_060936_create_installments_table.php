<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('purpose');
            $table->decimal('original_price', 15, 2);
            $table->decimal('total_price_after_interest', 15, 2);
            $table->decimal('down_payment', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2);
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->integer('duration');
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
