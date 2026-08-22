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
// Konuya göre DEPARTMAN yönlendirmesi (departman() fonksiyonu aşağıda):
//   Demo Talebi   -> satis@   (lead + oto-yanıt satıştan)
//   Fiyat Talebi  -> satis@   (YALNIZCA lead — oto-yanıt istenmiyor)
//   Destek Talebi -> destek@  (lead + oto-yanıt destekten)
//   Diğer         -> info@    (genel)
// Hem lead hem müşteriye giden oto-yanıt, ilgili departman kutusundan (From)
// gönderilir; müşteri "yanıtla" dediğinde doğru departmana ulaşır.
// NOT: satis@, destek@ ve info@ kutularının üçü de panelde OLUŞTURULMUŞ olmalı;
// yoksa yerel Postfix RCPT TO'yu reddeder ve o konudaki lead iletilmez (form
// ziyaretçiye hata gösterir, sebep mail-hata.log'a düşer). 2026-08-22'de
// üçünün de var olduğu doğrulandı (RCPT TO → 250). Tüm From adresleri
// @avicad.com.tr olduğu için SPF/DKIM/DMARC hizası korunur.
const SATIS_EPOSTA   = 'satis@avicad.com.tr';  // İndirme (Demo) + Fiyat Talebi
const DESTEK_EPOSTA  = 'destek@avicad.com.tr'; // Destek Talebi
const GENEL_EPOSTA   = 'info@avicad.com.tr';   // Diğer + yedek
const SITE_ADI       = 'AviCAD Türkiye';

// Demo kurulum dosyası. Site artık otomatik indirme YAPMIYOR — müşteri dosyaya
// yalnızca oto-yanıt mailindeki bu bağlantıdan ulaşıyor, yani bu satır
// indirmenin tek yolu. Adres değişirse mail de kırılır.
const DEMO_INDIRME_URL = 'https://avicad.com/dloads/AviCAD-Download.exe';
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
const SMTP_KAPI      = 587;   // submission; 25 kimlik doğrulamasız relay'i reddediyor
const SMTP_TLS       = true;  // 587'de STARTTLS zorunlu
const SMTP_KULLANICI = 'info@avicad.com.tr';

// KİMLİK DOĞRULAMA ZORUNLU — 2026-08-22'de sunucuda ölçüldü:
// doğrulamasız gönderimde yerel kutular (satis@ / destek@ / info@) kabul
// ediliyor ama harici adres "554 5.7.1 Relay access denied" dönüyor. Yani
// lead gidiyor, müşteriye giden oto-yanıt sessizce kayboluyordu.
//
// Şifre BU DOSYADA DEĞİL, yanındaki smtp-sifre.php'de durur:
//     <?php return 'info@ kutusunun sifresi';
// Sebep: (1) şifre git deposuna girmez, (2) siteyi yeniden dağıtınca
// üzerine yazılmaz — aksi halde her deploy maili sessizce bozardı.
// Dosya yoksa gönderim denenmez ve sebep günlüğe yazılır.
$sifreDosyasi = __DIR__ . '/smtp-sifre.php';
define('SMTP_SIFRE', is_readable($sifreDosyasi) ? trim((string) require $sifreDosyasi) : '');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function bitir(int $kod, array $govde): never {
    http_response_code($kod);
    echo json_encode($govde, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Mail hatalarını KENDİ dosyamıza yazar.
 *
 * error_log() kullanmıyoruz: bu sunucuda php.ini'de error_log AYARSIZ
 * (2026-08-22'de ölçüldü, boş dize). O yüzden buraya yazılan teşhisler
 * hiçbir yere düşmüyordu ve oto-yanıtın neden gitmediği 4 gün görünmedi.
 *
 * Hedef klasör olcum-veri/, .htaccess ile web'e kapalı (RedirectMatch 404).
 */
function mailGunlugu(string $satir): void
{
    $klasor = __DIR__ . '/olcum-veri';
    if (!is_dir($klasor)) {
        @mkdir($klasor, 0755, true);
    }
    @file_put_contents(
        $klasor . '/mail-hata.log',
        date('Y-m-d H:i:s') . ' ' . $satir . "\n",
        FILE_APPEND | LOCK_EX
    );
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
    // Telefon numarası sitede görünmüyor (944ecfb), o yüzden ziyaretçiyi
    // gerçekten ulaşabileceği kanallara yönlendiriyoruz.
    bitir(429, ['ok' => false, 'hata' => 'Saatlik gönderim sınırına ulaşıldı. Lütfen WhatsApp veya ' . GENEL_EPOSTA . ' üzerinden ulaşın.']);
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

/**
 * Demo talebinin oto-yanıt gövdesi.
 *
 * Diğer konulardan farklı olarak paylaşılan şablonu KULLANMAZ: kendi konu
 * satırı, kendi tanıtım metni ve indirme bağlantısı var. Site otomatik
 * indirmeyi kaldırdığı için bu mail dosyaya ulaşmanın tek yolu.
 */
function demoOtoYanitGovdesi(): string
{
    $link = DEMO_INDIRME_URL;
    return <<<METIN
Merhaba,

AViCAD deneme sürümü talebiniz için teşekkür ederiz.

AViCAD, profesyonel CAD kullanıcılarının mevcut çalışma alışkanlıklarını koruyarak hızlı, kolay ve maliyet odaklı bir şekilde yeni bir CAD ortamına geçiş yapabilmesi için geliştirilmiş güçlü bir tasarım çözümüdür.

Tam DWG uyumluluğu, tanıdık komut yapısı ve AutoCAD benzeri arayüzü sayesinde mevcut projelerinizi hiçbir veri kaybı yaşamadan açabilir, adaptasyon süreciyle zaman kaybetmeden hemen çalışmaya başlayabilirsiniz.

Neden AViCAD Kullanmalısınız?

- Birebir Komut ve Arayüz Uyumluluğu: AutoCAD alışkanlıklarınızla doğrudan kullanım
- Eksiksiz DWG ve DXF Desteği: Mevcut projelerinizle %100 uyumlu çalışma
- Gelişmiş Çözüm Araçları: Profesyonel 2D teknik çizim ve 3D modelleme
- Yerleşik Mühendislik Modülü: Entegre Mech-Q mekanik ve tesisat araç seti
- AEC ve Mimari Çözümler: Hızlı ve pratik mimari çizim araçları
- Gelişmiş Yazılım Destekleri: AutoLISP ve Visual LISP desteği
- Geniş Dosya Formatı Desteği: PDF, STEP ve IGES gibi formatlarla sorunsuz veri aktarımı
- Ekonomik Lisanslama: Yüksek yazılım maliyetlerini optimize eden esnek lisans seçenekleri

AViCAD'ı Kendi Projelerinizle Deneyin

Yazılımın performansını ve kullanım kolaylığını bizzat test etmek için deneme sürümünü indirip kendi DWG dosyalarınız üzerinde hemen çalışmaya başlayabilirsiniz.

AViCAD Demo İndir:
{$link}

CAD yazılım maliyetlerinizi düşürürken verimliliğinizden ve alışkanlıklarınızdan ödün vermeyin.

Ürün seçimi, lisanslama, kurulum ve teknik destek süreçlerinin tamamında AVICAD Türkiye Distribütörü ekibi olarak yanınızdayız.

Saygılarımızla,
AVICAD Türkiye Distribütörü
METIN;
}

/**
 * Destek talebinin oto-yanıt gövdesi.
 *
 * Demo gibi bu da paylaşılan şablonu kullanmaz: kendi konu satırı ve kendi
 * imzası var (AEC Teknik Destek Ekibi). Müşteriden ekran görüntüsü/hata kodu
 * isteniyor, o yüzden "bu e-postayı yanıtlayın" çağrısı metnin kendi içinde.
 */
function destekOtoYanitGovdesi(): string
{
    return <<<METIN
Merhaba,

AVICAD teknik destek talebiniz başarıyla alınmıştır.

Talebiniz uzman teknik ekibimize iletilmiş olup, en kısa sürede incelenerek sizinle iletişime geçilecektir.

Destek sürecini hızlandırmak adına, karşılaştığınız durumla ilgili varsa ekran görüntüsü veya hata kodlarını bu e-postaya yanıt olarak ekleyebilirsiniz.

Saygılarımızla,

AEC Teknik Destek Ekibi
AVICAD Türkiye Distribütörü
METIN;
}

// Konuya göre departman:
//   [kutu, From görünen ad, imza, oto-yanıt metni, oto-yanıt konu satırı,
//    tam gövde (null ise paylaşılan şablon kullanılır)].
// KONU SATIRI null ise o talepte müşteriye HİÇ oto-yanıt gönderilmez.
// Hem lead hem oto-yanıt bu kutudan gider; müşteri "yanıtla" deyince buraya döner.
[$departmanEposta, $departmanAd, $departmanImza, $otoMetin, $otoKonu, $otoGovdeTam] = match ($konu) {
    'Demo Talebi' => [
        SATIS_EPOSTA, 'AViCAD Türkiye Satış', 'AVICAD Türkiye Distribütörü',
        '',   // paylaşılan şablon kullanılmıyor
        'AViCAD Ücretsiz Deneme Sürümünüz Hazır – AutoCAD Alışkanlıklarınızı Değiştirmeden Keşfedin!',
        demoOtoYanitGovdesi(),
    ],
    // Fiyat Talebi: müşteriye OTOMATİK YANIT GİTMEZ (konu satırı null).
    // Teklif kişiye özel hazırlandığı için ilk teması satış ekibi kendisi
    // kuruyor. Lead yine satis@ kutusuna düşer.
    'Fiyat Talebi' => [
        SATIS_EPOSTA, 'AViCAD Türkiye Satış', 'AViCAD Türkiye Satış Ekibi',
        '', null, null,
    ],
    'Destek Talebi' => [
        DESTEK_EPOSTA, 'AViCAD Türkiye Destek', 'AEC Teknik Destek Ekibi',
        '',   // paylaşılan şablon kullanılmıyor
        'AVICAD Destek Talebiniz Alındı',
        destekOtoYanitGovdesi(),
    ],
    default => [
        GENEL_EPOSTA, 'AViCAD Türkiye', 'AViCAD Türkiye',
        'Mesajınız bize ulaştı. Ekibimiz en kısa sürede size dönüş yapacak.',
        'Talebiniz alındı — AViCAD Türkiye', null,
    ],
};

$ortakBaslik = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $baslik($departmanAd) . ' <' . $departmanEposta . '>',
];

/**
 * Tek bir e-postayı doğrudan SMTP ile yollar.
 *
 * Dönüş: [başarılı, tanılama]. Tanılama YALNIZCA sunucu günlüğüne yazılır,
 * istemciye asla dönmez — ham SMTP yanıtları altyapı hakkında bilgi sızdırır.
 */
function smtpYolla(string $alici, string $konu, string $govde, array $baslikSatirlari, string $gonderen): array
{
    if (SMTP_SIFRE === '') {
        return [false, 'smtp-sifre.php yok veya bos — kimlik dogrulamasiz gonderim relay reddi aliyor'];
    }

    // Sunucu sertifikası kendi ana makine adına (ihsdnsx32.com), biz localhost
    // üzerinden bağlanıyoruz; ad uyuşmazlığı bağlantıyı düşürmesin diye
    // doğrulama kapalı. Trafik makineden hiç çıkmıyor.
    $baglam = stream_context_create(['ssl' => [
        'verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true,
    ]]);
    $soket = @stream_socket_client(
        'tcp://' . SMTP_SUNUCU . ':' . SMTP_KAPI,
        $eno, $estr, 10, STREAM_CLIENT_CONNECT, $baglam
    );
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

    // 587 kimlik doğrulamasını TLS arkasında ister; STARTTLS'ten sonra EHLO
    // tekrarlanmalı, çünkü sunucu yetenek listesini yeniden bildirir.
    if (SMTP_TLS) {
        if ($kod($komut('STARTTLS')) !== 220) {
            $kapat();
            return [false, 'STARTTLS reddedildi'];
        }
        if (!@stream_socket_enable_crypto($soket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            $kapat();
            return [false, 'TLS el sikismasi basarisiz'];
        }
        if ($kod($komut('EHLO ' . $alan)) !== 250) {
            $kapat();
            return [false, 'TLS sonrasi EHLO reddedildi'];
        }
    }

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

    $y = $komut('MAIL FROM:<' . $gonderen . '>');
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

// Hedef kutu = departman (yukarıda match ile belirlendi). Reply-To müşteri:
// departman kutudan "yanıtla" deyince cevap müşteriye gider.
//
// ZARF GÖNDEREN = departman kutusu. BU SATIR MÜŞTERİNİN GÖRDÜĞÜ ADRESİ
// BELİRLİYOR — 2026-08-22'de ölçüldü ve sezgiye aykırı:
//
// Üç test maili aynı "From: ... <satis@avicad.com.tr>" başlığıyla, farklı
// zarf gönderenleriyle atıldı. Gmail'de zarfı info@ olanlar info@'dan,
// zarfı satis@ olan satis@'tan göründü. Yani sunucu giden mailde From:
// başlığını zarfa göre YENİDEN YAZIYOR (Plesk sender rewriting); başlığı
// departman yapmak tek başına YETMEZ, zarf da departman olmalı.
//
// Kimlik doğrulaması info@ ile yapılıyor ama sunucu farklı zarf gönderenine
// izin veriyor (AUTH info@ + MAIL FROM satis@ → 250; sender login mismatch
// kısıtı yok). Bounce'lar da ilgili departmana döner. Sunucu bu kısıtı
// ileride açarsa gönderim "MAIL FROM reddedildi" ile düşer ve sebep
// mail-hata.log'a yazılır.
$leadBaslik = array_merge($ortakBaslik, ['Reply-To: ' . $baslik($adSoyad) . ' <' . $emailTemiz . '>']);
[$leadGonderildi, $leadTani] = smtpYolla(
    $departmanEposta,
    $baslik("[Web] {$konuTemiz} — {$adSoyad}"),
    $leadGovde,
    $leadBaslik,
    $departmanEposta
);
if (!$leadGonderildi) {
    // Tek teşhis izi bu. İstemciye ham SMTP yanıtı DÖNMÜYOR; sunucu günlüğüne
    // yazılıyor ki saha hatası bildirildiğinde sebebi okunabilsin.
    mailGunlugu('lead gonderilemedi (' . $departmanEposta . ') -> ' . $leadTani);
}

// 2) Müşteriye otomatik yanıt — İLGİLİ DEPARTMAN kutusundan (From) ve o
//    departmanın imzasıyla. $otoMetin ve imza yukarıdaki match ile belirlendi.
//    Bu BAŞARISIZ olsa bile lead gittiyse istek başarılıdır.
$yanitGovde = <<<METIN
Merhaba {$adSoyad},

{$otoMetin}

Dilerseniz bu e-postayı doğrudan yanıtlayabilir ya da bize ulaşabilirsiniz:
Telefon : +90 (536) 928 00 59
E-posta : {$departmanEposta}

İyi çalışmalar dileriz.
{$departmanImza}
METIN;

// Konusuna özel tam gövdesi olan talepler (Demo, Destek) şablonu atlar.
if ($otoGovdeTam !== null) {
    $yanitGovde = $otoGovdeTam;
}

if ($otoKonu === null) {
    // Bu konuda müşteriye otomatik yanıt İSTENMİYOR (Fiyat Talebi): teklif
    // kişiye özel hazırlandığı için satış ekibi doğrudan yazıyor, önden giden
    // kalıp mail süreci soğutuyordu.
    //
    // "Gönderilemedi" ile karıştırılmamalı: gönderilmesi zaten istenmediği için
    // başarılı sayıyoruz, aksi halde ziyaretçi boş yere "e-posta gönderilemedi"
    // uyarısı görürdü ve günlüğe sahte hata düşerdi.
    $yanitGonderildi = true;
    $yanitTani = 'gonderilmedi (bu konuda oto-yanit kapali)';
} else {
    [$yanitGonderildi, $yanitTani] = smtpYolla(
        $emailTemiz,
        $baslik($otoKonu),
        $yanitGovde,
        $ortakBaslik,
        $departmanEposta
    );
    if (!$yanitGonderildi) {
        mailGunlugu('oto-yanit gonderilemedi (' . $emailTemiz . ') -> ' . $yanitTani);
    }
}

if (!$leadGonderildi) {
    // Sessiz lead kaybı bu projede daha önce yaşandı (835122c). İstemci bu
    // hatayı görüp ziyaretçiye telefon numarasını gösteriyor.
    bitir(502, ['ok' => false, 'hata' => 'Talep şu anda iletilemedi.']);
}

// otoYanit: müşteriye giden mail gerçekten gitti mi. Demo talebinde bu mail
// indirme bağlantısının TEK taşıyıcısı (site otomatik indirmeyi kaldırdı), o
// yüzden başarısızlığını ziyaretçiden saklamıyoruz — Contact.jsx bu bayrağa
// bakıp alternatif kanal öneriyor. Lead gittiği için istek başarılı sayılır.
bitir(200, ['ok' => true, 'otoYanit' => $yanitGonderildi]);
