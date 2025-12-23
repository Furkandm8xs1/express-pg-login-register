const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// JWT token'ı doğrulama middleware'i
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token bulunamadı" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, isAdmin }
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
};

// Admin kontrolü middleware'i
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli" });
  }

  next();
};

// Kullanıcı yetkisi kontrolü (kendi profili veya admin)
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
  }

  const userId = parseInt(req.params.id);
  const requesterId = req.user.id;

  const isOwner = userId === requesterId;
  const isAdmin = req.user.isAdmin;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
  }

  next();
};

// BU FONKSİYONU KONTROL ET HAT A OLABİLİR
const requirePageAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
      return res.redirect('/login');
  }

  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
  }
  catch (error) {
      return res.redirect('/login');
  }
};



// 1. Zaten giriş yapmışsa Login/Register sayfasına sokma, Dashboard'a at
const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.token; 
    if (token) {
        return res.redirect('/profile');
    }
    next();
};

// 2. Sadece Adminlerin görebileceği sayfalar için (Page versiyonu)
const requireAdminPage = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            // Giriş yapmış ama Admin değilse Dashboard'a geri gönder
            return res.redirect('/'); 
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/login');
    }
};


module.exports = {
  verifyToken,
  requireAdmin,
  requireOwnerOrAdmin,
  requirePageAuth,
  redirectIfLoggedIn,
  requireAdminPage
};