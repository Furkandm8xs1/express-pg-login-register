// Sidebar Hover Büyütme/Küçültme Fonksiyonu
// sidebar-hover.js

class SidebarHover {
  constructor() {
    this.sidebar = null;
    this.mainContent = null;
    this.isManuallyCollapsed = false;
    this.hoverTimeout = null;
    this.init();
  }

  init() {
    // Elementleri seç
    this.sidebar = document.getElementById('sidebar');
    this.mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (!this.sidebar || !this.mainContent) {
      console.error('Sidebar veya main-content bulunamadı!');
      return;
    }

    // Başlangıçta sidebar'ı daralt (mobil hariç)
    if (window.innerWidth > 768) {
      this.collapseSidebar();
    }

    // Mouse enter eventi - sidebar'a girince genişlet
    this.sidebar.addEventListener('mouseenter', () => {
      clearTimeout(this.hoverTimeout);
      this.expandSidebar();
    });

    // Mouse leave eventi - sidebar'dan çıkınca daralt
    this.sidebar.addEventListener('mouseleave', () => {
      // Biraz gecikme ekle, kullanıcı yanlışlıkla çıkınca hemen kapanmasın
      this.hoverTimeout = setTimeout(() => {
        this.collapseSidebar();
      }, 100);
    });

    // Toggle butonu için
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // Pencere boyutu değişince kontrol et
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Smooth transition ekle
    this.addSmoothTransitions();
  }

  expandSidebar() {
    if (!this.sidebar || !this.mainContent) return;

    this.sidebar.classList.remove('collapsed');
    this.mainContent.classList.remove('expanded');

    // Nav text ve title'ları göster
    this.animateTextElements(true);
  }

  collapseSidebar() {
    if (!this.sidebar || !this.mainContent) return;

    this.sidebar.classList.add('collapsed');
    this.mainContent.classList.add('expanded');

    // Nav text ve title'ları gizle
    this.animateTextElements(false);
  }

  toggleSidebar() {
    if (this.sidebar.classList.contains('collapsed')) {
      this.expandSidebar();
      this.isManuallyCollapsed = false;
    } else {
      this.collapseSidebar();
      this.isManuallyCollapsed = true;
    }
  }

  animateTextElements(show) {
    const navTexts = document.querySelectorAll('.nav-text');
    const sidebarTitle = document.querySelector('.sidebar-title');

    if (show) {
      // Göster
      navTexts.forEach((text, index) => {
        setTimeout(() => {
          text.style.opacity = '1';
          text.style.width = 'auto';
        }, index * 30); // Her bir item için 30ms gecikme
      });

      if (sidebarTitle) {
        sidebarTitle.style.opacity = '1';
        sidebarTitle.style.width = 'auto';
      }
    } else {
      // Gizle
      navTexts.forEach(text => {
        text.style.opacity = '0';
        text.style.width = '0';
      });

      if (sidebarTitle) {
        sidebarTitle.style.opacity = '0';
        sidebarTitle.style.width = '0';
      }
    }
  }

  handleResize() {
    const width = window.innerWidth;

    // Mobilde farklı davranış
    if (width <= 768) {
      // Mobilde varsayılan olarak collapsed
      if (!this.sidebar.classList.contains('collapsed')) {
        this.collapseSidebar();
      }
    }
  }

  addSmoothTransitions() {
    // CSS transition'ları ekle
    const style = document.createElement('style');
    style.textContent = `
      /* Sidebar hover efektleri */
      .sidebar {
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s ease;
      }

      .sidebar:hover {
        box-shadow: 6px 0 30px rgba(0, 0, 0, 0.4);
      }

      .main-content {
        transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sidebar-title,
      .nav-text {
        transition: opacity 0.3s ease,
                    width 0.3s ease;
      }

      /* Nav items hover efekti geliştirilmiş */
      .nav-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .nav-item:hover {
        padding-left: 25px;
      }

      .sidebar.collapsed .nav-item:hover {
        padding-left: 20px;
      }

      /* Logo hover animasyonu */
      .logo {
        transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .sidebar:hover .logo {
        transform: rotate(360deg) scale(1.1);
      }

      /* Nav icon hover efekti */
      .nav-icon {
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .nav-item:hover .nav-icon {
        transform: scale(1.3) rotate(5deg);
      }

      /* Sidebar toggle butonu animasyonu */
      .sidebar-toggle span {
        display: inline-block;
        transition: transform 0.3s ease;
      }

      .sidebar.collapsed .sidebar-toggle span {
        transform: rotate(180deg);
      }

      .sidebar-toggle:hover span {
        transform: scale(1.2);
      }

      /* Active item için ekstra efekt */
      .nav-item.active {
        background: linear-gradient(90deg, 
                    rgba(102, 126, 234, 0.15) 0%, 
                    rgba(118, 75, 162, 0.1) 100%);
        border-left: 4px solid transparent;
        border-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-image-slice: 1;
      }

      /* Pulse animasyonu */
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
        }
      }

      .nav-item.active .nav-icon {
        animation: pulse 2s infinite;
      }

      /* Scrollbar stilini güzelleştir */
      .sidebar-nav::-webkit-scrollbar {
        width: 6px;
      }

      .sidebar-nav::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      .sidebar-nav::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .sidebar-nav::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Tooltip efekti (collapsed modda) */
      .sidebar.collapsed .nav-item {
        position: relative;
      }

      .sidebar.collapsed .nav-item::after {
        content: attr(data-tooltip);
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(30, 30, 46, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        margin-left: 10px;
        transition: opacity 0.3s, margin-left 0.3s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1001;
      }

      .sidebar.collapsed .nav-item:hover::after {
        opacity: 1;
        margin-left: 15px;
      }

      /* Mobil için optimizasyon */
      @media (max-width: 768px) {
        .sidebar {
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
        }

        .sidebar:hover {
          box-shadow: 6px 0 35px rgba(0, 0, 0, 0.5);
          z-index: 1001;
        }
      }
    `;
    document.head.appendChild(style);

    // Tooltip için data-tooltip attribute'larını ekle
    this.addTooltips();
  }

  addTooltips() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const text = item.querySelector('.nav-text');
      if (text) {
        item.setAttribute('data-tooltip', text.textContent);
      }
    });
  }
}

// Sayfa yüklendiğinde SidebarHover'ı başlat
document.addEventListener('DOMContentLoaded', () => {
  new SidebarHover();
  console.log('✅ Sidebar Hover sistemi aktif!');
});

// Export et (modül olarak kullanılacaksa)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarHover;
}