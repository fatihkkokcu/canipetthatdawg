# Glide Arena

Mobil tarayıcı için top-down bir arcade oyunu. Karakteri **sanal joystick** ile sürüyorsun, yetenekleri
**ekran hareketleriyle** (çift dokunma, kaydırma, basılı tutma) tetikliyorsun. Dört tema var: buz pateni,
kaykay, uzay gemisi ve ralli — her biri farklı fizik ve farklı yeteneklerle geliyor.

Bu klasör kendi `package.json`'ı olan bağımsız bir projedir; olduğu gibi başka bir repoya taşınabilir.

## Çalıştırma

```bash
cd game
npm install
npm run dev      # http://localhost:5174 (telefondan test için --host açık)
npm run build    # production derlemesi -> dist/
npm run preview  # derlemeyi yerelde sun
```

Telefondan denemek için bilgisayarınla aynı Wi-Fi ağındayken `npm run dev` çıktısındaki
`http://192.168.x.x:5174` adresini telefon tarayıcısında aç.

## Kontroller

| Girdi | Ne yapar |
| --- | --- |
| Sol yarıya bas ve sürükle | Sanal joystick — parmağını bastığın yerde belirir, sürüklediğin yöne gider |
| Sağ yarıda çift dokunma | 1. yetenek (Ollie / Axel / Ateşleme / Nitro) |
| Sağ yarıda kaydırma | 2. yetenek (Kickflip / Atılım / Yan İtki / Sıçrama) |
| Sağ yarıda basılı tutma | 3. yetenek (Powerslide / Kızak / Kalkan / El Freni) |

Joystick ve komutlar aynı anda çalışır — sol elinle sürerken sağ elinle komut verebilirsin.

Masaüstünde test için: `WASD` / ok tuşları hareket, `Boşluk` çift dokunma, `Shift` kaydırma, `E` basılı tutma.

## Oynanış

90 saniyede en yüksek skoru topla:

- Toplanabilirler `10 × kombo` puan verir. Kombo her toplamada artar (en fazla ×8), 5 saniye toplamazsan
  veya bir engele çarparsan sıfırlanır.
- Yetenekler stil puanı kazandırır (ör. Ollie +30).
- Hız rampaları geçici hız takviyesi verir.
- Havadayken (zıplama/ollie) alçak engellerin üstünden geçersin.

Her tema için en iyi skor `localStorage`'da saklanır.

## Temalar

| Tema | Kontrol | His |
| --- | --- | --- |
| Buz Pateni | itki | Düşük sürtünme, düşük yanal tutuş — sürekli savrulur |
| Kaykay | itki | Hızlı ivme, sert dönüş, yüksek zıplama |
| Uzay Gemisi | itki | Neredeyse sürtünmesiz; ataleti yönetmen gerekir |
| Ralli | direksiyon | Joystick yukarı = gaz, sağ/sol = direksiyon; el freni savurtur |

Yeni bir tema eklemek için `src/game/themes.ts` içine bir `ThemeConfig` ekleyip `THEMES`/`THEME_LIST`'e
kaydetmek yeterli — fizik değerleri, palet, yetenek eşleşmeleri ve isimler oradan geliyor.

## Yapı

```
src/
  game/
    engine.ts     Oyun döngüsü, skor, çarpışma, kamera (sabit adımlı fizik)
    input.ts      Sanal joystick + hareket tanıma (dokunma/fare/klavye)
    player.ts     Fizik modeli ve yetenek efektleri
    world.ts      Arena üretimi: engeller, toplanabilirler, hız rampaları
    render.ts     Top-down canvas çizimi (zemin, sprite'lar, mini harita)
    particles.ts  Sabit kapasiteli parçacık havuzu
    themes.ts     Tema tanımları
  ui/             React arayüzü: menü, HUD, duraklatma ve sonuç ekranları
```

Oyun mantığı canvas üzerinde çalışır; React yalnızca menü ve HUD'u yönetir, bu yüzden her karede yeniden
render edilmez (HUD saniyede ~12 kez güncellenir).
