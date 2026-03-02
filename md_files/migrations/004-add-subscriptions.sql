-- Migration: Add Subscriptions Table
-- Description: Create subscriptions table to track user monthly subscriptions
-- Tarih: 2026-03-02

-- ⚠️  UYARI: Bu SQL'i çalıştırmadan önce BACKUP ALIN!

-- Adım 1: Subscriptions tablosunu oluştur
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  billing_day SMALLINT NOT NULL,
  category VARCHAR(100) DEFAULT 'Diğer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adım 2: Sorgu performansı için index'ler
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_billing_day
  ON subscriptions(user_id, billing_day);

-- Geri alma komutu (gerekirse):
-- DROP INDEX IF EXISTS idx_subscriptions_user_billing_day;
-- DROP INDEX IF EXISTS idx_subscriptions_user_id;
-- DROP TABLE IF EXISTS subscriptions;

-- ✅ Tamamlandı!

