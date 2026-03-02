-- Migration: Add Bill Sector/Category Support
-- Description: Add sector column to receipts table for bill categorization
-- Tarih: 17 Şubat 2026

-- ⚠️  UYARI: Bu SQL'i çalıştırmadan önce BACKUP ALIN!

-- Adım 1: Sector kolonu ekle (Giyim, Elektronik, Yemek, vb.)
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS sector VARCHAR(100) DEFAULT 'Diğer';

-- Adım 2: Index'le sorguları hızlandır
CREATE INDEX IF NOT EXISTS idx_receipts_sector ON receipts(sector);
CREATE INDEX IF NOT EXISTS idx_receipts_user_sector ON receipts(user_id, sector);

-- ✅ Tamamlandı!
-- Sektörler: Giyim, Elektronik, Yemek, Ulaştırma, Sağlık, Eğitim, Eğlence, Diğer

-- Geri alma komutu (gerekirse):
-- DROP INDEX idx_receipts_user_sector;
-- DROP INDEX idx_receipts_sector;
-- ALTER TABLE receipts DROP COLUMN sector;
