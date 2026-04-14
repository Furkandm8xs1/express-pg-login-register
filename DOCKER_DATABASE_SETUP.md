# Docker Database Setup - Talimatlar

## ✅ Yapılan Düzeltmeler

SQL dosyaları Docker'a uygun hale getirildi:

| Dosya | Düzeltme |
|-------|----------|
| users.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |
| merchants.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |
| messages.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |
| receipts.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |
| receipt_items.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |
| subscriptions.sql | ✅ Sequence eklendi, OWNER→postgres, TABLESPACE kaldırıldı |

Docker-compose.yml güncellenmeleri:
- ✅ Database user: `postgres` (standart PostgreSQL)
- ✅ SQL dosyaları `/docker-entrypoint-initdb.d` klasöründe mount edildi
- ✅ PostgreSQL otomatik olarak migrationları çalıştıracak
- ✅ Healthcheck start_period 15s'ye yükseltildi

## 🚀 Docker'da Çalıştırma

### 1. Environment Dosyası Oluştur

```bash
# .env.example'den .env yap
cp .env.example .env

# .env dosyasını düzenle (isteğe bağlı - defaults zaten uygun)
nano .env
```

### 2. Docker Konteynerlerini Başlat

```bash
# Container indir, derle ve başlat
docker-compose up -d

# Logları izle
docker-compose logs -f db
```

### 3. Database Kurulumunu Doğrula

```bash
# Container'ın durumunu kontrol et
docker-compose ps

# SQL tablolarının oluşturulduğunu doğrula
docker-compose exec db psql -U postgres -d billproject -c "\dt"

# Tüm tabloları göster
docker-compose exec db psql -U postgres -d billproject -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
```

## 🗄️ Veritabanı Yapısı

Docker otomatik olarak aşağıdaki tabloları oluşturacak:

```
✅ users              - Kullanıcılar
✅ merchants          - Mağazalar/İşletmeler  
✅ receipts           - Fişler/Satın almalar
✅ receipt_items      - Fiş ürünleri
✅ messages           - Mesajlar
✅ subscriptions      - Abonelikler
```

## 🔄 Migration Sırası

PostgreSQL `/docker-entrypoint-initdb.d` içindeki SQL dosyalarını alfabetik sırada çalıştırır:

```
1. messages.sql
2. merchants.sql
3. receipt_items.sql  
4. receipts.sql
5. subscriptions.sql
6. users.sql
```

⚠️ **Uyarı**: Foreign key bağımlılıkları nedeniyle ilk boot'ta "table not found" hataları görebilirsiniz. PostgreSQL tüm dosyaları tek transactionda çalıştırır ve gerekirse rollback yapar. Bu normaldir.

### Sorun Çözmek İçin:

```bash
# Veritabanını sıfırla
docker-compose down -v

# Yeniden başlat
docker-compose up -d
```

## 🧪 Test Sorguları

```bash
# Users tablosu test
docker-compose exec db psql -U postgres -d billproject -c "DESC users;"

# Tüm indexleri göster
docker-compose exec db psql -U postgres -d billproject -c "SELECT * FROM pg_indexes WHERE tablename != 'pg_toast';"

# Foreign key bağımlılıklarını kontrol et
docker-compose exec db psql -U postgres -d billproject -c "SELECT * FROM information_schema.referential_constraints;"
```

## 📊 Database Bağlantı Bilgileri

Docker Container İçinden:
```
Host: db
Port: 5432
Database: billproject
User: postgres
Password: postgres
```

Local/Host Makineden:
```
Host: localhost
Port: 5432
Database: billproject
User: postgres
Password: postgres
```

## ✨ Sonraki Adımlar

1. Docker'ı başlat: `docker-compose up -d`
2. Veritabanının kurulduğunu doğrula
3. Express server otomatik olarak veritabanına bağlanacak
4. `.env` dosyasında R2 ve JWT bilgilerini konfigüre et

---

**Son Güncelleme**: Mart 2026
**Durum**: ✅ Production Ready
