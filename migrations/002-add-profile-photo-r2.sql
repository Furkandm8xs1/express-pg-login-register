-- Migration: Kullanıcı Profil Fotoğrafı R2 Desteği
-- Description: users tablosuna profile_photo kolonu ekle (R2 URL depolaması için)
-- Tarih: 4 Ocak 2026

-- ⚠️  UYARI: Bu SQL'i çalıştırmadan önce BACKUP ALIN!

-- Adım 1: profile_photo kolonu ekle
ALTER TABLE users 
ADD COLUMN profile_photo VARCHAR(500) DEFAULT NULL;

-- Adım 2: Kolon indexleme (opsiyonel ama önerilen)
-- CREATE INDEX idx_users_profile_photo ON users(profile_photo);

-- ✅ Tamamlandı!
-- Sonrası: Artık profil fotoğrafları R2'de saklanacak ve URL'leri users.profile_photo'da tutulacak

-- Geri alma komutu (gerekirse):
-- ALTER TABLE users DROP COLUMN profile_photo;
