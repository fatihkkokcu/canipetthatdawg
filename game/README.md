# Glide Arena

Mobil tarayıcı için top-down bir arcade oyunu. Karakteri **sanal joystick** ile sürüyorsun, yetenekleri
**ekran hareketleriyle** (çift dokunma, kaydırma, basılı tutma) tetikliyorsun. Dört tema var: buz patencisi,
kaykaycı, uzay gemicisi ve ralli pilotu — her biri farklı fizik ve farklı yeteneklerle geliyor.

Görsel yön Journey ve Monument Valley'den geliyor: düz gouache yüzeyler, tek bir sıcak ışık kaynağı,
uzun yumuşak gölgeler ve arkanda savrulan bir atkı.

Bu klasör kendi `package.json`'ı olan bağımsız bir projedir; olduğu gibi başka bir repoya taşınabilir.

## Çalıştırma

```bash
cd game
npm install
npm run dev      # http://localhost:5174 (telefondan test için --host açık)
npm run build    # production derlemesi -> dist/
npm run preview  # derlemeyi yerelde sun

node scripts/bundle-single-file.mjs   # derlemeyi tek bir HTML dosyasına gömer
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

## Sanat yönü

- **Tek ışık kaynağı.** `render.ts` içindeki `LIGHT_X`/`LIGHT_Y` sahnedeki her şeyi aynı yönden
  aydınlatır. Anıtların her yüzü kendi normaline göre `faceDark` ile `faceLit` arasında karışır,
  gölgeler de aynı yönün tersine doğru süpürülerek çizilir. Hacim hissi buradan gelir.
- **Zemin boyalı, dokulu değil.** Büyük yumuşak kütleler (kumullar) + ince kontur çizgileri (rüzgâr
  izleri). Izgara ya da doku yok.
- **Atkı.** Oyuncunun son konumları tek bir daralan poligon olarak doldurulur; oyunun en Journey'li
  öğesi bu.
- **Avatarlar.** Buz patencisi ve kaykaycı, anıtlarla aynı 3/4 projeksiyonda *ayakta duran figürler*
  olarak çizilir: ekranda dik dururlar, gidiş yönüne göre aynalanır, virajda yana yatarlar; takla
  yaparken dikey eksende döndükleri için yatay eksende sıkışırlar. Tam tepeden çizilen bir insan
  kaçınılmaz olarak yıldız/böcek siluetine dönüşüyor — araçlar (gemi, otomobil) ise tepeden zaten
  okunduğu için yön açısıyla döndürülmeye devam eder.
- **Baş üç tona ayrılır.** Koyu saç / açık baş / gövde. Aynı tondaki baş ve omuz oyun ölçeğinde tek
  bir kütleye dönüşüyor.
- **Atmosfer.** Süzülen ışık zerreleri, ışık yönünden gelen sıcak parıltı ve hafif bir vinyet.
- Canvas gradyanlarında asla `transparent` durağı kullanma — tarayıcı şeffaf *siyaha* doğru
  interpolasyon yapıp her parıltının çevresine gri bir hâle bırakıyor. Bunun yerine `fade(renk, 0)`.

## Temalar

| Tema | Kontrol | His |
| --- | --- | --- |
| Buz Patencisi | itki | Düşük sürtünme, düşük yanal tutuş — sürekli savrulur |
| Kaykaycı | itki | Hızlı ivme, sert dönüş, yüksek zıplama |
| Uzay Gemicisi | itki | Neredeyse sürtünmesiz; ataleti yönetmen gerekir |
| Ralli Pilotu | direksiyon | Joystick yukarı = gaz, sağ/sol = direksiyon; el freni savurtur |

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
    render.ts     Top-down canvas çizimi: kumul zemini, faseta bölünmüş anıtlar,
                  yönlü ışık ve gölgeler, atmosfer katmanı
    particles.ts  Sabit kapasiteli parçacık havuzu
    themes.ts     Tema tanımları
  ui/             React arayüzü: menü, HUD, duraklatma ve sonuç ekranları
```

Oyun mantığı canvas üzerinde çalışır; React yalnızca menü ve HUD'u yönetir, bu yüzden her karede yeniden
render edilmez (HUD saniyede ~12 kez güncellenir).
