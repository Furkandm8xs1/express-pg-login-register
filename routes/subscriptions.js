const express = require('express');
const { verifyToken } = require('../utils/authMiddleware');

module.exports = (pool) => {
  const router = express.Router();

  function validateSubscriptionFields({ name, monthly_price, billing_day, category }) {
    const errors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Abonelik adı boş olamaz');
      }
    }

    if (monthly_price !== undefined) {
      const price = parseFloat(monthly_price);
      if (isNaN(price) || price <= 0) {
        errors.push('Aylık fiyat 0\'dan büyük bir sayı olmalıdır');
      }
    }

    if (billing_day !== undefined) {
      const day = parseInt(billing_day, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        errors.push('Fatura günü 1 ile 31 arasında olmalıdır');
      }
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        errors.push('Kategori boş olamaz');
      }
    }

    return errors;
  }

  // GET /api/subscriptions - Kullanıcının tüm aboneliklerini listele
  router.get('/api/subscriptions', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT id, name, monthly_price, billing_day, category, created_at, updated_at
         FROM subscriptions
         WHERE user_id = $1
         ORDER BY billing_day ASC, name ASC`,
        [userId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Abonelikleri listeleme hatası:', error);
      res.status(500).json({ error: 'Abonelikler getirilemedi' });
    }
  });

  // POST /api/subscriptions - Yeni abonelik oluştur
  router.post('/api/subscriptions', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, monthly_price, billing_day, category } = req.body;

      const errors = validateSubscriptionFields({ name, monthly_price, billing_day, category });

      if (!name || monthly_price === undefined || billing_day === undefined) {
        errors.push('Ad, aylık fiyat ve fatura günü zorunludur');
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('. ') });
      }

      const price = parseFloat(monthly_price);
      const day = parseInt(billing_day, 10);
      const safeCategory = (category && category.trim().length > 0) ? category.trim() : 'Diğer';

      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, name, monthly_price, billing_day, category)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, monthly_price, billing_day, category, created_at, updated_at`,
        [userId, name.trim(), price, day, safeCategory]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Abonelik oluşturma hatası:', error);
      res.status(500).json({ error: 'Abonelik oluşturulamadı' });
    }
  });

  // PUT /api/subscriptions/:id - Abonelik güncelle
  router.put('/api/subscriptions/:id', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const subscriptionId = parseInt(req.params.id, 10);

      if (isNaN(subscriptionId) || subscriptionId < 1) {
        return res.status(400).json({ error: 'Geçersiz abonelik ID' });
      }

      const { name, monthly_price, billing_day, category } = req.body;

      if (
        name === undefined &&
        monthly_price === undefined &&
        billing_day === undefined &&
        category === undefined
      ) {
        return res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
      }

      const errors = validateSubscriptionFields({ name, monthly_price, billing_day, category });
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('. ') });
      }

      const fields = [];
      const values = [];
      let idx = 1;

      if (name !== undefined) {
        fields.push(`name = $${idx}`);
        values.push(name.trim());
        idx++;
      }

      if (monthly_price !== undefined) {
        fields.push(`monthly_price = $${idx}`);
        values.push(parseFloat(monthly_price));
        idx++;
      }

      if (billing_day !== undefined) {
        fields.push(`billing_day = $${idx}`);
        values.push(parseInt(billing_day, 10));
        idx++;
      }

      if (category !== undefined) {
        fields.push(`category = $${idx}`);
        values.push(category.trim().length > 0 ? category.trim() : 'Diğer');
        idx++;
      }

      fields.push(`updated_at = NOW()`);

      const query = `
        UPDATE subscriptions
        SET ${fields.join(', ')}
        WHERE id = $${idx} AND user_id = $${idx + 1}
        RETURNING id, name, monthly_price, billing_day, category, created_at, updated_at
      `;

      values.push(subscriptionId, userId);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Abonelik bulunamadı' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Abonelik güncelleme hatası:', error);
      res.status(500).json({ error: 'Abonelik güncellenemedi' });
    }
  });

  // DELETE /api/subscriptions/:id - Abonelik sil
  router.delete('/api/subscriptions/:id', verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const subscriptionId = parseInt(req.params.id, 10);

      if (isNaN(subscriptionId) || subscriptionId < 1) {
        return res.status(400).json({ error: 'Geçersiz abonelik ID' });
      }

      const result = await pool.query(
        `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id`,
        [subscriptionId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Abonelik bulunamadı' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Abonelik silme hatası:', error);
      res.status(500).json({ error: 'Abonelik silinemedi' });
    }
  });

  return router;
};

