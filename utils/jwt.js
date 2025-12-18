// utils/jwtHelper.js
const jwt = require('jsonwebtoken');

// 1. GÜVENLİK KURALI: Fallback string kullanma!
// Eğer .env okunamazsa uygulama hata verip dursun. Bu, production'da güvenlik açığını önler.
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET tanımlı değil.");
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'baska-gizli-anahtar'; // Refresh için ayrı secret
const REFRESH_EXPIRES_IN = '7d'; // 7 gün

/**
 * Genel Token Üretici
 * @param {Object} payload - Token içine gömülecek veri (id, email, role vb.)
 * @param {String} expiresIn - Süre (opsiyonel)
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Refresh Token Üretici (Uzun ömürlü oturumlar için)
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

/**
 * Özel Admin Token Üretici (Senin senaryon için)
 * DB'de rol olmasa bile, buradan manuel olarak 'admin' rolü ekliyoruz.
 */
const generateAdminToken = (adminName) => {
    const payload = {
        name: adminName,
        role: 'admin',
        type: 'access'
    };
    return generateToken(payload, '2h'); // Admin oturumu 2 saat sürsün
};

/**
 * Gelişmiş Verify Fonksiyonu
 * Hatanın ne olduğunu (süre dolması vs.) anlamak için detay döner.
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded, error: null };
    } catch (error) {
        let message = "Geçersiz Token";
        if (error.name === 'TokenExpiredError') message = "Oturum Süresi Doldu";
        if (error.name === 'JsonWebTokenError') message = "Hatalı Token Yapısı";

        return { valid: false, decoded: null, error: message };
    }
};

/**
 * Token'ı doğrulamadan sadece içini okumak için (Decode)
 * Front-end tarafında işe yaradığı gibi bazen backend'de loglama için de gerekir.
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = { 
    generateToken,
    generateRefreshToken,
    generateAdminToken,
    verifyToken,
    decodeToken
};