/**
 * DemandIQ Smart Restock - Interactive Dashboard & Pipeline Simulator
 * Faithfully implementing S1 (Upload), S2 (Dashboard), and S3 (Product Detail)
 */

(function () {
  'use strict';

  // Bengali Digits Converter
  function toBanglaDigits(num) {
    if (num === null || num === undefined) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
  }

  function formatTaka(amount, isBn = false) {
    const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
    return isBn ? `৳${toBanglaDigits(formatted)}` : `৳${formatted}`;
  }

  // Persona 1: Rahim (F-Commerce Fashion Seller - 45 SKUs)
  const RAHIM_DATA = {
    personaName: 'Rahim (F-Commerce Fashion)',
    personaSub: 'Online Brand • 45 SKUs • Tracks in Excel & WhatsApp',
    kpis: {
      moneyAtRisk: 342800,
      lostSalesRisk: 215000,
      cashTiedUp: 127800,
      actionCount: 14,
    },
    products: [
      {
        sku: 'PANJABI-001',
        name: 'Premium Cotton Panjabi White',
        name_bn: 'প্রিমিয়াম সুতি পাঞ্জাবি - সাদা',
        category: 'Fashion',
        price: 1850,
        cost: 1250,
        stock: 4,
        onOrder: 0,
        leadTime: 7,
        moq: 25,
        daysOfCover: 1.8,
        stockoutDate: '2024-04-03',
        orderQty: 45,
        status: 'critical',
        class: 'fast',
        moneyAtRisk: 83250,
        wapeModel: '11.4%',
        wapeNaive: '24.8%',
        bias: '+1.2%',
        modelUsed: 'Holt-Winters Multiplicative',
        msg_en: 'Stock exhausts in 1.8 days before Eid rush! Place supplier order for 45 units today to protect ৳83,250 in sales.',
        msg_bn: 'ঈদের আগের পিক সিজন! আগামী পরশু স্টক শেষ হয়ে যাবে। ৳৮৩,২৫০ টাকার বিক্রি রক্ষা করতে আজই ৪৫ পিস অর্ডার করুন।',
      },
      {
        sku: 'SAREE-002',
        name: 'Dhakai Jamdani Saree Crimson',
        name_bn: 'ঢাকাই জামদানি শাড়ি - লাল',
        category: 'Festive Wear',
        price: 4500,
        cost: 3100,
        stock: 2,
        onOrder: 5,
        leadTime: 10,
        moq: 10,
        daysOfCover: 2.4,
        stockoutDate: '2024-04-04',
        orderQty: 15,
        status: 'critical',
        class: 'fast',
        moneyAtRisk: 67500,
        wapeModel: '9.8%',
        wapeNaive: '21.5%',
        bias: '-0.8%',
        modelUsed: 'Holt-Winters Additive',
        msg_en: 'High margin SKU! Supplier lead time is 10 days. Order 15 units immediately to avoid stockout during Pahela Baishakh.',
        msg_bn: 'উচ্চ লাভের পণ্য! সাপ্লায়ার থেকে আসতে ১০ দিন সময় লাগে। পহেলা বৈশাখের আগে সংকট এড়াতে এখনই ১৫ পিস অর্ডার করুন।',
      },
      {
        sku: 'KABLI-006',
        name: 'Royal Kabli Suit Charcoal',
        name_bn: 'রয়্যাল কাবলি সেট - চারকোল',
        category: 'Fashion',
        price: 2950,
        cost: 1950,
        stock: 5,
        onOrder: 0,
        leadTime: 8,
        moq: 15,
        daysOfCover: 5.2,
        stockoutDate: '2024-04-07',
        orderQty: 25,
        status: 'soon',
        class: 'fast',
        moneyAtRisk: 73750,
        wapeModel: '12.8%',
        wapeNaive: '26.4%',
        bias: '+1.5%',
        modelUsed: 'Holt-Winters Additive',
        msg_en: 'Reorder this week. Stock covers only 5.2 days with rising Eid search volume.',
        msg_bn: 'এই সপ্তাহের মধ্যে অর্ডার করুন। ঈদের কারণে চাহিদা বাড়ছে, বর্তমান স্টকে মাত্র ৫ দিন চলবে।',
      },
      {
        sku: 'KURTI-003',
        name: 'Floral Embroidered Kurti',
        name_bn: 'ফ্লোরাল এমব্রয়ডারি কুর্তি',
        category: 'Women Wear',
        price: 1200,
        cost: 800,
        stock: 14,
        onOrder: 0,
        leadTime: 5,
        moq: 30,
        daysOfCover: 6.5,
        stockoutDate: '2024-04-08',
        orderQty: 30,
        status: 'soon',
        class: 'healthy',
        moneyAtRisk: 36000,
        wapeModel: '13.1%',
        wapeNaive: '22.0%',
        bias: '+0.5%',
        modelUsed: 'Seasonal Naive',
        msg_en: 'Trending fast. Order minimum batch of 30 units before weekend.',
        msg_bn: 'দ্রুত বিক্রি হচ্ছে। সপ্তাহান্তের আগেই ন্যূনতম ৩০ পিস অর্ডার বুক করুন।',
      },
      {
        sku: 'POLO-004',
        name: 'Classic Pique Polo Navy',
        name_bn: 'ক্লাসিক পিক পোলো - নেভি ব্লু',
        category: 'Casuals',
        price: 850,
        cost: 550,
        stock: 78,
        onOrder: 0,
        leadTime: 7,
        moq: 50,
        daysOfCover: 42.0,
        stockoutDate: '2024-05-14',
        orderQty: 0,
        status: 'ok',
        class: 'healthy',
        moneyAtRisk: 0,
        wapeModel: '8.2%',
        wapeNaive: '14.1%',
        bias: '-0.3%',
        modelUsed: 'Holt-Winters Additive',
        msg_en: 'Healthy stock levels. Sufficient buffer for next 42 days.',
        msg_bn: 'স্টক একদম ঠিক আছে। আগামী ৪২ দিনের প্রয়োজনীয় ব্যালেন্স মজুত রয়েছে।',
      },
      {
        sku: 'JEANS-007',
        name: 'Slim Stretch Denim Jeans',
        name_bn: 'স্লিম স্ট্রেচ ডেনিম জিন্স',
        category: 'Denim',
        price: 1650,
        cost: 1100,
        stock: 65,
        onOrder: 0,
        leadTime: 14,
        moq: 25,
        daysOfCover: 48.0,
        stockoutDate: '2024-05-20',
        orderQty: 0,
        status: 'ok',
        class: 'healthy',
        moneyAtRisk: 0,
        wapeModel: '10.5%',
        wapeNaive: '19.2%',
        bias: '+0.4%',
        modelUsed: 'Croston SBA',
        msg_en: 'Stock is healthy. No reorder required until next review period.',
        msg_bn: 'পর্যাপ্ত স্টক রয়েছে। পরবর্তী রিভিউ তারিখের আগে নতুন ক্রয়ের প্রয়োজন নেই।',
      },
      {
        sku: 'TSHIRT-005',
        name: 'Urban Graphic Tee Olive',
        name_bn: 'গ্রাফিক টি-শার্ট - অলিভ',
        category: 'Casuals',
        price: 650,
        cost: 420,
        stock: 165,
        onOrder: 0,
        leadTime: 5,
        moq: 50,
        daysOfCover: 135.0,
        stockoutDate: '2024-08-16',
        orderQty: 0,
        status: 'overstock',
        class: 'slow',
        moneyAtRisk: 69300,
        wapeModel: '15.4%',
        wapeNaive: '28.9%',
        bias: '-2.1%',
        modelUsed: 'Croston SBA',
        msg_en: 'Overstock: ৳69,300 cash trapped. Run a Buy 1 Get 1 or bundle deal with Kurti to unlock liquidity.',
        msg_bn: 'বেশি স্টক: ৳৬৯,৩০০ টাকা অলস আটকে আছে। দ্রুত ক্যাশ তুলতে কুর্তির সাথে বান্ডেল অফার বা ২০% ডিসকাউন্ট দিন।',
      },
      {
        sku: 'WINTER-010',
        name: 'Warm Fleece Hoodie Grey',
        name_bn: 'উষ্ণ ফ্লিস হুডি - গ্রে',
        category: 'Winter Wear',
        price: 1450,
        cost: 750,
        stock: 78,
        onOrder: 0,
        leadTime: 10,
        moq: 30,
        daysOfCover: 210.0,
        stockoutDate: '2024-10-30',
        orderQty: 0,
        status: 'dead',
        class: 'dead',
        moneyAtRisk: 58500,
        wapeModel: '18.2%',
        wapeNaive: '34.0%',
        bias: '-4.0%',
        modelUsed: 'Croston SBA',
        msg_en: 'Dead stock: Zero sales in 60 days post-winter. Immediate end-of-season clearance recommended.',
        msg_bn: 'বিক্রি নেই: শীত শেষে ৬০ দিনে কোনো বিক্রি হয়নি। ৳৫৮,৫০০ মূলধন মুক্ত করতে স্টক ক্লিয়ারেন্স সেল দিন।',
      }
    ]
  };

  // Persona 2: Salma (Neighbourhood Shop Owner - 180 SKUs)
  const SALMA_DATA = {
    personaName: 'Salma (Neighbourhood Mart)',
    personaSub: 'Grocery & FMCG • 180 SKUs • Supplier Lead Time 5-14 Days',
    kpis: {
      moneyAtRisk: 512400,
      lostSalesRisk: 345000,
      cashTiedUp: 167400,
      actionCount: 22,
    },
    products: [
      {
        sku: 'RICE-001',
        name: 'Miniket Rice 25kg Bag',
        name_bn: 'মিনিকেট চাল ২৫ কেজি বস্তা',
        category: 'Staples',
        price: 2100,
        cost: 1850,
        stock: 3,
        onOrder: 0,
        leadTime: 4,
        moq: 20,
        daysOfCover: 1.5,
        stockoutDate: '2024-04-03',
        orderQty: 25,
        status: 'critical',
        class: 'fast',
        moneyAtRisk: 52500,
        wapeModel: '7.8%',
        wapeNaive: '16.5%',
        bias: '+0.2%',
        modelUsed: 'Holt-Winters Additive',
        msg_en: 'Top grocery staple! Stock finishes in 36 hours. Reorder 25 bags from distributor immediately.',
        msg_bn: 'দৈনন্দিন অতি জরুরি পণ্য! ৩৬ ঘণ্টার মধ্যে স্টক শেষ হবে। ডিলারের কাছে আজই ২৫ বস্তা চালের অর্ডার দিন।',
      },
      {
        sku: 'OIL-002',
        name: 'Fortified Soybean Oil 5L',
        name_bn: 'সয়াবিন তেল ৫ লিটার ক্যান',
        category: 'Cooking',
        price: 890,
        cost: 820,
        stock: 6,
        onOrder: 0,
        leadTime: 3,
        moq: 30,
        daysOfCover: 2.1,
        stockoutDate: '2024-04-04',
        orderQty: 40,
        status: 'critical',
        class: 'fast',
        moneyAtRisk: 35600,
        wapeModel: '8.4%',
        wapeNaive: '17.2%',
        bias: '+0.4%',
        modelUsed: 'Holt-Winters Additive',
        msg_en: 'Critical cooking oil inventory. Fast turnover requires 40 cans reorder today.',
        msg_bn: 'জরুরি রান্নার তেল! চাহিদা বেশি হওয়ায় আজই ৪০ ক্যান তেলের অর্ডার পাঠানো প্রয়োজন।',
      },
      {
        sku: 'SPICE-003',
        name: 'Pure Turmeric Powder 500g',
        name_bn: 'খাঁটি হলুদ গুঁড়া ৫০০ গ্রাম',
        category: 'Spices',
        price: 240,
        cost: 180,
        stock: 12,
        onOrder: 0,
        leadTime: 6,
        moq: 24,
        daysOfCover: 5.5,
        stockoutDate: '2024-04-07',
        orderQty: 36,
        status: 'soon',
        class: 'fast',
        moneyAtRisk: 8640,
        wapeModel: '11.0%',
        wapeNaive: '21.0%',
        bias: '-0.1%',
        modelUsed: 'Holt-Winters Multiplicative',
        msg_en: 'Demand surges during Ramadan and Eid prep. Order 36 packs before weekend.',
        msg_bn: 'রমজান ও ঈদের কারণে মসলার চাহিদা বাড়ছে। সপ্তাহ শেষ হওয়ার আগেই ৩৬ প্যাকেট হলুদ গুঁড়া বুক করুন।',
      },
      {
        sku: 'SOAP-004',
        name: 'Antiseptic Soap Bar 100g',
        name_bn: 'অ্যান্টিসেপটিক সাবান ১০০ গ্রাম',
        category: 'Personal Care',
        price: 65,
        cost: 50,
        stock: 220,
        onOrder: 0,
        leadTime: 5,
        moq: 100,
        daysOfCover: 45.0,
        stockoutDate: '2024-05-18',
        orderQty: 0,
        status: 'ok',
        class: 'healthy',
        moneyAtRisk: 0,
        wapeModel: '9.2%',
        wapeNaive: '15.5%',
        bias: '+0.2%',
        modelUsed: 'Seasonal Naive',
        msg_en: 'Steady consumer demand. Current inventory covers 45 days safely.',
        msg_bn: 'নিয়মিত চাহিদা রয়েছে। মজুত সাবান দিয়ে ৪৫ দিন স্বাচ্ছন্দ্যে চলবে।',
      },
      {
        sku: 'SNACK-005',
        name: 'Imported Hazelnut Biscuit Tin',
        name_bn: 'আমদানিকৃত হেজেলনাট বিস্কুট টিন',
        category: 'Snacks',
        price: 850,
        cost: 650,
        stock: 68,
        onOrder: 0,
        leadTime: 12,
        moq: 20,
        daysOfCover: 160.0,
        stockoutDate: '2024-09-12',
        orderQty: 0,
        status: 'overstock',
        class: 'slow',
        moneyAtRisk: 44200,
        wapeModel: '19.5%',
        wapeNaive: '33.0%',
        bias: '-3.2%',
        modelUsed: 'Croston SBA',
        msg_en: 'Slow mover: ৳44,200 cash locked. Offer 15% festival discount to free up grocery counter shelf space.',
        msg_bn: 'ধীরগতির বিক্রি: ৳৪৪,২০০ টাকা অলস পড়ে আছে। তাক খালি করতে ও ক্যাশ তুলতে ১৫% ছাড় দিন।',
      }
    ]
  };

  // State Management
  let currentPersona = 'rahim';
  let currentFilter = 'all';
  let currentSearch = '';
  let isBangla = true; // Default Bangla-First as per PRD Principle 5.1
  let detailChartInstance = null;

  // Cache DOM
  const tableBody = document.getElementById('sku-table-body');
  const actionList = document.getElementById('action-cards-list');
  const kpiRiskTotal = document.getElementById('kpi-risk-total');
  const kpiLostSales = document.getElementById('kpi-lost-sales');
  const kpiCashTied = document.getElementById('kpi-cash-tied');
  const kpiActionCount = document.getElementById('kpi-action-count');
  const searchInput = document.getElementById('sku-search-input');
  const toastEl = document.getElementById('app-toast');
  const toastMsg = document.getElementById('toast-msg');

  // Modal Elements
  const modalOverlay = document.getElementById('product-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-product-title');
  const modalSku = document.getElementById('modal-product-sku');
  const modalBadge = document.getElementById('modal-status-badge');
  const modalAdvisory = document.getElementById('modal-bangla-advisory');
  const modalStock = document.getElementById('modal-stock-val');
  const modalCover = document.getElementById('modal-cover-val');
  const modalOrder = document.getElementById('modal-order-val');
  const modalRisk = document.getElementById('modal-risk-val');
  const modalModelName = document.getElementById('modal-model-name');
  const modalWapeModel = document.getElementById('modal-wape-model');
  const modalWapeNaive = document.getElementById('modal-wape-naive');

  function getActiveDataset() {
    return currentPersona === 'rahim' ? RAHIM_DATA : SALMA_DATA;
  }

  function renderKPIs() {
    const data = getActiveDataset();
    kpiRiskTotal.textContent = formatTaka(data.kpis.moneyAtRisk, isBangla);
    kpiLostSales.textContent = formatTaka(data.kpis.lostSalesRisk, isBangla);
    kpiCashTied.textContent = formatTaka(data.kpis.cashTiedUp, isBangla);
    kpiActionCount.textContent = isBangla ? `${toBanglaDigits(data.kpis.actionCount)} টি পণ্য` : `${data.kpis.actionCount} SKUs`;
  }

  function renderPriorityTable() {
    if (!tableBody) return;
    const data = getActiveDataset();
    tableBody.innerHTML = '';

    const filtered = data.products.filter(item => {
      const matchFilter = currentFilter === 'all' || item.status === currentFilter;
      const q = currentSearch.toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.name_bn.includes(q);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-dim);">কোনো পণ্য পাওয়া যায়নি / No SKUs found matching filters.</td></tr>`;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.addEventListener('click', () => openProductModal(item));

      // Status badge styling
      const statusLabels = {
        critical: { en: 'CRITICAL', bn: 'জরুরি — স্টক শেষ' },
        soon: { en: 'SOON', bn: 'এই সপ্তাহে' },
        ok: { en: 'HEALTHY', bn: 'ঠিক আছে' },
        overstock: { en: 'OVERSTOCK', bn: 'বেশি স্টক' },
        dead: { en: 'DEAD', bn: 'বিক্রি নেই' }
      };

      const badgeText = isBangla ? statusLabels[item.status].bn : statusLabels[item.status].en;
      const prodName = isBangla ? item.name_bn : item.name;
      const coverText = isBangla ? `${toBanglaDigits(item.daysOfCover)} দিন` : `${item.daysOfCover}d`;
      const orderQtyText = item.orderQty > 0 ? (isBangla ? `${toBanglaDigits(item.orderQty)} পিস` : `${item.orderQty} units`) : '—';
      const riskText = item.moneyAtRisk > 0 ? formatTaka(item.moneyAtRisk, isBangla) : '—';

      tr.innerHTML = `
        <td><span class="status-badge ${item.status}">${badgeText}</span></td>
        <td>
          <span class="product-cell-name">${prodName}</span>
          <span class="product-cell-sku">${item.sku} • ${item.category}</span>
        </td>
        <td><strong>${isBangla ? toBanglaDigits(item.stock) : item.stock}</strong></td>
        <td>${coverText}</td>
        <td>${item.stockoutDate}</td>
        <td><strong style="color: var(--accent-cyan);">${orderQtyText}</strong></td>
        <td class="taka-cell">${riskText}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function renderActionCards() {
    if (!actionList) return;
    const data = getActiveDataset();
    actionList.innerHTML = '';

    // Action cards: items that need action (critical, soon, overstock)
    const actionItems = data.products
      .filter(p => p.status === 'critical' || p.status === 'soon' || p.status === 'overstock')
      .slice(0, 5);

    actionItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'action-item-card';

      const prodName = isBangla ? item.name_bn : item.name;
      const msg = isBangla ? item.msg_bn : item.msg_en;
      const orderBtnLabel = isBangla ? 'অর্ডার টেক্সট কপি' : 'Copy Order Text';

      card.innerHTML = `
        <div class="action-item-top">
          <span class="action-item-title">${prodName}</span>
          ${item.orderQty > 0 ? `<span class="action-item-qty">+${isBangla ? toBanglaDigits(item.orderQty) : item.orderQty} units</span>` : `<span class="action-item-qty" style="color: #60A5FA; background: rgba(96,165,250,0.1);">Clearance</span>`}
        </div>
        <div class="action-item-bangla">${msg}</div>
        <div class="action-btn-row">
          <button class="btn-order-copy" data-sku="${item.sku}">
            <i class="lucide-clipboard-copy"></i> ${orderBtnLabel}
          </button>
        </div>
      `;

      // Order copy click handler
      card.querySelector('.btn-order-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        const copyText = `[DemandIQ Restock Order]\nProduct: ${item.name} (${item.sku})\nRecommended Qty: ${item.orderQty} units\nTarget Date: ${item.stockoutDate}\nSupplier Note: Urgent restock before festival rush.`;
        navigator.clipboard.writeText(copyText).then(() => {
          showToast(isBangla ? `সাপ্লায়ারের জন্য অর্ডার টেক্সট ক্লিপবোর্ডে কপি হয়েছে! (${item.sku})` : `Order text copied for ${item.sku}! Paste into WhatsApp.`);
        }).catch(() => {
          showToast(`Copied order for ${item.sku}`);
        });
      });

      card.addEventListener('click', () => openProductModal(item));
      actionList.appendChild(card);
    });
  }

  function showToast(message) {
    if (!toastEl) return;
    toastMsg.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3800);
  }

  // S3 Product Detail Modal with Chart.js
  function openProductModal(item) {
    if (!modalOverlay) return;

    modalTitle.textContent = isBangla ? item.name_bn : item.name;
    modalSku.textContent = `${item.sku} • Category: ${item.category} • Price: ৳${item.price} • Cost: ৳${item.cost}`;
    modalBadge.className = `status-badge ${item.status}`;
    modalBadge.textContent = item.status.toUpperCase();
    modalAdvisory.textContent = isBangla ? item.msg_bn : item.msg_en;

    modalStock.textContent = isBangla ? `${toBanglaDigits(item.stock)} units` : `${item.stock} units`;
    modalCover.textContent = isBangla ? `${toBanglaDigits(item.daysOfCover)} Days` : `${item.daysOfCover} Days`;
    modalOrder.textContent = item.orderQty > 0 ? (isBangla ? `${toBanglaDigits(item.orderQty)} units` : `${item.orderQty} units`) : '0 (None)';
    modalRisk.textContent = formatTaka(item.moneyAtRisk, isBangla);

    modalModelName.textContent = item.modelUsed;
    modalWapeModel.textContent = item.wapeModel;
    modalWapeNaive.textContent = item.wapeNaive;

    modalOverlay.classList.add('active');
    renderDetailChart(item);
  }

  function renderDetailChart(item) {
    const canvas = document.getElementById('detailForecastChart');
    if (!canvas) return;

    if (detailChartInstance) {
      detailChartInstance.destroy();
    }

    // Generate 90 historical days + 60 forecast days
    const labels = [];
    const actualData = [];
    const forecastData = [];
    const upperBand = [];
    const lowerBand = [];
    const projectedStock = [];

    // Mock realistic curve
    const historyLength = 14;
    const forecastLength = 10;
    let runningStock = item.stock;

    for (let i = -historyLength; i <= 0; i++) {
      labels.push(`Day ${i}`);
      const val = Math.max(2, Math.round(5 + Math.sin(i * 0.4) * 3 + (i > -4 ? 6 : 0)));
      actualData.push(val);
      forecastData.push(null);
      upperBand.push(null);
      lowerBand.push(null);
      projectedStock.push(runningStock + Math.abs(i) * 3);
    }

    // Connect forecast at Day 0
    forecastData[actualData.length - 1] = actualData[actualData.length - 1];
    upperBand[actualData.length - 1] = actualData[actualData.length - 1];
    lowerBand[actualData.length - 1] = actualData[actualData.length - 1];

    for (let j = 1; j <= forecastLength; j++) {
      labels.push(`+${j}d`);
      actualData.push(null);
      const predictedDemand = Math.round(8 + (j > 3 && j < 7 ? 12 : 2)); // festival spike
      forecastData.push(predictedDemand);
      upperBand.push(predictedDemand + 4);
      lowerBand.push(Math.max(1, predictedDemand - 3));

      runningStock -= predictedDemand;
      projectedStock.push(runningStock);
    }

    const ctx = canvas.getContext('2d');
    detailChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Sales (History)',
            data: actualData,
            borderColor: '#10B981',
            backgroundColor: '#10B981',
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3
          },
          {
            label: '60-Day AI Forecast (Holt-Winters)',
            data: forecastData,
            borderColor: '#06B6D4',
            borderDash: [5, 5],
            borderWidth: 2.5,
            pointRadius: 3,
            tension: 0.3
          },
          {
            label: '80% Confidence Band (Upper)',
            data: upperBand,
            borderColor: 'transparent',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            fill: '+1',
            pointRadius: 0
          },
          {
            label: '80% Confidence Band (Lower)',
            data: lowerBand,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointRadius: 0
          },
          {
            label: 'Projected Stock Trajectory (Units Left)',
            data: projectedStock,
            borderColor: '#EF4444',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94A3B8', boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(13, 20, 36, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748B', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748B', font: { size: 10 } }
          }
        }
      }
    });
  }

  // Setup Event Listeners
  function setupListeners() {
    // Persona Switcher
    const btnRahim = document.getElementById('persona-rahim');
    const btnSalma = document.getElementById('persona-salma');
    if (btnRahim && btnSalma) {
      btnRahim.addEventListener('click', () => {
        currentPersona = 'rahim';
        btnRahim.classList.add('active');
        btnSalma.classList.remove('active');
        renderKPIs();
        renderPriorityTable();
        renderActionCards();
      });

      btnSalma.addEventListener('click', () => {
        currentPersona = 'salma';
        btnSalma.classList.add('active');
        btnRahim.classList.remove('active');
        renderKPIs();
        renderPriorityTable();
        renderActionCards();
      });
    }

    // Filter Chips
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.getAttribute('data-status');
        renderPriorityTable();
      });
    });

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderPriorityTable();
      });
    }

    // Modal Close
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
      });
    }

    // Language Toggle
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        isBangla = !isBangla;
        document.body.classList.toggle('lang-bn', isBangla);
        document.getElementById('lang-bn-pill').classList.toggle('active', isBangla);
        document.getElementById('lang-en-pill').classList.toggle('active', !isBangla);
        updateBilingualText();
        renderKPIs();
        renderPriorityTable();
        renderActionCards();
      });
    }

    // 3D Chamber Tabs
    const chamberTabs = document.querySelectorAll('.status-tab-btn');
    chamberTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        chamberTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const statusKey = tab.getAttribute('data-status-key');

        // Update 3D canvas highlights
        if (window.ThreeWarehouse) {
          window.ThreeWarehouse.focusStatus(statusKey);
        }

        // Update chamber view text
        updateChamberView(statusKey);
      });
    });

    // Sample CSV Simulation buttons
    const btnSimulate = document.getElementById('btn-run-simulation');
    if (btnSimulate) {
      btnSimulate.addEventListener('click', runUploadSimulation);
    }
  }

  function updateChamberView(statusKey) {
    const chamberTitle = document.getElementById('chamber-stage-title');
    const chamberAdvisory = document.getElementById('chamber-stage-advisory');
    const chamberBadge = document.getElementById('chamber-stage-badge');

    const CHAMBER_INFO = {
      critical: {
        badge: 'CRITICAL (লাল সংকেত)',
        title: 'Emergency Restock / জরুরি রি-অর্ডার',
        advisory: 'এই পণ্যগুলোর স্টক আগামী ১ থেকে ৩ দিনের মধ্যে শূন্য হবে। সাপ্লায়ারের ডেলিভারি সময় বিবেচনা করে এখনই নতুন চালান বুক না করলে ক্রেতারা ফিরে যাবে এবং নিশ্চিত বিক্রির টাকা হাতছাড়া হবে।'
      },
      soon: {
        badge: 'REORDER THIS WEEK (হলুদ সংকেত)',
        title: 'Prepare Purchase Order / এই সপ্তাহে অর্ডার',
        advisory: 'বর্তমান স্টক স্বাভাবিক থাকলেও আসন্ন সপ্তাহান্ত বা উৎসবের ভিড়ে এটি শেষ হয়ে যাওয়ার ঝুঁকিতে রয়েছে। সরবরাহকারীকে অগ্রিম অর্ডার দিয়ে নিরাপদ রাখুন।'
      },
      ok: {
        badge: 'HEALTHY BUFFER (সবুজ সংকেত)',
        title: 'Balanced & Optimized / সুস্থ মজুত',
        advisory: 'পণ্যের বিক্রির গতি ও মজুত একদম ভারসাম্যপূর্ণ। আগামী ৩০-৪৫ দিনের জন্য কোনো নতুন অর্ডারের প্রয়োজন নেই, ফলে অতিরিক্ত টাকা আটকে থাকবে না।'
      },
      overstock: {
        badge: 'SLOW / OVERSTOCK (নীল সংকেত)',
        title: 'Locked Capital / আটকে থাকা মূলধন',
        advisory: 'এই পণ্যে প্রয়োজনের তুলনায় অতিরিক্ত নগদ টাকা আটকে আছে। ক্যাশ দ্রুত সচল করতে বান্ডেল প্রমোশন, ক্লিয়ারেন্স অফার বা উৎসবের বিশেষ ডিসকাউন্ট চালু করুন।'
      }
    };

    const info = CHAMBER_INFO[statusKey] || CHAMBER_INFO.critical;
    if (chamberBadge) chamberBadge.textContent = info.badge;
    if (chamberTitle) chamberTitle.textContent = info.title;
    if (chamberAdvisory) chamberAdvisory.textContent = info.advisory;
  }

  // Bilingual content updates
  function updateBilingualText() {
    document.querySelectorAll('[data-i18n-en]').forEach(el => {
      const enText = el.getAttribute('data-i18n-en');
      const bnText = el.getAttribute('data-i18n-bn');
      el.textContent = isBangla ? bnText : enText;
    });
  }

  // 60-Second Pipeline Simulator (S1 PRD)
  function runUploadSimulation() {
    const progressWrap = document.getElementById('pipeline-progress');
    const btn = document.getElementById('btn-run-simulation');
    if (!progressWrap) return;

    progressWrap.style.display = 'block';
    btn.disabled = true;
    btn.textContent = isBangla ? 'অ্যানালাইসিস চলছে (৬০ সে)...' : 'Analyzing Pipeline (60s)...';

    const steps = [
      { id: 'step-1', delay: 400 },
      { id: 'step-2', delay: 1000 },
      { id: 'step-3', delay: 1800 },
      { id: 'step-4', delay: 2600 },
      { id: 'step-5', delay: 3400 }
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        const el = document.getElementById(s.id);
        if (el) {
          el.classList.add('active');
          if (idx > 0) {
            const prev = document.getElementById(steps[idx - 1].id);
            if (prev) {
              prev.classList.remove('active');
              prev.classList.add('done');
            }
          }
        }
      }, s.delay);
    });

    setTimeout(() => {
      const lastStep = document.getElementById('step-5');
      if (lastStep) {
        lastStep.classList.remove('active');
        lastStep.classList.add('done');
      }
      btn.disabled = false;
      btn.textContent = isBangla ? 'অ্যানালাইসিস সম্পন্ন! ড্যাশবোর্ডে দেখুন' : 'Analysis Complete! View Dashboard';
      showToast(isBangla ? 'নমুনা ডেটাসেটের অ্যানালাইসিস সফল হয়েছে! ১৪টি অ্যাকশন পাওয়া গেছে।' : 'Pipeline executed! 14 actionable restock recommendations generated.');

      // Smooth scroll to live demo dashboard
      const demoSection = document.getElementById('live-demo');
      if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 4200);
  }

  // Expose to window
  window.DemandIQApp = {
    openProductModalBySku: function (sku) {
      const data = getActiveDataset();
      const item = data.products.find(p => p.sku === sku);
      if (item) openProductModal(item);
    }
  };

  // Hybrid API Sync: Connect to Python backend if available, fallback gracefully to offline data
  function tryLiveBackendSync() {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      fetch('/health')
        .then(res => res.json())
        .then(data => {
          console.log('[DemandIQ] Live Python API Connected:', data);
          // If live API is running, fetch live sample dataset summary
          fetch('/api/datasets/sample', { method: 'POST' })
            .then(r => r.json())
            .then(sampleRes => {
              console.log('[DemandIQ] Live SQLite Dataset Loaded:', sampleRes);
              if (sampleRes.summary) {
                // Live backend verified!
                const toast = document.getElementById('toast-msg');
                if (toast) toast.textContent = 'Live Python API & SQLite Connected!';
              }
            })
            .catch(() => {});
        })
        .catch(() => {
          console.log('[DemandIQ] Running in standalone offline mode with bundled PRD datasets.');
        });
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    setupListeners();
    renderKPIs();
    renderPriorityTable();
    renderActionCards();
    tryLiveBackendSync();
  });

})();
