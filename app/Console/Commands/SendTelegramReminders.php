<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Debt;
use App\Models\InstallmentSchedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendTelegramReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily Telegram reminders for due and overdue debts and installments.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today()->toDateString();
        $threeDaysAgo = Carbon::today()->subDays(3)->toDateString();

        $botToken = config('services.telegram.bot_token');

        if (empty($botToken)) {
            $this->error('Telegram Bot Token is missing.');
            return;
        }

        $apiUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";

        // 1. Process Debts
        $debts = Debt::with('customer.user')
            ->where('status', 'pending')
            ->whereIn('due_date', [$today, $threeDaysAgo])
            ->get();

        foreach ($debts as $debt) {
            $telegramId = $debt->customer->user->telegram_id ?? null;
            if (!$telegramId) continue;

            $isOverdue = ($debt->due_date === $threeDaysAgo);
            $typeLabel = $isOverdue ? '⚠️ متأخر: دين عام' : '📅 استحقاق اليوم: دين عام';
            
            $message = "{$typeLabel}\n\nالزبون: {$debt->customer->name}\nالمبلغ: {$debt->amount} د.ع\nالوصف: {$debt->purpose}";

            $this->sendTelegramMessage($apiUrl, $telegramId, $message);
        }

        // 2. Process Installment Schedules
        $schedules = InstallmentSchedule::with('installment.customer.user')
            ->where('status', 'unpaid')
            ->whereIn('due_date', [$today, $threeDaysAgo])
            ->get();

        foreach ($schedules as $schedule) {
            $telegramId = $schedule->installment->customer->user->telegram_id ?? null;
            if (!$telegramId) continue;

            $isOverdue = ($schedule->due_date === $threeDaysAgo);
            $typeLabel = $isOverdue ? '⚠️ متأخر: قسط مستحق' : '📅 استحقاق اليوم: قسط';
            
            $customerName = $schedule->installment->customer->name;
            $purpose = $schedule->installment->purpose;
            
            $message = "{$typeLabel}\n\nالزبون: {$customerName}\nالمبلغ: {$schedule->amount_due} د.ع\nرقم القسط: {$schedule->installment_number}\nبخصوص: {$purpose}";

            $this->sendTelegramMessage($apiUrl, $telegramId, $message);
        }

        $this->info('Reminders sent successfully.');
    }

    private function sendTelegramMessage($apiUrl, $chatId, $text)
    {
        try {
            $response = Http::post($apiUrl, [
                'chat_id' => $chatId,
                'text' => $text,
            ]);

            if ($response->failed()) {
                Log::error("Failed to send reminder to {$chatId}: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Exception sending reminder to {$chatId}: " . $e->getMessage());
        }
    }
}
