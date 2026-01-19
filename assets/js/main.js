/* =========================================================
   WATTRIX / FHATAL STUDIOS — MAIN JS (2026 Revamp)
   =======================================================*/

const CONFIG = {
  gaId: 'G-WPLMYR2M1F',
  consentKey: 'wattrix_cookie_consent_v2'
};

/* --- 1. Loader & Mobile Nav --- */
window.addEventListener('DOMContentLoaded', () => {
  // Loader
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }, 800);
  }

  // Mobile Nav Toggle
  setupMobileNav();
});

function setupMobileNav() {
  const brand = document.querySelector('.brand');
  const nav = document.querySelector('.nav');
  if (!brand || !nav) return;

  // Create Toggle Button
  const btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.ariaLabel = 'Toggle navigation';
  btn.innerHTML = '<span></span><span></span><span></span>';

  // Insert inside brand, but visual order handled by CSS (justify-between)
  brand.appendChild(btn);

  // Toggle Logic
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    nav.classList.toggle('is-open');
  });

  // Close on link click
  document.querySelectorAll('.nav-links a, .nav-cta a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('is-open'));
  });
}

/* --- 2. Cookie Consent & Analytics --- */
(function () {
  // Helpers
  const $ = id => document.getElementById(id);
  const banner = $('cookieBanner');

  // --- Logic ---
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONFIG.consentKey)) || null; }
    catch (e) { return null; }
  }

  function setConsent(obj) {
    localStorage.setItem(CONFIG.consentKey, JSON.stringify({ ...obj, ts: new Date().toISOString(), v: 2 }));
    updateGtag(obj);
  }

  function updateGtag(consent) {
    // 1. Update GA4 Consent Signal
    if (window.__gtagLoaded && window.gtag) {
      window.gtag('consent', 'update', mapConsent(consent));
    } else {
      loadGtag(consent);
    }
  }

  function mapConsent(consent) {
    return {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    };
  }

  function loadGtag(consent) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // Default state
    gtag('consent', 'default', mapConsent(consent || { analytics: false }));
    gtag('js', new Date());
    gtag('config', CONFIG.gaId, { anonymize_ip: true });

    // Load Script
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.gaId);
    document.head.appendChild(s);
    window.__gtagLoaded = true;
  }

  // --- UI Handling ---
  const saved = getConsent();
  if (!saved) {
    if (banner) banner.classList.remove('hidden');
    // Load Gtag in denied mode by default if no choice yet
    loadGtag(null);
  } else {
    loadGtag(saved);
  }

  // Bind Buttons
  const btnAccept = $('cb-accept');
  const btnReject = $('cb-reject');

  if (btnAccept) {
    btnAccept.onclick = () => {
      setConsent({ necessary: true, analytics: true });
      banner.classList.add('hidden');
    };
  }

  if (btnReject) {
    btnReject.onclick = () => {
      setConsent({ necessary: true, analytics: false });
      banner.classList.add('hidden');
    };
  }

  // Simple "Manage" button in footer
  const btnManage = $('footerManageCookies');
  if (btnManage) {
    btnManage.onclick = () => {
      if (banner) {
        banner.classList.remove('hidden');
        // Reset animation
        banner.style.animation = 'none';
        banner.offsetHeight; /* trigger reflow */
        banner.style.animation = 'slideUp 0.4s ease-out';
      }
    };
  }

})();
