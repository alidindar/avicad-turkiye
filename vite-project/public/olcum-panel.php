<?php
/**
 * AviCAD Türkiye — ölçüm paneli.
 *
 * olcum.php'nin topladığı günlük sayaçları okunur hâle getirir. Dışarıdan
 * kütüphane yüklemez (grafikler düz CSS), böylece sitenin "sıfır üçüncü taraf"
 * konumu panelde de korunur.
 *
 * ERİŞİM: aşağıdaki ANAHTAR'ı kendi belirlediğiniz uzun bir dizeyle
 * değiştirin, panele
 *     https://avicad.com.tr/olcum-panel.php?anahtar=SIZIN_ANAHTARINIZ
 * adresiyle girin. Anahtar değiştirilmezse panel hiç açılmaz.
 */
declare(strict_types=1);

const ANAHTAR      = 'BURAYA_UZUN_BIR_ANAHTAR_YAZIN';
const VERI_KLASORU = __DIR__ . '/olcum-veri';
const GUN_SAYISI   = 30;

if (ANAHTAR === 'BURAYA_UZUN_BIR_ANAHTAR_YAZIN') {
    http_response_code(503);
    exit("Panel kapalı: olcum-panel.php içindeki ANAHTAR değeri değiştirilmemiş.\n");
}
if (!hash_equals(ANAHTAR, (string) ($_GET['anahtar'] ?? ''))) {
    http_response_code(404);   // 401 yerine 404: panelin varlığını ele vermiyoruz
    exit("Sayfa bulunamadı.\n");
}

// ─── Veriyi topla ───────────────────────────────────────────────────────────
$gunler = [];
$bolumToplam = [];
$formToplam = [];
$kaynakToplam = [];
$cihazToplam = [];

for ($i = GUN_SAYISI - 1; $i >= 0; $i--) {
    $tarih = date('Y-m-d', strtotime("-$i day"));
    $dosya = VERI_KLASORU . '/' . $tarih . '.json';
    $veri = is_readable($dosya) ? json_decode((string) file_get_contents($dosya), true) : null;
    $gunler[$tarih] = is_array($veri) ? (int) ($veri['sayfa'] ?? 0) : 0;
    if (!is_array($veri)) {
        continue;
    }
    foreach (['bolumler' => &$bolumToplam, 'form' => &$formToplam, 'kaynak' => &$kaynakToplam, 'cihaz' => &$cihazToplam] as $alan => &$hedef) {
        foreach ((array) ($veri[$alan] ?? []) as $ad => $sayi) {
            $hedef[$ad] = ($hedef[$ad] ?? 0) + (int) $sayi;
        }
    }
    unset($hedef);
}

$toplamZiyaret = array_sum($gunler);
$formBasarili  = (int) ($formToplam['basarili'] ?? 0);
$formHata      = (int) ($formToplam['hata'] ?? 0);
$donusum       = $toplamZiyaret > 0 ? round($formBasarili / $toplamZiyaret * 100, 1) : 0.0;
$mobil         = (int) ($cihazToplam['mobil'] ?? 0);
$masaustu      = (int) ($cihazToplam['masaustu'] ?? 0);
$mobilOran     = ($mobil + $masaustu) > 0 ? round($mobil / ($mobil + $masaustu) * 100) : 0;

arsort($bolumToplam);
arsort($kaynakToplam);

$enYuksekGun = max(1, max($gunler ?: [1]));
$enYuksekBolum = max(1, max($bolumToplam ?: [1]));

$g = static fn($s): string => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

// Bölüm id'lerini okunur adlara çevir.
$BOLUM_ADI = [
    'ana-icerik'   => 'Sayfa başı',
    'neden-avicad' => 'Neden AViCAD?',
    'hakkimizda'   => 'Hakkımızda',
    'karsilastirma' => 'AViCAD vs AutoCAD LT',
    'referanslar'  => 'Kullanıcı yorumları',
    'iletisim'     => 'İletişim formu',
    'sss'          => 'SSS',
];
?>
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Ölçüm Paneli — AviCAD Türkiye</title>
<style>
  /* Tek seri grafikler: marka mavisi tek hue yeterli, kategorik palet yok.
     Metin daima metin renginde — seri rengi metne uygulanmıyor. */
  :root {
    --yuzey: #ffffff;
    --zemin: #f6f8fb;
    --kenar: #e4e9f0;
    --metin: #0e1621;
    --metin-2: #48525f;
    --soluk: #7c8593;
    --marka: #0693e3;
    --marka-soft: rgba(6,147,227,0.14);
    --iyi: #2e7d52;
    --uyari: #b45309;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --yuzey: #131c27; --zemin: #0b1219; --kenar: #24303d;
      --metin: #edf1f7; --metin-2: #aab4c0; --soluk: #7c8593;
      --marka: #3aa8ea; --marka-soft: rgba(58,168,234,0.18);
      --iyi: #4caf7d; --uyari: #d98324;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 20px 60px; background: var(--zemin); color: var(--metin);
    font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .kap { max-width: 940px; margin: 0 auto; }
  h1 { font-size: 21px; margin: 0 0 4px; }
  .alt { color: var(--soluk); font-size: 13px; margin: 0 0 26px; }
  h2 { font-size: 15px; margin: 0 0 14px; font-weight: 600; }

  .kartlar { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px,1fr)); gap: 12px; margin-bottom: 26px; }
  .kart { background: var(--yuzey); border: 1px solid var(--kenar); border-radius: 12px; padding: 16px 18px; }
  .kart .etiket { font-size: 12px; color: var(--soluk); letter-spacing: 0.04em; text-transform: uppercase; }
  .kart .sayi { font-size: 30px; font-weight: 700; line-height: 1.15; margin-top: 6px; letter-spacing: -0.02em; }
  .kart .not { font-size: 12px; color: var(--metin-2); margin-top: 3px; }

  .blok { background: var(--yuzey); border: 1px solid var(--kenar); border-radius: 12px; padding: 20px; margin-bottom: 18px; }

  /* Dikey bar — günlük ziyaret. Uçlar 4px yuvarlatılmış ve tabana oturuyor. */
  .gunluk { display: flex; align-items: flex-end; gap: 2px; height: 150px; padding-top: 8px; }
  .gun { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; position: relative; }
  .gun i { display: block; background: var(--marka); border-radius: 4px 4px 0 0; min-height: 2px; transition: filter .15s; }
  .gun:hover i { filter: brightness(1.18); }
  .gun span {
    position: absolute; bottom: 100%; left: 50%; transform: translate(-50%,-6px);
    background: var(--metin); color: var(--yuzey); font-size: 12px; white-space: nowrap;
    padding: 4px 8px; border-radius: 6px; opacity: 0; pointer-events: none; transition: opacity .12s;
  }
  .gun:hover span { opacity: 1; }
  .eksen { display: flex; justify-content: space-between; color: var(--soluk); font-size: 11px; margin-top: 8px; }

  /* Yatay bar — bölüm derinliği ve kaynaklar. Etiketler uzun, yatay doğru form. */
  .satir { display: grid; grid-template-columns: 168px 1fr 54px; align-items: center; gap: 12px; margin-bottom: 9px; }
  .satir .ad { font-size: 13px; color: var(--metin-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .satir .cubuk { background: var(--marka-soft); border-radius: 5px; height: 22px; overflow: hidden; }
  .satir .cubuk i { display: block; height: 100%; background: var(--marka); border-radius: 5px; }
  .satir .deger { font-size: 13px; color: var(--metin); text-align: right; font-variant-numeric: tabular-nums; }

  .bos { color: var(--soluk); font-size: 14px; padding: 22px 0; text-align: center; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 6px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--kenar); }
  th { color: var(--soluk); font-weight: 600; font-size: 12px; }
  td:last-child, th:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  details { margin-top: 12px; }
  summary { cursor: pointer; color: var(--soluk); font-size: 13px; }
</style>
</head>
<body>
<div class="kap">
  <h1>Ölçüm Paneli</h1>
  <p class="alt">
    Son <?= GUN_SAYISI ?> gün · avicad.com.tr ·
    çerez kullanılmıyor, IP kaydedilmiyor, botlar sayılmıyor
  </p>

  <div class="kartlar">
    <div class="kart">
      <div class="etiket">Sayfa görüntüleme</div>
      <div class="sayi"><?= number_format($toplamZiyaret, 0, ',', '.') ?></div>
      <div class="not">son <?= GUN_SAYISI ?> günde</div>
    </div>
    <div class="kart">
      <div class="etiket">Form gönderimi</div>
      <div class="sayi" style="color:var(--iyi)"><?= $formBasarili ?></div>
      <div class="not"><?= $formHata > 0 ? "$formHata başarısız deneme" : 'başarısız gönderim yok' ?></div>
    </div>
    <div class="kart">
      <div class="etiket">Dönüşüm</div>
      <div class="sayi"><?= number_format($donusum, 1, ',', '.') ?>%</div>
      <div class="not">ziyaret başına form</div>
    </div>
    <div class="kart">
      <div class="etiket">Mobil</div>
      <div class="sayi"><?= $mobilOran ?>%</div>
      <div class="not"><?= $mobil ?> mobil · <?= $masaustu ?> masaüstü</div>
    </div>
  </div>

  <div class="blok">
    <h2>Günlük sayfa görüntüleme</h2>
    <?php if ($toplamZiyaret === 0): ?>
      <p class="bos">Henüz veri yok. Site ziyaret edildikçe burası dolacak.</p>
    <?php else: ?>
      <div class="gunluk">
        <?php foreach ($gunler as $tarih => $sayi): ?>
          <div class="gun">
            <span><?= $g(date('j F', strtotime($tarih))) ?>: <?= $sayi ?></span>
            <i style="height: <?= max(1, round($sayi / $enYuksekGun * 100)) ?>%"></i>
          </div>
        <?php endforeach; ?>
      </div>
      <div class="eksen">
        <span><?= $g(date('j F', strtotime(array_key_first($gunler)))) ?></span>
        <span>en yüksek: <?= $enYuksekGun ?></span>
        <span><?= $g(date('j F', strtotime(array_key_last($gunler)))) ?></span>
      </div>
    <?php endif; ?>
  </div>

  <div class="blok">
    <h2>Ziyaretçi nereye kadar iniyor</h2>
    <?php if (!$bolumToplam): ?>
      <p class="bos">Henüz veri yok.</p>
    <?php else: ?>
      <?php foreach ($bolumToplam as $id => $sayi): ?>
        <div class="satir">
          <div class="ad"><?= $g($BOLUM_ADI[$id] ?? $id) ?></div>
          <div class="cubuk"><i style="width: <?= max(2, round($sayi / $enYuksekBolum * 100)) ?>%"></i></div>
          <div class="deger"><?= $sayi ?></div>
        </div>
      <?php endforeach; ?>
      <details>
        <summary>Tablo görünümü</summary>
        <table>
          <tr><th>Bölüm</th><th>Görüntülenme</th></tr>
          <?php foreach ($bolumToplam as $id => $sayi): ?>
            <tr><td><?= $g($BOLUM_ADI[$id] ?? $id) ?></td><td><?= $sayi ?></td></tr>
          <?php endforeach; ?>
        </table>
      </details>
    <?php endif; ?>
  </div>

  <div class="blok">
    <h2>Ziyaretçiler nereden geliyor</h2>
    <?php if (!$kaynakToplam): ?>
      <p class="bos">Henüz veri yok.</p>
    <?php else: $enYuksekKaynak = max(1, max($kaynakToplam)); ?>
      <?php foreach (array_slice($kaynakToplam, 0, 10, true) as $ad => $sayi): ?>
        <div class="satir">
          <div class="ad"><?= $g($ad === 'dogrudan' ? 'Doğrudan / yer imi' : $ad) ?></div>
          <div class="cubuk"><i style="width: <?= max(2, round($sayi / $enYuksekKaynak * 100)) ?>%"></i></div>
          <div class="deger"><?= $sayi ?></div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
