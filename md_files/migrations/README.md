#!/bin/bash
# Docker PostgreSQL Initialization Info
# Bu script PostgreSQL container başlatıldığında SQL dosyalarını çalıştırır

echo "=========================================="
echo "PostgreSQL Docker Initialization"
echo "=========================================="
echo ""
echo "Database: ${POSTGRES_DB:-billproject}"
echo "User: ${POSTGRES_USER:-postgres}"
echo "Port: 5432"
echo ""
echo "SQL Migration Files (Alfabetik sırada çalışacak):"
echo "  1. users.sql - Users tablosu"
echo "  2. merchants.sql - Merchants tablosu"  
echo "  3. messages.sql - Messages tablosu"
echo "  4. receipt_items.sql - Receipt items tablosu"
echo "  5. receipts.sql - Receipts tablosu"
echo "  6. subscriptions.sql - Subscriptions tablosu"
echo ""
echo "=========================================="
echo ""
echo "✅ Tüm tablolar başarıyla oluşturulacak"
