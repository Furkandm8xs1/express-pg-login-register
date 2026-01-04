# 🔧 R2 CORS Ayarları

## Sorun
Tarayıcı R2'den resim yükleyemeyebilir - **CORS bloğu** sebebiyle

## Çözüm: AWS CLI ile CORS Ayarla

### 1. AWS CLI Yüklü mü kontrol et
```bash
aws --version
```

Yoksa: https://aws.amazon.com/cli/ adresinden indir

### 2. R2 Credentials'ı Konfigüre Et

```bash
# AWS credentials file oluştur veya düzenle
# Windows: C:\Users\<username>\.aws\credentials
# Mac/Linux: ~/.aws/credentials
```

Aç ve şu ekle:
```
[default]
aws_access_key_id = 393fdabbd10df5b2c922e0f4210fa03f
aws_secret_access_key = 583d46c2cbf63fad34da3756e7044106ac395ca8f8ecf324d80561f93c89d83b
```

### 3. CORS Ayarla

```bash
# Komutu çalıştır (PowerShell/Terminal'de):
aws s3api put-bucket-cors ^
  --bucket receipts ^
  --cors-configuration "AllowedHeaders=*,AllowedMethods=GET HEAD,AllowedOrigins=*,MaxAgeSeconds=3000" ^
  --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com ^
  --region auto
```

**Veya JSON dosyasıyla:**

1. `cors.json` dosyası oluştur:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

2. Komutu çalıştır:
```bash
aws s3api put-bucket-cors ^
  --bucket receipts ^
  --cors-configuration file://cors.json ^
  --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com ^
  --region auto
```

### 4. CORS'u Doğrula

```bash
aws s3api get-bucket-cors ^
  --bucket receipts ^
  --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com ^
  --region auto
```

---

## Cloudflare Dashboard'dan CORS Ayarla (Alternatif)

1. Cloudflare Dashboard'a git
2. **R2** seçimi yap
3. **receipts** bucket'ını seç
4. **Settings** → **CORS**
5. **Add CORS rule** tıkla
6. Doldur:
   - **Allowed Origins**: `*` (veya `http://localhost:3000`)
   - **Allowed Methods**: `GET`, `HEAD`
   - **Allowed Headers**: `*`
   - **Max Age**: `3000`
7. **Save**

---

## Test Et

Browser Console'a:
```javascript
fetch('https://receipts.857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com/users/1/profile.jpeg')
  .then(r => r.blob())
  .then(b => console.log('✅ CORS OK:', b.size, 'bytes'))
  .catch(e => console.error('❌ CORS Error:', e))
```

Eğer hata alırsan CORS ayarı eksiktir!

---

## Eğer Hala Sorun Varsa

### Option A: Custom Domain Kullan (Recommended)
R2 bucket'a **Custom Domain** ekle:
1. Cloudflare DNS'de CNAME kayıt oluştur
2. R2 Settings'de custom domain set et
3. Frontend'de URL'i custom domain'e değiştir

### Option B: Signed URLs Kullan
API'de R2'ye authorized GET URL'si dönüş yap:
```javascript
// Backend'de
const signedUrl = await s3.getSignedUrlPromise('getObject', {
  Bucket: bucket,
  Key: key,
  Expires: 3600
});
```

---

**Kontrol Listesi:**
- [ ] AWS CLI yüklü
- [ ] Credentials set edildi
- [ ] CORS komutu çalıştırıldı
- [ ] CORS doğrulandı (get-bucket-cors)
- [ ] Test fetch çalıştırıldı
- [ ] Browser console'da hata var mı kontrol ettim

