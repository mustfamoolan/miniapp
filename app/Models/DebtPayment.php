<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DebtPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'debt_id',
        'amount_paid',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount_paid' => 'decimal:2',
    ];

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }
}
