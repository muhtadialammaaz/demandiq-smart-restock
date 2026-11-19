/**
 * DemandIQ Smart Restock - Scroll Graphics & Interactive Micro-Animations
 */

(function () {
  'use strict';

  // 1. Sticky Header visual depth on scroll
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 40) {
      header.style.background = 'rgba(7, 11, 20, 0.92)';
      header.style.borderBottomColor = 'rgba(255, 255, 255, 0.12)';
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    } else {
      header.style.background = 'rgba(7, 11, 20, 0.8)';
      header.style.borderBottomColor = 'var(--border-subtle)';
      header.style.boxShadow = 'none';
    }
  }, { passive: true });

  // 2. IntersectionObserver for Reveal Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  // 3. Smooth scrolling for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 4. Download Sample CSV trigger with celebration
  const btnDownloadSales = document.getElementById('btn-download-sales-csv');
  const btnDownloadInv = document.getElementById('btn-download-inv-csv');

  function triggerCsvDownload(filename, relativePath) {
    const a = document.createElement('a');
    a.href = relativePath;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Confetti celebration if available
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  if (btnDownloadSales) {
    btnDownloadSales.addEventListener('click', (e) => {
      e.preventDefault();
      triggerCsvDownload('demandiq_sample_sales.csv', 'sample_data/demandiq_sample_sales.csv');
    });
  }

  if (btnDownloadInv) {
    btnDownloadInv.addEventListener('click', (e) => {
      e.preventDefault();
      triggerCsvDownload('demandiq_sample_inventory.csv', 'sample_data/demandiq_sample_inventory.csv');
    });
  }

})();
