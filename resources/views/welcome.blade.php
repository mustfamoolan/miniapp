<!DOCTYPE html>
<html lang="ar" dir="rtl">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
        <meta name="theme-color" content="#0d0d14">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

        <title>Mini App Dion</title>

        {{-- Telegram WebApp SDK --}}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>

        {{-- Vite Assets --}}
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body style="margin:0;padding:0;background:#0d0d14;overflow-x:hidden;">
        <div id="app"></div>
    </body>
</html>
