const API_BASE = '';

function getTokenFromCookie(name = 'token') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((char) => {
            return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`;
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT parse hatasi:', error);
        return null;
    }
}

function safeText(value, fallback = '-') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
}

function renderProfile(user) {
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;

    profileInfo.innerHTML = `
        <div class="profile-item">
            <span class="label">Kullanici Adi</span>
            <span class="value">${safeText(user.username)}</span>
        </div>
        <div class="profile-item">
            <span class="label">E-posta</span>
            <span class="value">${safeText(user.email)}</span>
        </div>
        <div class="profile-item">
            <span class="label">Kullanici ID</span>
            <span class="value">#${safeText(user.id)}</span>
        </div>
        <div class="profile-item">
            <span class="label">Kayit Tarihi</span>
            <span class="value">${user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '-'}</span>
        </div>
    `;
}

async function loadUserInfo() {
    const statusText = document.getElementById('statusText');
    const token = getTokenFromCookie();

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const decoded = parseJwt(token);
    if (!decoded || !decoded.id) {
        window.location.href = '/login';
        return;
    }

    try {
        if (statusText) statusText.textContent = 'Kullanici bilgileri getiriliyor...';

        const response = await fetch(`${API_BASE}/user/${decoded.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Kullanici bilgileri alinamadi');
        }

        const user = await response.json();
        renderProfile(user);
        if (statusText) statusText.textContent = 'Bilgiler guncel.';
    } catch (error) {
        console.error('Kullanici yukleme hatasi:', error);
        if (statusText) statusText.textContent = 'Bilgiler su an yuklenemedi.';
    }
}

function setupCloseAccountButton() {
    const closeBtn = document.getElementById('closeAccountBtn');
    if (!closeBtn) return;

    closeBtn.addEventListener('click', () => {
        window.location.href = '/account-close-whatsapp';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    setupCloseAccountButton();
});
