<?php
/**
 * check_mojibake.php - scan file teks untuk urutan mojibake
 * (double-encoding: byte UTF-8 yang pernah didecode sebagai cp1252 lalu ditulis ulang UTF-8).
 *
 * Usage : php scripts/check_mojibake.php
 * Scan  : resources/views, public/js, app, lang (relatif root Laravel)
 * Exit  : 0 = bersih, 1 = ada temuan, 2 = error
 *
 * Cara aman menulis file di Windows (hindari kerusakan encoding):
 *  - PowerShell 5.1 : baca dengan Get-Content -Encoding UTF8;
 *                      tulis dengan [System.IO.File]::WriteAllText(path, teks,
 *                      (New-Object System.Text.UTF8Encoding($false)))  <- UTF-8 tanpa BOM
 *  - Python         : open(path, encoding="utf-8") untuk read DAN write
 *  - Hindari        : redirect > ; Set-Content/Out-File tanpa -Encoding ;
 *                      Get-Content tanpa -Encoding (PS5.1 default = ANSI/cp1252 -> mojibake)
 *
 * Pola di bawah ditulis dengan escape \x{} (ASCII-safe, bukan karakter literal),
 * sehingga file skrip ini sendiri tidak bisa rusak encoding.
 *
 * Pola = lead char hasil decode cp1252 byte 0xC2-0xFF (mis. Â, Ã, â)
 *        diikuti 1-3 continuation char dari himpunan hasil decode cp1252
 *        byte 0x80-0x9F (definisi + 5 kontrol tak terdefinisi 0x81/8D/8F/90/9D)
 *        ditambah U+00A0-U+00FF.
 */

$lead = '[\x{00C2}-\x{00FF}]';
$cont = '[\x{0081}\x{008D}\x{008F}\x{0090}\x{009D}'
      . '\x{00A0}-\x{00FF}'
      . '\x{0152}\x{0153}\x{0160}\x{0161}\x{0178}\x{017D}\x{017E}\x{0192}'
      . '\x{02C6}\x{02DC}'
      . '\x{2013}\x{2014}\x{2018}\x{2019}\x{201A}\x{201C}\x{201D}\x{201E}'
      . '\x{2020}\x{2021}\x{2022}\x{2026}\x{2030}\x{2039}\x{203A}'
      . '\x{20AC}\x{2122}]';
$pattern = '/' . $lead . $cont . '{1,3}/u';

$root = dirname(__DIR__); // root Laravel (folder induk scripts/)
$dirs = ['resources/views', 'public/js', 'app', 'lang'];
$exts = ['php', 'blade.php', 'js', 'json', 'html', 'css', 'xml', 'md', 'txt', 'vue', 'ts'];

$files = [];
foreach ($dirs as $d) {
    $abs = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $d);
    if (!is_dir($abs)) { continue; }
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($abs, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $fi) {
        if (!$fi->isFile()) { continue; }
        $name = $fi->getFilename();
        $ok = false;
        foreach ($exts as $e) {
            if (substr($name, -strlen($e)) === $e) { $ok = true; break; }
        }
        if ($ok) { $files[] = $fi->getPathname(); }
    }
}
sort($files);

$hits = 0;
$hitFiles = 0;
foreach ($files as $path) {
    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') { continue; }
    // Lewati file binari yang kebetulan ada ekstensi teks
    if (strpos($raw, "\0") !== false) { continue; }
    if (!preg_match('//u', $raw)) { continue; } // bukan UTF-8 valid – di luar cakupan ini
    if (!preg_match_all($pattern, $raw, $m, PREG_OFFSET_CAPTURE)) { continue; }
    $hitFiles++;
    $rel = str_replace(str_replace('\\', '/', $root) . '/', '', str_replace('\\', '/', $path));
    foreach ($m[0] as $hit) {
        $hits++;
        $line = substr_count(substr($raw, 0, $hit[1]), "\n") + 1;
        $sample = $hit[0];
        if (strlen($sample) > 40) { $sample = substr($sample, 0, 40) . '...'; }
        $hex = '';
        foreach (str_split($hit[0]) as $ch) { $hex .= sprintf('%02X ', ord($ch)); }
        echo "  $rel:$line  [hex: " . trim($hex) . "]\n";
    }
}

echo "Files scanned : " . count($files) . "\n";
echo "Files with hits: $hitFiles\n";
echo "Total spots    : $hits\n";
if ($hits > 0) {
    echo "RESULT: MOJIBAKE DITEMUKAN (exit 1)\n";
    exit(1);
}
echo "RESULT: BERSIH (exit 0)\n";
exit(0);
