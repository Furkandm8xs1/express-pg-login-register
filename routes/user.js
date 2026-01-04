const express = require('express');
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require('../utils/authMiddleware');
const { uploadToR2, deleteFromR2, extractR2KeyFromUrl } = require('../utils/r2-storage');

module.exports = function(pool) {
    const router = express.Router();

    // Input validation middleware
    const validateUserId = (req, res, next) => {
        const userId = parseInt(req.params.id);

        if (isNaN(userId) || userId < 1) {
            return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
        }

        next();
    };

    // Photo dosya validasyonu middleware
    const validatePhotoFile = (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: "Fotoğraf dosyası gerekli" });
        }

        // MIME type kontrolü
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif, webp desteklenir"
            });
        }

        // Dosya boyutu kontrolü (5MB max)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (req.file.size > MAX_SIZE) {
            return res.status(400).json({
                error: "Dosya çok büyük. Maksimum 5MB olabilir."
            });
        }

        next();
    };

    // KULLANICI BİLGİLERİNİ GETİR (Sadece kendi bilgileri veya Admin)

    router.get("/user/:id", verifyToken, validateUserId, requireOwnerOrAdmin, async(req, res) => {

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
    router.get("/users", verifyToken, requireAdmin, async(req, res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

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
    router.put("/user/:id/photo",
        verifyToken,
        validateUserId,
        (req, res, next) => {
            // Multer middleware'ini çağır (upload singleton)
            const multer = require('multer');
            const upload = multer({ storage: multer.memoryStorage() });
            upload.single('photo')(req, res, next);
        },
        validatePhotoFile,
        requireOwnerOrAdmin,
        async(req, res) => {
            const userId = parseInt(req.params.id);

            try {
                // 1. Eski fotoğrafı R2'den sil (varsa)
                const userResult = await pool.query(
                    'SELECT profile_photo FROM users WHERE id = $1', [userId]
                );

                if (userResult.rows.length > 0 && userResult.rows[0].profile_photo) {
                    const oldPhotoUrl = userResult.rows[0].profile_photo;
                    const r2Key = extractR2KeyFromUrl(oldPhotoUrl);

                    if (r2Key) {
                        try {
                            await deleteFromR2(r2Key);
                        } catch (deleteError) {
                            console.warn('⚠️  Eski fotoğraf R2\'den silinemedi:', deleteError.message);
                            // Devam et, silme başarısız olsa bile yükleme yapılsın
                        }
                    }
                }

                // 2. Yeni fotoğrafı R2'ye yükle
                const timestamp = Date.now();
                const fileExtension = req.file.mimetype.split('/')[1]; // jpeg, png, vb.
                const r2Key = `users/${userId}/profile.${fileExtension}`;

                const photoUrl = await uploadToR2(r2Key, req.file.buffer, req.file.mimetype);

                // 3. URL'i database'e kaydet
                const result = await pool.query(
                    'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, profile_photo', [photoUrl, userId]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: "Kullanıcı bulunamadı" });
                }

                res.json({
                    message: "Profil fotoğrafı başarıyla güncellendi",
                    photoUrl: result.rows[0].profile_photo
                });

            } catch (error) {
                console.error('Photo update hatası:', error);
                res.status(500).json({ error: "Fotoğraf güncellemesi başarısız: " + error.message });
            }
        }
    );

    // KULLANICI SİL (SADECE ADMİN ve kendi hesabını silemez)
    router.delete("/user/:id", verifyToken, validateUserId, requireAdmin, async(req, res) => {
        const userId = parseInt(req.params.id);
        const adminId = req.user.id;

        // Admin kendi hesabını silemez
        if (userId === adminId) {
            return res.status(400).json({ error: "Kendi hesabınızı silemezsiniz" });
        }

        try {
            // 1. Kullanıcının profil fotoğrafını al
            const userResult = await pool.query(
                'SELECT profile_photo FROM users WHERE id = $1', [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "Kullanıcı bulunamadı" });
            }

            // 2. Profil fotoğrafını R2'den sil (varsa)
            if (userResult.rows[0].profile_photo) {
                const photoUrl = userResult.rows[0].profile_photo;
                const r2Key = extractR2KeyFromUrl(photoUrl);

                if (r2Key) {
                    try {
                        await deleteFromR2(r2Key);
                    } catch (deleteError) {
                        console.warn('⚠️  Kullanıcı silinirken fotoğraf R2\'den silinemedi:', deleteError.message);
                        // Devam et, silme başarısız olsa bile kullanıcı silinsin
                    }
                }
            }

            // 3. Kullanıcıyı database'den sil
            const deleteResult = await pool.query(
                'DELETE FROM users WHERE id = $1 RETURNING id', [userId]
            );

            res.json({ message: "Kullanıcı ve profil fotoğrafı silindi", userId: deleteResult.rows[0].id });

        } catch (error) {
            console.error('Delete hatası:', error);
            res.status(500).json({ error: "Sunucu hatası: " + error.message });
        }
    });

    return router;
};