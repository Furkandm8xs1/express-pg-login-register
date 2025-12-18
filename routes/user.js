const express = require('express');
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require('../utils/authMiddleware');

module.exports = function (pool) {
  const router = express.Router();

  // Input validation middleware
  const validateUserId = (req, res, next) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
    }

    next();
  };

  const validatePhotoUrl = (req, res, next) => {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "photoUrl gerekli" });
    }

    // Base64 data URL kontrolü
    if (photoUrl.startsWith('data:image/')) {
      const validFormats = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
      const hasValidFormat = validFormats.some(format => photoUrl.startsWith(format));

      if (!hasValidFormat) {
        return res.status(400).json({
          error: "Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif, webp desteklenir"
        });
      }

      next();
    } else {
      // Normal URL kontrolü
      try {
        new URL(photoUrl);

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = allowedExtensions.some(ext =>
          photoUrl.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          return res.status(400).json({
            error: "Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif, webp desteklenir"
          });
        }

        next();
      } catch (error) {
        return res.status(400).json({ error: "Geçersiz URL formatı" });
      }
    }
  };

  // KULLANICI BİLGİLERİNİ GETİR (Sadece kendi bilgileri)

  router.get("/user/:id", verifyToken, validateUserId, async (req, res) => {
    
    const userId = parseInt(req.params.id);

   try {

      const result = await pool.query('SELECT id, username, email, created_at, profile_photo FROM users WHERE id = $1', [userId]);

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
  router.get("/users", verifyToken, requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, username, email, created_at, is_admin, profile_photo FROM users ORDER BY id ASC'
      );

      res.json(result.rows);

    } catch (error) {
      console.error('Users fetch hatası:', error);
      res.status(500).json({ error: "Sunucu hatası" });
    }
  });

  // PROFİL FOTOĞRAFI GÜNCELLE (Sadece kendi profili veya admin)
  router.put("/user/:id/photo", verifyToken,validatePhotoUrl,validateUserId, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { photoUrl } = req.body;

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

  // KULLANICI SİL (SADECE ADMİN ve kendi hesabını silemez)
  router.delete("/user/:id", verifyToken, validateUserId, requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const adminId = req.user.id;

    // Admin kendi hesabını silemez
    if (userId === adminId) {
      return res.status(400).json({ error: "Kendi hesabınızı silemezsiniz" });
    }

    try {
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

  return router;
};