// Karanlık/Aydınlık Mod Yönetimi
class DarkModeManager {
    constructor() {
        this.storageKey = 'theme-mode';
        this.darkModeClass = 'dark-mode';
        this.init();
    }

    init() {
        // Kaydedilmiş temayı yükle veya sistem tercihini kullan
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
    }

    setTheme(theme) {
        const isDark = theme === 'dark';

        if (isDark) {
            document.documentElement.classList.add(this.darkModeClass);
        } else {
            document.documentElement.classList.remove(this.darkModeClass);
        }

        localStorage.setItem(this.storageKey, theme);
        this.updateToggleButton(isDark);
    }

    toggle() {
        const isDark = document.documentElement.classList.contains(this.darkModeClass);
        this.setTheme(isDark ? 'light' : 'dark');
    }

    updateToggleButton(isDark) {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.innerHTML = isDark
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
            btn.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
    }

    getCurrentTheme() {
        return localStorage.getItem(this.storageKey) || 'light';
    }
}

// Sayfaya yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.darkMode = new DarkModeManager();
});

// Sistem renk şeması değişirse güncelle
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme-mode')) {
        window.darkMode.setTheme(e.matches ? 'dark' : 'light');
    }
});
