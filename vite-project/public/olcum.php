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
 *   - IP adresi ÖLÇÜM VERİSİNE KAYDEDİLMEZ. Yalnızca hız sınırı için, geçici
 *     klasörde, SHA-256 hash'i tutulur (ham IP değil) ve o kayıt bir saatlik
 *     pencereden ibarettir — iletisim.php ile aynı yöntem. Ölçüm dosyalarında
 *     IP'ye dair hiçbir iz yok.
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

// ─── Kötüye kullanım sınırları ──────────────────────────────────────────────
// Bu uç nokta kimlik doğrulamasız YAZIYOR ve her istek günlük JSON'u tümüyle
// okuyup yeniden yazıyor. Sınır olmadan sömürülebilir bir yol açılıyordu:
// sayaç anahtarları saldırgan kontrolünde (kaynak -> Referer başlığı,
// etiket -> istek gövdesi), dolayısıyla farklı anahtarlarla atılan istekler
// dosyayı sınırsız büyütür. Dosya büyüdükçe her istek pahalılaşır — maliyet
// doğrusal değil KARESEL artar — ve disk dolar. Bot filtresi yalnızca
// User-Agent'a baktığı için koruma sayılmaz, tek satırla aşılır.
//
// Sınır cömert tutuldu: tek bir ziyaret ~10 olay üretiyor (1 sayfa + bölümler
// + form). 120, normal ziyaretçiyi hiçbir koşulda etkilemez.
const SAATLIK_OLAY_SINIRI = 120;
// Bir kovadaki farklı anahtar tavanı. Aşılınca yeni değerler 'diger' kovasına
// yazılır; böylece anahtar sayısı ve dolayısıyla dosya boyutu sınırlı kalır.
const MAKS_ANAHTAR = 200;

/**
 * Sayacı artırır ama kovadaki farklı anahtar sayısına tavan uygular.
 * Tavan dolduğunda yeni değerler 'diger' altında toplanır — istatistik
 * anlamını korur, dosya şişmez.
 */
function sayacArtir(array &$kova, string $anahtar): void
{
    if (!isset($kova[$anahtar]) && count($kova) >= MAKS_ANAHTAR) {
        $anahtar = 'diger';
    }
    $kova[$anahtar] = ($kova[$anahtar] ?? 0) + 1;
}

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

// Hız sınırı — gövdeyi okumadan ÖNCE, ucuz olan kontrol önce çalışsın.
// IP ham hâliyle DEĞİL hash'lenerek saklanıyor: olcum.php'nin "IP kaydetmez"
// duruşu bu dosyada da korunuyor (iletisim.php ile aynı yöntem).
$ip        = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$izDosyasi = sys_get_temp_dir() . '/avicad_olcum_' . hash('sha256', $ip) . '.json';
$simdi     = time();
$iz        = ['b' => $simdi, 'n' => 0];
if (is_readable($izDosyasi)) {
    $onceki = json_decode((string) file_get_contents($izDosyasi), true);
    if (is_array($onceki) && isset($onceki['b'], $onceki['n']) && $simdi - (int) $onceki['b'] < 3600) {
        $iz = ['b' => (int) $onceki['b'], 'n' => (int) $onceki['n']];
    }
}
if ($iz['n'] >= SAATLIK_OLAY_SINIRI) {
    // Ölçüm ASLA ziyaretçiyi etkilememeli: sessizce başarı dön, sayma.
    cik(200, ['ok' => true, 'not' => 'sinir']);
}
$iz['n']++;
@file_put_contents($izDosyasi, json_encode($iz), LOCK_EX);

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
// Kovaların dizi olduğunu garantiye al: sayacArtir() referansla çalışıyor,
// eksik/bozuk bir alan gelirse count() üzerinde patlardı.
foreach (['bolumler', 'form', 'kaynak', 'cihaz'] as $kovaAdi) {
    if (!isset($gun[$kovaAdi]) || !is_array($gun[$kovaAdi])) {
        $gun[$kovaAdi] = [];
    }
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
        sayacArtir($gun['kaynak'], $kaynak);

        // Cihaz sınıfı istemciden geliyor (etiket): mobil | masaustu
        $cihaz = in_array($etiket, ['mobil', 'masaustu'], true) ? $etiket : 'bilinmiyor';
        $gun['cihaz'][$cihaz] = ($gun['cihaz'][$cihaz] ?? 0) + 1;
        break;

    case 'bolum':
        if ($etiket !== '') {
            sayacArtir($gun['bolumler'], $etiket);
        }
        break;

    case 'form':
        if ($etiket !== '') {
            sayacArtir($gun['form'], $etiket);
        }
        break;
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($gun, JSON_UNESCAPED_UNICODE));
@flock($fp, LOCK_UN);
fclose($fp);

cik(200, ['ok' => true]);
