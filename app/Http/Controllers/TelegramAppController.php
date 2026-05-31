<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Debt;
use App\Models\Installment;
use App\Models\InstallmentSchedule;
use Carbon\Carbon;

class TelegramAppController extends Controller
{
    /**
     * Get the unified Dashboard Summary for the active Telegram User.
     */
    public function getDashboardSummary(Request $request)
    {
        $user = $request->user(); // Injected by EnsureTelegramUser middleware

        // 1. Eager load customers with their pending debts and active installments
        $customers = $user->customers()->with([
            'debts' => fn($q) => $q->where('status', 'pending'),
            'installments' => fn($q) => $q->where('status', 'active')->with(['schedules' => fn($sq) => $sq->where('status', 'unpaid')])
        ])->get();

        $totalPendingDebts = 0;
        $totalRemainingInstallments = 0;
        $overdueCount = 0;
        $upcomingCount = 0;

        $today = Carbon::today();
        $next7Days = Carbon::today()->addDays(7);

        $customerSummary = [];

        foreach ($customers as $customer) {
            $customerTotalDebts = $customer->debts->sum('amount');
            
            $customerRemainingInstallments = 0;
            foreach ($customer->installments as $installment) {
                $installmentRemaining = $installment->schedules->sum('amount_due');
                $customerRemainingInstallments += $installmentRemaining;

                // Check schedules for overdue/upcoming
                foreach ($installment->schedules as $schedule) {
                    $dueDate = Carbon::parse($schedule->due_date);
                    if ($dueDate->isBefore($today)) {
                        $overdueCount++;
                    } elseif ($dueDate->isBetween($today, $next7Days, true)) {
                        $upcomingCount++;
                    }
                }
            }

            // Check debts for overdue/upcoming
            foreach ($customer->debts as $debt) {
                if ($debt->due_date) {
                    $dueDate = Carbon::parse($debt->due_date);
                    if ($dueDate->isBefore($today)) {
                        $overdueCount++;
                    } elseif ($dueDate->isBetween($today, $next7Days, true)) {
                        $upcomingCount++;
                    }
                }
            }

            $totalPendingDebts += $customerTotalDebts;
            $totalRemainingInstallments += $customerRemainingInstallments;

            $customerSummary[] = [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'total_due' => $customerTotalDebts + $customerRemainingInstallments,
            ];
        }

        return response()->json([
            'total_pending_debts' => $totalPendingDebts,
            'total_remaining_installments' => $totalRemainingInstallments,
            'total_receivables' => $totalPendingDebts + $totalRemainingInstallments,
            'overdue_count' => $overdueCount,
            'upcoming_count' => $upcomingCount,
            'customers' => $customerSummary,
        ]);
    }

    /**
     * Get full details of a specific customer.
     */
    public function getCustomerProfile(Request $request, $id)
    {
        $customer = $request->user()->customers()->with([
            'debts',
            'installments.schedules'
        ])->findOrFail($id);

        return response()->json($customer);
    }

    /**
     * Store a new Customer.
     */
    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = $request->user()->customers()->create($validated);
        return response()->json($customer, 201);
    }

    /**
     * Store a new single Debt.
     */
    public function storeDebt(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0',
            'purpose' => 'nullable|string|max:255',
            'due_date' => 'nullable|date',
        ]);

        // Ensure customer belongs to user
        $customer = $request->user()->customers()->findOrFail($validated['customer_id']);

        $debt = $customer->debts()->create($validated);
        return response()->json($debt, 201);
    }

    /**
     * Pay a single Debt.
     */
    public function payDebt(Request $request, $id)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
        ]);

        // Authorization checks omitted for brevity (should ideally check user -> customer -> debt)
        $debt = Debt::findOrFail($id);
        
        $debt->payments()->create([
            'amount_paid' => $validated['amount_paid'],
            'paid_at' => now(),
        ]);

        // For simplicity, any payment marks it as paid completely. In real app, calculate sum.
        $debt->update(['status' => 'paid']);

        return response()->json(['status' => 'success', 'debt' => $debt]);
    }

    /**
     * Create an Installment Plan and automatically generate schedules.
     */
    public function storeInstallment(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'purpose' => 'required|string|max:255',
            'original_price' => 'required|numeric|min:0',
            'total_price_after_interest' => 'required|numeric|min:0',
            'down_payment' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'frequency' => 'required|in:daily,weekly,monthly',
        ]);

        $customer = $request->user()->customers()->findOrFail($validated['customer_id']);

        $remainingAmount = $validated['total_price_after_interest'] - $validated['down_payment'];
        $validated['remaining_amount'] = $remainingAmount;

        $installment = $customer->installments()->create($validated);

        $portion = round($remainingAmount / $validated['duration'], 2);
        
        // Handle remainder precision
        $totalScheduled = 0;
        
        $dueDate = Carbon::today();
        
        for ($i = 1; $i <= $validated['duration']; $i++) {
            if ($validated['frequency'] === 'daily') {
                $dueDate->addDay();
            } elseif ($validated['frequency'] === 'weekly') {
                $dueDate->addWeek();
            } elseif ($validated['frequency'] === 'monthly') {
                $dueDate->addMonth();
            }

            $amountDue = ($i === $validated['duration']) ? ($remainingAmount - $totalScheduled) : $portion;
            $totalScheduled += $amountDue;

            $installment->schedules()->create([
                'installment_number' => $i,
                'amount_due' => $amountDue,
                'due_date' => $dueDate->toDateString(),
            ]);
        }

        return response()->json($installment->load('schedules'), 201);
    }

    /**
     * Mark an Installment Schedule row as paid.
     */
    public function payInstallmentRow(Request $request, $id)
    {
        $schedule = InstallmentSchedule::findOrFail($id);
        
        if ($schedule->status === 'paid') {
            return response()->json(['error' => 'Already paid'], 400);
        }

        $schedule->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Check if all schedules are paid to mark parent as completed
        $installment = $schedule->installment;
        $unpaidCount = $installment->schedules()->where('status', 'unpaid')->count();
        
        if ($unpaidCount === 0) {
            $installment->update(['status' => 'completed']);
        }

        return response()->json(['status' => 'success', 'schedule' => $schedule]);
    }
}
