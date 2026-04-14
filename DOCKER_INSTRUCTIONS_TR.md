# Docker Kullanım Talimatları

Bu belge, Receipt-AI uygulamasını Docker ile çalıştırmanız için gereken tüm talimatları içerir.

## 📋 İçindekiler

- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Temel Komutlar](#temel-komutlar)
- [Environment Değişkenleri](#environment-değişkenleri)
- [Ağ ve Portlar](#ağ-ve-portlar)
- [Sorun Giderme](#sorun-giderme)
- [Üretim Dağıtımı](#üretim-dağıtımı)

---

## 🔧 Gereksinimler

Docker ve Docker Compose'u sisteminize yüklemeniz gerekir.

### macOS

```bash
# Homebrew ile yükleyin
brew install docker
brew install docker-compose

# Alternatif: Docker Desktop'ı indirin
# https://www.docker.com/products/docker-desktop
```

### Windows

```bash
# Docker Desktop'ı indirin (Docker Compose dahil)
# https://www.docker.com/products/docker-desktop
```

### Linux (Debian/Ubuntu)

```bash
# Docker yükleyin
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Daemon başlatın
sudo systemctl start docker
sudo systemctl enable docker

# Kullanıcı ekleme (sudo olmadan çalıştırmak için)
sudo usermod -aG docker $USER
```

---

## 📦 Kurulum

### 1. Environment Dosyası Oluşturun

`.env.example` dosyasından `.env` dosyasını oluşturun:

```bash
cp .env.example .env
```

### 2. `.env` Dosyasını Düzenleyin

`.env` dosyasında gerekli bilgileri girin:

```bash
# Database Ayarları
DB_USER=macbook
DB_PASSWORD=your_secure_password
DB_NAME=billproject

# JWT Secrets (Üretim için güçlü değerler kullanın)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production

# Cloudflare R2 (Storage) Ayarları
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your_custom_domain_or_default_r2_url

# Email Ayarları (İsteğe bağlı)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASSWORD=your_app_password
```

### 3. Docker Konteynerlerini Başlatın

```bash
# Konteyner imajlarını indir, derle ve başlat
docker-compose up -d

# Çıkışı izleyin
docker-compose up

# Belirli bir servis başlat
docker-compose up -d db       # Sadece veritabanı
docker-compose up -d server   # Sadece sunucu
```

---

## 🚀 Temel Komutlar

### Konteyner Yönetimi

```bash
# Durumu göster
docker-compose ps

# Konteyner loglarını göster
docker-compose logs

# Server loglarını izle (real-time)
docker-compose logs -f server

# Database loglarını göster
docker-compose logs db

# Konteyner kapatma
docker-compose down

# Tüm verileri sil (veritabanı dahil)
docker-compose down -v

# Konteyner yeniden başlat
docker-compose restart

# Belirli servisi yeniden başlat
docker-compose restart server
```

### Konteyner İçinde Komut Çalıştırma

```bash
# Server konteynerinde bash açın
docker-compose exec server /bin/sh

# Veritabanında SQL komutu çalıştırın
docker-compose exec db psql -U macbook -d billproject -c "SELECT version();"

# npm komutu çalıştırın
docker-compose exec server npm list

# Dosya kopyala (konteynerini dili kopyala)
docker-compose exec server cat server.js
```

### İmaj Yönetimi

```bash
# Tüm yerel imajları listele
docker images

# Konteyner imajını manuel olarak derle
docker build -t receipt-ai:latest .

# Docker imajını sil
docker rmi receipt-ai:latest

# Kullanılmayan imajları temizle
docker image prune
```

---

## 🔐 Environment Değişkenleri

### Zorunlu Değişkenler

| Değişken         | Açıklama                       | Örnek                |
| ---------------- | ------------------------------ | -------------------- |
| `DB_USER`        | PostgreSQL kullanıcı adı       | `macbook`            |
| `DB_PASSWORD`    | PostgreSQL şifresi             | `secure_password`    |
| `DB_NAME`        | Veritabanı adı                 | `billproject`        |
| `JWT_SECRET`     | JWT imzalama anahtarı (güçlü!) | `random_long_string` |
| `REFRESH_SECRET` | Yenileme token anahtarı        | `random_long_string` |

### Cloudflare R2 Ayarları (Depolama için)

| Değişken               | Açıklama               |
| ---------------------- | ---------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare hesap ID'si |
| `R2_ACCESS_KEY_ID`     | R2 erişim anahtarı     |
| `R2_SECRET_ACCESS_KEY` | R2 gizli anahtarı      |
| `R2_BUCKET_NAME`       | Depo adı               |
| `R2_ENDPOINT`          | R2 uç noktası URL'si   |
| `R2_PUBLIC_URL`        | Herkese açık URL (CDN) |

### İsteğe Bağlı Değişkenler

| Değişken        | Açıklama                        |
| --------------- | ------------------------------- |
| `SMTP_HOST`     | Email sunucusu (Gmail vb.)      |
| `SMTP_PORT`     | SMTP portu (genellikle 587)     |
| `SMTP_USER`     | Email adresi                    |
| `SMTP_PASSWORD` | Email şifresi                   |
| `NODE_ENV`      | `production` veya `development` |

---

## 🌐 Ağ ve Portlar

### Erişim Noktaları

| Servis   | Port | URL                     | Açıklama                          |
| -------- | ---- | ----------------------- | --------------------------------- |
| Server   | 3000 | `http://localhost:3000` | Express.js uygulaması             |
| Database | 5432 | `localhost:5432`        | PostgreSQL (dışarıdan erişebilir) |

### Konteyner İçi Ağ

Docker Compose `receipt-ai-network` isimli bir Bridge ağ oluşturur:

- Server → Database: `db:5432` (hostname ile erişim)
- Database → Server: `server:3000` (hostname ile erişim)

### Portları Değiştirme

`docker-compose.yml`'de port eşlemesini değiştirin:

```yaml
server:
  ports:
    - "8000:3000" # 8000 numarasından 3000'e yönlendir

db:
  ports:
    - "5433:5432" # 5433 numarasından 5432'ye yönlendir
```

---

## 🔍 Sorun Giderme

### 1. Veritabanı Bağlantısı Başarısız

**Sorun:** `❌ Veritabanı bağlantı hatası`

```bash
# Veritabanı sağlıklı mı kontrol edin
docker-compose ps

# Veritabanı loglarını göster
docker-compose logs db

# Veritabanı şifresini kontrol edin
grep DB_PASSWORD .env

# Container'ı yeniden başlat
docker-compose restart db
docker-compose restart server
```

### 2. Port Zaten Kullanımda

**Sorun:** `Address already in use`

```bash
# Mevcut containerı bulun ve silin
docker-compose down

# Veya alternatif port kullanın
docker-compose -p receipt-ai-2 up -d
```

### 3. Disk Alanı Yetersiz

```bash
# Kullanılmayan containerları temizle
docker container prune

# Kullanılmayan imajları temizle
docker image prune

# Kullanılmayan hacimleri temizle
docker volume prune
```

### 4. Konteyner Başlamıyor

```bash
# Ayrıntılı logları göster
docker-compose up (arka plana alma olmadan)

# Belirli servisi kontrol et
docker-compose logs server

# Konteyner içi hatalar için
docker-compose exec server npm start
```

### 5. Veritabanı Şifresini Sıfırlama

```bash
# Eski containerları sil
docker-compose down -v

# .env dosyasını yeni şifreyle güncelleyin
# .env dosyasını edit edin

# Yeniden başlat
docker-compose up -d
```

---

## 🏗️ Üretim Dağıtımı

### Recommended Üretim Ayarları

**1. Environment Değişkenlerini Güvenle Saklayın**

```bash
# Güçlü şifreler ve anahtarlar oluşturun
openssl rand -hex 32  # 32 karakterlik rastgele anahtar

# .env dosyasını versiyona almayın
echo ".env" >> .gitignore
```

**2. Node Environment'ını Ayarlayın**

`.env` içinde:

```bash
NODE_ENV=production
```

**3. Docker Compose Override'ı (Üretim)**

`docker-compose.prod.yml` oluşturun:

```yaml
version: "3.8"

services:
  server:
    restart: always
    environment:
      NODE_ENV: production
    volumes:
      # Üretim'de kaynak kodu mount'lamayın
      - /app/node_modules

  db:
    restart: always
    # Backup volume'u ekleyin
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
```

**4. Başlatma Komutu (Üretim)**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Veritabanı Yedekleme

```bash
# Veritabanını dışa aktar
docker-compose exec db pg_dump -U macbook billproject > backup.sql

# Veritabanını geri yükle
docker-compose exec -T db psql -U macbook billproject < backup.sql
```

### SSL/HTTPS Ayarı (Nginx ile)

Nginx reverse proxy eklemek için `docker-compose.yml`'e:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - server
```

---

## 📊 Konteyner Performansı İzleme

```bash
# Gerçek zamanlı kaynakları izle
docker stats

# Belirli servisi izle
docker stats receipt-ai-server

# Konteyner boyutunu kontrol et
docker images | grep receipt-ai
docker ps -s
```

---

## 🧹 Temizleme ve Bakım

```bash
# Tüm durdurulmuş containerları sil
docker container prune

# Dangling imajları sil
docker image prune

# Kullanılmayan hacimleri sil
docker volume prune

# Tümünü temizle (UYARI: Veri kaybedebilir)
docker system prune -a --volumes
```

---

## 📚 Yararlı Docker Komutu Özeti

| Komut                                 | Açıklama                       |
| ------------------------------------- | ------------------------------ |
| `docker-compose up -d`                | Serviceleri arka plana başlat  |
| `docker-compose down`                 | Serviceleri durdur             |
| `docker-compose ps`                   | Çalışan containerları listele  |
| `docker-compose logs -f`              | Logları gerçek zamanlı izle    |
| `docker-compose exec [service] [cmd]` | Container'da komut çalıştır    |
| `docker-compose restart`              | Tüm serviceleri yeniden başlat |
| `docker-compose build --no-cache`     | İmajı sıfırdan derle           |

---

## ✅ Kontrol Listesi

Başlamadan önce şunu doğrulayın:

- [ ] Docker ve Docker Compose yüklü (`docker --version`, `docker-compose --version`)
- [ ] `.env` dosyası oluşturuldu ve dolduruldu
- [ ] Gerekli portlar (3000, 5432) mevcuttur
- [ ] Cloudflare R2 credentials doğru
- [ ] Yeterli disk alanı var (~5GB)

---

## 🆘 Yardım ve Destek

Sorun yaşıyorsanız:

1. Logları kontrol edin: `docker-compose logs`
2. Container durum: `docker-compose ps`
3. Sağlık kontrolleri: `docker-compose exec [service] curl http://localhost:3000`

---

**Son güncelleme:** Mart 2026
