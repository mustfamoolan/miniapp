<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotController extends Controller
{
    /**
     * Handle incoming Telegram Webhook updates.
     */
    public function handleWebhook(Request $request)
    {
        $update = $request->all();

        // Log incoming update
        Log::info('Telegram Webhook Update:', $update);

        // Process message
        if (isset($update['message'])) {
            $message = $update['message'];
            $chatId = $message['chat']['id'] ?? null;
            $text = $message['text'] ?? '';

            if ($chatId && $text === '/start') {
                $replyText = "Welcome! 👋\n\nClick the button below to open the Mini App and start exploring!";

                $keyboard = [
                    'inline_keyboard' => [
                        [
                            [
                                'text' => 'Open Mini App',
                                'web_app' => ['url' => config('app.url')]
                            ]
                        ]
                    ]
                ];

                $this->sendMessage($chatId, $replyText, $keyboard);
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Send a message to a specific Telegram chat using the Bot API.
     */
    protected function sendMessage(int $chatId, string $text, array $replyMarkup = [])
    {
        $botToken = config('services.telegram.bot_token');

        if (empty($botToken)) {
            Log::error('Telegram Bot Token is not set.');
            return false;
        }

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
        ];

        if (!empty($replyMarkup)) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        $response = Http::post($url, $payload);

        if ($response->failed()) {
            Log::error('Telegram API Error: ' . $response->body());
            return false;
        }

        return true;
    }
}
