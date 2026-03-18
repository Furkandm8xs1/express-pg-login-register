// routes/proxy-receipt-image.js
// Güvenli resim proxy'si: Yalnızca kendi fişlerinin resimlerini görebilirler
const express = require('express');
const { getFromR2 } = require('../utils/r2-storage');
const { verifyToken } = require('../utils/authMiddleware');

module.exports = (pool) => {
    const router = express.Router();

    /**
     * Güvenli resim proxy'si
     * GET /api/receipts/:receiptId/image
     * 
     * 🔒 Güvenlik:
     * - JWT authentication gerekli
     * - Fiş sahibi kontrolü yapılır (SQL injection yok)
     * - URL enumeration saldırısından korunur
     */
    router.get('/api/receipts/:receiptId/image', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const receiptId = req.params.receiptId;

            // 1. Erişim kontrolü: Fiş, bu kullanıcıya mı ait?
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

            // 2. R2'den key'i çıkar
            // Örnek URL: https://pub-xxx.r2.dev/receipts/1/1773778279200-neszjs493.jpg
            // Key: receipts/1/1773778279200-neszjs493.jpg
            let r2Key;
            
            try {
                // URL'den key çıkarma (r2.dev/ sonrasındaki kısım)
                const urlParts = imageUrl.split('r2.dev/');
                if (urlParts.length === 2) {
                    r2Key = urlParts[1];
                } else {
                    throw new Error('URL formatı geçersiz');
                }

                // 3. R2'den resmi al ve gönder
                const imageBuffer = await getFromR2(r2Key);
                
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Cache-Control', 'private, max-age=3600');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.send(imageBuffer);

            } catch (r2Error) {
                console.error(`❌ R2 resim çekme hatası:`, r2Error);
                return res.status(500).json({ error: 'Resim yüklenemedi' });
            }

        } catch (error) {
            console.error('❌ Proxy hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    return router;
};
