// --- AYARLAR ---
const API_BASE = 'http://localhost:3000/api';

// GÜVENLİK GÜNCELLEMESİ:
// CURRENT_USER_ID değişkenini sildik.
// Kimlik bilgisi artık Cookie içinde gizli ve otomatik gidiyor.


const fileInput = document.getElementById('fileInput');
const scanBtn = document.getElementById('scanBtn');
const fileNameDisplay = document.getElementById('fileName');
const loader = document.getElementById('loader');
const resultCard = document.getElementById('resultCard');

document.addEventListener('DOMContentLoaded', () => {
  
    if (document.getElementById('dashboard-section').style.display !== 'none') {
        loadDashboardData();
    }
});
function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function logout(){
    deleteCookie('token');
    return window.location.href = '/'
}


fileInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        fileNameDisplay.textContent = this.files[0].name;
        scanBtn.disabled = false;
        resultCard.style.display = 'none';
    }
});


function switchTab(tabName) {
    // Menü aktiflik ayarı
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Bölüm değiştirme
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(tabName + '-section').style.display = 'block';

    // Eğer Dashboard açıldıysa verileri yükle
    if (tabName === 'dashboard') {
        loadDashboardData();
    }
}

async function uploadReceipt() {
    const file = fileInput.files[0];
    if (!file) return;

    // UI Güncelleme
    scanBtn.disabled = true;
    loader.style.display = 'block';
    resultCard.style.display = 'none';

    const formData = new FormData();
    formData.append('receiptImage', file);

    // GÜVENLİK GÜNCELLEMESİ: 
    // formData.append('user_id', ...) SATIRINI KALDIRDIK.
    // Backend artık ID'yi Token'dan kendisi alıyor.

    try {
        const response = await fetch(`${API_BASE}/receipts/analyze`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

         /*Eğer oturum süresi dolmuşsa:
                     if (response.status === 401 || response.status === 403) {
           alert("Oturum süreniz doldu, lütfen tekrar giriş yapın.");
            window.location.href = '/login';  Login sayfasına at
            return;
        }
*/
        const result = await response.json();

        if (result.success) {
            renderReceiptResult(result.data);
            // Başarılı yüklemeden sonra dashboard verisi eskidi, tazeleyelim (arka planda)
            loadDashboardData();
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


async function loadDashboardData() {
    try {
        // GÜVENLİK GÜNCELLEMESİ:
        // Eski URL: /receipts/user/${CURRENT_USER_ID} -> GÜVENSİZ
        // Yeni URL: /receipts/my-receipts -> GÜVENLİ (ID Token'dan gelir)

        const response = await fetch(`${API_BASE}/receipts/my-receipts`, {
            method: 'GET',
            credentials: 'include'
        }
        );

        // Eğer token yoksa veya geçersizse:
        if (response.status === 401 || response.status === 403) {
            console.warn("Oturum kapalı, dashboard yüklenemedi.");
            // İstersen burada da login'e yönlendirebilirsin:
            // window.location.href = '/login.html';
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

    // En yüksek sayıyı bul
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


let myChart = null;

function renderCharts(receipts) {
    const ctx = document.getElementById('merchantChart').getContext('2d');

    // Veriyi Hazırla: Hangi markete ne kadar harcandı?
    const merchantSpending = {};
    receipts.forEach(r => {
        const name = r.merchant_name || 'Diğer';
        merchantSpending[name] = (merchantSpending[name] || 0) + Number(r.total_amount);
    });

    const labels = Object.keys(merchantSpending);
    const data = Object.values(merchantSpending);

    // Eğer eski grafik varsa yok et (yeniden çizim hatasını önlemek için)
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar', // 'pie' veya 'doughnut' da yapabilirsin
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