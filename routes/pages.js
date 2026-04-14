const express = require('express');
const path = require('path');
const router = express.Router();
const { requirePageAuth, redirectIfLoggedIn, requireAdminPage } = require('../utils/authMiddleware');


router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/index.html"));
});

// Login sayfası
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/login.html"));
});

// Register sayfası
router.get("/register", redirectIfLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/register.html"));
});

// Profile sayfası
//bunu test amaçlı degiştirdim ona  gore  

router.get("/profile", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/profile.html"));
});

// Dashboard sayfası
router.get("/dashboard", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/dashboard.html"));
});

router.get("/ayarlar", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/ayarlar.html"));
});

router.get("/account-close-whatsapp", requirePageAuth, (req, res) => {
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;

  if (!adminPhone) {
    return res.status(500).send("WhatsApp yonlendirme numarasi ayarlanmamis.");
  }

  const userId = req.user?.id || "-";
  const username = req.user?.username || "-";
  const email = req.user?.email || "-";

  const message = encodeURIComponent(
    `Merhaba, hesabimi kapatmak istiyorum.\n\nKullanici: ${username}\nE-posta: ${email}\nKullanici ID: ${userId}`
  );

  return res.redirect(`https://api.whatsapp.com/send?phone=${adminPhone}&text=${message}`);
});

// Reset password sayfası
router.get("/reset-password", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/reset-password.html"));
});

// Forgot password sayfası
router.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/forgot-password.html"));
});

// Messages sayfası
router.get("/messages", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/mesajlar.html"));
});
// Messages sayfası
router.get("/admin", requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/admin.html"));
});

router.get("/receipt", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/my-receipts.html"));
});


router.get("/subscriptions", requirePageAuth, (req, res) => {
  res.redirect("/my-receipts");
});

router.get("/my-receipts", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/my-receipts.html"));
});



module.exports = router;