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


const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};


const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};



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


const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};