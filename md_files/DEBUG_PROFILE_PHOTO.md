# 🔍 Profil Fotoğrafı Debug Rehberi

## Sorunun Kaynağını Bulma

### 1️⃣ Browser Console'da Kontrol

1. Profile sayfasını aç
2. **F12** tuşuna basarak DevTools'u aç
3. **Console** tab'ına git
4. Şunları gör:

```
✅ BEKLENEN MESAJLAR:
- "📱 Kullanıcı verisi: {...}"
- "📸 Profil Fotoğrafı URL: https://..."
- "✅ Fotoğraf set ediliyor: https://..."
```

```
❌ SORUN İŞARETLERİ:
- "⚠️  Fotoğraf URL bulunamadı" → DB'de NULL kaydedilmiş
- "Kullanıcı bulunamadı" → API hata dönüyor
- Network error → Server bağlantı sorunu
```

### 2️⃣ Network Tab'ında Kontrol

DevTools → **Network** tab'ı

**GET /user/{id} İsteği**:
```json
Response (Status: 200):
{
  "id": 1,
  "username": "Ahmet",
  "email": "ahmet@example.com",
  "created_at": "2026-01-04...",
  "profile_photo": "https://bucket.account.r2.cloudflarestorage.com/users/1/profile.jpg"
}
```

✅ Eğer `profile_photo` null ise → SQL kolonu doğru oluşturulmuş mu kontrol et

### 3️⃣ Elements Tab'ında Kontrol

DevTools → **Elements/Inspector** tab'ı

```html
<!-- Inspektörde bul: -->
<img id="profilePhoto" class="profile-photo" 
     src="https://bucket.r2.cloudflarestorage.com/users/1/profile.jpg">
```

✅ Eğer `src` hala SVG ise → JavaScript fotoğrafı set etmemiş
❌ Eğer `src` R2 linki ise ama resim gözükmüyor → CORS/CDN sorunu

### 4️⃣ R2 CDN URL'sinin Erişilebilir Olup Olmadığını Test Et

Browser'da şu URL'yi direkt aç:
```
https://[bucket-name].[account-id].r2.cloudflarestorage.com/users/1/profile.jpg
```

✅ Eğer resim açılırsa → CORS sorunu
❌ Eğer 404 veya redirect ise → Dosya R2'de yok

---

## 🛠️ Çözümleri Deneyin

### Çözüm 1: DOM Ready Sorunu (ÇÖZÜLDÜ ✅)

Değişiklik: `loadUserInfo()` → `DOMContentLoaded` event'ine alındı

```javascript
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});
```

**Test**: Sayfayı yenileyip console'da mesajları gör

---

### Çözüm 2: R2 CORS Sorunu

**Problem**: "Mixed Content" veya CORS bloğu

**Çözüm**: R2 bucket'ında CORS ayarla

```bash
# AWS CLI ile
aws s3api put-bucket-cors \
  --bucket your-bucket \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "MaxAgeSeconds": 3000
    }]
  }' \
  --endpoint-url https://your-account.r2.cloudflarestorage.com
```

**Veya Cloudflare UI'da**:
- R2 Settings → CORS
- GET, HEAD metodlarını allow et
- Origin'ini (http://localhost:3000) ekle

---

### Çözüm 3: R2 Public URL Ayarı

R2 bucket'ında **Custom Domain** veya **Public URL** ayarlı mı kontrol et:

1. Cloudflare R2 Dashboard
2. Bucket seçimi
3. Settings → **Public URL** veya **Custom Domain**
4. Etkinleştirildi mi kontrol et

---

### Çözüm 4: API Response'ını Kontrol Et

Terminal'de test yapın:

```bash
# Profile API çağrısını test et
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/user/1 \
     -H "Content-Type: application/json"

# Dönüş şu şekilde olmalı:
{
  "id": 1,
  "username": "...",
  "profile_photo": "https://..."
}
```

---

### Çözüm 5: Database'de Kontrol

```sql
-- Fotoğraf URL'sinin kaydedilip kaydedilmediğini kontrol et
SELECT id, username, profile_photo FROM users WHERE id = 1;

-- Çıktı örneği:
-- id | username | profile_photo
-- 1  | Ahmet    | https://bucket.r2.cloudflarestorage.com/users/1/profile.jpg
```

✅ Eğer NULL ise → Fotoğraf upload başarısız olmuş
❌ Eğer URL var ise → Problem JavaScript veya CORS

---

## 📋 Kontrol Listesi

- [ ] Console'da debug mesajlarını gördüm
- [ ] Network tab'ında response URL var mı kontrol ettim
- [ ] HTML'de img tag'ının src'si güncellendi mi gördüm
- [ ] R2 linki browser'da direkt açılabiliyor mu test ettim
- [ ] R2 CORS ayarlarını kontrol ettim
- [ ] Database'de profile_photo kolonu var mı kontrol ettim
- [ ] API response'u correct dönüyor mu test ettim

---

## 🚀 Hızlı Düzeltme Adımları

1. Sayfayı **hard refresh** yap: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
2. Browser cache'i temizle: DevTools → Application → Clear Cache
3. Console'daki mesajları oku
4. Yukarıdaki çözümleri teker teker dene
5. Hala sorun varsa → Çözümün adını söyle, biraz daha debug yapabilirim

---

**Tarih**: 4 Ocak 2026  
**Status**: Debugging
