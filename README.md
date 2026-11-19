# DemandIQ Smart Restock — AI Landing Page with 3D Visual & Scroll Graphics

> **CommerceSphere AI Hackathon Track** · Working Prototype Design & Landing Experience  
> *"Decisions, Not Charts — Upload sales CSV and know what to reorder in 60 seconds, explained in simple Bangla."*

---

## 🌟 Highlights & Features

1. **3D WebGL Digital Twin (`js/three-scene.js`)**:
   - Interactive isometric smart warehouse scene built with **Three.js (r128)**.
   - Dynamic 3D inventory crates with color-coded status beacons:
     - 🔴 **Critical** (`#EF4444`): Stocks running out in 1–3 days.
     - 🟠 **Soon** (`#F59E0B`): Safe for 4–7 days; reorder this week.
     - 🟢 **Healthy / OK** (`#10B981`): Optimal 30–45 days cover.
     - 🔵 **Overstock / Dead** (`#3B82F6`): Capital trapped; clearance promo suggested.
   - Real-time 3D raycasting with interactive hover tooltips and click-to-inspect actions.
   - Interactive 3D HUD controls: Auto-Orbit, Explode Racks View, Holographic Wireframe Scanner, and Camera Reset.

2. **Scroll Graphics & Visual Storytelling (`js/scroll-animations.js`)**:
   - Scroll-linked camera choreographies that smoothly track page progress.
   - Interactive **Before vs After comparison matrix** (The Spreadsheet Trap vs. DemandIQ AI Clarity).
   - Real-time animated number counters with BDT (৳) formatting and Bengali numerals (`০-৯`).

3. **Full Working Dashboard Simulation (PRD Screens S2 & S3)**:
   - **Persona Switcher**: Switch between **Rahim** (F-Commerce fashion seller, 45 SKUs) and **Salma** (Neighbourhood retail mart, 180 SKUs).
   - **4 Key PRD Metrics**: Money at Risk (ঝুঁকিতে থাকা টাকা ৳), Lost-Sales Risk (হারাতে পারেন এমন বিক্রি ৳), Cash Tied Up (আটকে থাকা টাকা ৳), and Items Needing Action.
   - **Priority Table**: Search, filter chips (All, Critical, Soon, Healthy, Overstock, Dead), days of cover, stockout dates, order quantities, and money at risk.
   - **আজকের করণীয় (Today's Actions)**: Top 5 priority action cards with natural Bangla advisory text and a **1-click WhatsApp restock copy button** with animated toast feedback.
   - **Product Detail Modal (S3)**: Embedded **Chart.js** displaying 90-day historical actuals, 60-day forecast with shaded **80% confidence intervals**, projected stockout zero-crossing date, and **28-day held-out backtest WAPE comparison** (Holt-Winters vs. Naive baseline).

4. **Event Multiplier Calendar (PRD Screen S4)**:
   - Bangladesh seasonal surge cards: **Eid-ul-Fitr (+280%)**, **Pohela Boishakh (+190%)**, **11.11 Mega Sale (+320%)**, and **Eid-ul-Adha (+240%)**.
   - Custom event addition simulator with learned multipliers from past sales curves.

5. **Interactive ROI & Money-at-Risk Simulator**:
   - Interactive sliders for monthly sales turnover (৳50,000 – ৳30,00,000), SKU count, and supplier lead times.
   - Real-time dynamic calculation of recovered sales, unlocked dead capital, and weekly hours saved.

6. **In-Browser CSV Onboarding Simulator (PRD Screen S1)**:
   - Drag-and-drop file dropzone.
   - Downloadable sample CSV templates: `demandiq_sample_sales.csv` and `demandiq_sample_inventory.csv`.
   - 5-step animated pipeline visualizer simulating the autonomous 60-second analysis engine.

7. **Bilingual Engine (English 🌐 / বাংলা 🇧🇩)**:
   - Instant header toggle switching every heading, label, status badge, advisory message, and numeral between English and authentic Bengali.

---

## 🚀 How to Run Locally

### Option 1: Python Web Server (Recommended)
Open a terminal in this directory and run:
```bash
python server.py
```
Then open your browser and navigate to:
```
http://localhost:3000
```

### Option 2: Direct Browser Launch
Simply double-click `index.html` or open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 📁 Project Structure

```
demandiq-landing/
├── index.html                   # Master Landing Page HTML with all PRD screens
├── server.py                    # Lightweight Python HTTP server
├── README.md                    # Documentation & hackathon guide
├── css/
│   └── styles.css               # Cyber-fintech dark theme, glassmorphism & responsive styles
├── js/
│   ├── three-scene.js           # Three.js 3D warehouse twin & raycasting HUD
│   ├── dashboard-sim.js         # Interactive S2/S3 dashboard & Chart.js modal engine
│   ├── roi-calculator.js        # Dynamic ROI & Event Multiplier calculation
│   └── scroll-animations.js     # Scroll graphics & celebratory interactions
└── sample_data/
    ├── demandiq_sample_sales.csv      # Sample sales data (date, sku, qty, price)
    └── demandiq_sample_inventory.csv  # Sample inventory data (sku, stock, cost, lead time)
```

---

## ⚖️ PRD Honesty Rules Compliance
- ✅ Sample data is clearly labelled as **নমুনা ডেটা — আসল দোকানের ডেটা নয়**.
- ✅ Backtest numbers (WAPE, bias) and baseline comparisons are explicitly shown.
- ✅ All business assumptions (lead time, MOQ, service level) are visible and editable.
