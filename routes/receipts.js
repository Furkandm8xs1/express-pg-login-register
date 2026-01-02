// routes/receipts.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { verifyToken, requireAdminPage } = require('../utils/authMiddleware');
const { uploadToR2, deleteFromR2 } = require('../utils/r2-storage');

// --- AYARLAR ---

// Gemini API Ayarı
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ROUTE FONKSIYONU ---
module.exports = (pool, upload) => {

    // 1. Fiş Yükle ve Analiz Et
    router.post('/api/receipts/analyze', upload.single('receiptImage'), verifyToken, async (req, res) => {
        const client = await pool.connect();

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Lütfen bir resim yükleyin.' });
            }

            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
            }

            const userId = req.user.id;

            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const prompt = `
                Bu fişi analiz et ve sadece JSON formatında yanıt ver. Markdown kullanma.
                Format:
                {
                    "merchant": {"name": "Mağaza Adı", "branch": "Şube", "address": "Adres", "tax_number": "VKN"},
                    "transaction": {"date": "YYYY-MM-DD", "time": "HH:MM", "receipt_no": "Fiş No"},
                    "items": [{"name": "Ürün", "category": "Kategori", "quantity": 1, "price": 10.00, "total": 10.00}],
                    "financials": {"total_amount": 100.00, "total_tax": 18.00, "currency": "TRY", "payment_method": "Kredi Kartı"}
                }
            `;

            // Buffer'ı base64'e çevir 

            const base64Image = req.file.buffer.toString('base64');
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: req.file.mimetype
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            let text = response.text();

            // JSON temizliği
            text = text.replace(/```json|```/g, "").trim();
            const data = JSON.parse(text);

            // 2. Dosyayı Cloudflare R2'ye Yükle
            let imageUrl = null;
            try {
                const fileName = `receipts/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
                imageUrl = await uploadToR2(fileName, req.file.buffer, req.file.mimetype);
                console.log(`✅ Dosya R2'ye yüklendi: ${fileName}`);
            } catch (uploadError) {
                console.error('R2 yükleme hatası:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Dosya bulut depolamaya yüklenemedi: ' + uploadError.message
                });
            }

            // 3. Veritabanı İşlemleri (Transaction Başlat)
            await client.query('BEGIN');

            // A. Mağaza Kaydı
            let merchantId = null;
            if (data.merchant && data.merchant.name) {
                if (data.merchant.tax_number) {
                    // Tax number ile kontrol et
                    let merchantRes = await client.query(
                        `SELECT id FROM merchants WHERE tax_number = $1 LIMIT 1`,
                        [data.merchant.tax_number]
                    );

                    if (merchantRes.rows.length > 0) {
                        // Mağaza var, update et
                        merchantId = merchantRes.rows[0].id;
                        await client.query(
                            `UPDATE merchants SET name = $1, branch = $2, address = $3 WHERE id = $4`,
                            [data.merchant.name, data.merchant.branch, data.merchant.address, merchantId]
                        );
                    } else {
                        // Mağaza yok, insert et
                        merchantRes = await client.query(
                            `INSERT INTO merchants (name, branch, address, tax_number) 
                             VALUES ($1, $2, $3, $4) 
                             RETURNING id`,
                            [data.merchant.name, data.merchant.branch, data.merchant.address, data.merchant.tax_number]
                        );
                        merchantId = merchantRes.rows[0].id;
                    }
                } else {
                    // Name + Branch ile kontrol et
                    let merchantRes = await client.query(
                        `SELECT id FROM merchants WHERE name = $1 AND branch = $2 LIMIT 1`,
                        [data.merchant.name, data.merchant.branch]
                    );

                    if (merchantRes.rows.length > 0) {
                        // Mağaza var, update et
                        merchantId = merchantRes.rows[0].id;
                        await client.query(
                            `UPDATE merchants SET address = $1 WHERE id = $2`,
                            [data.merchant.address, merchantId]
                        );
                    } else {
                        // Mağaza yok, insert et
                        merchantRes = await client.query(
                            `INSERT INTO merchants (name, branch, address, tax_number) 
                             VALUES ($1, $2, $3, $4) 
                             RETURNING id`,
                            [data.merchant.name, data.merchant.branch, data.merchant.address, null]
                        );
                        merchantId = merchantRes.rows[0].id;
                    }
                }
            }

            // B. Fişi Kaydet
            const receiptRes = await client.query(
                `INSERT INTO receipts 
                 (user_id, merchant_id, transaction_date, transaction_time, receipt_no, total_amount, total_tax, payment_method, image_url, raw_api_response)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING id`,
                [
                    userId,
                    merchantId,
                    data.transaction?.date || null,
                    data.transaction?.time || null,
                    data.transaction?.receipt_no || null,
                    data.financials?.total_amount || 0,
                    data.financials?.total_tax || 0,
                    data.financials?.payment_method || 'Nakit',
                    imageUrl,
                    JSON.stringify(data)
                ]
            );
            const receiptId = receiptRes.rows[0].id;

            // C. Kalemleri Kaydet
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await client.query(
                        `INSERT INTO receipt_items (receipt_id, item_name, quantity, unit_price, total_price)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [receiptId, item.name, item.quantity || 1, item.price || 0, item.total || item.price]
                    );
                }
            }

            await client.query('COMMIT');

            res.json({ success: true, message: 'Fiş başarıyla kaydedildi', receiptId: receiptId, data: data });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Fiş işleme hatası:", error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    });

    // 2. Kullanıcının Fişlerini Listele
    router.get('/api/receipts/my-receipts', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await pool.query(`
                SELECT r.*,
                       m.name as merchant_name, 
                       COUNT(ri.id) as item_count,
                       COALESCE(SUM(ri.quantity), 0) as total_quantity
                FROM receipts r
                LEFT JOIN merchants m ON r.merchant_id = m.id
                LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
                WHERE r.user_id = $1
                GROUP BY r.id, m.name
                ORDER BY r.created_at DESC
            `, [userId]);

            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Fişler getirilemedi' });
        }
    });

    // 3. Tek Fiş Detayları ve Ürünlerini Getir
    router.get('/api/receipts/:receiptId', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const receiptId = req.params.receiptId;

            const receiptCheck = await pool.query(
                `SELECT * FROM receipts WHERE id = $1 AND user_id = $2`,
                [receiptId, userId]
            );

            if (receiptCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bu fişe erişim yetkiniz yok' });
            }

            const receipt = await pool.query(
                `SELECT r.*, m.name as merchant_name
                 FROM receipts r
                 LEFT JOIN merchants m ON r.merchant_id = m.id
                 WHERE r.id = $1`,
                [receiptId]
            );

            const items = await pool.query(
                `SELECT * FROM receipt_items WHERE receipt_id = $1 ORDER BY id`,
                [receiptId]
            );

            res.json({
                receipt: receipt.rows[0],
                items: items.rows
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Fiş detayları getirilemedi' });
        }
    });

    // 4. YENİ: Mağaza Adını Güncelle
    router.put('/api/receipts/:receiptId/merchant', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const receiptId = req.params.receiptId;
            const { merchant_name } = req.body;

            if (!merchant_name || merchant_name.trim() === '') {
                return res.status(400).json({ error: 'Mağaza adı boş olamaz' });
            }

            // Fiş sahibi kontrol et
            const receiptCheck = await pool.query(
                `SELECT merchant_id FROM receipts WHERE id = $1 AND user_id = $2`,
                [receiptId, userId]
            );

            if (receiptCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bu fişe erişim yetkiniz yok' });
            }

            const merchantId = receiptCheck.rows[0].merchant_id;

            // Mağaza adını güncelle
            const result = await pool.query(
                `UPDATE merchants SET name = $1 WHERE id = $2 RETURNING *`,
                [merchant_name.trim(), merchantId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Mağaza bulunamadı' });
            }

            res.json({ success: true, merchant: result.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Mağaza adı güncellenemedi' });
        }
    });

    // 5. GÜNCELLENMIŞ: Ürün İsmini ve Adedini Güncelle
    router.put('/api/receipts/:receiptId/items/:itemId', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const receiptId = req.params.receiptId;
            const itemId = req.params.itemId;
            const { item_name, quantity } = req.body;

            // Fiş sahibi kontrol et
            const receiptCheck = await pool.query(
                `SELECT * FROM receipts WHERE id = $1 AND user_id = $2`,
                [receiptId, userId]
            );

            if (receiptCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bu fişe erişim yetkiniz yok' });
            }

            // Güncelleme sorgusu hazırla
            let updateQuery = 'UPDATE receipt_items SET ';
            let updateValues = [];
            let valueIndex = 1;

            if (item_name !== undefined) {
                if (item_name.trim() === '') {
                    return res.status(400).json({ error: 'Ürün ismi boş olamaz' });
                }
                updateQuery += `item_name = $${valueIndex}, `;
                updateValues.push(item_name.trim());
                valueIndex++;
            }

            if (quantity !== undefined) {
                const qty = parseInt(quantity);
                if (isNaN(qty) || qty < 1) {
                    return res.status(400).json({ error: 'Adet 1\'den küçük olamaz' });
                }
                updateQuery += `quantity = $${valueIndex}, `;
                updateValues.push(qty);
                valueIndex++;
            }

            // Son virgülü kaldır
            updateQuery = updateQuery.slice(0, -2);
            updateQuery += ` WHERE id = $${valueIndex} AND receipt_id = $${valueIndex + 1} RETURNING *`;
            updateValues.push(itemId, receiptId);

            const result = await pool.query(updateQuery, updateValues);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Ürün bulunamadı' });
            }

            res.json({ success: true, item: result.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Ürün güncellenemedi' });
        }
    });

    // 6. FİŞ SİL (Sadece fiş sahibi veya admin)
    router.delete('/api/receipts/:receiptId', verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const receiptId = req.params.receiptId;

            // Fiş sahibi mi kontrol et
            const receiptCheck = await pool.query(
                `SELECT image_url FROM receipts WHERE id = $1 AND user_id = $2`,
                [receiptId, userId]
            );

            if (receiptCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bu fişe erişim yetkiniz yok' });
            }

            // R2'den resmi sil
            const imageUrl = receiptCheck.rows[0].image_url;
            if (imageUrl) {
                try {
                    await deleteFromR2(imageUrl);
                } catch (deleteError) {
                    console.error('R2 silme hatası:', deleteError);
                }
            }

            // Veritabanında fiş sil
            await pool.query(`DELETE FROM receipt_items WHERE receipt_id = $1`, [receiptId]);
            await pool.query(`DELETE FROM receipts WHERE id = $1`, [receiptId]);

            res.json({ success: true, message: 'Fiş başarıyla silindi' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Fiş silinemedi' });
        }
    });

    // 7. ADMİN: TÜM FİŞLERİ LİSTELE
    router.get('/api/admin/receipts', verifyToken, async (req, res) => {
        try {
            // Admin kontrolü
            if (!req.user.isAdmin) {
                return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
            }

            const result = await pool.query(`
                SELECT r.*, 
                       u.username as user_name,
                       m.name as merchant_name, 
                       COUNT(ri.id) as item_count
                FROM receipts r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN merchants m ON r.merchant_id = m.id
                LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
                GROUP BY r.id, u.username, m.name
                ORDER BY r.created_at DESC
            `);

            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Fişler getirilemedi' });
        }
    });

    return router;
};