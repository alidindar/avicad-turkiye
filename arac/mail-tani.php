<?php
/**
 * AviCAD Türkiye — mail tanı aracı, 2. sürüm (GEÇİCİ).
 *
 * 1. SÜRÜMÜN BULGUSU: kimlik doğrulamasız SMTP, harici adrese
 *    "554 5.7.1 Relay access denied" veriyor. Yerel kutular (satis@, destek@,
 *    info@) 250 dönüyor — yani lead gidiyor, müşteriye giden oto-yanıt
 *    gitmiyor. Kök sebep bu.
 *
 * BU SÜRÜM NEYİ ÖLÇER: şifreyle AUTH yapıldığında relay açılıyor mu, ve
 * sunucu "info@ ile doğrulanıp satis@ adına gönderme"ye (sender login
 * mismatch) izin veriyor mu. Cevap, iletisim.php'nin zarf gönderenini
 * departmanda mı bırakacağımızı yoksa info@'ya mı çekeceğimizi belirler.
 * Müşterinin gördüğü From: başlığı her hâlükârda departmanda kalır.
 *
 * ŞİFRE NEDEN FORMDAN: sunucunun access_log'u tam URL'leri saklıyor
 * (1. sürümün çıktısında görüldü), o yüzden şifre GET ile GEÇMEMELİ.
 * Bu sayfa şifreyi POST ile alır; gövde günlüğe yazılmaz.
 *
 * KULLANIM: https://avicad.com.tr/mail-tani.php?anahtar=ANAHTAR
 * İŞ BİTİNCE BU DOSYAYI SUNUCUDAN SİLİN.
 */
declare(strict_types=1);

const ANAHTAR       = 'avicad-tani-c8XTgHQHPU7BAHqxHRMlGwKQ';
const SMTP_SUNUCU   = 'localhost';
const SATIS_EPOSTA  = 'satis@avicad.com.tr';
const GENEL_EPOSTA  = 'info@avicad.com.tr';

header('X-Robots-Tag: noindex, nofollow');

$anahtarGirdi = (string) ($_GET['anahtar'] ?? $_POST['anahtar'] ?? '');
if (!hash_equals(ANAHTAR, $anahtarGirdi)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Sayfa bulunamadı.\n");
}

/**
 * Tek bir SMTP oturumu yürütür ve her adımın ham yanıtını biriktirir.
 *
 * $ayar: kapi, tls (STARTTLS denensin mi), kullanici, sifre, zarf, hedef,
 *        gonder (DATA'ya girip gerçek mail atsın mı).
 * Dönüş: [satır listesi, başarılı mı].
 */
function smtpDene(array $ayar): array
{
    $kayit = [];
    $ekle = static function (string $s) use (&$kayit): void { $kayit[] = $s; };

    // Sertifika localhost adına değil (ihsdnsx32.com), bağlantı makineden
    // dışarı çıkmadığı için doğrulamayı kapatıyoruz.
    $baglam = stream_context_create(['ssl' => [
        'verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true,
    ]]);
    $soket = @stream_socket_client(
        'tcp://' . SMTP_SUNUCU . ':' . $ayar['kapi'],
        $eno, $estr, 10, STREAM_CLIENT_CONNECT, $baglam
    );
    if (!$soket) {
        return [["bağlanılamadı: $estr ($eno)"], false];
    }
    stream_set_timeout($soket, 20);

    $oku = static function () use ($soket): string {
        $y = '';
        while (($satir = fgets($soket, 515)) !== false) {
            $y .= $satir;
            if (strlen($satir) >= 4 && $satir[3] === ' ') {
                break;
            }
        }
        return trim($y);
    };
    $kod = static fn(string $y): int => (int) substr(ltrim($y), 0, 3);
    $komut = static function (string $s, bool $gizle = false) use ($soket, $oku, $ekle): string {
        fwrite($soket, $s . "\r\n");
        $y = $oku();
        $ekle('> ' . ($gizle ? '********' : $s));
        $ekle('< ' . str_replace("\n", "\n  ", $y));
        return $y;
    };

    $ekle('< ' . $oku());
    $komut('EHLO avicad.com.tr');

    if ($ayar['tls']) {
        if ($kod($komut('STARTTLS')) !== 220) {
            $ekle('!! STARTTLS reddedildi');
            @fclose($soket);
            return [$kayit, false];
        }
        if (!@stream_socket_enable_crypto($soket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            $ekle('!! TLS el sıkışması başarısız');
            @fclose($soket);
            return [$kayit, false];
        }
        $ekle('   [TLS kuruldu]');
        $komut('EHLO avicad.com.tr');   // TLS sonrası EHLO tekrarlanmalı
    }

    if ($ayar['sifre'] !== '') {
        if ($kod($komut('AUTH LOGIN')) !== 334) {
            $ekle('!! AUTH LOGIN kabul edilmedi');
            @fclose($soket);
            return [$kayit, false];
        }
        if ($kod($komut(base64_encode($ayar['kullanici']))) !== 334) {
            $ekle('!! kullanıcı adı reddedildi');
            @fclose($soket);
            return [$kayit, false];
        }
        if ($kod($komut(base64_encode($ayar['sifre']), true)) !== 235) {
            $ekle('!! ŞİFRE REDDEDİLDİ');
            @fclose($soket);
            return [$kayit, false];
        }
        $ekle('   [kimlik doğrulandı]');
    }

    if ($kod($komut('MAIL FROM:<' . $ayar['zarf'] . '>')) !== 250) {
        @fclose($soket);
        return [$kayit, false];
    }
    if (!in_array($kod($komut('RCPT TO:<' . $ayar['hedef'] . '>')), [250, 251], true)) {
        @fwrite($soket, "QUIT\r\n");
        @fclose($soket);
        return [$kayit, false];
    }

    $basarili = true;
    if ($ayar['gonder']) {
        if ($kod($komut('DATA')) === 354) {
            $mesaj = implode("\r\n", [
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=UTF-8',
                'From: AViCAD Türkiye Satış <' . SATIS_EPOSTA . '>',
                'To: ' . $ayar['hedef'],
                'Subject: AviCAD teslimat testi (zarf: ' . $ayar['zarf'] . ')',
                'Date: ' . date('r'),
                'Message-ID: <' . bin2hex(random_bytes(8)) . '@avicad.com.tr>',
            ]) . "\r\n\r\nBu mail ulaştıysa oto-yanıt yolu çalışıyor demektir.\r\n"
               . "Zarf göndereni: " . $ayar['zarf'] . "\r\n";
            fwrite($soket, $mesaj . "\r\n.\r\n");
            $y = $oku();
            $ekle('> [gövde]');
            $ekle('< ' . $y);
            $basarili = $kod($y) === 250;
        } else {
            $basarili = false;
        }
    } else {
        $komut('RSET');   // gerçek gönderim istenmediyse mail kuyruğa girmez
    }

    @fwrite($soket, "QUIT\r\n");
    @fclose($soket);
    return [$kayit, $basarili];
}

$kullanici = trim((string) ($_POST['kullanici'] ?? GENEL_EPOSTA));
$sifre     = (string) ($_POST['sifre'] ?? '');
$hedef     = trim((string) ($_POST['hedef'] ?? ''));
$gonder    = ($_POST['gonder'] ?? '') === '1';
$calistir  = $_SERVER['REQUEST_METHOD'] === 'POST' && $sifre !== '' && $hedef !== '';
?>
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>AviCAD mail tanı 2</title>
<style>
  body{font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;max-width:900px;margin:32px auto;padding:0 18px;background:#0f1115;color:#e6e8ee}
  h1{font-size:20px} h2{font-size:16px;margin-top:28px;border-bottom:1px solid #2a2f3a;padding-bottom:6px}
  label{display:block;margin:10px 0 4px;font-size:13px;color:#9aa3b2}
  input[type=text],input[type=password],input[type=email]{width:100%;padding:9px 11px;border:1px solid #2a2f3a;border-radius:7px;background:#161a22;color:#e6e8ee;font-size:14px}
  button{margin-top:16px;padding:10px 20px;border:0;border-radius:7px;background:#3b82f6;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
  pre{background:#161a22;border:1px solid #2a2f3a;border-radius:8px;padding:12px;overflow-x:auto;font-size:12.5px;white-space:pre-wrap;word-break:break-word}
  .ok{color:#4ade80;font-weight:600} .no{color:#f87171;font-weight:600}
  .not{background:#1a1f2b;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 7px 7px 0;font-size:13.5px;color:#c3cad8}
</style>
</head>
<body>
<h1>AviCAD mail tanı — 2. sürüm</h1>
<p class="not">Şifre <b>POST</b> ile gönderilir, sunucu erişim günlüğüne yazılmaz.
Bu sayfa iş bitince sunucudan silinmeli.</p>

<form method="post" action="mail-tani.php">
  <input type="hidden" name="anahtar" value="<?= htmlspecialchars(ANAHTAR, ENT_QUOTES) ?>">
  <label>Kimlik doğrulanacak kutu</label>
  <input type="text" name="kullanici" value="<?= htmlspecialchars($kullanici, ENT_QUOTES) ?>">
  <label>Şifresi (panelde E-posta Yönetimi'nden belirlenir)</label>
  <input type="password" name="sifre" autocomplete="off">
  <label>Test maili gidecek harici adres</label>
  <input type="email" name="hedef" value="<?= htmlspecialchars($hedef !== '' ? $hedef : '', ENT_QUOTES) ?>" placeholder="ornek@gmail.com">
  <label><input type="checkbox" name="gonder" value="1" <?= $gonder ? 'checked' : '' ?>> Gerçek test maili gönderilsin (işaretsizse yalnızca sondaj yapılır)</label>
  <button type="submit">Testi çalıştır</button>
</form>

<?php if ($calistir): ?>
<?php
// İki senaryo: zarf = doğrulanan kutu (her zaman çalışmalı) ve zarf =
// departman kutusu (sunucu sender login mismatch'e izin veriyorsa çalışır).
$senaryolar = [
    'A · 587 + STARTTLS · zarf = doğrulanan kutu' => ['kapi' => 587, 'tls' => true,  'zarf' => $kullanici],
    'B · 587 + STARTTLS · zarf = satis@ (mismatch)' => ['kapi' => 587, 'tls' => true,  'zarf' => SATIS_EPOSTA],
    'C · 25 · TLS yok · zarf = doğrulanan kutu'    => ['kapi' => 25,  'tls' => false, 'zarf' => $kullanici],
];
$ozet = [];
foreach ($senaryolar as $ad => $s):
    [$kayit, $basarili] = smtpDene($s + [
        'kullanici' => $kullanici, 'sifre' => $sifre, 'hedef' => $hedef, 'gonder' => $gonder,
    ]);
    $ozet[$ad] = $basarili;
?>
<h2><?= htmlspecialchars($ad, ENT_QUOTES) ?> — <span class="<?= $basarili ? 'ok' : 'no' ?>"><?= $basarili ? 'GEÇTİ' : 'KALDI' ?></span></h2>
<pre><?= htmlspecialchars(implode("\n", $kayit), ENT_QUOTES) ?></pre>
<?php endforeach; ?>

<h2>Özet</h2>
<pre><?php foreach ($ozet as $ad => $b) { printf("%-46s %s\n", $ad, $b ? 'GEÇTİ' : 'KALDI'); } ?></pre>
<p class="not">Bu çıktının tamamını paylaşın. B senaryosu geçtiyse zarf gönderen
departman kutusunda kalabilir; yalnızca A geçtiyse zarf info@ olur, From:
başlığı yine departmanda kalır (müşteri yine satıştan/destekten dönüş alır).</p>
<?php endif; ?>
</body>
</html>
