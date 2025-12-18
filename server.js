// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

// dikkat et bu kod içinde inline js kullanıyoruz frontendde bu yüzden helmet i devre dışı bırakıyoruz

const app = express();
const PORT = process.env.PORT || 3000;

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


// daha helmet kullanmayacagız cunku inline js e izin vermiyor ve frontend de inline js kullanıyoruz
// Middleware
app.use(helmet(
  { contentSecurityPolicy: false }
));
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // JSON gövdeleri için limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded gövdeleri için limit
app.use(express.static(path.join(__dirname, 'frontend', 'public')));



// Route'lar

const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth')(pool);
const userRoutes = require('./routes/user')(pool);
const resetPasswordRoutes = require('./routes/reset-password')(pool);
const messageRoutes = require('./routes/messages')(pool);

// Sayfa route'larını dahil et
app.use('/', pageRoutes);
// api route'larını dahil et
app.use('/', authRoutes);
app.use('/', userRoutes);
// Reset-password route'larını dahil et (pool'u parametre olarak geç)
app.use('/', resetPasswordRoutes);
// mesajlar sayfası route'larını dahil et (pool'u parametre olarak geç)

app.use('/', messageRoutes);



app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server http://localhost:${PORT} üzerinde çalışıyor`);
});