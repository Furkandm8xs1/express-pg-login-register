# Cloudflare R2 Setup Rehberi

Bu proje artık fişlerin Cloudflare R2 Object Storage'da depolanmasını desteklemektedir.

## 1. Gerekli Paketleri Yükle

```bash
npm install
```

`@aws-sdk/client-s3` ve `multer-s3` paketleri otomatik yüklenecektir.

## 2. Cloudflare R2 Bucket Oluştur

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sol menüden **R2** → **Create Bucket** seç
3. Bucket adı: `receipts` (veya istediğin isim)
4. Bölge: Otomatik seç
5. **Create Bucket** tıkla

## 3. Cloudflare R2 API Token Oluştur

1. Cloudflare Dashboard → **R2** → **Settings**
2. **API Tokens** bölümünde **Create API Token** tıkla
3. Token tipi: **S3 API Token** seç
4. Permissions: 
   - `Object Read`
   - `Object Write`
   - `Object Delete`
5. Token oluştur ve kaydet:
   - **Access Key ID**
   - **Secret Access Key**

## 4. .env Dosyasını Güncelle

`.env` dosyasında aşağıdaki bilgileri doldurun:

```env
# --- Cloudflare R2 Object Storage Ayarları ---
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_api_token_access_key
R2_SECRET_ACCESS_KEY=your_api_token_secret_access_key
R2_BUCKET_NAME=receipts
R2_ENDPOINT=https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
R2_PUBLIC_URL=                 # Custom domain varsa doldur, yoksa boş bırak
```

**Bilgileri nasıl bulursun:**
- **R2_ACCOUNT_ID**: Cloudflare Dashboard → Account → Home → Account ID (alt sağ)
- **R2_ACCESS_KEY_ID & SECRET**: Yukarıda oluşturduğun API Token'dan

## 5. Database Schema'yı Güncelle

`receipts` tablosuna `image_url` kolonu ekleme:

```sql
ALTER TABLE receipts 
ADD COLUMN image_url VARCHAR(500) NULLABLE;
```

**Opsiyonel - Eski image_path'i temizle:**
```sql
-- Varsa eski veriden migrasyon:
UPDATE receipts 
SET image_url = 'https://your_bucket.r2.cloudflarestorage.com/receipts/' || image_path
WHERE image_path IS NOT NULL AND image_url IS NULL;

-- Veya silebilirsin:
-- ALTER TABLE receipts DROP COLUMN image_path;
```

## 6. Sunucuyu Çalıştır

```bash
npm run dev
```

## Dosya Yükleme Akışı

1. Kullanıcı fişin resmini yükler
2. Backend, Multer ile dosyayı belleğe yükler (disk'e değil)
3. Gemini API resmi analiz eder
4. Dosya R2'ye yüklenir: `receipts/{userId}/{timestamp}-{random}.jpg`
5. R2 public URL'si veritabanına kaydedilir
6. Frontend, R2 URL'sinden resimi doğrudan gösterir

## Public URL Nasıl Oluşturuluyor?

Eğer custom domain yoksa, URL şu formatta oluşturulur:
```
https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{key}
```

Custom domain eklemek için:
1. Cloudflare Dashboard → **R2** → **Bucket Settings**
2. **Custom Domains** → **Connect Domain**
3. Kendi domain'inizi bağla (örn: `receipts.example.com`)

Sonra `.env`'de güncelle:
```env
R2_PUBLIC_URL=https://receipts.example.com
```

## Güvenlik Notu

- Dosyaların R2 URL'leri **public** erişilebilir
- Eğer gizli tutmak istersen, proxy route'unu kullan: `/api/receipts/{receiptId}/image`
- Proxy route'u, kullanıcıya sadece kendi fişlerinin resimlerini gösterir

## Sorunları Çöz

### "Cloudflare R2'ye bağlanmıyor"
- R2_ACCOUNT_ID, ACCESS_KEY, SECRET_KEY doğru mu?
- `.env` dosyasını yeniden kontrol et
- Endpoint URL'sini kontrol et

### "Dosya yüklenmedi"
- Dosya boyutu 50MB'dan küçük mü?
- Dosya format JPEG/PNG/GIF mi?
- `npm install` yeniden çalıştır

### "Resim sayfada görmüyorum"
- R2 bucket'ı public mu?
- Custom domain eklemişse, R2_PUBLIC_URL doğru mu?

## Bulut Depolama Avantajları

✅ Sunucuda disk alanı tasarrufu  
✅ Sınırsız dosya depolama  
✅ CDN ile hızlı yükleme  
✅ Otomatik yedek ve güvenlik  
✅ İşletim sistemi bağımsız
