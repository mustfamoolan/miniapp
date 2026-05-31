<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class EnsureTelegramUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $telegramId = $request->header('X-Telegram-User-Id') ?? $request->input('telegram_id');

        if (!$telegramId) {
            return response()->json(['error' => 'Unauthorized. Telegram ID is missing.'], 401);
        }

        // Find or create the user based on telegram_id
        $user = User::firstOrCreate(
            ['telegram_id' => $telegramId],
            ['name' => $request->header('X-Telegram-User-Name') ?? 'Telegram User']
        );

        // Bind the user to the request
        $request->merge(['user' => $user]);
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}
