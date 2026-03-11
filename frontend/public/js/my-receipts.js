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
let hourlyChart = null;

// Receipts filtering
let allReceipts = [];
let filteredReceipts = [];
let dashboardReceipts = [];

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

    // Dosya seçimini temizle ve input'ı resetle
    fileInput.value = '';
    fileNameDisplay.textContent = 'Dosya seçin';

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
        allReceipts = receipts;
        filteredReceipts = receipts;

        loading.style.display = 'none';

        // Ay dropdown'unu ve özet kartlarını doldur
        populateMonthFilter(receipts);
        renderMonthlySummaryCards(receipts);

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
        renderReceipts(filteredReceipts);
        emptyState.style.display = 'none';
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

// AY DROPDOWN'UNU DOLDUR

function populateMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');

    // Eski seçenekleri temizle (başlık hariç)
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }

    // 2026 yılının 12 ayını ekle
    for (let month = 0; month < 12; month++) {
        const date = new Date(2026, month, 1);
        const monthKey = `2026-${String(month + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = monthName;
        monthFilter.appendChild(option);
    }
}

// AYLLIK ÖZET KARTLARINI RENDER ET
function renderMonthlySummaryCards(receipts) {
    const container = document.getElementById('monthlySummaryCards');
    if (!container) return;

    const monthlyData = {};

    // Aylık verileri hesapla
    receipts.forEach(receipt => {
        const date = new Date(receipt.transaction_date);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (year >= 2026) {
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;

            if (!monthlyData[key]) {
                monthlyData[key] = {
                    total: 0,
                    count: 0,
                    month: date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
                };
            }

            monthlyData[key].total += Number(receipt.total_amount);
            monthlyData[key].count += 1;
        }
    });

    // Kartları oluştur
    const sortedMonths = Object.entries(monthlyData).sort((a, b) => b[0].localeCompare(a[0]));

    container.innerHTML = sortedMonths.map(([monthKey, data]) => `
        <div class="month-summary-card" onclick="selectMonth('${monthKey}')">
            <div class="month-name">${data.month}</div>
            <div class="month-info">${data.total.toFixed(2)} ₺</div>
            <div class="month-detail">${data.count} fiş</div>
        </div>
    `).join('');
}

// AY SEÇ VE FİŞLERİ FILTRELE
function selectMonth(monthKey) {
    const monthFilter = document.getElementById('monthFilter');
    monthFilter.value = monthKey;
    filterReceiptsByMonth();

    // Kartları güncelle
    updateMonthlySummaryCardsUI();
}

// DROPDOWN'DAN SEÇILEN AYA GÖRE FİLTRELE
function filterReceiptsByMonth() {
    const monthFilter = document.getElementById('monthFilter');
    const selectedMonth = monthFilter.value;

    if (!selectedMonth) {
        // Tüm aylar
        filteredReceipts = allReceipts;
    } else {
        // Seçilen aya göre filtrele
        filteredReceipts = allReceipts.filter(receipt => {
            const date = new Date(receipt.transaction_date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const receiptMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            return receiptMonthKey === selectedMonth;
        });
    }

    // UI'ı güncelle
    updateMonthlySummaryCardsUI();
    renderReceipts(filteredReceipts);

    if (filteredReceipts.length === 0) {
        emptyState.style.display = 'block';
        receiptsContainer.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        receiptsContainer.style.display = 'grid';
    }
}

// ÖZET KARTLARI AKTIF/PASIF DURUMUNU GÜNCELLEyüncelle
function updateMonthlySummaryCardsUI() {
    const monthFilter = document.getElementById('monthFilter');
    const selectedMonth = monthFilter.value;
    const cards = document.querySelectorAll('.month-summary-card');

    cards.forEach(card => {
        card.classList.remove('active');
    });

    // Seçili ayı bulup vurgula
    if (selectedMonth === '') {
        // Hepsi seçili değilse, vurgulama yok
    } else {
        const cards = document.querySelectorAll('.month-summary-card');
        let monthData = {};

        allReceipts.forEach(receipt => {
            const date = new Date(receipt.transaction_date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

            if (monthKey === selectedMonth) {
                const monthText = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                monthData[monthText] = true;
            }
        });

        cards.forEach(card => {
            const monthText = card.querySelector('.month-name').textContent;
            if (monthData[monthText]) {
                card.classList.add('active');
            }
        });
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

    const newName = nameElement.value.toLowerCase().trim();
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

function closeModal() {
    receiptModal.style.display = 'none';
}

window.onclick = function (event) {
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
        dashboardReceipts = receipts;

        // Dashboard ay dropdown'unu doldur
        populateDashboardMonthFilter(receipts);

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

function normalizeMerchantName(rawName) {
    let name = (rawName || 'Diğer').toLowerCase().trim();

    // Nokta ve virgülleri kaldır
    name = name.replace(/[.,]/g, '');

    // Birden fazla boşluğu tek boşluğa indir
    name = name.replace(/\s+/g, ' ');

    // Şirket son eklerini kaldır (a.ş., a.s., aş, as vb.)
    name = name.replace(/\b(a\.?\s*ş\.?|a\.?\s*s\.?|aş|as)\b$/g, '').trim();

    // Türkçe karakterleri sadeleştir
    const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
    name = name.replace(/[çğıöşü]/g, ch => map[ch] || ch);

    // İlk harfi büyük yap
    if (!name) name = 'diğer';
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
}

function renderCharts(receipts) {
    const ctx = document.getElementById('merchantChart').getContext('2d');

    // Veriyi Hazırla - İsim normalizasyonu
    const merchantSpending = {};
    receipts.forEach(r => {
        const name = normalizeMerchantName(r.merchant_name);
        merchantSpending[name] = (merchantSpending[name] || 0) + Number(r.total_amount);
    });

    // Harcamaya göre sırala (en yüksekten aşağıya)
    const sortedEntries = Object.entries(merchantSpending)
        .sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1]);

    // Eğer eski grafik varsa yok et
    if (myChart) myChart.destroy();

    // Canlı renkler
    const colors = [
        'rgba(108, 99, 255, 1)',      // Mor
        'rgba(255, 107, 107, 1)',     // Kırmızı
        'rgba(255, 170, 50, 1)',      // Turuncu
        'rgba(77, 150, 255, 1)',      // Mavi
        'rgba(46, 213, 115, 1)',      // Yeşil
        'rgba(255, 195, 113, 1)',     // Sarı 
        'rgba(165, 142, 251, 1)',     // Açık mor
        'rgba(255, 127, 179, 1)'      // Pembe
    ];

    const backgroundColor = data.map((_, index) => colors[index % colors.length]);
    const borderColors = backgroundColor.map(color => color.replace('1)', '0.8)'));

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Harcama Tutarı (₺)',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: backgroundColor.map(color => color.replace('1)', '0.9)'))
            }]
        },
        options: {
            indexAxis: 'x',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        padding: 15,
                        color: '#333'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(0) + ' ₺';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}





// --- ÇIKIŞ FONKSİYONU ---
function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function logout() {
    deleteCookie('token');
    return window.location.href = '/'
}

// ============================================================
// DASHBOARD AY FİLTRESİ FONKSİYONLARI
// ============================================================

// DASHBOARD AY DROPDOWN'UNU DOLDUR
function populateDashboardMonthFilter(receipts) {
    const monthFilter = document.getElementById('dashboardMonthFilter');
    if (!monthFilter) return;

    // Eski seçenekleri temizle (başlık hariç)
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }

    // 2026 yılının 12 ayını ekle
    for (let month = 0; month < 12; month++) {
        const date = new Date(2026, month, 1);
        const monthKey = `2026-${String(month + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = monthName;
        monthFilter.appendChild(option);
    }
}

// DASHBOARD AYLLIK FİLTRE
function filterDashboardByMonth() {
    const monthFilter = document.getElementById('dashboardMonthFilter');
    if (!monthFilter) return;

    const selectedMonth = monthFilter.value;
    let filteredData = dashboardReceipts;

    if (selectedMonth) {
        // Seçilen aya göre filtrele
        filteredData = dashboardReceipts.filter(receipt => {
            const date = new Date(receipt.transaction_date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const receiptMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            return receiptMonthKey === selectedMonth;
        });
    }

    // Grafikler ve istatistikleri güncelle
    updateStats(filteredData);
    renderCharts(filteredData);
}

