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
// Lead yönlendirmesi konuya göre:
//   Fiyat Talebi + Demo Talebi -> satış ekibi (satis@)
//   Destek Talebi + Diğer       -> info@
// NOT: satis@avicad.com.tr KUTUSU hosting panelinde OLUŞTURULMUŞ olmalı (ya da
// info@'ya alias). Yoksa yerel Postfix RCPT TO'yu reddeder ve Demo/Fiyat
// lead'leri iletilmez (form ziyaretçiye hata gösterir, sebep error_log'a düşer).
const SATIS_EPOSTA   = 'satis@avicad.com.tr'; // Fiyat + Demo Talebi
const DESTEK_EPOSTA  = 'info@avicad.com.tr';  // Destek + Diğer
const GONDEREN       = 'info@avicad.com.tr';  // From (müşteriye görünen) — domainle aynı (SPF)
const SITE_ADI       = 'AviCAD Türkiye';
const ARALIK_SN      = 30;    // aynı IP'den iki gönderim arasında en az
const SAATLIK_SINIR  = 5;     // aynı IP'den saatte en fazla
const MAKS_UZUNLUK   = 2000;  // tek alan için üst sınır

// ─── SMTP ───────────────────────────────────────────────────────────────────
// PHP'nin mail() fonksiyonu BU SUNUCUDA KAPALI: sendmail_path = /dev/null,
// yani çağrı sessizce hiçbir yere gitmiyor (2026-08-17'de ölçüldü — üç ayrı
// mail() denemesi de false döndü). Paylaşımlı hostinglerde spam önlemek için
// yaygın bir ayar. Sunucunun kendi Postfix'i localhost:25 ve :587 üzerinde
// dinlediği için doğrudan SMTP konuşuyoruz; dış kütüphane gerekmiyor.
const SMTP_SUNUCU    = 'localhost';
const SMTP_KAPI      = 25;
const SMTP_KULLANICI = 'info@avicad.com.tr';

// SMTP_SIFRE BOŞ bırakılırsa kimlik doğrulaması denenmez. Yerel Postfix
// genelde kendi sunucusundan gelen bağlantıya izin verir; önce bu denenmeli.
// Sunucu "relay access denied" derse buraya info@avicad.com.tr'nin şifresini
// yazın. Dosya web kökünde olsa da PHP olarak çalıştığı için içeriği dışarıdan
// okunamaz; yine de şifreyi kimseyle paylaşmayın.
const SMTP_SIFRE     = '';

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

/**
 * Tek bir e-postayı doğrudan SMTP ile yollar.
 *
 * Dönüş: [başarılı, tanılama]. Tanılama YALNIZCA sunucu günlüğüne yazılır,
 * istemciye asla dönmez — ham SMTP yanıtları altyapı hakkında bilgi sızdırır.
 */
function smtpYolla(string $alici, string $konu, string $govde, array $baslikSatirlari): array
{
    $soket = @fsockopen(SMTP_SUNUCU, SMTP_KAPI, $eno, $estr, 10);
    if (!$soket) {
        return [false, "baglanti kurulamadi: $estr ($eno)"];
    }
    stream_set_timeout($soket, 15);

    $oku = static function () use ($soket): string {
        $yanit = '';
        while (($satir = fgets($soket, 515)) !== false) {
            $yanit .= $satir;
            // Çok satırlı yanıtta ara satırlar "250-", son satır "250 " olur.
            if (strlen($satir) >= 4 && $satir[3] === ' ') {
                break;
            }
        }
        return $yanit;
    };
    $kod = static fn(string $yanit): int => (int) substr(ltrim($yanit), 0, 3);
    $komut = static function (string $satir) use ($soket, $oku): string {
        fwrite($soket, $satir . "\r\n");
        return $oku();
    };
    $kapat = static function () use ($soket): void {
        @fwrite($soket, "QUIT\r\n");
        @fclose($soket);
    };

    if ($kod($oku()) !== 220) {
        $kapat();
        return [false, 'karsilama alinamadi'];
    }

    $alan = $_SERVER['HTTP_HOST'] ?? 'avicad.com.tr';
    $y = $komut('EHLO ' . $alan);
    if ($kod($y) !== 250) {
        $kapat();
        return [false, 'EHLO reddedildi: ' . trim($y)];
    }

    // Şifre boşsa auth atlanır — yerel Postfix kendi sunucusundan gelen
    // bağlantıya genelde izin verir.
    if (SMTP_SIFRE !== '') {
        if ($kod($komut('AUTH LOGIN')) !== 334) {
            $kapat();
            return [false, 'AUTH LOGIN desteklenmiyor'];
        }
        if ($kod($komut(base64_encode(SMTP_KULLANICI))) !== 334) {
            $kapat();
            return [false, 'kullanici adi reddedildi'];
        }
        $y = $komut(base64_encode(SMTP_SIFRE));
        if ($kod($y) !== 235) {
            $kapat();
            return [false, 'kimlik dogrulama basarisiz: ' . trim($y)];
        }
    }

    $y = $komut('MAIL FROM:<' . GONDEREN . '>');
    if ($kod($y) !== 250) {
        $kapat();
        return [false, 'MAIL FROM reddedildi: ' . trim($y)];
    }

    $y = $komut('RCPT TO:<' . $alici . '>');
    if (!in_array($kod($y), [250, 251], true)) {
        $kapat();
        return [false, 'RCPT TO reddedildi: ' . trim($y)];
    }

    $y = $komut('DATA');
    if ($kod($y) !== 354) {
        $kapat();
        return [false, 'DATA reddedildi: ' . trim($y)];
    }

    // RFC 5321 nokta kaçışı: gövdede satır başındaki tek nokta veri sonu
    // işareti sanılır ve mail yarıda kesilirdi.
    $guvenliGovde = (string) preg_replace('/^\./m', '..', $govde);

    $mesaj = implode("\r\n", array_merge($baslikSatirlari, [
        'To: ' . $alici,
        'Subject: ' . $konu,
        'Date: ' . date('r'),
        'Message-ID: <' . bin2hex(random_bytes(8)) . '@' . $alan . '>',
    ])) . "\r\n\r\n" . str_replace("\n", "\r\n", $guvenliGovde);

    fwrite($soket, $mesaj . "\r\n.\r\n");
    $y = $oku();
    $basarili = $kod($y) === 250;
    $kapat();

    return [$basarili, $basarili ? 'ok' : 'teslim reddedildi: ' . trim($y)];
}

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

// Konuya göre hedef kutu. Reply-To müşteriye ayarlı kalır: satış/destek
// kutudan doğrudan "yanıtla" deyince cevap müşteriye gider.
$leadAlici = in_array($konu, ['Fiyat Talebi', 'Demo Talebi'], true)
    ? SATIS_EPOSTA
    : DESTEK_EPOSTA;
$leadBaslik = array_merge($ortakBaslik, ['Reply-To: ' . $baslik($adSoyad) . ' <' . $emailTemiz . '>']);
[$leadGonderildi, $leadTani] = smtpYolla(
    $leadAlici,
    $baslik("[Web] {$konuTemiz} — {$adSoyad}"),
    $leadGovde,
    $leadBaslik
);
if (!$leadGonderildi) {
    // Tek teşhis izi bu. İstemciye ham SMTP yanıtı DÖNMÜYOR; sunucu günlüğüne
    // yazılıyor ki saha hatası bildirildiğinde sebebi okunabilsin.
    error_log('[iletisim.php] lead gonderilemedi -> ' . $leadTani);
}

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

[$yanitGonderildi, $yanitTani] = smtpYolla(
    $emailTemiz,
    $baslik('Talebiniz alındı — AviCAD Türkiye'),
    $yanitGovde,
    $ortakBaslik
);
if (!$yanitGonderildi) {
    error_log('[iletisim.php] oto-yanit gonderilemedi -> ' . $yanitTani);
}

if (!$leadGonderildi) {
    // Sessiz lead kaybı bu projede daha önce yaşandı (835122c). İstemci bu
    // hatayı görüp ziyaretçiye telefon numarasını gösteriyor.
    bitir(502, ['ok' => false, 'hata' => 'Talep şu anda iletilemedi.']);
}

bitir(200, ['ok' => true]);
