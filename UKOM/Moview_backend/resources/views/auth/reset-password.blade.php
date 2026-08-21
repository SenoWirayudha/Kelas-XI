<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password — Moview</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #0e1420;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 24px 16px;
        }
        .card {
            width: 100%;
            max-width: 420px;
            background-color: #161d2c;
            border: 1px solid #2a3346;
            border-radius: 24px;
            padding: 36px 28px;
        }
        .logo {
            width: 64px; height: 64px;
            margin: 0 auto 16px auto;
            background-color: #3b82f6;
            border-radius: 18px;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 30px; font-weight: bold;
        }
        h1 { color: #f5f7fa; font-size: 22px; text-align: center; }
        .subtitle { color: #9aa5b8; font-size: 14px; text-align: center; margin-top: 8px; line-height: 1.6; }
        label { display: block; color: #9aa5b8; font-size: 13px; margin: 20px 0 6px 4px; }
        input[type="password"] {
            width: 100%;
            padding: 14px 16px;
            background-color: #0e1420;
            border: 1px solid #2a3346;
            border-radius: 14px;
            color: #f5f7fa;
            font-size: 15px;
            outline: none;
        }
        input[type="password"]:focus { border-color: #3b82f6; }
        button {
            width: 100%;
            margin-top: 28px;
            padding: 15px;
            background-color: #3b82f6;
            border: none;
            border-radius: 28px;
            color: #fff;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        }
        button:disabled { opacity: 0.6; cursor: default; }
        .message { display: none; margin-top: 20px; padding: 14px 16px; border-radius: 14px; font-size: 14px; line-height: 1.6; }
        .message.error { display: block; background-color: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); }
        .message.success { display: block; background-color: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">M</div>
        <h1>Buat Password Baru</h1>
        <p class="subtitle">Masukkan password baru untuk akun Moview-mu.</p>

        <form id="reset-form" method="post" action="#" onsubmit="return submitReset(event)">
            <label for="password">Password baru</label>
            <input type="password" id="password" name="password" minlength="6" required autocomplete="new-password">

            <label for="password_confirmation">Konfirmasi password</label>
            <input type="password" id="password_confirmation" name="password_confirmation" minlength="6" required autocomplete="new-password">

            <button type="submit" id="btn-submit">Simpan Password Baru</button>
        </form>

        <div id="message" class="message"></div>
    </div>

    <script>
        function submitReset(event) {
            event.preventDefault();
            var form = document.getElementById('reset-form');
            var button = document.getElementById('btn-submit');
            var message = document.getElementById('message');
            var token = {{ json_encode($token) }};

            message.className = 'message';
            button.disabled = true;
            button.textContent = 'Menyimpan...';

            fetch('/api/v1/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: document.getElementById('password').value,
                    password_confirmation: document.getElementById('password_confirmation').value
                })
            })
            .then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
            .then(function (result) {
                if (result.ok && result.data.success) {
                    form.style.display = 'none';
                    message.className = 'message success';
                    message.innerHTML = '<strong>Password berhasil diubah!</strong><br>Kembali ke app dan login dengan password barumu.';
                } else {
                    message.className = 'message error';
                    message.textContent = (result.data && result.data.message) ? result.data.message : 'Gagal mengubah password. Coba lagi.';
                    button.disabled = false;
                    button.textContent = 'Simpan Password Baru';
                }
            })
            .catch(function () {
                message.className = 'message error';
                message.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
                button.disabled = false;
                button.textContent = 'Simpan Password Baru';
            });

            return false;
        }
    </script>
</body>
</html>
