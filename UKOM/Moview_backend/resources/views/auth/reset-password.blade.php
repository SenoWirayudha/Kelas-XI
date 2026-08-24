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
        .input-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-wrap input {
            width: 100%;
            padding: 14px 44px 14px 16px;
            background-color: #0e1420;
            border: 1px solid #2a3346;
            border-radius: 14px;
            color: #f5f7fa;
            font-size: 15px;
            outline: none;
        }
        .input-wrap input:focus { border-color: #3b82f6; }
        .input-wrap .eye-btn {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #9aa5b8;
            display: flex;
            align-items: center;
            justify-content: center;
            width: auto;
            margin-top: 0;
        }
        .input-wrap .eye-btn:hover { color: #f5f7fa; }
        .input-wrap .eye-btn svg { width: 20px; height: 20px; stroke-width: 1.75; fill: none; stroke: currentColor; }
        .btn-submit {
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .btn-submit:disabled { opacity: 0.6; cursor: default; }
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2.5px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-submit.loading .spinner { display: block; }
        .btn-submit.loading .btn-label { display: none; }
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

        <div id="reset-form">
            <label for="password">Password baru</label>
            <div class="input-wrap">
                <input type="password" id="password" minlength="6" required autocomplete="new-password">
                <button type="button" class="eye-btn" onclick="togglePw('password', this)" aria-label="Toggle password visibility">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>

            <label for="password_confirmation">Konfirmasi password</label>
            <div class="input-wrap">
                <input type="password" id="password_confirmation" minlength="6" required autocomplete="new-password">
                <button type="button" class="eye-btn" onclick="togglePw('password_confirmation', this)" aria-label="Toggle password visibility">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>

            <button type="button" class="btn-submit" id="btn-submit" onclick="submitReset()">
                <span class="btn-label">Simpan Password Baru</span>
                <span class="spinner"></span>
            </button>
        </div>

        <div id="message" class="message"></div>
    </div>

    <script>
        var EYE_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
        var EYE_CLOSED = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';

        function togglePw(fieldId, btn) {
            var input = document.getElementById(fieldId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = EYE_CLOSED;
            } else {
                input.type = 'password';
                btn.innerHTML = EYE_OPEN;
            }
        }

        function submitReset() {
            var container = document.getElementById('reset-form');
            var button = document.getElementById('btn-submit');
            var message = document.getElementById('message');
            var token = '{{ $token }}';

            message.className = 'message';
            button.classList.add('loading');
            button.disabled = true;

            fetch('/api/v1/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: document.getElementById('password').value,
                    password_confirmation: document.getElementById('password_confirmation').value
                })
            })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                button.classList.remove('loading');
                button.disabled = false;
                if (result.ok && result.data.success) {
                    container.style.display = 'none';
                    message.className = 'message success';
                    message.innerHTML = '<strong>Password berhasil diubah!</strong><br>Kembali ke app dan login dengan password barumu.';
                } else {
                    message.className = 'message error';
                    message.textContent = (result.data && result.data.message)
                        ? result.data.message
                        : 'Gagal mengubah password. Coba lagi.';
                }
            })
            .catch(function () {
                button.classList.remove('loading');
                button.disabled = false;
                message.className = 'message error';
                message.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
            });
        }
    </script>
</body>
</html>
