# Bill Sector Specialization (Fiş Sektör Özelliklendirmesi)

## Overview

This document describes the new bill sector categorization feature that allows users to organize their bills by category (Giyim, Elektronik, Yemek, etc.).

## Available Sectors (Mevcut Sektörler)

1. **Giyim** - Clothing (Elbise, pantolon, ayakkabı, vb.)
2. **Elektronik** - Electronics (Telefon, bilgisayar, monitor, vb.)
3. **Yemek** - Food & Dining (Restoran, kafe, pizza, vb.)
4. **Ulaştırma** - Transportation (Taksi, yakıt, otobüs, vb.)
5. **Sağlık** - Health & Medicine (Eczane, doktor, ilaç, vb.)
6. **Eğitim** - Education (Okul, kitap, kurs, vb.)
7. **Eğlence** - Entertainment (Sinema, konser, oyun, vb.)
8. **Ev ve Bahçe** - Home & Garden (Mobilya, dekorasyon, vb.)
9. **Spor** - Sports (Gym, antrenman, spor malzemeleri, vb.)
10. **Diğer** - Other (Default category)

## Installation & Setup

### 1. Database Migration

Run the migration file to add sector support to the database:

```bash
# Using psql
psql -U your_db_user -d your_db_name -f migrations/003-add-sector-support.sql

# Or execute the SQL directly in your database client
-- You'll find the SQL content in: migrations/003-add-sector-support.sql
```

This migration adds:

- `sector` column to the `receipts` table
- Indexes for faster queries by sector

### 2. Server Restart

After running the migration, restart your Node.js server:

```bash
npm start
# or
node server.js
```

## Features

### Automatic Sector Detection

When you upload a receipt, the system:

1. Uses Google Gemini AI to analyze the receipt image
2. Extracts merchant name and item information
3. Automatically categorizes the receipt into one of the 10 available sectors
4. If unsure, defaults to "Diğer"

### Manual Sector Editing

After a receipt is saved, you can:

1. Open the receipt details by clicking on it
2. Change the sector from the dropdown menu
3. Click "Kaydet" (Save) to update

### Visual Identification

Each receipt card displays:

- A colored left border based on its sector
- A sector badge showing the category name
- Color coding for quick visual identification:
  - 🔴 Giyim (Red)
  - 🟢 Elektronik (Teal)
  - 🟡 Yemek (Yellow)
  - etc.

## API Endpoints

### Get All Available Sectors

```http
GET /api/sectors
```

**Response:**

```json
{
  "sectors": ["Giyim", "Elektronik", "Yemek", ...],
  "description": "Kullanılabilir fiş sektörleri"
}
```

### Upload Receipt with Sector Detection

```http
POST /api/receipts/analyze
```

**Request:** FormData with `receiptImage` file

**Response:** Includes detected `sector` property

### Update Receipt Sector

```http
PUT /api/receipts/{receiptId}/sector
```

**Request Body:**

```json
{
  "sector": "Elektronik"
}
```

**Response:**

```json
{
  "success": true,
  "receipt": { ...receipt data with updated sector... }
}
```

## Code Changes Summary

### Backend - routes/receipts.js

- Added `BILL_SECTORS` constant with all available sectors
- Added `SECTOR_KEYWORDS` mapping for automatic detection
- Added `validateAndNormalizeSector()` function
- Added `guessSectorFromData()` function for keyword-based detection
- Updated POST `/api/receipts/analyze` to include sector
- Added GET `/api/sectors` endpoint
- Added PUT `/api/receipts/:receiptId/sector` endpoint
- Updated INSERT query to store sector in database

### Frontend - views/my-receipts.html

- Added sector selector in receipt modal
- Added CSS styling for sector badges and selector
- Displays sector information with color coding

### Frontend - public/js/my-receipts.js

- Added `loadSectors()` function to fetch available sectors
- Added `updateSector()` function to update receipt sector
- Updated `openReceiptDetail()` to show sector selector
- Updated `renderReceipts()` to display sector badge with colors
- Added sector color mapping

## Database Schema

### receipts table

```sql
-- New column added:
ALTER TABLE receipts
ADD COLUMN sector VARCHAR(100) DEFAULT 'Diğer';

-- Indexes added:
CREATE INDEX idx_receipts_sector ON receipts(sector);
CREATE INDEX idx_receipts_user_sector ON receipts(user_id, sector);
```

## Usage Example

### Upload a Receipt with Automatic Sector Detection

1. Click "Fiş Yükle" (Upload Receipt)
2. Select a receipt image (e.g., from a clothing store)
3. Click "Analiz Et ve Kaydet" (Analyze and Save)
4. The system automatically detects: **Sector: Giyim**
5. View the receipt in "Fişlerim" (My Receipts) with the Giyim badge

### Change Sector Manually

1. Click on a receipt card to open details
2. In the modal, find the "Sektör" (Sector) dropdown
3. Select a different sector from the list
4. Click "Kaydet" (Save)
5. The receipt updates immediately

## Sector Detection Rules

The system uses keyword matching to guess sectors:

- **Giyim**: elbise, pantolon, ayakkabı, gömlek, tişört, ceket, butik
- **Elektronik**: telefon, bilgisayar, tablet, laptop, monitor, kamera
- **Yemek**: restoran, kafe, pizza, burger, kebab, lokanta, pasta
- **Ulaştırma**: taksi, otobüs, tren, yakıt, benzin, araç
- **Sağlık**: eczane, doktor, hastane, ilaç
- **Eğitim**: okul, üniversite, kitap, kurs
- **Eğlence**: sinema, tiyatro, konser, oyun, müzik
- **Ev ve Bahçe**: mobilya, dekorasyon, boyası, inşaat
- **Spor**: spor, fitness, gym, antrenman

If multiple keywords match, the first matching sector is used. If no keywords match, the default "Diğer" is assigned.

## Troubleshooting

### Migration Error: Column already exists

If you get an error that the `sector` column already exists, run:

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name='receipts' AND column_name='sector';
```

### Sectors Not Showing in Dropdown

1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart the server
3. Check that the API endpoint `/api/sectors` returns data

### Sector Not Saving

1. Check browser console for errors (F12)
2. Verify that the receipt belongs to the current user
3. Check server logs for any database errors

## Future Enhancements

Potential improvements:

- Sector-based expense reports and analytics
- Sector filtering in receipt list
- Custom sector creation by users
- Sector-based budget tracking
- Sector comparison across time periods

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review server logs (`npm start` output)
3. Check browser console errors (F12 > Console)
4. Verify the migration was run successfully
