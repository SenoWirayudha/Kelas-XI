<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Mengalihkan... | Moview</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0F1419;
            color: #FFFFFF;
            font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        }
        a { color: #6EA8FF; }
    </style>
</head>
<body>
    <p>Mengalihkan ke dashboard... <a href="{{ $url }}">Lanjutkan</a></p>
    <script>
        window.location.replace(@json($url));
    </script>
</body>
</html>
