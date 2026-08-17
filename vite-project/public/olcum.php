<?php
/**
 * AviCAD Türkiye — kendi ölçüm toplayıcımız.
 *
 * Neden üçüncü taraf analitik yok: site açılışında hiçbir dış sunucuya istek
 * atmıyor (fontlar yerelleştirildi, YouTube tıkla-oynat facade'ı arkasında,
 * form kendi endpoint'imize gidiyor). Bir analitik servisi eklemek bu konumu
 * bozar ve KVKK aydınlatma metnine "üçüncü tarafa aktarım" satırı eklemeyi
 * gerektirirdi.
 *
 * KİŞİSEL VERİ İŞLENMEZ — bilinçli tasarım:
 *   - Çerez yok, localStorage yok, parmak izi yok.
 *   - IP adresi KAYDEDİLMEZ (hash'i bile tutulmuyor).
 *   - Tekil ziyaretçi sayılmıyor; yalnızca toplam sayaçlar artırılıyor.
 *   - Referrer'dan yalnızca alan adı alınır (tam URL değil).
 * Sonuç: aydınlatma metninde değişiklik gerekmiyor.
 *
 * Veri, gün başına tek bir JSON dosyasında toplanır ve web'den okunamayan
 * bir klasörde durur (olcum-veri/.htaccess ile kapalı).
 */
declare(strict_types=1);

const VERI_KLASORU = __DIR__ . '/olcum-veri';
const IZINLI_OLAYLAR = ['sayfa', 'bolum', 'form'];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// Tarayıcı bu isteğin yanıtını asla önbelleğe almamalı.
header('Cache-Control: no-store');

function cik(int $kod, array $govde): never {
    http_response_code($kod);
    echo json_encode($govde, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cik(405, ['ok' => false]);
}

// Botları sayma — istatistiği şişirir ve gerçek ziyaretçiyi gizler.
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|bing|yandex|facebookexternalhit|headless|curl|wget|python|monitor/i', $ua)) {
    cik(200, ['ok' => true, 'not' => 'bot']);
}

$ham = file_get_contents('php://input');
if ($ham === false || strlen($ham) > 2000) {
    cik(400, ['ok' => false]);
}
$veri = json_decode($ham, true);
if (!is_array($veri)) {
    cik(400, ['ok' => false]);
}

$olay = is_string($veri['olay'] ?? null) ? $veri['olay'] : '';
if (!in_array($olay, IZINLI_OLAYLAR, true)) {
    cik(422, ['ok' => false]);
}
// Serbest metin kabul edilmiyor: yalnızca kısa, güvenli bir etiket.
$etiket = is_string($veri['etiket'] ?? null) ? substr(preg_replace('/[^a-z0-9\-]/i', '', $veri['etiket']), 0, 40) : '';

if (!is_dir(VERI_KLASORU)) {
    @mkdir(VERI_KLASORU, 0750, true);
    // Klasör web kökünün altında; içeriği dışarıdan OKUNAMAMALI.
    @file_put_contents(VERI_KLASORU . '/.htaccess', "Require all denied\n");
}

$dosya = VERI_KLASORU . '/' . date('Y-m-d') . '.json';

// Eşzamanlı isteklerde sayaç kaybolmasın: dosyayı kilitleyip oku-yaz.
$fp = @fopen($dosya, 'c+');
if (!$fp) {
    cik(200, ['ok' => true]);   // ölçüm asla ziyaretçiyi etkilememeli
}
@flock($fp, LOCK_EX);
$icerik = stream_get_contents($fp);
$gun = json_decode((string) $icerik, true);
if (!is_array($gun)) {
    $gun = ['sayfa' => 0, 'bolumler' => [], 'form' => [], 'kaynak' => [], 'cihaz' => []];
}

switch ($olay) {
    case 'sayfa':
        $gun['sayfa'] = ($gun['sayfa'] ?? 0) + 1;

        // Referrer'dan YALNIZCA alan adı — tam URL kişisel iz taşıyabilir.
        $ref = $_SERVER['HTTP_REFERER'] ?? '';
        $kaynak = 'dogrudan';
        if ($ref !== '') {
            $alan = parse_url($ref, PHP_URL_HOST);
            if (is_string($alan) && $alan !== '' && !str_contains($alan, 'avicad.com.tr')) {
                $kaynak = substr(preg_replace('/[^a-z0-9\.\-]/i', '', $alan), 0, 60);
            }
        }
        $gun['kaynak'][$kaynak] = ($gun['kaynak'][$kaynak] ?? 0) + 1;

        // Cihaz sınıfı istemciden geliyor (etiket): mobil | masaustu
        $cihaz = in_array($etiket, ['mobil', 'masaustu'], true) ? $etiket : 'bilinmiyor';
        $gun['cihaz'][$cihaz] = ($gun['cihaz'][$cihaz] ?? 0) + 1;
        break;

    case 'bolum':
        if ($etiket !== '') {
            $gun['bolumler'][$etiket] = ($gun['bolumler'][$etiket] ?? 0) + 1;
        }
        break;

    case 'form':
        if ($etiket !== '') {
            $gun['form'][$etiket] = ($gun['form'][$etiket] ?? 0) + 1;
        }
        break;
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($gun, JSON_UNESCAPED_UNICODE));
@flock($fp, LOCK_UN);
fclose($fp);

cik(200, ['ok' => true]);
