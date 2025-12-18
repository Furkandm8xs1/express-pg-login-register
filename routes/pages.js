const express = require('express');
const path = require('path');
const router = express.Router();






router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/login.html"));
});

// Login sayfası
router.get("/login",  (req, res) => {
  res.sendFile(path.join(viewsPath, "login.html"));
});

// Register sayfası
router.get("/register",  (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/register.html"));
});

// Profile sayfası
//bunu test amaçlı degiştirdim ona  gore

router.get("/profile",(req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/profile.html"));
});

// Dashboard sayfası
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/dashboard.html"));
});

router.get("/ayarlar", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/ayarlar.html"));
});

// Reset password sayfası
router.get("/reset-password",(req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/reset-password.html"));
});

// Forgot password sayfası
router.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/forgot-password.html"));
});

// Messages sayfası
router.get("/messages",  (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/views/mesajlar.html"));
});

module.exports = router;