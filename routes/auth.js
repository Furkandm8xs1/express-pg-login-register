// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { generateToken } = require('../utils/jwt');
const { get } = require('./pages');


module.exports = (pool) => {
  const router = express.Router();

  // Rate limiting middleware - Brute force saldırılarına karşı
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına maksimum 100 istek
    message: { error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Input validation middleware
  const validateRegisterInput = (req, res, next) => {
    const { username, email, password, birthdate } = req.body;

    // Boş alan kontrolü
    if (!username || !email || !password || !birthdate) {
      return res.status(400).json({ error: "Tüm alanlar gereklidir" });
    }

    // Username validasyonu
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: "Kullanıcı adı 3-50 karakter arasında olmalıdır" });
    }

    // Email validasyonu
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Geçerli bir email adresi giriniz" });
    }

    // Password validasyonu
    if (password.length < 8) {
      return res.status(400).json({ error: "Şifre en az 8 karakter olmalıdır" });
    }

    // XSS koruması - tehlikeli karakterleri temizle
    req.body.username = username.trim().replace(/[<>]/g, '');
    req.body.email = cleanEmail;

    // Birthdate validasyonu
    const date = new Date(birthdate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Geçerli bir doğum tarihi giriniz" });
    }

    next();
  };

  const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email ve şifre gereklidir" });
    }

    // Email format kontrolü
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Geçerli bir email adresi giriniz" });
    }

    // Email'i normalize et
    req.body.email = email.trim().toLowerCase();

    next();
  };

  // KAYIT ENDPOINT'İ
  router.post("/register", authLimiter, validateRegisterInput, async (req, res) => {
    const { username, email, password, birthdate } = req.body;

    try {
      // Email kontrolü
      const checkEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (checkEmail.rows.length > 0) {
        return res.status(409).json({ error: "Bu email zaten kullanılıyor" });
      }

      // Şifre hash'leme
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Kullanıcı oluştur
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash, birthdate) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin, created_at',
        [username, email, passwordHash, birthdate]
      );

      const user = result.rows[0];
     

      res.status(201).json({
        message: "Kayıt başarılı",
        userId: user.id
      });

    } catch (error) {
      console.error('Register hatası:', error);
      res.status(500).json({ error: "Sunucu hatası" });
    }
  });

  // GİRİŞ ENDPOINT'İ
  router.post("/login", authLimiter, validateLoginInput, async (req, res) => {
    const { email, password } = req.body;

    try {
      // Kullanıcıyı bul
      const result = await pool.query(
        'SELECT id, username, email, password_hash, is_admin, profile_photo FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Email veya şifre hatalı" });
      }

      const user = result.rows[0];

      // Şifre kontrolü
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.status(401).json({ error: "Email veya şifre hatalı" });
      }

      const tokenPayload = {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: user.is_admin
        };
        
        const token = generateToken(tokenPayload);



      res.json({
        message: "Giriş başarılı",
        token: token
      });



    } catch (error) {
      console.error('Login hatası:', error);
      res.status(500).json({ error: "Sunucu hatası" });
      console.log("burda bir hata var");
    }
  });

  return router;
};

