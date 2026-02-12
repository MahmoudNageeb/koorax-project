/**
 * Koorax Zikr Toast Component
 * مكوّن الذكر والصلاة على النبي
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

class ZikrToast {
  constructor() {
    this.shown = false;
    this.lastShownDate = localStorage.getItem('koorax_last_zikr_date');
    this.currentZikr = '';
  }

  shouldShow() {
    const today = new Date().toDateString();
    
    // Show once per day (first page load)
    if (this.lastShownDate !== today) {
      return true;
    }
    
    return false;
  }

  getRandomZikr() {
    const randomIndex = Math.floor(Math.random() * AZKAR_LIST.length);
    return AZKAR_LIST[randomIndex];
  }

  show() {
    if (this.shown || !this.shouldShow()) return;
    
    this.currentZikr = this.getRandomZikr();
    this.shown = true;
    
    // Save today's date
    const today = new Date().toDateString();
    localStorage.setItem('koorax_last_zikr_date', today);
    
    // Create toast element
    const toast = this.createToastElement();
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Auto close after 5 seconds
    setTimeout(() => {
      this.close(toast);
    }, 5000);
  }

  createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'zikr-toast';
    toast.className = 'zikr-toast';
    toast.innerHTML = `
      <div class="zikr-content">
        <div class="zikr-icon">
          <i class="fas fa-moon"></i>
        </div>
        <div class="zikr-text">${this.currentZikr}</div>
        <button class="zikr-close" onclick="window.zikrToast.close()" title="إغلاق">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add close on click
    toast.querySelector('.zikr-close').addEventListener('click', () => {
      this.close(toast);
    });
    
    return toast;
  }

  close(toast = null) {
    const toastElement = toast || document.getElementById('zikr-toast');
    if (!toastElement) return;
    
    toastElement.classList.remove('show');
    toastElement.classList.add('hide');
    
    setTimeout(() => {
      toastElement.remove();
    }, 300);
  }
}

// Add styles
function addZikrStyles() {
  if (document.getElementById('zikr-toast-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'zikr-toast-styles';
  style.textContent = `
    .zikr-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      max-width: 500px;
      width: 90%;
      z-index: 9999;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .zikr-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .zikr-toast.hide {
      transform: translateX(-50%) translateY(-100px);
      opacity: 0;
    }
    
    .zikr-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, 
        rgba(16, 185, 129, 0.15) 0%, 
        rgba(6, 78, 59, 0.25) 100%
      );
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    }
    
    .zikr-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      color: white;
      font-size: 1.25rem;
    }
    
    .zikr-text {
      flex: 1;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.6;
      text-align: center;
      font-family: 'Cairo', sans-serif;
    }
    
    .zikr-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .zikr-close:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      transform: scale(1.1);
    }
    
    /* Mobile responsive */
    @media (max-width: 640px) {
      .zikr-toast {
        top: 10px;
        width: calc(100% - 20px);
      }
      
      .zikr-content {
        padding: 1rem;
        gap: 0.75rem;
      }
      
      .zikr-icon {
        width: 36px;
        height: 36px;
        font-size: 1.1rem;
      }
      
      .zikr-text {
        font-size: 0.9rem;
      }
      
      .zikr-close {
        width: 28px;
        height: 28px;
      }
    }
    
    /* Light theme support */
    body[data-theme="light"] .zikr-content {
      background: linear-gradient(135deg, 
        rgba(16, 185, 129, 0.2) 0%, 
        rgba(6, 78, 59, 0.15) 100%
      );
      border-color: rgba(16, 185, 129, 0.4);
    }
    
    body[data-theme="light"] .zikr-text {
      color: #0f172a;
    }
    
    body[data-theme="light"] .zikr-close {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.12);
      color: rgba(0, 0, 0, 0.6);
    }
    
    body[data-theme="light"] .zikr-close:hover {
      background: rgba(0, 0, 0, 0.12);
      color: rgba(0, 0, 0, 0.9);
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize
function initializeZikrToast() {
  addZikrStyles();
  window.zikrToast = new ZikrToast();
  
  // Show after short delay to ensure page is loaded
  setTimeout(() => {
    window.zikrToast.show();
  }, 1500);
}

// Auto-run on DOM loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeZikrToast);
} else {
  initializeZikrToast();
}
