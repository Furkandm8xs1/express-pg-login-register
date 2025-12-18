const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = function(pool) {
  const router = express.Router();

  // Mail transporter yapılandırması
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  // Şifre sıfırlama isteği
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email adresi gerekli' });
      }
       // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Geçerli bir email adresi giriniz" });
    }

      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'Bu email adresi kayıtlı değil' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
        [resetToken, resetTokenExpiry, email]
      );

      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Şifre Sıfırlama Talebi',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Şifre Sıfırlama</h2>
            <p>Merhaba ${user.rows[0].username},</p>
            <p>Şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi oluşturabilirsiniz:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Şifremi Sıfırla
            </a>
            <p>Veya bu linki tarayıcınıza kopyalayın:</p>
            <p style="color: #666;">${resetLink}</p>
            <p style="color: red; margin-top: 20px;">Bu link 1 saat geçerlidir.</p>
            <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ 
        success: true, 
        message: 'Şifre sıfırlama linki email adresinize gönderildi' 
      });

    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      res.status(500).json({ message: 'Bir hata oluştu' });
    }
  });

  // Token doğrulama
  router.get('/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const user = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
        [token]
      );

      if (user.rows.length === 0) {
        return res.status(400).json({
          valid: false,
          message: 'Geçersiz veya süresi dolmuş token'
        });
      }

      res.json({ valid: true, email: user.rows[0].email });

    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(500).json({ valid: false, message: 'Bir hata oluştu' });
    }
  });

  // Yeni şifre belirleme
  router.post('/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token ve yeni şifre gerekli' });
      }

      const user = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
        [token]
      );

      if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await pool.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
        [hashedPassword, user.rows[0].id]
      );

      res.json({
        success: true,
        message: 'Şifreniz başarıyla güncellendi'
      });

    } catch (error) {
      console.error('Şifre güncelleme hatası:', error);
      res.status(500).json({ message: 'Bir hata oluştu' });
    }
  });

  return router;
};