# 🎨 Frontend Design Specification: AI Compliance Dashboard

**Project Name:** AI-Driven Data Policy Enforcement Platform
**Style:** Modern Enterprise, Clean, Dark Mode Option, "Glassmorphism" Accents
**Target Audience:** Compliance Officers, Data Engineers

---

## 1. Global Design System

### **Typography**
- **Primary Font:** Inter (Clean, modern sans-serif) - Google Fonts
- **Headings:** Outfit or Plus Jakarta Sans (tech feel)
- **Monospace:** JetBrains Mono (for rules/code snippets)

### **Color Palette (Modern Tech)**
- **Primary (Brand):** `#2563EB` (Royal Blue) - Core actions, active states
- **Secondary (Accent):** `#10B981` (Emerald Green) - Compliance/Success
- **Danger (Violations):** `#EF4444` (Red) - Critical issues
- **Background:** `#F8FAFC` (Light Slate) or `#0F172A` (Dark Slate)
- **Cards/Surfaces:** White (`#FFFFFF`) with subtle shadow: `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);`

### **UI Elements Style**
- **Border Radius:** `8px` (Standard), `12px` (Cards)
- **Buttons:**
  - **Primary:** Solid Blue, Rounded, `px-4 py-2`
  - **Secondary:** Outline, Gray Text
  - **Icon Buttons:** Ghost style (transparent bg, hover effect)
- **Inputs:** Clean borders, focus ring in brand color

---

## 2. Layout Structure

### **Sidebar Navigation (Left, Fixed)**
- **Logo:** "ComplianceAI" (Icon + Text) at top left
- **Menu Items:**
  1.  📊 **Dashboard** (Home) - Overview of risk/compliance
  2.  📄 **Documents** (Policy Manager) - Upload & view PDFs
  3.  🧠 **Rules Engine** (AI Output) - Extracted logic view
  4.  🚨 **Violations** (Scanner) - List of database issues
  5.  ⚙️ **Settings** - Configuration
- **Bottom:** User Profile, Dark Mode Toggle

### **Header (Top, Sticky)**
- **Breadcrumbs:** `Home > Documents > Upload`
- **Search Bar:** "Search rules, documents, or violations..."
- **Notifications:** Bell icon (Badge for new violations)

---

## 3. Key Pages & Components

### **A. Dashboard (Home)**
**Purpose:** High-level compliance status at a glance.

1.  **Stats Cards (Row of 4):**
    - "Total Documents Processed" (Count + small sparkline)
    - "Active Rules" (Count)
    - "Open Violations" (Count + red trend arrow)
    - "Compliance Score" (Percentage gauge: 85%)

2.  **Charts Section (2 Columns):**
    - **Left:** "Violations by Severity" (Doughnut Chart: Critical, High, Medium)
    - **Right:** "Compliance Trend" (Line Chart: Last 30 Days)

3.  **Recent Activity (List):**
    - "New Rule Extracted: 'Data Retention Policy'" (Timestamp)
    - "Violation Detected: User Table (Rule #102)" (Timestamp)

---

### **B. Document Upload & Management**
**Purpose:** Ingest PDF policies.

1.  **Upload Area (Top):**
    - Large dashed border box: "Drag & drop PDF here or Click to Browse"
    - Icon: Cloud Upload
    - Supported formats text underneath.

2.  **Document List (Table):**
    - **Columns:** Name, Upload Date, Status (Processing/Complete), Actions (View, Delete)
    - **Status Badge:** Green (Complete), Yellow (Processing), Red (Error)

---

### **C. Rules Engine (AI Viewer)**
**Purpose:** Review AI-extracted logic.

1.  **Rule Cards (Grid or List):**
    - **Card Header:** Rule Name ("User Age Restriction") + Confidence Score (92% - Green Pill)
    - **Body:**
        - **Original Text:** "Users must be at least 18 years old..." (Italic, Gray)
        - **Extracted Logic:** `threshold: age >= 18` (Code block style)
    - **Footer:** "Source: PrivacyPolicy_v2.pdf" | Actions: [Edit] [Approve]

---

### **D. Violation Scanner Results**
**Purpose:** See where the database failed compliance.

1.  **Filters Bar:**
    - Filter by: Severity (High/Low), Rule Type, Date Range
    - Action Button: "Run Full Scan" (Primary Button)

2.  **Violations Table:**
    - **Columns:**
        - **Severity:** (Red Dot for High)
        - **Rule:** "Data Retention > 5 Years"
        - **Table/Row:** "users_table (id: 4521)"
        - **Explanation:** "Record created 2018-01-01 (7 years ago)"
        - **Status:** Open/Resolved (Dropdown)
        - **Action:** [View Details] [Ignore]

---

## 4. User Experience (UX) Animations

- **Hover Effects:** Cards lift slightly (`transform: translateY(-2px)`), buttons glow.
- **Micro-interactions:** Checkmarks animate on success.
- **Loading States:** Skeleton loaders for tables/charts while data fetches.
- **Transitions:** Smooth fade-in between pages.

---

## 5. Technical Requirements for Frontend Dev
- **Framework:** React + Tailwind CSS
- **Charts:** Recharts or Chart.js
- **Icons:** Lucide React or Heroicons
- **Fonts:** Google Fonts (Inter)

---

**Prompt for AI Generators:**
"Design a modern SaaS dashboard for a Compliance Platform. Dark sidebar, light content area. Include a statistics summary row, a drag-and-drop file upload section, and a detailed data table for tracking violations. Use a blue and emerald color scheme. The style should be clean, enterprise-grade, and minimalist."
