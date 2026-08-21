<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login dengan Google — Moview</title>
</head>
<body style="margin:0; padding:0; background-color:#0e1420; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e1420; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#161d2c; border-radius:20px; border:1px solid #2a3346;">
                    <tr>
                        <td style="padding:36px 32px 8px 32px; text-align:center;">
                            <div style="display:inline-block; width:56px; height:56px; line-height:56px; background-color:#3b82f6; border-radius:16px; color:#ffffff; font-size:26px; font-weight:bold;">M</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 0 32px; text-align:center;">
                            <h1 style="margin:0; color:#f5f7fa; font-size:22px;">Akun Google Terdeteksi</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 32px 0 32px; text-align:center;">
                            <p style="margin:0; color:#9aa5b8; font-size:14px; line-height:1.6;">
                                Hi {{ $username }}, akun ini terdaftar pakai Google Sign-In,
                                jadi tidak ada password yang perlu direset.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 32px 0 32px; text-align:center;">
                            <p style="margin:0; color:#9aa5b8; font-size:14px; line-height:1.6;">
                                Silakan login langsung lewat tombol
                                <span style="color:#f5f7fa; font-weight:bold;">"Login dengan Google"</span>
                                di app Moview.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px 32px 32px; text-align:center;">
                            <p style="margin:0; color:#5b6678; font-size:11px;">
                                Tidak mencoba login? Abaikan email ini.
                            </p>
                        </td>
                    </tr>
                </table>
                <p style="margin:20px 0 0 0; color:#5b6678; font-size:11px;">© {{ date('Y') }} Moview — Your cinematic journey awaits</p>
            </td>
        </tr>
    </table>
</body>
</html>
