<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password — Moview</title>
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
                            <h1 style="margin:0; color:#f5f7fa; font-size:22px;">Reset Password</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 32px 0 32px; text-align:center;">
                            <p style="margin:0; color:#9aa5b8; font-size:14px; line-height:1.6;">
                                Hi {{ $username }}, kami menerima permintaan untuk mereset password akun Moview-mu.
                                Klik tombol di bawah untuk membuat password baru.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 32px 8px 32px;" align="center">
                            <a href="{{ $link }}"
                               style="display:inline-block; background-color:#3b82f6; color:#ffffff; text-decoration:none; font-weight:bold; font-size:15px; padding:14px 36px; border-radius:28px;">
                                Buat Password Baru
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 32px 0 32px; text-align:center;">
                            <p style="margin:0; color:#9aa5b8; font-size:12px; line-height:1.6;">
                                Link berlaku {{ $ttl }} menit dan hanya bisa dipakai sekali.<br>
                                Kalau kamu tidak meminta reset ini, abaikan email ini — passwordmu tidak berubah.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px 32px 32px; text-align:center;">
                            <p style="margin:0; color:#5b6678; font-size:11px; word-break:break-all;">
                                Tombol tidak berfungsi? Salin link ini ke browser:<br>
                                <a href="{{ $link }}" style="color:#3b82f6; text-decoration:none;">{{ $link }}</a>
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
