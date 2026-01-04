let currentImage = null;
let imageX = 0;
let imageY = 0;
let imageScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;


function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('JWT parse error:', e);
        return null;
    }
}

function getTokenFromCookie(name = 'token') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Çıkış yaparken Cookie'yi silmek için yardımcı fonksiyon
function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}




// 1. Get token from cookie
const token = getTokenFromCookie();

// 2. Redirect to login if no token
if (!token) {
    window.location.href = '/login';
}

// 3. Decode token and extract user data
const decodedToken = parseJwt(token);
if (!decodedToken || !decodedToken.id) {
    // If token is invalid, redirect to login
    window.location.href = '/login';
}

const userId = decodedToken.id;
const userEmail = decodedToken.email;
const isAdmin = decodedToken.isAdmin || false;

async function loadUserInfo() {
    try {
        const res = await fetch(`http://localhost:3000/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const user = await res.json();
        console.log('📱 Kullanıcı verisi:', user);
        console.log('📸 Profil Fotoğrafı URL:', user.profile_photo);

        if (res.ok) {
            // ✅ ÖNCE IMG'i SET ET
            if (user.profile_photo && user.profile_photo.trim() !== '') {
                console.log('✅ Fotoğraf set ediliyor:', user.profile_photo);
                const imgElement = document.getElementById('profilePhoto');
                if (imgElement) {
                    imgElement.src = user.profile_photo;
                    imgElement.onerror = () => {
                        console.error('❌ Fotoğraf yüklenemedi:', user.profile_photo);
                        // Hata durumunda SVG'ye dön
                        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="%23999"%3E👤%3C/text%3E%3C/svg%3E';
                    };
                    imgElement.onload = () => {
                        console.log('✅ Fotoğraf başarıyla yüklendi');
                    };
                }
            } else {
                console.warn('⚠️  Fotoğraf URL bulunamadı veya boş');
            }

            // ✅ SONRA CONTENT'İ SET ETf
            document.getElementById('userContent').innerHTML = `
                <h2 class="profile-name">${user.username}</h2>
                <p class="profile-email">${user.email}</p>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Kullanıcı ID</div>
                        <div class="info-value">#${user.id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Kayıt Tarihi</div>
                        <div class="info-value">${new Date(user.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Hesap Durumu</div>
                        <div class="info-value">✅ Aktif</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Rol</div>
                        <div class="info-value"> Kullanıcı</div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
                    <button class="btn btn-primary" onclick="window.location.href='/forgot-password'">Şifremi Unuttum</button>
                </div>
            `;
        } else if (res.status === 403) {
            document.getElementById('userContent').innerHTML = `
                <div class="error-message">Bu bilgilere erişim yetkiniz yok</div>
                <div class="actions">
                    <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
                </div>
            `;
        } else {
            document.getElementById('userContent').innerHTML = `
                <div class="error-message">Kullanıcı bilgileri yüklenemedi</div>
                <div class="actions">
                    <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load user error:', error);
        document.getElementById('userContent').innerHTML = `
            <div class="error-message">Sunucuya bağlanılamadı</div>
            <div class="actions">
                <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
            </div>
        `;
    }
}

document.getElementById('photoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('❌ Geçersiz dosya formatı. Sadece JPG, PNG, GIF, WEBP desteklenir.');
        e.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('❌ Dosya boyutu 5MB\'dan küçük olmalı');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            openCropModal();
        };
        img.onerror = () => {
            alert('❌ Resim yüklenemedi. Lütfen geçerli bir resim dosyası seçin.');
            e.target.value = '';
        };
        img.src = event.target.result;
    };
    reader.onerror = () => {
        alert('❌ Dosya okunamadı.');
        e.target.value = '';
    };
    reader.readAsDataURL(file);

    e.target.value = '';
});

function openCropModal() {
    const modal = document.getElementById('cropModal');
    const canvas = document.getElementById('cropCanvas');
    const ctx = canvas.getContext('2d');

    const containerSize = 400;
    canvas.width = containerSize;
    canvas.height = containerSize;

    const scale = Math.max(containerSize / currentImage.width, containerSize / currentImage.height);
    imageScale = scale;
    imageX = (containerSize - currentImage.width * scale) / 2;
    imageY = (containerSize - currentImage.height * scale) / 2;

    document.getElementById('zoomSlider').value = 1;

    modal.style.display = 'block';
    drawImage();
    setupCropControls();
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    currentImage = null;
    imageX = 0;
    imageY = 0;
    imageScale = 1;
    isDragging = false;
}

function drawImage() {
    const canvas = document.getElementById('cropCanvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.drawImage(
        currentImage,
        imageX,
        imageY,
        currentImage.width * imageScale,
        currentImage.height * imageScale
    );
    ctx.restore();
}

function setupCropControls() {
    const canvas = document.getElementById('cropCanvas');
    const zoomSlider = document.getElementById('zoomSlider');

    canvas.onmousedown = (e) => {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        dragStartX = e.clientX - rect.left - imageX;
        dragStartY = e.clientY - rect.top - imageY;
    };

    canvas.onmousemove = (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        imageX = e.clientX - rect.left - dragStartX;
        imageY = e.clientY - rect.top - dragStartY;
        drawImage();
    };

    canvas.onmouseup = () => {
        isDragging = false;
    };

    canvas.onmouseleave = () => {
        isDragging = false;
    };

    zoomSlider.oninput = (e) => {
        const containerSize = 400;
        const baseScale = Math.max(containerSize / currentImage.width, containerSize / currentImage.height);
        const zoomFactor = parseFloat(e.target.value);
        const newScale = baseScale * zoomFactor;

        const centerX = containerSize / 2;
        const centerY = containerSize / 2;

        const imageCenterX = (centerX - imageX) / imageScale;
        const imageCenterY = (centerY - imageY) / imageScale;

        imageScale = newScale;

        imageX = centerX - (imageCenterX * imageScale);
        imageY = centerY - (imageCenterY * imageScale);

        drawImage();
    };
}

async function saveCroppedPhoto() {
    const canvas = document.getElementById('cropCanvas');
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');

    const size = 300;
    outputCanvas.width = size;
    outputCanvas.height = size;

    const containerSize = 400;
    const cropSize = 300;
    const cropX = (containerSize - cropSize) / 2;
    const cropY = (containerSize - cropSize) / 2;

    ctx.drawImage(
        canvas,
        cropX, cropY, cropSize, cropSize,
        0, 0, size, size
    );

    // 1. Canvas'ı Blob'a dönüştür (Base64 yerine)
    outputCanvas.toBlob(async(blob) => {
        if (!blob) {
            alert('❌ Resim işleme başarısız oldu');
            return;
        }

        try {
            // 2. FormData oluştur ve Blob'u ekle
            const formData = new FormData();
            formData.append('photo', blob, 'profile.jpg');

            // 3. R2'ye upload et (API endpoint)
            const res = await fetch(`http://localhost:3000/user/${userId}/photo`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type'ı otomatik olarak multipart/form-data'ya ayarla
                },
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                // 4. Response'dan URL al ve UI'ı güncelle
                const newPhotoUrl = data.photoUrl;
                document.getElementById('profilePhoto').src = newPhotoUrl;
                closeCropModal();
                alert('✅ Profil fotoğrafı başarıyla güncellendi!');
            } else if (res.status === 403) {
                alert('❌ Bu işlem için yetkiniz yok');
            } else if (res.status === 400) {
                alert('❌ ' + (data.error || 'Geçersiz fotoğraf formatı'));
            } else {
                alert('❌ Fotoğraf yüklenemedi: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Save photo error:', error);
            alert('❌ Sunucuya bağlanılamadı: ' + error.message);
        }
    }, 'image/jpeg', 0.9);
}

function logout() {
    deleteCookie('token');
    window.location.href = '/login';
}

// Load user info on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});