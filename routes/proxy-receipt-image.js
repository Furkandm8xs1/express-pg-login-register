// routes/proxy-receipt-image.js
// Bu route, R2'den resim proxy'leme yaparak güvenlik sağlar (isteğe bağlı)
const express = require('express');
const router = express.Router();
const { getFromR2 } = require('../utils/r2-storage');
const { verifyToken } = require('../utils/authMiddleware');

/**
 * Güvenli resim proxy'si (yalnızca kendi fişlerinin resimlerini görebilirler)
 * GET /api/receipts/:receiptId/image
 */
router.get('/api/receipts/:receiptId/image', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const receiptId = req.params.receiptId;

        // Veritabanından fiş bilgisini al
        const pool = require('../server'); // server.js'den pool'u alacak
        const receiptCheck = await pool.query(
            `SELECT image_url FROM receipts WHERE id = $1 AND user_id = $2`,
            [receiptId, userId]
        );

        if (receiptCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Bu fişe erişim yetkiniz yok' });
        }

        const imageUrl = receiptCheck.rows[0].image_url;
        if (!imageUrl) {
            return res.status(404).json({ error: 'Resim bulunamadı' });
        }

        // R2 URL'sinden dosya adını çıkar
        const fileName = imageUrl.split('/').pop();
        const userId_prefix = `receipts/${userId}`;

        try {
            const imageBuffer = await getFromR2(`${userId_prefix}/${fileName}`);
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(imageBuffer);
        } catch (error) {
            // Eğer prefix'i tahmin edemediyse, URL'den çıkart
            const keyFromUrl = imageUrl.split(`${process.env.R2_BUCKET_NAME}.`)[1]?.split('.r2')[0];
            if (keyFromUrl) {
                const imageBuffer = await getFromR2(keyFromUrl);
                res.setHeader('Content-Type', 'image/jpeg');
                res.send(imageBuffer);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Resim proxy hatası:', error);
        res.status(500).json({ error: 'Resim yüklenemedi' });
    }
});

module.exports = router;
