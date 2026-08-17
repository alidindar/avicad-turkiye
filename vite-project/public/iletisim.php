<?php
/**
 * AviCAD Türkiye — iletişim formu endpoint'i.
 *
 * EmailJS'in yerini alır. Eski kurulumda public key + service id + template
 * id'leri istemci bundle'ında açıkta yayınlanıyordu ve "Yanıt" şablonunun To
 * alanı {{email}} olduğu için bundle'ı okuyan biri şirket adına ISTEDIGI
 * adrese e-posta gönderebiliyordu. Burada kimlik bilgisi diye bir şey yok:
 * gönderimi sunucunun kendi MTA'sı yapıyor, doğrulama ve hız sınırı da
 * sunucuda.
 *
 * Sözleşme (Contact.jsx bunu bilmiyor, yalnızca emailService.js çağırıyor):
 *   POST application/json
 *   { ad, soyad, telefon, email, konu, mesaj, website }
 *   200 {"ok":true}  |  4xx/5xx {"ok":false,"hata":"..."}
 *
 * `website` honeypot alanıdır — gerçek ziyaretçi görmez, bot doldurur.
 */
declare(strict_types=1);

// ─── Ayarlar ────────────────────────────────────────────────────────────────
const SATIS_EPOSTA   = 'info@avicad.com.tr';  // lead'in düşeceği kutu
const GONDEREN       = 'info@avicad.com.tr';  // From — domainle aynı olmalı (SPF)
const SITE_ADI       = 'AviCAD Türkiye';
const ARALIK_SN      = 30;    // aynı IP'den iki gönderim arasında en az
const SAATLIK_SINIR  = 5;     // aynı IP'den saatte en fazla
const MAKS_UZUNLUK   = 2000;  // tek alan için üst sınır

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function bitir(int $kod, array $govde): never {
    http_response_code($kod);
    echo json_encode($govde, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    bitir(405, ['ok' => false, 'hata' => 'Yalnızca POST kabul edilir.']);
}

// ─── Girdi ──────────────────────────────────────────────────────────────────
$ham = file_get_contents('php://input');
if ($ham === false || strlen($ham) > 20000) {
    bitir(400, ['ok' => false, 'hata' => 'İstek okunamadı.']);
}
$veri = json_decode($ham, true);
if (!is_array($veri)) {
    bitir(400, ['ok' => false, 'hata' => 'Geçersiz istek biçimi.']);
}

$al = static function (string $anahtar) use ($veri): string {
    $d = $veri[$anahtar] ?? '';
    return is_string($d) ? trim($d) : '';
};

// Honeypot: bot doldurmuşsa sessizce başarı dön — saldırgana ipucu verme,
// istemcideki davranışla da tutarlı kal.
if ($al('website') !== '') {
    bitir(200, ['ok' => true]);
}

$ad      = $al('ad');
$soyad   = $al('soyad');
$telefon = $al('telefon');
$email   = $al('email');
$konu    = $al('konu');
$mesaj   = $al('mesaj');

foreach (['ad' => $ad, 'soyad' => $soyad, 'telefon' => $telefon, 'email' => $email, 'konu' => $konu] as $etiket => $deger) {
    if ($deger === '') {
        bitir(422, ['ok' => false, 'hata' => "Zorunlu alan eksik: $etiket"]);
    }
}
foreach ([$ad, $soyad, $telefon, $email, $konu, $mesaj] as $deger) {
    if (mb_strlen($deger) > MAKS_UZUNLUK) {
        bitir(422, ['ok' => false, 'hata' => 'Alan çok uzun.']);
    }
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    bitir(422, ['ok' => false, 'hata' => 'Geçersiz e-posta adresi.']);
}
// Telefonda yalnızca rakam/boşluk/()+- bekleniyor; istemci maskeliyor ama
// istemciye güvenilmez.
if (!preg_match('/^[0-9 ()+\-]{10,25}$/u', $telefon)) {
    bitir(422, ['ok' => false, 'hata' => 'Geçersiz telefon numarası.']);
}

$KONULAR = ['Fiyat Talebi', 'Demo Talebi', 'Destek Talebi', 'Diğer'];
if (!in_array($konu, $KONULAR, true)) {
    bitir(422, ['ok' => false, 'hata' => 'Geçersiz konu.']);
}

// ─── Hız sınırı ─────────────────────────────────────────────────────────────
// Dosya tabanlı ve IP başına. Paylaşımlı hostingde Redis/APCu garantisi yok;
// tmp dosyası her kurulumda çalışır. IP ham haliyle DEĞİL, hash'lenerek
// saklanıyor — disk üzerinde gereksiz kişisel veri tutmamak için.
$ip     = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$iz     = sys_get_temp_dir() . '/avicad_form_' . hash('sha256', $ip) . '.json';
$simdi  = time();
$gecmis = [];
if (is_readable($iz)) {
    $onceki = json_decode((string) file_get_contents($iz), true);
    if (is_array($onceki)) {
        $gecmis = array_values(array_filter($onceki, static fn($t) => is_int($t) && $t > $simdi - 3600));
    }
}
if ($gecmis !== [] && $simdi - max($gecmis) < ARALIK_SN) {
    bitir(429, ['ok' => false, 'hata' => 'Çok sık gönderim. Lütfen biraz bekleyip tekrar deneyin.']);
}
if (count($gecmis) >= SAATLIK_SINIR) {
    bitir(429, ['ok' => false, 'hata' => 'Saatlik gönderim sınırına ulaşıldı. Lütfen telefonla ulaşın.']);
}
$gecmis[] = $simdi;
@file_put_contents($iz, json_encode($gecmis), LOCK_EX);

// ─── E-posta ────────────────────────────────────────────────────────────────
// Başlık enjeksiyonu: ad/e-posta gibi alanlar başlıklara giriyor; içlerindeki
// CR/LF saldırganın kendi başlığını (Bcc gibi) eklemesine izin verirdi.
$temizle = static fn(string $s): string => str_replace(["\r", "\n", "\0"], ' ', $s);

$adSoyad     = $temizle("$ad $soyad");
$emailTemiz  = $temizle($email);
$telefonTemiz = $temizle($telefon);
$konuTemiz   = $temizle($konu);

// UTF-8 konu başlığı: kodlanmazsa Türkçe karakterler bozulur.
$baslik = static fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';

$OTO_YANIT = [
    'Fiyat Talebi'  => 'Fiyat teklifi talebiniz bize ulaştı. Satış ekibimiz, ihtiyaçlarınıza uygun paket ve fiyat bilgisiyle en kısa sürede sizi arayacak.',
    'Demo Talebi'   => '30 günlük ücretsiz demo talebiniz alındı. Kurulum ve deneme süreci için ekibimiz kısa süre içinde sizinle iletişime geçecek.',
    'Destek Talebi' => 'Destek talebiniz bize ulaştı. Konuyla ilgili ekibimiz en kısa sürede size dönüş yapacak.',
];

$ortakBaslik = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $baslik(SITE_ADI) . ' <' . GONDEREN . '>',
];

// 1) Satışa lead bildirimi. Reply-To müşteriye ayarlı ki kutudan doğrudan
//    "yanıtla" denebilsin.
$leadGovde = <<<METIN
Yeni form gönderimi — {$konuTemiz}

Ad Soyad : {$adSoyad}
Telefon  : {$telefonTemiz}
E-posta  : {$emailTemiz}
Konu     : {$konuTemiz}

Mesaj:
{$mesaj}

---
Gönderim: {$_SERVER['HTTP_HOST']} · tarih:
METIN;
$leadGovde .= date('d.m.Y H:i');

$leadBaslik = array_merge($ortakBaslik, ['Reply-To: ' . $baslik($adSoyad) . ' <' . $emailTemiz . '>']);
$leadGonderildi = @mail(
    SATIS_EPOSTA,
    $baslik("[Web] {$konuTemiz} — {$adSoyad}"),
    $leadGovde,
    implode("\r\n", $leadBaslik)
);

// 2) Müşteriye otomatik yanıt. Bu BAŞARISIZ olsa bile lead gittiyse istek
//    başarılıdır — ziyaretçinin talebi kaydedilmiştir, asıl mesele odur.
$otoMetin = $OTO_YANIT[$konu] ?? 'Talebiniz bize ulaştı. Ekibimiz en kısa sürede size dönüş yapacak.';
$yanitGovde = <<<METIN
Merhaba {$adSoyad},

{$otoMetin}

Bu arada bize doğrudan da ulaşabilirsiniz:
Telefon : +90 (536) 928 00 59
E-posta : info@avicad.com.tr

İyi çalışmalar dileriz.
AviCAD Türkiye
METIN;

@mail(
    $emailTemiz,
    $baslik('Talebiniz alındı — AviCAD Türkiye'),
    $yanitGovde,
    implode("\r\n", $ortakBaslik)
);

if (!$leadGonderildi) {
    // Sessiz lead kaybı bu projede daha önce yaşandı (835122c). İstemci bu
    // hatayı görüp ziyaretçiye telefon numarasını gösteriyor.
    bitir(502, ['ok' => false, 'hata' => 'Talep şu anda iletilemedi.']);
}

bitir(200, ['ok' => true]);
