let currentImage = null;
let imageX = 0;
let imageY = 0;
let imageScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// --- JWT ve Cookie Yardımcı Fonksiyonları ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
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

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// --- Başlangıç Kontrolleri ---

// 1. Token'ı al
const token = getTokenFromCookie();

// 2. Token yoksa login'e at
if (!token) {
    window.location.href = '/login';
}

// 3. Token'ı çöz ve verileri al
const decodedToken = parseJwt(token);
if (!decodedToken || !decodedToken.id) {
    window.location.href = '/login';
}

const userId = decodedToken.id;
const userEmail = decodedToken.email;
// Backend /user/:id endpoint'inde is_admin bilgisini dönmediği için
// yetki bilgisini doğrudan Token'dan alıyoruz.
const isAdmin = decodedToken.isAdmin || false;

// --- Ana Fonksiyonlar ---

async function loadUserInfo() {
    try {
        const res = await fetch(`http://localhost:3000/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Backend 404 veya 500 dönerse
        if (!res.ok) {
             if (res.status === 403) throw new Error('Yetkisiz Erişim');
             throw new Error('Kullanıcı bilgileri alınamadı');
        }

        const user = await res.json();

        if (user.profile_photo) {
            document.getElementById('profilePhoto').src = user.profile_photo;
        }

        // Kullanıcı arayüzünü doldur
        document.getElementById('userContent').innerHTML = `
          <h2 class="profile-name">${user.username}</h2>
          <p class="profile-email">${user.email}</p>
          ${isAdmin ? '<span class="admin-badge">👑 Admin</span>' : ''}
          
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
              <div class="info-label">Yetki Seviyesi</div>
              <div class="info-value">${isAdmin ? '👑 Admin' : '👤 Kullanıcı'}</div>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
            <button class ="btn btn-primary" onclick="window.location.href='/forgot-password'">Şifremi Unuttum</button>
          </div>
        `;

        // Eğer kullanıcı Admin ise (Token'dan gelen bilgiye göre) paneli aç
        if (isAdmin) {
            document.getElementById('usersSection').style.display = 'block';
            loadAllUsers();
        } else {
            document.getElementById('usersSection').style.display = 'none';
        }

    } catch (error) {
        console.error('Load user error:', error);
        document.getElementById('userContent').innerHTML = `
        <div class="error-message">${error.message || 'Sunucuya bağlanılamadı'}</div>
        <div class="actions">
          <button class="btn btn-danger" onclick="logout()">🚪 Çıkış Yap</button>
        </div>
      `;
    }
}

async function loadAllUsers() {
    try {
        // GÜNCELLEME: Header eklendi. Backend verifyToken middleware kullanıyor.
        const res = await fetch(`http://localhost:3000/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 403) {
            document.getElementById('allUsers').innerHTML = '<div class="error-message">Bu sayfayı görüntülemek için admin yetkisi gerekli</div>';
            return;
        }

        const users = await res.json();

        if (res.ok && users.length > 0) {
            document.getElementById('userCount').textContent = `${users.length} Kullanıcı`;

            let html = `
          <table>
            <thead>
              <tr>
                <th>Profil</th>
                <th>Kullanıcı Adı</th>
                <th>Email</th>
                <th>Kayıt Tarihi</th>
                <th>Yetki</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
        `;

            users.forEach(user => {
                const isCurrentUser = user.id == userId;
                const photoSrc = user.profile_photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ddd'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40' fill='%23999'%3E👤%3C/text%3E%3C/svg%3E";

                // Backend /users endpoint'inde is_admin dönüyor, burada kullanabiliriz.
                html += `
            <tr style="${isCurrentUser ? 'background: #e7f3ff;' : ''}">
              <td><img src="${photoSrc}" class="user-avatar" alt="${user.username}"></td>
              <td><strong>${user.username}</strong></td>
              <td>${user.email}</td>
              <td>${new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
              <td>
                ${user.is_admin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge">Kullanıcı</span>'}
                ${isCurrentUser ? '<span class="badge">Siz</span>' : ''}
              </td>
              <td>
                ${!isCurrentUser ? `<button class="delete-btn" onclick="deleteUser(${user.id})">🗑️ Sil</button>` : '-'}
              </td>
            </tr>
          `;
            });

            html += `</tbody></table>`;
            document.getElementById('allUsers').innerHTML = html;
        } else {
            document.getElementById('allUsers').innerHTML = '<p>Henüz kullanıcı yok</p>';
        }
    } catch (error) {
        console.error('Load all users error:', error);
        document.getElementById('allUsers').innerHTML = '<div class="error-message">Kullanıcılar yüklenemedi</div>';
    }
}

// --- Fotoğraf Yükleme ve Kırpma İşlemleri (Değişmedi, sadece Save güncellendi) ---

document.getElementById('photoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('❌ Geçersiz dosya formatı.');
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
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

function openCropModal() {
    const modal = document.getElementById('cropModal');
    const canvas = document.getElementById('cropCanvas');
    // const ctx = canvas.getContext('2d'); // Kullanılmıyorsa kaldırılabilir
    // const container = document.getElementById('cropContainer'); // Kullanılmıyorsa kaldırılabilir

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
}

function drawImage() {
    const canvas = document.getElementById('cropCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.drawImage(currentImage, imageX, imageY, currentImage.width * imageScale, currentImage.height * imageScale);
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

    canvas.onmouseup = () => { isDragging = false; };
    canvas.onmouseleave = () => { isDragging = false; };

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

    ctx.drawImage(canvas, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    const photoUrl = outputCanvas.toDataURL('image/jpeg', 0.9);

    try {
        // GÜNCELLEME: Backend query string (requesterId) beklemiyor, URL temizlendi.
        const res = await fetch(`http://localhost:3000/user/${userId}/photo`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, // Token Header'a eklendi
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ photoUrl }) // Backend sadece photoUrl bekliyor
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('profilePhoto').src = photoUrl;
            if (isAdmin) loadAllUsers(); // Admin ise listeyi güncelle
            closeCropModal();
            alert('✅ Profil fotoğrafı başarıyla güncellendi!');
        } else {
            alert('❌ ' + (data.error || 'Hata oluştu'));
        }
    } catch (error) {
        console.error('Save photo error:', error);
        alert('❌ Sunucuya bağlanılamadı');
    }
}

async function deleteUser(deleteUserId) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        // GÜNCELLEME: Authorization header eklendi
        const res = await fetch(`http://localhost:3000/user/${deleteUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (res.ok) {
            alert('✅ Kullanıcı başarıyla silindi');
            loadAllUsers();
        } else {
            alert('❌ ' + (data.error || 'Silme işlemi başarısız'));
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('❌ Sunucuya bağlanılamadı');
    }
}

function logout() {
    deleteCookie('token'); // Çerez silme fonksiyonu eklendi
    window.location.href = '/login';
}

// Sayfa yüklendiğinde başlat
loadUserInfo();