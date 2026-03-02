# Quick Start Guide - Running Sector Migration

## Prerequisites

- PostgreSQL server running
- Access to your database
- `psql` CLI installed (or use pgAdmin/DBeaver)

## Option 1: Using psql Command Line (Recommended)

```bash
# Navigate to your project directory
cd "c:\Users\furkanali\Desktop\bill project"

# Run the migration
psql -U your_db_user -d your_db_name -f migrations/003-add-sector-support.sql
```

**Replace:**

- `your_db_user` - Your PostgreSQL username (e.g., `postgres`)
- `your_db_name` - Your database name (e.g., `bill_management`)

**Example:**

```bash
psql -U postgres -d bill_management -f migrations/003-add-sector-support.sql
```

## Option 2: Using pgAdmin GUI

1. Open pgAdmin in your browser
2. Connect to your database
3. Right-click on your database → Query Tool
4. Open the file: `migrations/003-add-sector-support.sql`
5. Select all the SQL and click Execute

## Option 3: Using DBeaver

1. Open DBeaver
2. Right-click your database connection → New SQL Editor
3. File → Open → Select `migrations/003-add-sector-support.sql`
4. Press Ctrl+Enter to execute

## Verification

After running the migration, verify it was successful:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name='receipts' AND column_name='sector';

-- Should return:
-- column_name | data_type | column_default
-- sector      | character varying(100) | 'Diğer'::character varying

-- Check if indexes exist
SELECT indexname FROM pg_indexes WHERE tablename='receipts';

-- Should include:
-- idx_receipts_sector
-- idx_receipts_user_sector
```

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_receipts_user_sector;
DROP INDEX IF EXISTS idx_receipts_sector;

-- Remove column
ALTER TABLE receipts DROP COLUMN IF EXISTS sector;
```

## After Migration

1. Restart your Node.js server:

```bash
npm start
```

2. Test the feature:

- Upload a receipt
- Check that it has a sector assigned
- Try changing the sector in the modal

3. Check browser console (F12) for any errors

## Common Issues

### Error: "Column already exists"

You probably already ran this migration. That's fine! The feature is already active.

### Error: "Permission denied"

Make sure you're using a database user with ALTER TABLE permissions.

### No changes appearing

- Clear browser cache (Ctrl+Shift+Delete)
- Restart the server
- Hard refresh the page (Ctrl+F5)

## Support

Check `SECTOR_FEATURE.md` for detailed documentation and troubleshooting.
