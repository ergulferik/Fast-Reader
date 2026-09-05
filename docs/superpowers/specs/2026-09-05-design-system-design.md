# Fast Reader — Design System (v3) Tasarım Dokümanı

**Tarih:** 2026-09-05
**Durum:** Tartışmaya hazır taslak (onay bekliyor)
**Kapsam:** UI/UX yenileme için design system + mevcut 3 yüzeyin yenilenmesi + yeni ayarlar paneli + HUD okuma UX iyileştirmeleri

**Kesinleşen kararlar:** Popup başlığı sade accent renk · HUD her zaman koyu · Ayarlar popup içi geçişli görünüm · Ayarlar'da Koyu/Açık/Sistem tema seçimi

---

## 1. Amaç ve Yön

Fast Reader'ın yeni versiyonu için **mevcut görsel kimliği koruyup olgunlaştıran** bir tasarım sistemi kurmak. "Sıfırdan yeni bir görünüm" değil; **evrimleştirme**: aynı DNA (koyu tema + turuncu vurgu + hafif glassmorphism), ama:

- Gradyan/parıltı (shimmer) gürültüsünü azalt, daha rafine gölge ve tipografi kullan.
- Her şeyi **design token**'lara oturt (şu an renkler ~15 yerde elle yazılı).
- **Otomatik koyu/açık tema** desteği ekle (`prefers-color-scheme`).
- Mevcut tutarsızlıkları temizle.

### Tasarım İlkeleri

1. **Okuma önce gelir.** Kelime kahramandır; tüm kontroller geri çekilir. Süslemeler dikkati dağıtmamalı.
2. **Tanıdık ama rafine.** Kullanıcı "aynı uygulama ama daha iyi" hissetmeli, "bambaşka bir şey" değil.
3. **Sistematik.** Renk, boşluk, tipografi, yarıçap, gölge, hareket — hepsi token'dan gelir; elle sabit değer yazılmaz.
4. **Erişilebilir.** Koyu+açık otomatik, WCAG AA kontrast, klavye öncelikli, `prefers-reduced-motion` ve `prefers-contrast` desteği.

---

## 2. Mevcut Durum Denetimi (nereden geliyoruz)

| Alan | Şu an | Sorun |
|------|-------|-------|
| Renk | `#ff6b35 → #f7931e` gradyanı elle ~15 yerde | Token yok; tek değişiklik = onlarca düzenleme |
| Tema | Sadece koyu | `prefers-color-scheme` yok |
| Focus outline | Popup'ta turuncu, HUD'da `#667eea` (mor) | Tutarsız — eski artık kod |
| Yarıçap | 8 / 10 / 12 / 16px karışık | Ölçek yok |
| Boşluk | 12 / 16 / 24px serbest | Ölçek yok |
| Font ağırlığı | 200–800 arası rastgele | Tanımlı ramp yok |
| Buton efekti | Kayan parıltı (`::before`) + `translateY` hover | Tarihli hisseder |
| Kapat butonu | Ayrı kırmızı gradyan | Sisteme bağlı değil |

Bunların hepsi bu çalışmada token sistemine bağlanacak ve düzeltilecek.

---

## 3. Token Mimarisi

**İki katmanlı** yapı, tek bir paylaşılan `src/styles/tokens.css` dosyasında:

### 3a. Primitive (ham) token'lar — tema-bağımsız
Renk rampaları ve ham ölçekler. Doğrudan komponentlerde KULLANILMAZ, sadece semantik token'ları beslerler.

```css
:root {
  /* Marka turuncusu (tek, rafine ton + varyantlar) */
  --orange-400: #ff8551;
  --orange-500: #ff6b35;   /* birincil vurgu */
  --orange-600: #ef5a1f;   /* hover/basılı */
  --orange-050: #fff1ea;   /* açık temada zemin tonu */

  /* Nötrler — saf siyah değil, hafif sıcak */
  --neutral-950: #14110f;
  --neutral-900: #1c1917;
  --neutral-800: #292524;
  --neutral-700: #3a3532;
  --neutral-400: #a8a29e;
  --neutral-200: #e7e5e4;
  --neutral-100: #f5f4f2;
  --neutral-000: #ffffff;

  /* Durum renkleri */
  --red-500: #ef4444;      /* kapat / hata */
  --green-500: #22c55e;    /* tamamlandı */
}
```

### 3b. Semantik token'lar — temaya göre eşlenir
Komponentler SADECE bunları kullanır. Koyu varsayılan, açık `@media` ile.

```css
:root {
  /* Koyu (varsayılan) */
  --surface:        var(--neutral-950);
  --surface-raised: var(--neutral-900);
  --surface-overlay: rgba(28, 25, 23, 0.72); /* glass panel */
  --border:         rgba(255, 255, 255, 0.08);
  --border-strong:  rgba(255, 255, 255, 0.16);
  --text:           var(--neutral-000);
  --text-muted:     var(--neutral-400);
  --text-faint:     rgba(255, 255, 255, 0.32); /* bağlam kelimeleri */
  --accent:         var(--orange-500);
  --accent-hover:   var(--orange-400);
  --accent-text:    #ffffff;
  --focus-ring:     var(--orange-500);
  --danger:         var(--red-500);
}

/* Açık palet — tek yerde tanımlanır, aşağıdaki üç seçici de bunu kullanır */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* açık değerler */ }
}
:root[data-theme="light"] { /* açık değerler */ }

/* Açık değerler (yukarıdaki iki seçicide aynen kullanılır) */
/*
  --surface: var(--neutral-100);  --surface-raised: var(--neutral-000);
  --surface-overlay: rgba(255,255,255,.78);
  --border: rgba(0,0,0,.08);      --border-strong: rgba(0,0,0,.16);
  --text: var(--neutral-900);     --text-muted: #57534e;
  --text-faint: rgba(0,0,0,.32);
  --accent: var(--orange-600);    --accent-hover: var(--orange-500);
  --accent-text: #fff;            --focus-ring: var(--orange-600);
  --danger: var(--red-500);
*/
```

### 3c. Manuel tema override (KESİNLEŞTİ)
Kullanıcı Ayarlar'dan **Koyu / Açık / Sistem** seçebilir. Mekanizma:

- Varsayılan = **Sistem**: hiçbir attribute yok → `prefers-color-scheme` geçerli.
- **Koyu** seçilince: `<html data-theme="dark">` → koyu değerler her koşulda kazanır.
- **Açık** seçilince: `<html data-theme="light">` → açık değerler her koşulda kazanır.
- Seçim `chrome.storage.local` içinde saklanır; popup ve ayarlar bu attribute'u `<html>`'e uygular.

> **HUD her zaman koyu (KESİNLEŞTİ).** HUD, kullanıcının sayfası üzerine bindirilen ayrı bir iframe olduğundan okuma odağı için tema seçiminden **bağımsız**, sabit koyu paletle çalışır. HUD kökü `data-theme="dark"` sabitlenir; `prefers-color-scheme`'e tepki vermez.

---

## 4. Ölçekler

### Tipografi
Font: **Inter** (mevcut), fallback `"Segoe UI", -apple-system, sans-serif`. Ağırlıklar **400 / 500 / 600 / 700** ile sınırlı (rastgele 200/800 kaldırılır).

| Token | Boyut | Kullanım |
|-------|-------|----------|
| `--font-display` | `clamp(3rem, 11vw, 9rem)` | HUD anlık kelime |
| `--font-title` | 1.125rem / 600 | Panel başlığı |
| `--font-body` | 0.875rem / 400 | Metin girişi, gövde |
| `--font-label` | 0.75rem / 500 | Etiketler, slider label |
| `--font-caption` | 0.6875rem / 400 | Alt bilgi, kredi |

### Boşluk (4 tabanlı)
`--space-1:4px` · `--space-2:8px` · `--space-3:12px` · `--space-4:16px` · `--space-6:24px` · `--space-8:32px`

### Yarıçap
`--radius-sm:8px` · `--radius-md:12px` · `--radius-lg:16px` · `--radius-full:999px`
(Karışık 10px değeri kaldırılır.)

### Elevation / Glass (2 seviye)
Shimmer efekti **tamamen kaldırılır**. Blur korunur ama standardize + hafifletilir.

```css
--elevation-1: 0 1px 2px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.24);
--elevation-2: 0 4px 16px rgba(0,0,0,.32);
--blur-panel: blur(12px);        /* eskiden 8–20px karışıktı */
--accent-glow: 0 0 0 3px rgba(255,107,53,.24); /* focus/hover ışıması */
```

### Hareket
```css
--ease-out: cubic-bezier(.2, 0, 0, 1);
--dur-fast: 120ms;
--dur-base: 200ms;
```
`translateY(-2/-3px)` hover sıçramaları yerine **hafif `scale(1.02)` + gölge** ve renk geçişi. `@media (prefers-reduced-motion: reduce)` altında tüm transition/animation kapatılır.

---

## 5. Komponent Envanteri

Tüm yüzeylerde paylaşılacak komponentler (hepsi semantik token kullanır):

- **Button** — `primary` (dolu accent), `secondary` (border + şeffaf), `ghost` (sadece metin), `icon` (kare/yuvarlak). Uppercase + letter-spacing kaldırılır; normal case, daha okunur.
- **IconButton / CloseButton** — nötr yüzey + hover'da `--danger` (ayrı gradyan yerine sistemden).
- **Slider (range)** — thumb accent, track `--border`; tek stil, WebKit + Firefox.
- **Progress** — ince, accent dolgu; parlama token'dan.
- **TextInput / Textarea** — `--surface-raised` zemin, `--border`, focus'ta `--accent-glow`.
- **Toggle / Switch** — YENİ (ayarlar için).
- **Segmented control** — YENİ (tema: Koyu/Açık/Sistem seçimi ve font seçimi için).
- **Kbd chip** — nötr yüzey (turuncu yerine `--surface-raised` + `--border`); kısayol rozetleri.
- **Panel / Card** — glass yüzey, `--elevation`, `--radius-lg`.
- **Selection FAB** — content script seçim ikonu; rafine, tek boyut, tutarlı gölge.

---

## 6. Yüzey 1 — Popup

Mevcut yapı korunur (başlık / textarea / aksiyonlar / kredi), token'lara taşınır.

Değişiklikler:
- Genişlik 400px kalır; iç boşluklar `--space` ölçeğine oturur.
- Başlıktaki gradyanlı metin **sade `--accent` renk** olur (KESİNLEŞTİ — gradyan hero yok).
- Butonlar yeni Button komponenti; uppercase kalkar.
- **Yeni:** sağ üstte küçük bir **ayarlar (⚙) ikon butonu** → popup içinde Ayarlar görünümüne geçer.
- Tema: seçime göre (Koyu/Açık/Sistem); Sistem'de otomatik.

---

## 7. Yüzey 2 — HUD (okuma ekranı) + UX İyileştirmeleri

Sadece stil değil, okuma deneyimi de gelişir:

- **ORP odak çizgisi:** anlık kelimenin ortasında sabit dikey bir hizalama kılavuzu; kelimeler bu eksene göre hizalanır (klasik RSVP odak noktası). Vurgulanan orta karakter `--accent`.
- **Sakin bağlam:** önceki/sonraki kelimeler `--text-faint`; okunmuş/okunmamış önizleme panelleri daha az göze batan, tek tutarlı stil.
- **Kontrol paneli:** üstte yüzen glass panel; hafifletilmiş blur + `--elevation-2`. Hız, ilerleme, oynat/duraklat/sıfırla.
- **İlerleme + kalan süre:** `x / y kelime` yanında tahmini kalan süre (WPM'den hesaplanır).
- **Kısayol ipuçları:** sağ altta; `--kbd` rozetleri nötrleşir, kapatılabilir/soluk.
- **Kapat:** IconButton, hover'da `--danger`.
- HUD **her zaman koyu** (tema seçiminden bağımsız — bkz. Bölüm 3c).

---

## 8. Yüzey 3 — Ayarlar Paneli (YENİ)

**Popup içinde geçişli görünüm** (KESİNLEŞTİ — ayrı pencere yok). ⚙ ikonuna basınca popup, giriş görünümünden ayarlar görünümüne yumuşak geçer; üstte geri (←) oku. `chrome.storage.local` ile kalıcı. Minimum, gerçekten değerli tercihler (YAGNI):

- **Varsayılan okuma hızı** (WPM) — slider. HUD açılışta bunu kullanır.
- **Tema** — Segmented: **Koyu / Açık / Sistem** (KESİNLEŞTİ). Seçim `<html data-theme>`'e uygulanır (bkz. 3c); popup + ayarlar yüzeyini etkiler, HUD hariç.
- **ORP odak çizgisi** — Toggle (aç/kapa).
- **Bağlam kelimeleri** — Toggle (önceki/sonraki kelimeleri göster/gizle).

Ayarlar durumu tek bir `settings` nesnesinde tutulur (`{ defaultWpm, theme, orp, contextWords }`); popup açılışında ve HUD başlangıcında okunur.

---

## 9. Erişilebilirlik

- Tüm metin/zemin çiftleri WCAG **AA** (normal metin ≥ 4.5:1, büyük metin ≥ 3:1). Açık temada accent `--orange-600`'a kaydırıldı çünkü `#ff6b35` beyaz üzerinde AA'yı geçmiyor.
- Görünür `:focus-visible` halkası (`--accent-glow`), tek tutarlı stil — mevcut `#667eea` hatası düzeltilir.
- `prefers-reduced-motion` ve `prefers-contrast: high` desteklenir.
- Klavye: Space/R/Esc korunur; tüm interaktif öğeler tab-erişilebilir.

---

## 10. Dosya Yapısı ve Migrasyon

```
src/styles/
  tokens.css      # YENİ — primitive + semantik token'lar (tek kaynak)
  base.css        # YENİ — reset, tipografi ramp, ortak yardımcılar
  components.css  # YENİ — Button, Slider, Toggle, Kbd, Panel...
  content.css     # Selection FAB + iframe (token'lara taşınır)
  hud.css         # (styles.css yeniden adlandırılır) HUD'a özel
  popup.css       # popup + ayarlar görünümü (token'lara taşınır)
```

Migrasyon prensibi: her sabit renk/boşluk/yarıçap değeri karşılık gelen token ile değiştirilir; `popup.js` içindeki inline stiller (hata bildirimi) token'lı bir sınıfa taşınır.

---

## 11. Kapsam Dışı (YAGNI)

- Onboarding / tanıtım ekranı (bu versiyonda yok).
- Tam görsel yeniden tasarım / yeni marka paleti.
- Font seçenekleri kütüphanesi (Inter yeterli; istenirse ileride).
- Kelime öbekleme (chunk / birden fazla kelime) — okuma motoru değişikliği, ayrı iş.

---

## 12. Kararlar (kesinleşti)

1. **Popup başlığı:** sade `--accent` renk (gradyan hero yok).
2. **HUD teması:** her zaman koyu, tema seçiminden bağımsız.
3. **Ayarlar:** popup içi geçişli görünüm (ayrı pencere yok).
4. **Tema kontrolü:** Ayarlar'da Koyu / Açık / Sistem seçimi; varsayılan Sistem (otomatik).
