// server.js
require('dotenv').config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Pool } = require('pg');

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

// Bağlantıyı test et
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Veritabanı bağlantı hatası:', err.stack);
  }
  console.log('✅ PostgreSQL bağlantısı başarılı!');
  release();
});

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

// SAYFA ROUTE'LARI (Clean URLs)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/login.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/frontend/login.html");
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/frontend/register.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/frontend/dashboard.html");
});

// API ROUTE'LARI

// KAYIT ENDPOINT'İ
app.post("/register", async (req, res) => {
  const { username, email, password , birthdate } = req.body; // destructuring

  if (!username || !email || !password || !birthdate) {
    return res.status(400).json({ error: "username, email, password ve birthdate gerekli" });
  }

  try {
    const checkEmail = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: "Bu email zaten kullanılıyor" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash , birthdate) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, passwordHash, birthdate]
    );

    res.status(201).json({ 
      message: "Kayıt başarılı", 
      userId: result.rows[0].id 
    });

  } catch (error) {
    console.error('Register hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// GİRİŞ ENDPOINT'İ
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email ve password gerekli" });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı veya yanlış email/password" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı veya yanlış email/password" });
    }

    res.json({
      message: "Giriş başarılı",
      userId: user.id,
      isAdmin: user.is_admin || false
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// KULLANICI BİLGİLERİNİ GETİR
app.get("/user/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at, is_admin, profile_photo FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('User fetch hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// TÜM KULLANICILARI LİSTELE (SADECE ADMİN)
app.get("/users", async (req, res) => {
  const requesterId = parseInt(req.query.requesterId);

  if (!requesterId) {
    return res.status(400).json({ error: "requesterId gerekli" });
  }

  try {
    // İsteği yapan kişinin admin olup olmadığını kontrol et
    const requesterCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [requesterId]
    );

    if (requesterCheck.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    const isAdmin = requesterCheck.rows[0].is_admin;

    if (!isAdmin) {
      return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli" });
    }

    // Admin ise tüm kullanıcıları getir
    const result = await pool.query(
      'SELECT id, username, email, created_at, is_admin, profile_photo FROM users ORDER BY id ASC'
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Users fetch hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PROFİL FOTOĞRAFI GÜNCELLE
app.put("/user/:id/photo", async (req, res) => {
  const userId = parseInt(req.params.id);
  const { photoUrl } = req.body;

  if (!photoUrl) {
    return res.status(400).json({ error: "photoUrl gerekli" });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, profile_photo',
      [photoUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.json({
      message: "Profil fotoğrafı güncellendi", 
      profilePhoto: result.rows[0].profile_photo 
    });

  } catch (error) {
    console.error('Photo update hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// KULLANICI SİL (SADECE ADMİN)
app.delete("/user/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  const requesterId = parseInt(req.query.requesterId);

  if (!requesterId) {
    return res.status(400).json({ error: "requesterId gerekli" });
  }

  try {
    // İsteği yapan kişinin admin olup olmadığını kontrol et
    const requesterCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [requesterId]
    );

    if (requesterCheck.rows.length === 0 || !requesterCheck.rows[0].is_admin) {
      return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli" });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.json({ message: "Kullanıcı silindi", userId: result.rows[0].id });

  } catch (error) {
    console.error('Delete hatası:', error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server http://localhost:${PORT} üzerinde çalışıyor`);
});