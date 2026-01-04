const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const verifyToken = (req, res, next) => {


  let token = req.cookies?.token;

  if (!token && req.headers.cookie) {
    console.log("⚠️ Cookie-parser bulamadı, manuel aranıyor...");
    const rawCookies = req.headers.cookie.split(';');
    const tokenCookie = rawCookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }



  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı! Lütfen tekrar giriş yapın.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token Hatası:", err.message);
    return res.status(403).json({ error: 'Token geçersiz veya süresi dolmuş.' });
  }
};


const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli" });
  }

  next();
};

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