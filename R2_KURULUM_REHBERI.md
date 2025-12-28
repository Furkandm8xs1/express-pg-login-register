# Cloudflare R2 Entegrasyonu - Adım Adım Kurulum

## 📋 Yapılan Değişiklikler

### 1. **Paketler Eklendi**
- `@aws-sdk/client-s3` - AWS S3 uyumlu API
- `multer-s3` - Multer ve S3 entegrasyonu

**Kurulum:**
```bash
npm install
```

### 2. **Yeni Dosyalar Oluşturuldu**

#### `utils/r2-storage.js`
Cloudflare R2 işlemleri için utility fonksiyonları:
- `uploadToR2(key, body, mimeType)` - Dosya yükle
- `deleteFromR2(key)` - Dosya sil
- `getFromR2(key)` - Dosya oku

#### `routes/receipts.js` (Güncellemesi)
- Multer diskStorage → memoryStorage (bellekte tutuş)
- Dosya yükleme R2'ye gönderilecek
- `image_path` → `image_url` (veritabanı)

#### `routes/proxy-receipt-image.js` (Opsiyonel)
- Güvenli resim erişimi
- Yalnızca kendi fişlerinin resimlerini görüntüle

#### `test-r2-connection.js`
- R2 bağlantısını test et
- Bucket'ları listele

### 3. **.env Güncellemesi**

```env
# --- Cloudflare R2 Object Storage Ayarları ---
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
R2_PUBLIC_URL=                 # Custom domain varsa doldur
```

## 🚀 Kurulum Adımları

### Adım 1: Cloudflare R2 Bucket Oluştur

1. https://dash.cloudflare.com açın
2. Sol menü → **R2** → **Create Bucket**
3. Bucket adı: `receipts`
4. Bölge: **Auto** seçin
5. **Create Bucket** tıklayın

### Adım 2: API Token Oluştur

1. **R2** → **Settings**
2. **API Tokens** bölümü → **Create API Token**
3. Aşağıdaki ayarları yapın:
   - **Token Name**: `receipt-upload`
   - **Permissions**: 
     - ✅ Object Read
     - ✅ Object Write
     - ✅ Object Delete
   - **Bucket Access**: Specific Bucket → `receipts`
4. **Create API Token** tıklayın
5. Token bilgilerini kopyalayın:
   ```
   Access Key ID: xxx
   Secret Access Key: xxx
   ```

### Adım 3: Account ID Bul

1. Cloudflare Dashboard → Sol üst (Ana Sayfada)
2. Sağ alt köşede **Account ID** görceksin
3. Kopyala

### Adım 4: .env Dosyasını Güncelle

```bash
nano .env
```

Aşağıdaki bölümü doldur:

```env
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8
R2_ACCESS_KEY_ID=1234567890abcdef1234567890abcdef
R2_SECRET_ACCESS_KEY=1234567890abcdef1234567890abcdef1234567890abcdef
R2_BUCKET_NAME=receipts
R2_ENDPOINT=https://a1b2c3d4e5f6g7h8.r2.cloudflarestorage.com
R2_PUBLIC_URL=
```

### Adım 5: Database'i Güncelle

```sql
-- PostgreSQL'e bağlan
\c userdb

-- image_url kolonu ekle
ALTER TABLE receipts 
ADD COLUMN image_url VARCHAR(500) NULLABLE;

-- (Opsiyonel) Eski image_path silebilirsin
-- ALTER TABLE receipts DROP COLUMN image_path;
```

### Adım 6: Bağlantıyı Test Et

```bash
npm run test-r2
```

**Beklenen çıktı:**
```
✅ Cloudflare R2'ye başarıyla bağlandı!

📦 Mevcut Bucketler:
   - receipts

✅ "receipts" bucket'ı bulundu!

📍 Endpoint: https://xxxx.r2.cloudflarestorage.com
🪣 Bucket: receipts
🔗 Varsayılan Public URL: https://receipts.xxxx.r2.cloudflarestorage.com
```

### Adım 7: Sunucuyu Başlat

```bash
npm run dev
```

## 🧪 Test Etme

### Test 1: Fiş Yükle

1. Tarayıcıda http://localhost:3000/my-receipts aç
2. Bir fişin resmini seç ve yükle
3. Console'da hata var mı kontrol et
4. Başarıysa: `✅ Dosya R2'ye yüklendi: receipts/...`

### Test 2: Database Kontrol

```sql
SELECT id, merchant_name, image_url FROM receipts LIMIT 5;
```

`image_url` sütunu dolu mu kontrol et:
```
id | merchant_name  | image_url
1  | Carrefour     | https://receipts.xxxx.r2.cloudflarestorage.com/receipts/1/1234567-xyz.jpg
```

## 🔧 Sorun Giderme

### Hata: "R2 API'sine bağlanmıyor"

```bash
# .env kontrol et
cat .env | grep R2_

# Token yanlışsa, yeni oluştur
# Cloudflare Dashboard → R2 → Settings → API Tokens
```

### Hata: "Bucket bulunamadı"

```bash
npm run test-r2

# Bucket adını kontrol et
# R2_BUCKET_NAME doğru mu?
```

### Hata: "Dosya yüklenemedi (413 Payload Too Large)"

Multer limit'ini artır [routes/receipts.js](routes/receipts.js):
```javascript
limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
```

### Resim Ekranda Görmüyorum

1. Browser console açın (F12)
2. Network tab → image request kontrol et
3. Status 403 ise → Bucket public değil

**Çöz:**
```bash
# Cloudflare R2 Dashboard → Bucket Settings
# Public Access: ON yap
```

## 📂 Dosya Yapısı

```
backend-project/
├── utils/
│   ├── r2-storage.js           # R2 operasyonları
│   ├── authMiddleware.js       # Token doğrulama
│   └── jwt.js
├── routes/
│   ├── receipts.js             # Güncellenmiş (R2 kullanıyor)
│   ├── proxy-receipt-image.js  # Opsiyonel güvenli proxy
│   └── ...
├── .env                        # R2 ayarları
├── server.js                   # server.js (uploads silinmiş)
├── test-r2-connection.js       # Test scripti
├── CLOUDFLARE_R2_SETUP.md      # Bu dosya
└── migrations/
    └── 001-add-r2-support.sql  # Database migration
```

## 📊 Akış Diyagramı

```
Frontend (File Upload)
    ↓
Backend (routes/receipts.js)
    ↓
Multer (Memory Storage)
    ↓
Gemini API (OCR)
    ↓
uploadToR2() ← S3Client
    ↓
Cloudflare R2 (Object Storage)
    ↓
Database (image_url kaydet)
    ↓
Frontend (R2 URL'sinden resim göster)
```

## ✅ Kontrol Listesi

- [ ] npm install tamamlandı
- [ ] Cloudflare R2 bucket oluşturuldu
- [ ] API Token oluşturuldu
- [ ] Account ID bulundu
- [ ] .env dosyası dolduruldu
- [ ] Database'e image_url kolonu eklendi
- [ ] `npm run test-r2` başarılı çalıştı
- [ ] `npm run dev` sunucu çalışıyor
- [ ] Fiş yükle testi yapıldı
- [ ] Database'de image_url göründü
- [ ] Frontend'de resim görüntüleniyor

## 📚 Faydalı Linkler

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK v3 S3](https://docs.aws.amazon.com/sdk-for-javascript/latest/developer-guide/welcome.html)
- [R2 Pricing](https://www.cloudflare.com/pricing/r2/)

## 💡 İpuçları

1. **Custom Domain Ekle** (İsteğe Bağlı):
   - Cloudflare R2 Settings → Custom Domains
   - Kendi domain'ini bağla (ör: `receipts.example.com`)
   - `.env`'de R2_PUBLIC_URL güncelle

2. **Dosya Organizasyonu**:
   - Dosyalar otomatik olarak `receipts/{userId}/{timestamp}.jpg` şeklinde kaydediliyor
   - Güvenlik sağlamak için userId ile klasörleme yapıldı

3. **Maliyeti Düşür**:
   - Eski fişleri silmek için `deleteFromR2()` kullan
   - R2 çok ucuz (100GB / ay benzer fiyat)

---

**Sorular?** Backend repo dosyalarına bakın veya Cloudflare dokumentasyonuna başvurun.
