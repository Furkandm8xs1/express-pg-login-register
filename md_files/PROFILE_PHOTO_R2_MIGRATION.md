# Kullanıcı Profil Fotoğrafı - Base64'ten R2'ye Geçiş

## 📋 Proje Özeti
Kullanıcı profil fotoğraflarını base64 string yerine Cloudflare R2 Object Storage'da kaydetmek ve yönetmek için geliştirilmiş sistem.

### ✅ Avantajlar
- **Depolama**: Base64 yerine sadece URL saklanır (çok az yer kaplar)
- **Performans**: Resim yüklenmesi daha hızlı olur
- **Ölçeklenebilirlik**: Sınırsız resim depolayabilir
- **Güvenlik**: Veritabanında hassas veri kalmaz
- **Yönetim**: Silinmiş resimleri R2'den otomatik kaldır

---

## 🛠️ Yapılacak İşler

### 1️⃣ Backend Güncellemesi (`routes/user.js`)

#### a) Photo URL Güncelleme Endpoint'i
- `PUT /user/:id/photo` endpoint'ini güncelle
- Base64 string yerine FormData + multipart kabul et
- R2 Storage'a resim yükle
- Unique path oluştur: `users/{userId}/profile_{timestamp}.jpg`
- Eski fotoğrafı R2'den sil (varsa)
- Yeni URL'i DB'ye kaydet

#### b) User Fetch Endpoint'i
- `GET /user/:id`: Fotoğraf URL'ini doğru dönüş yap
- Resim olmadığında fallback URL dönüş

#### c) User Silme Endpoint'i
- `DELETE /user/:id`: Kullanıcı silinirken R2'deki resmini de sil

---

### 2️⃣ Frontend Güncellemesi (`frontend/public/js/profile.js`)

#### a) Canvas'tan Blob Oluşturma
- Cropped resim Base64 yerine Blob'a dönüştür
- Dosya boyutunu kontrol et (max 5MB)
- MIME type belirle (image/jpeg)

#### b) R2'ye Upload
- FormData oluştur: `{ photo: File }`
- `PUT /api/user/:id/photo` endpoint'ine gönder
- Loading state göster
- Hata yönetimi

#### c) Frontend Değişiklikleri
- `photoInput` event listener'ı güncelle
- `saveCroppedPhoto()` fonksiyonunu değiştir
- Response'dan gelen URL'i kullan
- Profile photo'yu güncelleyelim

---

### 3️⃣ Database Şeması

#### Mevcut Durum
```sql
-- users table'da zaten var:
ALTER TABLE users ADD COLUMN profile_photo VARCHAR(500);
-- Şu anda base64 string saklanıyor
```

#### Geçiş Planı
```sql
-- 1. Yeni kolon oluştur (geçiş sırasında)
-- 2. Eski Base64'leri NULL'a ayarla
-- 3. R2'ye upload et
-- 4. Yeni URL'leri sakla
-- 5. profile_photo kolon tipini VARCHAR(500) olarak tutabilir
```

---

### 4️⃣ R2 Dosya Yapısı

```
bucket/
├── receipts/
│   ├── {userId}/
│   │   ├── {timestamp}-{random}.jpg
│   │   └── ...
│
├── users/
│   ├── {userId}/
│   │   └── profile.jpg  ← Profil fotoğrafı burada
│   └── {userId}/
│       └── profile.jpg
```

---

### 5️⃣ Dosya Değişiklikleri

| Dosya | Değişiklik | Öncelik |
|-------|-----------|---------|
| `routes/user.js` | Photo endpoint güncelle | 🔴 Yüksek |
| `frontend/public/js/profile.js` | Canvas → Blob → Upload | 🔴 Yüksek |
| `frontend/public/css/profile.css` | Mobile responsive ekle | 🟠 Orta |
| `frontend/views/profile.html` | HTML güncelle (opsiyonel) | 🟢 Düşük |
| `utils/r2-storage.js` | Yardımcı fonksiyon | 🟠 Orta |

---

## 📝 Teknik Detaylar

### Backend Flow (Upload)
```
1. User fotoğraf seçer
2. Frontend canvas'da crop yapıp blob oluşturur
3. FormData ile server'a gönderir
4. Backend kontrolü:
   - Dosya tipini doğrula (image/*)
   - Boyutunu kontrol et (max 5MB)
5. Eski fotoğrafı R2'den sil (varsa)
6. Yeni fotoğrafı R2'ye yükle
   - Path: users/{userId}/profile.jpg
7. URL'i DB'ye kaydet
8. Frontend'e URL'i dönüş
9. UI'ı güncelle
```

### Frontend Flow
```
1. User fotoğraf seçer
2. Modal açılır (crop alanı)
3. User crop yapar
4. "Kaydet" butonu:
   - Canvas → Blob dönüştür
   - FormData oluştur
   - POST /api/user/{id}/photo
5. Response'dan URL al
6. Profile photo'yu güncelleştir
7. Success message göster
```

### Database Flow
```
Before:
profile_photo: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." (çok uzun)

After:
profile_photo: "https://r2-cdn-url/users/123/profile.jpg"
```

---

## 🔐 Güvenlik Özellikleri

### Validasyon
- ✅ Dosya tipi kontrolü (sadece resim)
- ✅ Dosya boyutu kontrolü (max 5MB)
- ✅ MIME type doğrulama
- ✅ User ownership doğrulama
- ✅ Malicious filename koruması

### Yetkilendirme
- ✅ `verifyToken`: Kullanıcı login mi?
- ✅ `requireOwnerOrAdmin`: Kendi fotoğrafını veya admin mi?

### R2 Configuration
- ✅ CORS ayarları (sadece domain'dan upload)
- ✅ Rate limiting (DDoS koruması)
- ✅ Access control (public read, authenticated write)

---

## 🚀 Uygulama Adımları

### Adım 1: Backend Hazırlığı
- [ ] `PUT /user/:id/photo` endpoint'i güncelle
- [ ] FormData parsing kodu ekle
- [ ] R2 deletion logic'i ekle
- [ ] Error handling ve validation ekle

### Adım 2: Frontend Hazırlığı
- [ ] `profile.js`'de `saveCroppedPhoto()` güncelle
- [ ] Canvas → Blob dönüşüm ekle
- [ ] FormData oluşturma kodu ekle
- [ ] Loading & error states ekle

### Adım 3: Testing
- [ ] Base64 fotoğraf yüklemeleri test et
- [ ] Fotoğraf silme işlemini test et
- [ ] Mobil cihazlarda test et
- [ ] Dosya boyutu limitini test et

### Adım 4: Migration (Production)
- [ ] Mevcut Base64 fotoğrafları R2'ye yükle
- [ ] Database'i güncelle
- [ ] Eski backup'ı al
- [ ] Sistem deploy et

---

## 💾 Kod Örnekleri

### Backend (user.js) - PUT Endpoint
```javascript
router.put("/user/:id/photo", 
  verifyToken, 
  validateUserId, 
  upload.single('photo'),  // Multer middleware
  requireOwnerOrAdmin, 
  async (req, res) => {
    // 1. Dosya validasyonu
    // 2. Eski fotoğrafı R2'den sil
    // 3. Yeni fotoğrafı R2'ye yükle
    // 4. URL'i DB'ye kaydet
    // 5. Response dönüş
  }
);
```

### Frontend (profile.js) - Upload Function
```javascript
async function saveCroppedPhoto() {
  try {
    const canvas = document.getElementById('cropCanvas');
    const blob = await canvasToBlob(canvas);
    
    const formData = new FormData();
    formData.append('photo', blob, 'profile.jpg');
    
    const response = await fetch(`/api/user/${userId}/photo`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    updateProfilePhoto(result.photoUrl);
  } catch (error) {
    console.error('Upload hatası:', error);
  }
}
```

---

## 🎯 Beklenen Sonuçlar

| Metrik | Önce | Sonra |
|--------|------|-------|
| **DB Boyutu/User** | ~100KB (Base64) | ~50 Byte (URL) | 
| **Yükleme Hızı** | Yavaş (Base64) | Hızlı (Multipart) |
| **Storage Limit** | 1GB ≈ 10 User | Sınırsız |
| **Resim Değişim** | Slow Query | Instant Update |

---

## 📞 Destek Notları

- R2 Config: `.env`'de `CLOUDFLARE_R2_*` variables'lar zaten var
- `uploadToR2()` fonksiyonu: `utils/r2-storage.js`'de mevcut
- `deleteFromR2()` fonksiyonu: Yeni eklemek gerekebilir
- Existing receipts yönetimi: Aynı sistem kullanıyor

---

## ✨ Bonus Özellikler (İleride)

- [ ] Resim compression (WebP formatına dönüştür)
- [ ] Resim cache (CDN ile)
- [ ] Resim versioning (eski foto backup)
- [ ] Resim editing tools (daha fazla filter)
- [ ] Batch upload (birden fazla resim)

---

**Güncelleme Tarihi**: 4 Ocak 2026
**Durum**: 🟡 Hazırlanıyor
**Sorumlu**: Development Team
