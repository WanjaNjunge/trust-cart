# Admin Frontend Design System

## 1. Core Philosophy
The Admin Panel will share the same **DNA** (Typography, Color Palette, Radius) as the Storefront to maintain brand identity, but will differ in **Structure** and **Density**:
- **Storefront:** Immersive, spacious, "Glassmorphism" aesthetic, marketing-focused.
- **Admin:** Utilitarian, data-dense, high-contrast, productivity-focused.

## 2. Layout Structure
We will use a **Collapsible Sidebar Layout**:

```
+------------------+--------------------------------------------+
|  [Logo]          |  [Header: Search | Notifications | Profile]  |
|                  +--------------------------------------------+
|  DASHBOARD       |                                            |
|                  |  [Page Title + Actions]                    |
|  CATALOG         |                                            |
|   Products       |  +--------------------------------------+  |
|   Collections    |  |                                      |  |
|   Inventory      |  |           MAIN CONTENT AREA          |  |
|                  |  |                                      |  |
|  SALES           |  |        (Tables, Forms, Charts)       |  |
|   Orders         |  |                                      |  |
|   Invoices       |  +--------------------------------------+  |
|                  |                                            |
|  SETTINGS        |                                            |
+------------------+--------------------------------------------+
```

## 3. Visual Theme

### Colors (Inherited from `tailwind.config.ts`)
- **Primary Action:** `primary` (Electric Indigo) for save buttons, active states.
- **Sidebar Background:** `slate-900` (Dark Mode contrast) or `white` with a strong border. *Recommendation: Dark Sidebar for clear context switching.*
- **Background:** `slate-50` (Light Gray) for the main content area to create separation from white cards.

### Typography
- **Headings:** `font-display` (Sans-serif) for page titles.
- **Body/Data:** `font-sans` (Inter/System) for high readability in tables.

### Component Styling
- **Cards:** White background, thin border (`border-slate-200`), subtle shadow (`shadow-sm`). *Avoid "glass" effects in Admin to reduce visual noise.*
- **Tables:**
    - Sticky headers.
    - Zebrastraping (optional) or hover rows (`hover:bg-slate-50`).
    - Condensed padding (`py-2` instead of `py-4`).
- **Inputs:** Standard form controls with clear focus rings (`ring-primary`).

## 4. Key Components to Build

### A. AdminShell
The wrapper component that handles the Sidebar state (expanded/collapsed) and responsive mobile drawer.

### B. DataTable
A reusable, server-side paginated table component.
- **Props:** `columns`, `data`, `isLoading`, `onSort`, `pagination`.
- **Features:**
    - Bulk Actions (Select checkboxes).
    - Status Badges (Pills with semantic colors: Green=Published, Yellow=Pending).

### C. PageHeader
Standardized header for every admin page.
- **Title:** H1.
- **Breadcrumbs:** Path context.
- **Actions:** Primary Action (e.g., "Add Product") + Secondary (Export).

### D. StatsCard
Simple metric display.
- **Layout:** Icon + Label + Big Number + Trend (Green/Red % change).

## 5. Implementation Strategy
1.  **Layout First:** content wrapper + sidebar.
2.  **Navigation Config:** Define menu items array (Label, Icon, Href, Permission).
3.  **UI Primitives:** Ensure `Table`, `Badge`, `Button` are exported from `src/components/ui`.

## 6. Route Structure
All admin pages live under `app/(admin)/admin/...` group to share the layout but keep URL as `/admin/...`.
