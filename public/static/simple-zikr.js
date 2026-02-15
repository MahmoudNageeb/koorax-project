/**
 * Simple Zikr Component - No localStorage/window dependency
 * يعمل على Cloudflare Workers بدون مشاكل
 */

const AZKAR_LIST = [
  'سبحان الله وبحمده، سبحان الله العظيم',
  'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',
  'اللهم صل وسلم وبارك على سيدنا محمد',
  'سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
  'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه',
  'حسبي الله ونعم الوكيل',
  'اللهم إني أسألك العفو والعافية في الدنيا والآخرة',
  'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',
  'لا حول ولا قوة إلا بالله العلي العظيم',
  'اللهم إنك عفو كريم تحب العفو فاعف عني'
];

function showSimpleZikr() {
  // Get random zikr
  const randomIndex = Math.floor(Math.random() * AZKAR_LIST.length);
  const zikr = AZKAR_LIST[randomIndex];
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] opacity-0 transition-all duration-500';
  toast.style.cssText = `
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
    max-width: 90vw;
    width: auto;
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="font-size: 1.5rem; color: #10b981;">
        <i class="fas fa-moon"></i>
      </div>
      <div style="color: #d1d5db; font-size: 1rem; font-weight: 600; line-height: 1.5; direction: rtl;">
        ${zikr}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="color: #9ca3af; cursor: pointer; background: none; border: none; font-size: 1.25rem; padding: 0.25rem; transition: color 0.2s;"
              onmouseover="this.style.color='#f87171'" 
              onmouseout="this.style.color='#9ca3af'"
              title="إغلاق">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  }, 100);
  
  // Auto close after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

// Show on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showSimpleZikr);
} else {
  showSimpleZikr();
}
