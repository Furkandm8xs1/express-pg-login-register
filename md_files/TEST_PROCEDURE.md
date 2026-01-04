# 🎯 Hızlı Test Prosedürü

## Yapman Gereken

1. **Sayfayı Yenile**: Profile sayfasını `Ctrl + Shift + R` (hard refresh) ile yenile

2. **DevTools Aç**: `F12` tuşuna bas

3. **Console Tab'ına Git**: DevTools'da "Console" sekmesine tıkla

4. **Şu Mesajları Ara ve Bana Söyle**:

```
Aranan Mesajlar:

🔴 BUNDLE MESAJLARI (Sayfayı yüklediğinde):
- "📷 profilePhoto element found: true" ← true mi false mi?
- "📷 Current src: ..." ← Ne yazıyor? SVG mi yoksa R2 linki mi?
- "📷 Width: ... Height: ..." ← Sayı mı yoksa 0 mi?
- "📷 Display: ..." ← flex mi, block mi, none mu?

🔵 API MESAJLARI (Biraz sonra):
- "📱 Kullanıcı verisi: {...}" ← Bu çıkıyor mu?
- "📸 Profil Fotoğrafı URL: https://..." ← URL yazıyor mu?
- "✅ Fotoğraf set ediliyor: ..." ← Bu yazıyor mu?

🔴 HATA MESAJLARI:
- Kırmızı error messages? Varsa tam metni yaz
- Network error? Cevapla
```

---

## Örnek Çıktılar

### ✅ BAŞARILI DURUM:
```
📷 profilePhoto element found: true
📷 Current src: data:image/svg+xml,...
📷 Width: 150 Height: 150
📷 Display: flex
📱 Kullanıcı verisi: {id: 1, username: "Ahmet", profile_photo: "https://..."}
📸 Profil Fotoğrafı URL: https://receipts.857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com/users/1/profile.jpg
✅ Fotoğraf set ediliyor: https://...
```

Sonra: **Profil fotoğrafı ekranda görünür olmalı**

---

### ❌ SORUN 1: Foto URL NULL
```
📷 profilePhoto element found: true
📱 Kullanıcı verisi: {..., profile_photo: null}
⚠️  Fotoğraf URL bulunamadı
```

**Çözüm**: 
```sql
-- Terminal'de kontrol et
SELECT profile_photo FROM users WHERE id = 1;
-- NULL dönüyorsa, fotoğraf upload başarısız olmuş
```

---

### ❌ SORUN 2: Element bulunamıyor
```
📷 profilePhoto element found: false
```

**Çözüm**: HTML'de `id="profilePhoto"` olan img tag'ı yok demektir. HTML kontrol etmeliyiz.

---

### ❌ SORUN 3: CORS Error (Resim açılmıyor ama URL doğru)
```
✅ Fotoğraf set ediliyor: https://...
```

Ama resim ekranda gözükmüyor + Console'da CORS hatası

**Çözüm**: R2 CORS ayarı yapmalıyız

---

## 📝 Rapor Şablonu

Bana şu şekilde sor/bildir:

> Console'da gördüğüm mesajlar:
> - profilePhoto element: [true/false]
> - Current src: [SVG/R2 URL]
> - Width/Height: [sayılar]
> - Profil Fotoğrafı URL: [null/URL]
> - Sayfada fotoğraf gözüküyor mu: [Evet/Hayır]
> - Console'da kırmızı error var mı: [Evet/Hayır/Varsa yazısı]

