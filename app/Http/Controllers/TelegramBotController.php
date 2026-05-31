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

        // Handle Inline Queries
        if (isset($update['inline_query'])) {
            $inlineQuery = $update['inline_query'];
            $this->answerInlineQuery($inlineQuery['id'], []);
            return response()->json(['status' => 'success']);
        }

        // Process regular message
        if (isset($update['message'])) {
            $message = $update['message'];
            $chatId = $message['chat']['id'] ?? null;
            $text = $message['text'] ?? '';

            if ($chatId && str_starts_with($text, '/start')) {
                $replyText = "💰 *Welcome to your Digital Wallet!* \n\nManage your assets, send, receive, and track your history all in one place.\n\nTap the button below to open your wallet.";

                $keyboard = [
                    'inline_keyboard' => [
                        [
                            [
                                'text' => '💎 Open Wallet',
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
            'parse_mode' => 'Markdown',
        ];

        if (!empty($replyMarkup)) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        $response = Http::post($url, $payload);

        if ($response->failed()) {
            Log::error('Telegram API Error (sendMessage): ' . $response->body());
            return false;
        }

        return true;
    }

    /**
     * Handle empty/search inline queries.
     */
    protected function answerInlineQuery(string $inlineQueryId, array $results)
    {
        $botToken = config('services.telegram.bot_token');
        if (empty($botToken)) return false;

        $url = "https://api.telegram.org/bot{$botToken}/answerInlineQuery";
        
        $payload = [
            'inline_query_id' => $inlineQueryId,
            'results' => json_encode($results),
            'cache_time' => 0,
            'is_personal' => true,
            'button' => json_encode([
                'text' => 'Search assets...',
                'start_parameter' => 'search'
            ])
        ];

        $response = Http::post($url, $payload);
        
        if ($response->failed()) {
            Log::error('Telegram API Error (answerInlineQuery): ' . $response->body());
            return false;
        }

        return true;
    }

    /**
     * Setup the bot\'s Menu Button to open the Web App.
     */
    public function setupBot()
    {
        $botToken = config('services.telegram.bot_token');
        $appUrl = config('app.url');

        if (empty($botToken) || empty($appUrl)) {
            return response()->json(['error' => 'Missing bot token or app url'], 400);
        }

        $url = "https://api.telegram.org/bot{$botToken}/setChatMenuButton";

        $payload = [
            'menu_button' => json_encode([
                'type' => 'web_app',
                'text' => 'Wallet',
                'web_app' => ['url' => $appUrl]
            ])
        ];

        $response = Http::post($url, $payload);

        if ($response->successful()) {
            return response()->json(['status' => 'success', 'message' => 'Menu button updated successfully.']);
        }

        return response()->json(['error' => 'Failed to set menu button', 'details' => $response->json()], 500);
    }
}
