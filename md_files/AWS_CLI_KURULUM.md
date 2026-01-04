# 📚 AWS CLI Kurulumu - Baştan Sona Rehber (Windows için)

## 1️⃣ AWS CLI İndir

### Adım 1: İndirme Linki
Tarayıcında şu linke git:
```
https://awscli.amazonaws.com/AWSCLIV2.msi
```

Otomatik indirme başlayacak. İndirilen dosya: **AWSCLIV2.msi**

### Adım 2: Kurulumu Başlat
1. İndirilen **AWSCLIV2.msi** dosyasına çift tıkla
2. "Windows Installer" açılacak
3. **"Install"** butonuna tıkla
4. Kurulum tamamlanıncaya kadar bekle (1-2 dakika)
5. **"Close"** tıkla

### Adım 3: Kurulumu Doğrula

1. **Windows Start** menüsünü aç (Windows tuşu)
2. **cmd** veya **PowerShell** yazıp aç
3. Şunu yazıp Enter'a bas:
```bash
aws --version
```

✅ Başarılı çıktı örneği:
```
aws-cli/2.x.x Python/3.x.x Windows/10
```

❌ Hata alırsan kurulum başarısız demektir, yeniden dene.

---

## 2️⃣ AWS Credentials Ayarla

### Adım 1: Credentials Dosyası Oluştur

**Seçenek A: Otomatik (Önerilen)**

Aynı PowerShell/CMD'de şunu yazıp Enter'a bas:
```bash
aws configure
```

Sana 4 soru soracak. Cevapları:

```
AWS Access Key ID [None]: 393fdabbd10df5b2c922e0f4210fa03f
AWS Secret Access Key [None]: 583d46c2cbf63fad34da3756e7044106ac395ca8f8ecf324d80561f93c89d83b
Default region name [None]: auto
Default output format [None]: json
```

✅ Done! Dosya otomatik oluşturuldu.

---

**Seçenek B: Manual (Eğer Seçenek A çalışmazsa)**

1. **Windows Start** tuşu → **Dosya Yöneticisi** aç
2. Sol panelde **"Bu Bilgisayar"** seçip çift tıkla
3. Adres çubuğuna şunu kopyala yapıştır:
```
C:\Users\%USERNAME%\.aws
```
4. Enter'a bas

❌ **".aws" klasörü yoksa**:
- Boş bir yere sağ tıkla → **Yeni** → **Klasör**
- Adı `.aws` yap (başında nokta var!)

✅ **.aws klasörü var ise**:
- İçine girebilirsin

5. **.aws** klasöründe sağ tıkla → **Yeni** → **Metin Belgesi**
6. Adı `credentials` yap (`.txt` ekleme!)
7. Aç ve şu yazı yapıştır:
```
[default]
aws_access_key_id = 393fdabbd10df5b2c922e0f4210fa03f
aws_secret_access_key = 583d46c2cbf63fad34da3756e7044106ac395ca8f8ecf324d80561f93c89d83b
```
8. Kaydet (Ctrl+S)

9. Aynı klasörde yeni bir metin dosyası daha oluştur: **config**
10. Şunu yapıştır:
```
[default]
region = auto
output = json
```
11. Kaydet

✅ Done! Her iki dosya oluşturuldu.

---

## 3️⃣ CORS Ayarını Yap (Ana İşlem)

### Adım 1: PowerShell/CMD'de Bu Komutu Çalıştır

PowerShell'i aç (Windows Start → PowerShell yazıp aç)

Şu komutu **TAMAMEN** kopyala ve yapıştır:
```powershell
aws s3api put-bucket-cors --bucket receipts --cors-configuration file://cors.json --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com --region auto
```

Ama **ÖNCE** bir `cors.json` dosyası oluşturman gerekli!

### Adım 2: cors.json Dosyası Oluştur

1. **Dosya Yöneticisi** aç
2. **Bill project** klasörüne git (C:\Users\furkanali\Desktop\bill project)
3. Boş alana sağ tıkla → **Yeni** → **Metin Belgesi**
4. Adı `cors.json` yap
5. **Düzenle** (sağ tıkla) ve şu yazı yapıştır:

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

6. **Kaydet** (Ctrl+S)

⚠️ **ÖNEMLİ**: Dosyanın **adı tam olarak** `cors.json` olmalı!

### Adım 3: Komutu Çalıştır

PowerShell'de şunu yazıp Enter'a bas:
```powershell
cd C:\Users\furkanali\Desktop\bill project
```

Sonra şu komutu yapıştır:
```powershell
aws s3api put-bucket-cors --bucket receipts --cors-configuration file://cors.json --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com --region auto
```

✅ Başarılı çıktı: **(Hiç çıktı yok = başarılı!)**

❌ Hata alırsan, hata mesajını bana kopyala yapıştır!

---

## 4️⃣ CORS'u Doğrula

Aynı PowerShell'de şunu çalıştır:
```powershell
aws s3api get-bucket-cors --bucket receipts --endpoint-url https://857b03dc23fb46cb61d24c54920be252.r2.cloudflarestorage.com --region auto
```

✅ Başarılı çıktı (CORS Rules görülmeli):
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": [
                "*"
            ],
            "AllowedMethods": [
                "GET",
                "HEAD"
            ],
            "AllowedOrigins": [
                "*"
            ],
            "ExposeHeaders": [
                "ETag"
            ],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

---

## 5️⃣ Test Et

Browser'ı aç ve **Profile sayfasına** git:
```
http://localhost:3000/profile
```

### F12 ile Console'u Aç:
1. **F12** tuşuna bas
2. **Console** sekmesine tıkla
3. Şunları ara:

```
✅ Başarı işareti:
- "✅ Fotoğraf başarıyla yüklendi"

❌ Hata işareti:
- Kırmızı CORS hatası
- "❌ Fotoğraf yüklenemedi"
```

---

## 🆘 Sorun Giderme

### Problem: "aws command not found"
**Çözüm**: 
- Bilgisayarı yeniden başlat
- PowerShell yerine **CMD** dene

### Problem: "File not found: cors.json"
**Çözüm**:
- cors.json'ın **"Bill project" klasöründe** olduğundan emin ol
- PowerShell'de `cd C:\Users\furkanali\Desktop\bill project` yazıp çalıştır

### Problem: Credentials hatası
**Çözüm**:
- credentials dosyasını kontrol et: `C:\Users\<username>\.aws\credentials`
- Access Key ve Secret Key'in **TAMAMEN** doğru yazılı olduğunu kontrol et

### Problem: CORS hala çalışmıyor
**Çözüm**:
- Tarayıcı cache'i temizle: **Ctrl + Shift + Delete** → **Cached images and files** → **Delete**
- Sayfayı yenile: **Ctrl + Shift + R**

---

## 📋 Kontrol Listesi

- [ ] AWS CLI yüklü (`aws --version` çalıştı)
- [ ] Credentials ayarlandı (credentials dosyası oluşturuldu)
- [ ] cors.json dosyası oluşturuldu (Bill project klasöründe)
- [ ] CORS komutu çalıştırıldı (hata almadı)
- [ ] get-bucket-cors komutu başarılı (JSON çıktı)
- [ ] Sayfayı yeniledin (Ctrl+Shift+R)
- [ ] Console'da başarı mesajı var mı kontrol ettim

---

## 💬 Yardıma İhtiyacın Varsa

Şunları bana söyle:
1. Hangi adımda takıldın?
2. Hata mesajı tam nedir? (kopyala yapıştır)
3. PowerShell/CMD'de ne çıktı?

Sonra çözerim! 🚀

