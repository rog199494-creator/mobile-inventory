# Mobile Inventory System (TSD Replacement)

A professional mobile inventory management system that transforms smartphones into portable data terminals for retail stocktaking, inspired by e-revision.ru.

**Experience Qualities**:
1. **Efficient** - Fast barcode scanning workflow with minimal taps, optimized for rapid inventory processing
2. **Reliable** - Offline-first architecture ensuring data capture works without internet connectivity
3. **Clear** - Immediate visual feedback on discrepancies with color-coded variance indicators

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-role system with real-time synchronization, offline capabilities, Excel import/export, barcode scanning simulation, and comprehensive inventory reconciliation logic.

## Essential Features

### 1. Session Management (Admin)
- **Functionality**: Create and manage inventory sessions for specific stores with imported reference data
- **Purpose**: Establishes the baseline "book" inventory against which physical counts are compared
- **Trigger**: Admin clicks "New Session" and uploads Excel file with expected inventory
- **Progression**: Upload Excel → Parse data (barcode, name, expected qty, price) → Create session → Session appears in dashboard → Can be activated
- **Success criteria**: Excel correctly parsed, session created with all reference products, ready for scanning

### 2. Barcode Scanner (Mobile Interface)
- **Functionality**: Scan barcodes using camera simulation (text input for MVP) and record actual quantities
- **Purpose**: Enable staff to quickly capture physical inventory counts on mobile devices
- **Trigger**: Staff selects active session and begins scanning
- **Progression**: Enter/scan barcode → System finds product → Show product info → Enter/adjust quantity → Confirm → Record saved locally → Auto-sync when online
- **Success criteria**: Each scan creates a record with barcode, quantity, timestamp; works offline; syncs automatically

### 3. Real-time Progress Dashboard
- **Functionality**: Live view of scanning progress, staff activity, and preliminary discrepancies
- **Purpose**: Allow managers to monitor inventory progress and identify issues early
- **Trigger**: Admin opens active session details
- **Progression**: View session → See scanned vs total items progress bar → View recent scans list → See active scanners → Monitor completion percentage
- **Success criteria**: Updates within 2 seconds of scan submission, shows accurate progress metrics

### 4. Variance Analysis & Reporting
- **Functionality**: Calculate and categorize discrepancies between expected and actual inventory
- **Purpose**: Identify shrinkage, overstocks, and unknown items for accounting reconciliation
- **Trigger**: Admin views completed session or requests analysis during active session
- **Progression**: Open results view → See summary (total variance in units/value) → Browse categorized discrepancies (shortage/overage/unknown) → Filter by variance type → Export to Excel
- **Success criteria**: All variances correctly calculated, color-coded by type, exportable with original + actual + variance columns

### 5. Offline-First Data Sync
- **Functionality**: Store scan records locally when offline, automatically sync when connection restored
- **Purpose**: Ensure inventory can proceed in basements/warehouses without cellular coverage
- **Trigger**: Network becomes unavailable during scanning
- **Progression**: Scan offline → Records saved to IndexedDB → Visual indicator shows offline mode → Network restored → Automatic background sync → Success confirmation
- **Success criteria**: No scan data lost during offline periods, transparent sync with conflict resolution

## Edge Case Handling

- **Duplicate Scans**: Accumulate quantities instead of creating duplicate records - show toast "Added to existing count"
- **Unknown Barcodes**: Allow recording items not in reference data, flag as "Unknown/New Item" for review
- **Concurrent Scanning**: Multiple users scanning same item - server aggregates quantities from all scanners
- **Mid-Session Excel Re-upload**: Allow updating reference data during active session with confirmation dialog
- **Incomplete Sessions**: Auto-save progress, allow resuming sessions later, warning before closing with unsynced data
- **Invalid Excel Format**: Clear validation errors with row-by-row feedback on upload issues

## Design Direction

The design should evoke **professional efficiency meets modern simplicity** - like a premium business tool that feels as polished as consumer apps. Think clean dashboards with data-dense tables that remain readable, confident use of color to communicate variance status (green surplus, red shortage, amber unknown), and an interface that feels equally at home on a warehouse floor and in a management office.

## Color Selection

A professional retail analytics palette with strong data visualization colors:

- **Primary Color**: `oklch(0.45 0.15 250)` - Deep trustworthy blue communicating reliability and business credibility
- **Secondary Colors**: 
  - `oklch(0.95 0.01 250)` - Pale blue-grey for subtle backgrounds and cards
  - `oklch(0.25 0.08 250)` - Dark blue-grey for headers and emphasis
- **Accent Color**: `oklch(0.55 0.20 200)` - Vibrant cyan for CTAs and interactive elements, energetic without being aggressive
- **Status Colors**:
  - Success/Surplus: `oklch(0.65 0.18 145)` - Fresh green
  - Warning/Unknown: `oklch(0.75 0.15 85)` - Warm amber
  - Error/Shortage: `oklch(0.60 0.22 25)` - Clear red
- **Foreground/Background Pairings**:
  - Primary Blue: White text `oklch(1 0 0)` - Ratio 9.2:1 ✓
  - Accent Cyan: White text `oklch(1 0 0)` - Ratio 5.1:1 ✓
  - Background `oklch(0.98 0.005 250)`: Foreground `oklch(0.20 0.05 250)` - Ratio 13.5:1 ✓
  - Success Green: White text `oklch(1 0 0)` - Ratio 4.8:1 ✓
  - Error Red: White text `oklch(1 0 0)` - Ratio 5.2:1 ✓

## Font Selection

Typography should convey **precision and clarity** - numbers must be instantly readable, data tables should feel organized, and the interface should project professional competence.

- **Primary Font**: Space Grotesk - Modern geometric sans with excellent readability for UI and data
- **Monospace Font**: JetBrains Mono - For barcodes, quantities, and numeric data to ensure digit alignment

**Typographic Hierarchy**:
- H1 (Page Titles): Space Grotesk Bold / 32px / -0.02em letter spacing / line-height 1.2
- H2 (Section Headers): Space Grotesk SemiBold / 24px / -0.01em / line-height 1.3
- H3 (Card Titles): Space Grotesk Medium / 18px / 0 / line-height 1.4
- Body (General Text): Space Grotesk Regular / 15px / 0 / line-height 1.6
- Data/Numbers: JetBrains Mono Medium / 14px / 0 / line-height 1.5 / tabular-nums
- Labels/Captions: Space Grotesk Medium / 13px / 0.01em / line-height 1.5 / uppercase

## Animations

Animations should reinforce **data flow and system responsiveness** - scanning actions should feel satisfying with quick confirmation animations, sync status should smoothly transition, and variance highlights should draw attention without being distracting.

Key animation moments:
- Scan confirmation: 200ms scale pulse + success color flash on scan record addition
- Sync status: Smooth 300ms fade between offline/syncing/online indicators
- Variance highlighting: 250ms color transition when switching between shortage/surplus filters
- Progress bars: Smooth 400ms eased updates as new scans arrive
- Data table updates: 150ms fade-in for new rows in real-time scan feed

## Component Selection

**Components**:
- **Card**: Session cards in dashboard, product detail cards during scanning
- **Table**: Main data grid for variance analysis with sortable columns
- **Badge**: Status indicators (Active/Completed/Planned), variance type tags (Shortage/Surplus/Unknown)
- **Button**: Primary actions (New Session, Start Scanning, Export Excel), secondary (Edit, Delete)
- **Input**: Barcode entry field with autofocus, quantity adjustment
- **Dialog**: Session creation wizard, Excel upload with drag-drop
- **Progress**: Linear progress for session completion percentage
- **Tabs**: Switch between "Active Sessions", "Completed", "All"
- **Alert**: Network status banner (offline warning, sync success)
- **Separator**: Divide sections in session detail view
- **Sheet**: Mobile bottom drawer for scan confirmation details

**Customizations**:
- Custom Excel drop zone with animated upload indicator
- Real-time scanning feed component with auto-scroll to latest
- Variance summary cards with large numeric displays and trend indicators
- Barcode input with format validation and auto-submit on valid code detection

**States**:
- Buttons: Distinct hover with 2px lift shadow, active with pressed effect, disabled at 40% opacity
- Input fields: Focus with accent color ring, error state with red border + icon, success with green checkmark
- Table rows: Hover background tint, selected row with accent border-left, variance rows with status color background at 10% opacity

**Icon Selection**:
- Barcode: `Barcode` - Primary scanner icon
- Upload: `Upload` - Excel file upload
- Download: `Download` - Export results
- TrendUp/TrendDown: `TrendUp`, `TrendDown` - Variance indicators  
- CheckCircle: `CheckCircle` - Sync success, completed status
- WarningCircle: `Warning` - Unknown items, validation issues
- Users: `Users` - Active scanners count
- ChartBar: `ChartBar` - Analytics/reporting view
- Plus: `Plus` - Create new session
- ArrowsClockwise: `ArrowsClockwise` - Sync status

**Spacing**:
- Card padding: `p-6` on desktop, `p-4` on mobile
- Section gaps: `gap-6` for main layout sections
- Form fields: `gap-4` vertical spacing between inputs
- Table cells: `px-4 py-3` for comfortable data scanning
- Button padding: `px-6 py-2.5` for primary, `px-4 py-2` for secondary

**Mobile**:
- Scanner interface: Full-screen on mobile with floating action buttons
- Tables: Horizontal scroll with sticky first column (product name)
- Session cards: Stack vertically on mobile, 2-column grid on tablet, 3-column on desktop
- Navigation: Bottom sheet on mobile for session selection, sidebar on desktop
- Input fields: Larger touch targets (min 44px height) with increased font size (16px to prevent zoom)
