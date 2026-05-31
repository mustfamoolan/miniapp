<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'purpose',
        'original_price',
        'total_price_after_interest',
        'down_payment',
        'remaining_amount',
        'frequency',
        'duration',
        'status',
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'total_price_after_interest' => 'decimal:2',
        'down_payment' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function schedules()
    {
        return $this->hasMany(InstallmentSchedule::class);
    }
}
