# Mobile Inventory System - TSD Replacement

A professional mobile inventory management system that transforms smartphones into portable data terminals for retail stocktaking, inspired by e-revision.ru.

## Features

✅ **Session Management** - Create and manage multiple inventory counting sessions
✅ **Excel/CSV Import** - Upload your expected inventory from spreadsheets
✅ **Mobile Scanner** - Scan barcodes and record quantities on any device
✅ **Offline Support** - Continue scanning even without internet connection
✅ **Real-time Progress** - Monitor scanning progress across multiple users
✅ **Variance Analysis** - Automatic calculation of shortages, surpluses, and unknown items
✅ **Excel Export** - Download variance reports for accounting systems

## How to Use

### 1. Create a New Session

Click "New Session" and provide:
- Session name (e.g., "Monthly Inventory - January 2024")
- Store/location name
- Upload a CSV file with your expected inventory

### 2. CSV File Format

Your CSV should have the following columns:

```csv
Barcode,Product Name,Expected Qty,Price
8901234567890,Premium Coffee Beans 500g,150,12.99
8901234567891,Organic Green Tea 100g,200,8.50
8901234567892,Dark Chocolate Bar 100g,300,4.25
```

**Required columns:**
- `Barcode` - Product barcode/SKU
- `Product Name` - Full product description
- `Expected Qty` - Current book inventory quantity
- `Price` - Unit price (for calculating variance value)

### 3. Start Scanning

- Select an active session and click "Scan"
- Enter barcodes manually or scan with camera (simulation mode)
- Adjust quantities using +/- buttons
- System automatically tracks:
  - Total items scanned
  - Unique products counted
  - Scanning progress percentage

### 4. Offline Mode

The app works without internet:
- All scans are saved locally
- Offline indicator shows pending sync count
- Automatic sync when connection restored

### 5. View Results

Click "View Details" on any session to see:
- **Shortages** - Items with less stock than expected (highlighted red)
- **Surpluses** - Items with more stock than expected (highlighted green)
- **Unknown** - Items scanned but not in original list (highlighted amber)
- **Matches** - Items with exact quantities

Export results as CSV for uploading to your accounting system.

## Sample Data

The application includes 3 demo sessions:
1. **Active Session** - Currently in progress with partial scans
2. **Completed Session** - Finished inventory with all variances calculated
3. **Planned Session** - Ready to start, no scans yet

## Technical Notes

- All data persists in browser storage
- Sessions are never deleted automatically
- Multiple users can scan simultaneously (data merges automatically)
- Duplicate barcode scans accumulate quantities
- Unknown items are flagged for review but still recorded

## Support

For CSV format issues, ensure:
- File is saved as `.csv` or `.txt`
- Commas separate columns (not semicolons)
- No special characters in product names
- Prices use decimal points (not commas)
