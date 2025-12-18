// Cookie yardımcı fonksiyonları - tüm sayfalarda kullanılabilir

// Cookie'den token'ı al
function getTokenFromCookie() {
    const name = 'token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
}

// Cookie'den token'ı sil (logout için)
function deleteTokenCookie() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
}

// JWT token'ı decode et
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('JWT parse hatası:', e);
        return null;
    }
}

// Token'ın geçerliliğini kontrol et
function isTokenValid(token) {
    if (!token) return false;
    
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return false;
    
    // Token'ın süresi dolmuş mu kontrol et
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
}

// Kullanıcı girişi yapılmış mı kontrol et ve redirect yap
function requireAuth(redirectTo = '/login') {
    const token = getTokenFromCookie();
    
    if (!token || !isTokenValid(token)) {
        window.location.href = redirectTo;
        return null;
    }
    
    return parseJwt(token);
}

// Admin yetkisi kontrol et
function requireAdmin(redirectTo = '/dashboard') {
    const userInfo = requireAuth(redirectTo);
    
    if (!userInfo || !userInfo.isAdmin) {
        alert('❌ Bu sayfaya erişim yetkiniz yok');
        window.location.href = redirectTo;
        return null;
    }
    
    return userInfo;
}