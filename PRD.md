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
- **Functionality**: Create and manage inventory sessions for specific stores with imported reference data. Store selection can be done manually or via external Telegram Mini App integration.
- **Purpose**: Establishes the baseline "book" inventory against which physical counts are compared, with flexible store selection options
- **Trigger**: Admin clicks "New Session", enters session details, and either types store name manually or selects from external store management app
- **Progression**: Click "New Session" → Enter session name → Either type store name OR (if in Telegram) enter store app URL and click "Select from App" → External app opens → Select store → Data returns automatically → Upload Excel file (barcode, name, expected qty, price) → Create session → Session appears in dashboard → Can be activated
- **Success criteria**: Excel correctly parsed, session created with all reference products and store information (including store ID if from external app), ready for scanning

### 2. Barcode Scanner (Mobile Interface)
- **Functionality**: Scan barcodes using device camera with html5-qrcode library or manual text input as fallback, with automatic flashlight control based on lighting conditions
- **Purpose**: Enable staff to quickly capture physical inventory counts on mobile devices using camera scanning with optimal visibility
- **Trigger**: Staff selects active session and begins scanning
- **Progression**: Follow step-by-step process (Setup → Scanning → Review → Complete) → Click "Open Camera" → Camera activates with live preview → Flashlight auto-enables in low light (or manual control: Always On/Always Off/Auto) → Point at barcode → Auto-detect and scan → System finds product → Adjust quantity if needed → Confirm → Record saved locally → Auto-sync when online (or use manual text input if camera unavailable)
- **Success criteria**: Camera scanning detects 1D/2D barcodes automatically, flashlight adapts to lighting conditions (<50% brightness auto-on, >70% auto-off), manual flashlight control available, manual input available as fallback, each scan creates a record with barcode, quantity, timestamp; works offline; syncs automatically; progress tracked through visual step indicators

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
- **Low Light Scanning**: Automatic flashlight activation when ambient brightness falls below 50%, with manual override options (Always On, Always Off, Auto)
- **No Flashlight Support**: Graceful degradation when device doesn't support torch capability
- **External Store App Unavailable**: If store selection app doesn't respond within 30 seconds or fails to load, fallback to manual input with helpful error message
- **Store App URL Persistence**: URL for external store app is saved locally for convenience across sessions
- **Invalid Store Data**: Validate store data received from external app (must include id and name), reject malformed responses with clear error

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
- Step-by-step progress indicator for scanning workflow (Setup → Scanning → Review → Complete)
- Flashlight control dropdown with mode selection and status indicator
- Brightness meter showing ambient light level in auto mode

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
- Lightbulb: `Lightbulb` - Flashlight off state
- LightbulbFilament: `LightbulbFilament` - Flashlight on state
- Circle: `Circle` - Step indicators (incomplete)
- CheckCircle: `CheckCircle` - Step indicators (complete)

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
