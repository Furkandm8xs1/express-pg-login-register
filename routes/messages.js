const express = require('express');
const { verifyToken } = require('../utils/jwt'); // Önceki adımda oluşturduğun jwt helper

module.exports = (pool) => {
    const router = express.Router();

    // --- JWT Authentication Middleware ---
    // Bu middleware, korunan route'lardan önce çalışır.
    const requireAuth = (req, res, next) => {
        // 1. Token'ı cookie'den al (Frontend'den otomatik gelir)
        // Not: Cookie-parser yüklü olmalıdır: npm install cookie-parser
        const token = req.cookies.token; 

        if (!token) {
            return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
        }

        // 2. Token'ı doğrula
        const verification = verifyToken(token);

        if (!verification.valid) {
            // Token geçersiz veya süresi dolmuş
            return res.status(401).json({ error: verification.error || 'Geçersiz oturum' });
        }

        // 3. Kullanıcı bilgisini request nesnesine ekle
        // Artık route içinde req.user.id diyerek kullanıcının kim olduğunu bileceğiz.
        req.user = verification.decoded;
        next();
    };

    // --- ROUTE'LAR ---

    // 1. Mesajları Getir
    router.get('/api/messages', requireAuth, async (req, res) => {
        // userId artık header'dan DEĞİL, güvenli token'dan geliyor
        const userId = req.user.id; 
        
        try {
            const result = await pool.query(
                `SELECT m.id, m.message_text, m.is_from_system, m.created_at, u.username
                 FROM messages m
                 LEFT JOIN users u ON m.user_id = u.id
                 WHERE m.user_id = $1
                 ORDER BY m.created_at ASC`,
                [userId]
            );
            
            res.json({ messages: result.rows });
        } catch (error) {
            console.error('Mesaj getirme hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    // 2. Yeni Mesaj Gönder
    router.post('/api/messages', requireAuth, async (req, res) => {
        const userId = req.user.id; // Token'dan gelen güvenli ID
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Mesaj boş olamaz' });
        }
        
        try {
            // Kullanıcı mesajını kaydet
            const result = await pool.query(
                `INSERT INTO messages (user_id, message_text, is_from_system)
                 VALUES ($1, $2, false)
                 RETURNING *`,
                [userId, message.trim()]
            );
            
            // (Opsiyonel) Otomatik sistem yanıtı simülasyonu
            setTimeout(async () => {
                await pool.query(
                    `INSERT INTO messages (user_id, message_text, is_from_system)
                     VALUES ($1, $2, true)`,
                    [userId, 'Mesajınız alındı. En kısa sürede dönüş yapacağız.']
                );
            }, 1000);
            
            res.json({ success: true, message: result.rows[0] });

        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    // 3. Mesajları Temizle
    router.delete('/api/messages', requireAuth, async (req, res) => {
        const userId = req.user.id;
        
        try {
            await pool.query('DELETE FROM messages WHERE user_id = $1', [userId]);
            res.json({ success: true });
        } catch (error) {
            console.error('Mesaj silme hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    return router;
};