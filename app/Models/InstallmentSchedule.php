<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_id',
        'installment_number',
        'amount_due',
        'due_date',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'amount_due' => 'decimal:2',
    ];

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }
}
