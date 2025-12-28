-- Migration: Cloudflare R2 Image URL Support
-- Description: receipts tablosundan image_path silin, image_url ekleyin

-- UYARI: Bu SQL'i çalıştırmadan önce BACKUP ALIN!

-- Yeni image_url kolonu ekle (henüz image_path varsa)
ALTER TABLE receipts 
ADD COLUMN image_url VARCHAR(500) NULLABLE;

-- Eğer image_path'i bir R2 URL'sine dönüştürmek istiyorsan:
-- UPDATE receipts SET image_url = 'https://your_bucket.r2.cloudflarestorage.com/receipts/' || image_path
-- WHERE image_path IS NOT NULL;

-- Daha sonra eski image_path kolonunu silebilirsin:
-- ALTER TABLE receipts DROP COLUMN image_path;

-- Ya da image_path'i tutabilirsin (backup için)
