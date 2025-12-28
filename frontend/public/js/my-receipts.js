// --- AYARLAR ---
const API_BASE = 'http://localhost:3000/api';

// --- ELEMENTLER ---
const receiptsContainer = document.getElementById('receiptsContainer');
const emptyState = document.getElementById('emptyState');
const loading = document.getElementById('loading');
const receiptModal = document.getElementById('receiptModal');
const searchInput = document.getElementById('searchInput');

// Upload elements
const fileInput = document.getElementById('fileInput');
const scanBtn = document.getElementById('scanBtn');
const fileNameDisplay = document.getElementById('fileName');
const loader = document.getElementById('loader');
const resultCard = document.getElementById('resultCard');

// Dashboard elements
let myChart = null;

// --- SAYFA YÜKLENDİĞİNDE ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Upload tab event listeners
    fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            fileNameDisplay.textContent = this.files[0].name;
            scanBtn.disabled = false;
            resultCard.style.display = 'none';
        }
    });

    // Arama inputunda Enter tuşuna bastığında
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchReceipts();
            }
        });
    }
}

// --- SEKMELERİ DEĞİŞTİRME ---
function switchTab(tabName) {
    // Menü aktiflik ayarı
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Bölüm değiştirme
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(tabName + '-section').style.display = 'block';

    // Eğer Fişlerim açıldıysa verileri yükle
    if (tabName === 'receipts') {
        loadReceipts();
    }

    // Eğer Dashboard açıldıysa verileri yükle
    if (tabName === 'dashboard') {
        loadDashboardData();
    }
}

// ============================================================
// FİŞ YÜKLEME FONKSİYONLARI
// ============================================================

async function uploadReceipt() {
    const file = fileInput.files[0];
    if (!file) return;

    // UI Güncelleme
    scanBtn.disabled = true;
    loader.style.display = 'block';
    resultCard.style.display = 'none';

    const formData = new FormData();
    formData.append('receiptImage', file);

    try {
        const response = await fetch(`${API_BASE}/receipts/analyze`, {
            method: 'POST',
            body: formData,
            credentials: 'include' 
        });

        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu, lütfen tekrar giriş yapın.");
            window.location.href = '/login';
            return;
        }

        const result = await response.json();

        if (result.success) {
            renderReceiptResult(result.data);
            // Başarılı yüklemeden sonra fişleri tazeleyelim
            if (receiptsContainer) {
                loadReceipts();
            }
        } else {
            alert('Hata: ' + result.error);
        }

    } catch (error) {
        console.error('Upload hatası:', error);
        alert('Sunucuya bağlanırken hata oluştu.');
    } finally {
        loader.style.display = 'none';
        scanBtn.disabled = false;
    }
}

// Analiz Sonucunu Ekrana Basma
function renderReceiptResult(data) {
    const container = document.getElementById('receiptDetails');
    const itemsHtml = data.items ? data.items.map(item => `
        <div class="item-row">
            <span>${item.name} (x${item.quantity || 1})</span>
            <span>${item.total || item.price} ${data.financials.currency || 'TL'}</span>
        </div>
    `).join('') : '<p>Ürün detayı bulunamadı.</p>';

    container.innerHTML = `
        <div style="margin-bottom:15px; border-bottom:2px dashed #ccc; padding-bottom:10px;">
            <h4>${data.merchant.name}</h4>
            <small>${data.transaction.date || ''} - ${data.transaction.time || ''}</small>
        </div>
        ${itemsHtml}
        <div class="total-row">
            <span>TOPLAM</span>
            <span>${data.financials.total_amount} ${data.financials.currency || 'TL'}</span>
        </div>
    `;
    resultCard.style.display = 'block';
}

// ============================================================
// FİŞLERİM FONKSİYONLARI
// ============================================================

async function loadReceipts() {
    try {
        loading.style.display = 'block';
        receiptsContainer.innerHTML = '';

        const response = await fetch(`${API_BASE}/receipts/my-receipts`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
        }

        const receipts = await response.json();

        loading.style.display = 'none';

        if (receipts.length === 0) {
            emptyState.style.display = 'block';
            receiptsContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            receiptsContainer.style.display = 'grid';
            renderReceipts(receipts);
        }

    } catch (error) {
        console.error('Fişler yükleme hatası:', error);
        loading.style.display = 'none';
        receiptsContainer.innerHTML = '<p style="color: red; grid-column: 1/-1;">Hata: Fişler yüklenemedi.</p>';
    }
}

function renderReceipts(receipts) {
    receiptsContainer.innerHTML = receipts.map(receipt => {
        const date = new Date(receipt.transaction_date).toLocaleDateString('tr-TR');
        const amount = parseFloat(receipt.total_amount).toFixed(2);
        const totalQty = parseInt(receipt.total_quantity) || 0;
        const itemCount = parseInt(receipt.item_count) || 0;
        
        return `
            <div class="receipt-card" onclick="openReceiptDetail(${receipt.id})">
                <h3>🏪 ${receipt.merchant_name || 'Bilinmeyen Mağaza'}</h3>
                <div class="meta">
                    <span><i class="fas fa-calendar"></i> ${date || '-'}</span>
                    <span><i class="fas fa-clock"></i> ${receipt.transaction_time || '-'}</span>
                </div>
                <div class="amount">${amount} ₺</div>
                <div class="items-count">
                    <i class="fas fa-box"></i> ${totalQty} ürün (${itemCount} kalem)
                </div>
            </div>
        `;
    }).join('');
}

function searchReceipts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadReceipts();
        return;
    }

    const cards = document.querySelectorAll('.receipt-card');
    let foundCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'block';
            foundCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (foundCount === 0) {
        emptyState.textContent = 'Arama sonucu bulunamadı.';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

async function openReceiptDetail(receiptId) {
    try {
        loading.style.display = 'block';

        const response = await fetch(`${API_BASE}/receipts/${receiptId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            alert('Fiş yüklenemedi');
            return;
        }

        const data = await response.json();
        loading.style.display = 'none';

        // Modal içeriğini doldur
        document.getElementById('modalTitle').textContent = `Fiş Detayları - ${data.receipt.merchant_name || 'Bilinmeyen'}`;
        
        // Mağaza adı düzenleme alanı
        document.getElementById('modalMerchantEdit').innerHTML = `
            <input type="text" value="${data.receipt.merchant_name || ''}" 
                   id="merchant-name-${receiptId}" class="edit-input">
            <button class="btn-save-item" onclick="updateMerchantName(${receiptId}, '${data.receipt.merchant_name || ''}')">
                <i class="fas fa-save"></i> Kaydet
            </button>
        `;
        
        const dateTime = `${new Date(data.receipt.transaction_date).toLocaleDateString('tr-TR')} ${data.receipt.transaction_time || ''}`;
        document.getElementById('modalDateTime').textContent = dateTime;
        document.getElementById('modalTotal').textContent = `${parseFloat(data.receipt.total_amount).toFixed(2)} ₺`;

        // Ürünleri göster
        const itemsHtml = data.items.map(item => `
            <div class="item-edit-row">
                <input type="text" value="${item.item_name}" 
                       id="item-name-${item.id}" class="item-name">
                <div class="quantity-edit">
                    <input type="number" value="${item.quantity}" 
                           id="item-quantity-${item.id}" class="quantity-input" min="1">
                </div>
                <div class="price">${parseFloat(item.total_price).toFixed(2)} ₺</div>
                <button class="btn-save-item" onclick="updateItem(${receiptId}, ${item.id}, '${item.item_name}', ${item.quantity})">
                    <i class="fas fa-save"></i> Kaydet
                </button>
            </div>
        `).join('');

        document.getElementById('modalItems').innerHTML = itemsHtml || '<p>Ürün bulunamadı.</p>';

        // Modal'ı aç
        receiptModal.style.display = 'block';

    } catch (error) {
        console.error('Fiş detay hatası:', error);
        alert('Fiş detayları yüklenemedi.');
    }
}

// YENİ: Mağaza Adını Güncelleme
async function updateMerchantName(receiptId, oldName) {
    const inputElement = document.getElementById(`merchant-name-${receiptId}`);
    const newName = inputElement.value.trim();

    if (!newName) {
        alert('Mağaza adı boş olamaz');
        return;
    }

    if (newName === oldName) {
        alert('Değişiklik yapılmadı');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/receipts/${receiptId}/merchant`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ merchant_name: newName })
        });

        if (!response.ok) {
            alert('Mağaza adı güncellenemedi');
            return;
        }

        const result = await response.json();
        alert('✅ Mağaza adı başarıyla güncellendi!');
        
        // Modal'ı kapat ve fişleri yenile
        closeModal();
        loadReceipts();

    } catch (error) {
        console.error('Güncelleme hatası:', error);
        alert('Hata: Mağaza adı güncellenemedi');
    }
}

// GÜNCELLENMIŞ: Ürün Adı ve Adet Güncelleme
async function updateItem(receiptId, itemId, oldName, oldQuantity) {
    const nameElement = document.getElementById(`item-name-${itemId}`);
    const quantityElement = document.getElementById(`item-quantity-${itemId}`);
    
    const newName = nameElement.value.trim();
    const newQuantity = parseInt(quantityElement.value);

    if (!newName) {
        alert('Ürün ismi boş olamaz');
        return;
    }

    if (newQuantity < 1) {
        alert('Adet 1\'den küçük olamaz');
        return;
    }

    if (newName === oldName && newQuantity === oldQuantity) {
        alert('Değişiklik yapılmadı');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/receipts/${receiptId}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                item_name: newName,
                quantity: newQuantity 
            })
        });

        if (!response.ok) {
            alert('Ürün güncellenemedi');
            return;
        }

        const result = await response.json();
        alert('✅ Ürün başarıyla güncellendi!');
        
        // Modal'ı kapat ve fişleri yenile
        closeModal();
        loadReceipts();

    } catch (error) {
        console.error('Güncelleme hatası:', error);
        alert('Hata: Ürün güncellenemedi');
    }
}

// ESKİ FONKSİYON (artık updateItem kullanılıyor)
async function updateItemName(receiptId, itemId, oldName) {
    const inputElement = document.getElementById(`item-name-${itemId}`);
    const newName = inputElement.value.trim();

    if (!newName) {
        alert('Ürün ismi boş olamaz');
        return;
    }

    if (newName === oldName) {
        alert('Değişiklik yapılmadı');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/receipts/${receiptId}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ item_name: newName })
        });

        if (!response.ok) {
            alert('Ürün güncellenemedi');
            return;
        }

        const result = await response.json();
        alert('✅ Ürün ismi başarıyla güncellendi!');

    } catch (error) {
        console.error('Güncelleme hatası:', error);
        alert('Hata: Ürün güncellenemedi');
    }
}

function closeModal() {
    receiptModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === receiptModal) {
        receiptModal.style.display = 'none';
    }
}

// ============================================================
// DASHBOARD FONKSİYONLARI
// ============================================================

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/receipts/my-receipts`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            console.warn("Oturum kapalı, dashboard yüklenemedi.");
            return;
        }

        const receipts = await response.json();

        updateStats(receipts);
        renderCharts(receipts);

    } catch (error) {
        console.error('Dashboard veri hatası:', error);
    }
}

function updateStats(receipts) {
    // Toplam Harcama
    const total = receipts.reduce((sum, r) => sum + Number(r.total_amount), 0);
    document.getElementById('totalSpent').textContent = total.toFixed(2) + ' ₺';

    // Toplam Fiş
    document.getElementById('totalReceipts').textContent = receipts.length;

    // En Çok Gidilen Market
    const merchants = {};
    receipts.forEach(r => {
        const name = r.merchant_name || 'Bilinmeyen';
        merchants[name] = (merchants[name] || 0) + 1;
    });

    let topMerchant = '-';
    let maxCount = 0;
    for (const [name, count] of Object.entries(merchants)) {
        if (count > maxCount) {
            maxCount = count;
            topMerchant = name;
        }
    }
    document.getElementById('topMerchant').textContent = topMerchant;

    // Son Harcamalar Listesi
    const list = document.getElementById('recentList');
    list.innerHTML = receipts.slice(0, 5).map(r => `
        <li>
            <span>${r.merchant_name}</span>
            <span class="price">${r.total_amount} ₺</span>
        </li>
    `).join('');
}

function renderCharts(receipts) {
    const ctx = document.getElementById('merchantChart').getContext('2d');

    // Veriyi Hazırla
    const merchantSpending = {};
    receipts.forEach(r => {
        const name = r.merchant_name || 'Diğer';
        merchantSpending[name] = (merchantSpending[name] || 0) + Number(r.total_amount);
    });

    const labels = Object.keys(merchantSpending);
    const data = Object.values(merchantSpending);

    // Eğer eski grafik varsa yok et
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Harcama Tutarı (TL)',
                data: data,
                backgroundColor: [
                    'rgba(108, 99, 255, 0.7)',
                    'rgba(255, 159, 67, 0.7)',
                    'rgba(77, 150, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// --- ÇIKIŞ FONKSİYONU ---
function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function logout(){
    deleteCookie('token');
    return window.location.href = '/'
}