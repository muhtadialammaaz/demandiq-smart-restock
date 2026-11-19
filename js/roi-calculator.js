/**
 * DemandIQ Smart Restock - Interactive ROI & Event Multiplier Engine
 */

(function () {
  'use strict';

  function toBanglaDigits(num) {
    if (num === null || num === undefined) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
  }

  function formatTaka(amount, isBn = false) {
    const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
    return isBn ? `৳${toBanglaDigits(formatted)}` : `৳${formatted}`;
  }

  // ROI Calculator
  const sliderTurnover = document.getElementById('calc-turnover');
  const sliderSkus = document.getElementById('calc-skus');
  const sliderLeadTime = document.getElementById('calc-leadtime');

  const valTurnover = document.getElementById('val-turnover');
  const valSkus = document.getElementById('val-skus');
  const valLeadTime = document.getElementById('val-leadtime');

  const resLostSales = document.getElementById('res-lost-sales');
  const resDeadCash = document.getElementById('res-dead-cash');
  const resHoursSaved = document.getElementById('res-hours-saved');
  const resTotalBenefit = document.getElementById('res-total-benefit');

  function calculateROI() {
    if (!sliderTurnover) return;

    const turnover = parseFloat(sliderTurnover.value);
    const skus = parseInt(sliderSkus.value, 10);
    const leadTime = parseInt(sliderLeadTime.value, 10);
    const isBn = document.body.classList.contains('lang-bn');

    // Update Slider displays
    valTurnover.textContent = formatTaka(turnover, isBn);
    valSkus.textContent = isBn ? `${toBanglaDigits(skus)} টি SKU` : `${skus} SKUs`;
    valLeadTime.textContent = isBn ? `${toBanglaDigits(leadTime)} দিন` : `${leadTime} Days`;

    // Mathematical approximations from PRD Section 1 & 1.4:
    // Average stockout loss without demand forecasting is ~14% of monthly turnover.
    // DemandIQ prevents ~60% of these stockouts.
    const monthlyLostSalesSaved = turnover * 0.14 * 0.60;

    // Working capital trapped in dead / slow stock is ~18% of monthly volume.
    // DemandIQ frees ~45% of trapped liquidity through smart MOQ and reorder cadence.
    const deadCapitalUnlocked = turnover * 0.18 * 0.45;

    // Time spent on notebook / Excel inventory calculations: ~0.15 hours per SKU per week
    const weeklyHoursSaved = Math.min(25, Math.max(4, Math.round(skus * 0.08 + leadTime * 0.2)));

    const total60DayBenefit = (monthlyLostSalesSaved + deadCapitalUnlocked) * 2;

    // Render results
    resLostSales.textContent = formatTaka(monthlyLostSalesSaved, isBn);
    resDeadCash.textContent = formatTaka(deadCapitalUnlocked, isBn);
    resHoursSaved.textContent = isBn ? `${toBanglaDigits(weeklyHoursSaved)} ঘণ্টা` : `${weeklyHoursSaved} hrs/week`;
    resTotalBenefit.textContent = formatTaka(total60DayBenefit, isBn);
  }

  // Event Multiplier adjustments
  function setupEventListeners() {
    [sliderTurnover, sliderSkus, sliderLeadTime].forEach(slider => {
      if (slider) {
        slider.addEventListener('input', calculateROI);
      }
    });

    // Custom Event Add Button
    const btnAddEvent = document.getElementById('btn-add-event');
    if (btnAddEvent) {
      btnAddEvent.addEventListener('click', () => {
        const eventName = prompt('Enter Festival / Campaign Name (e.g. Durga Puja, Flash Sale):', 'New Year Flash Sale');
        if (eventName) {
          alert(`Event "${eventName}" added to calendar! DemandIQ will estimate multipliers from your historical sales curve.`);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    calculateROI();
  });

  // Re-calculate when language toggles
  window.addEventListener('lang-changed', calculateROI);

})();
