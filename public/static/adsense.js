// AdSense Helper - جاهز للاستخدام
// استبدل ca-pub-XXXXXXXXXXXXXXXX برقم الناشر الخاص بك من Google AdSense

const ADSENSE_CONFIG = {
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX', // ضع رقم الناشر هنا
  slots: {
    headerAd: '1234567890',     // Ad Slot ID for header
    contentAd: '0987654321',    // Ad Slot ID for content
    sidebarAd: '1122334455',    // Ad Slot ID for sidebar
    footerAd: '5544332211'      // Ad Slot ID for footer
  }
};

// إنشاء إعلان
function createAdUnit(slotId, format = 'auto', responsive = 'true') {
  return `
    <div class="ad-container">
      <div class="ad-label">إعلان</div>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${ADSENSE_CONFIG.publisherId}"
           data-ad-slot="${ADSENSE_CONFIG.slots[slotId]}"
           data-ad-format="${format}"
           data-full-width-responsive="${responsive}"></ins>
    </div>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  `;
}

// تحميل سكريبت AdSense
function loadAdsenseScript() {
  if (!document.querySelector('script[src*="adsbygoogle"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

// تهيئة الإعلانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadAdsenseScript();
});
