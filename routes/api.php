<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\TelegramBotController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/telegram/webhook', [TelegramBotController::class, 'handleWebhook']);
Route::get('/telegram/setup', [TelegramBotController::class, 'setupBot']);

Route::middleware('telegram.user')->prefix('app')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\TelegramAppController::class, 'getDashboardSummary']);
    
    Route::get('/customers/{id}', [\App\Http\Controllers\TelegramAppController::class, 'getCustomerProfile']);
    Route::post('/customers', [\App\Http\Controllers\TelegramAppController::class, 'storeCustomer']);
    
    Route::post('/debts', [\App\Http\Controllers\TelegramAppController::class, 'storeDebt']);
    Route::post('/debts/{id}/pay', [\App\Http\Controllers\TelegramAppController::class, 'payDebt']);
    
    Route::post('/installments', [\App\Http\Controllers\TelegramAppController::class, 'storeInstallment']);
    Route::post('/installments/schedules/{id}/pay', [\App\Http\Controllers\TelegramAppController::class, 'payInstallmentRow']);
});
