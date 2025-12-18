// Instagram Tarzı Fotoğraf Görüntüleyici
// photo-viewer.js

class PhotoViewer {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    // Overlay oluştur
    this.createOverlay();
    
    // Profil fotoğrafına tıklama eventi ekle
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
      profilePhoto.addEventListener('click', (e) => {
        // Upload overlay'e tıklanmadıysa fotoğrafı aç
        if (!e.target.closest('.upload-overlay')) {
          this.openPhoto(profilePhoto.src);
        }
      });
      
      // Mouse cursor değiştir
      profilePhoto.style.cursor = 'pointer';
    }
  }

  createOverlay() {
    // Overlay div'i oluştur
    this.overlay = document.createElement('div');
    this.overlay.className = 'photo-viewer-overlay';
    this.overlay.innerHTML = `
      <div class="photo-viewer-container">
        <button class="photo-viewer-close"> × </button>
        <img class="photo-viewer-image" src="" alt="Fotoğraf">
      </div>
    `;
    
    // CSS ekle
    this.addStyles();
    
    // Body'e ekle
    document.body.appendChild(this.overlay);
    
    // Event listeners
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay || e.target.classList.contains('photo-viewer-close')) {
        this.closePhoto();
      }
    });
    
    // ESC tuşu ile kapatma
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.closePhoto();
      }
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .photo-viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .photo-viewer-overlay.active {
        background: rgba(0, 0, 0, 0.30);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        opacity: 1;
        visibility: visible;
      }

      .photo-viewer-container {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        transform: scale(0.8);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .photo-viewer-overlay.active .photo-viewer-container {
        transform: scale(1);
      }

      .photo-viewer-image {
        max-width: 90vw;
        max-height: 90vh;
        border-radius: 50%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        object-fit: contain;
        animation: photoZoomIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes photoZoomIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .photo-viewer-close {
        position: absolute;
        top: -50px;
        right: 0;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        font-size: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        line-height: 1;
        padding: 0;
      }

      .photo-viewer-close:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: rotate(90deg) scale(1.1);
      }

      /* Mobil için */
      @media (max-width: 768px) {
        .photo-viewer-close {
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          font-size: 28px;
        }

        .photo-viewer-image {
          max-width: 95vw;
          max-height: 85vh;
          border-radius: 50%;
        }

        .photo-viewer-container {
          max-width: 95%;
          max-height: 95%;
        }
      }

      /* Zoom animasyonu için */
      .photo-viewer-overlay.active .photo-viewer-image {
        animation: photoFloat 3s ease-in-out infinite;
      }

      @keyframes photoFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  openPhoto(imageSrc) {
    const image = this.overlay.querySelector('.photo-viewer-image');
    image.src = imageSrc;
    
    // Overlay'i aç
    setTimeout(() => {
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
  }

  closePhoto() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Animasyon bitince image'i temizle
    setTimeout(() => {
      const image = this.overlay.querySelector('.photo-viewer-image');
      image.src = '';
    }, 400);
  }
}

// Sayfa yüklendiğinde PhotoViewer'ı başlat
document.addEventListener('DOMContentLoaded', () => {
  new PhotoViewer();
});

// Export et (modül olarak kullanılacaksa)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoViewer;
}