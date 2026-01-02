// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer konfigürasyonu (bellek içinde depolama)
const upload = multer({ storage: multer.memoryStorage() });

// PostgreSQL bağlantısı
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Veritabanı bağlantı hatası:', err.stack);
  }
  console.log('✅ PostgreSQL bağlantısı başarılı!');
  release();
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Frontend dosyaları
app.use(express.static(path.join(__dirname, 'frontend', 'public')));
// NOT: uploads klasörü artık kullanılmıyor (Dosyalar Cloudflare R2'de depolanıyor)

// --- ROUTE IMPORTLARI ---
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth')(pool);
const userRoutes = require('./routes/user')(pool);
const resetPasswordRoutes = require('./routes/reset-password')(pool);
const messageRoutes = require('./routes/messages')(pool);
// YENİ EKLENDİ: Fiş route'unu import et
const receiptRoutes = require('./routes/receipts')(pool, upload);

// --- ROUTE KULLANIMLARI ---
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', resetPasswordRoutes);
app.use('/', messageRoutes);
// YENİ EKLENDİ: Fiş route'unu kullan
app.use('/', receiptRoutes);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server http://localhost:${PORT} üzerinde çalışıyor`);
});