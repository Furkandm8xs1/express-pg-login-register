// --- AYARLAR ---
const API_BASE = 'http://localhost:3000/api';

// --- ELEMENTLER ---
const subscriptionsTbody = document.getElementById('subscriptionsTbody');
const subscriptionsEmptyState = document.getElementById('subscriptionsEmptyState');
const subscriptionsError = document.getElementById('subscriptionsError');
const totalMonthlyCostEl = document.getElementById('totalMonthlyCost');
const totalSubscriptionsEl = document.getElementById('totalSubscriptions');

const subscriptionNameInput = document.getElementById('subscriptionName');
const subscriptionPriceInput = document.getElementById('subscriptionPrice');
const subscriptionDayInput = document.getElementById('subscriptionDay');
const subscriptionCategoryInput = document.getElementById('subscriptionCategory');

let subscriptions = [];

document.addEventListener('DOMContentLoaded', () => {
  loadSubscriptions();
});

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return value.toFixed(2) + ' ₺';
}

function clearError() {
  if (subscriptionsError) {
    subscriptionsError.style.display = 'none';
    subscriptionsError.textContent = '';
  }
}

function showError(message) {
  if (!subscriptionsError) return;
  subscriptionsError.textContent = message;
  subscriptionsError.style.display = 'block';
}

async function loadSubscriptions() {
  try {
    clearError();

    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      showError('Abonelikler yüklenemedi.');
      return;
    }

    const data = await response.json();
    subscriptions = Array.isArray(data) ? data : [];

    renderSubscriptions();
    updateSummary();
  } catch (error) {
    console.error('Abonelikleri yüklerken hata:', error);
    showError('Sunucuya bağlanırken bir hata oluştu.');
  }
}

function renderSubscriptions() {
  if (!subscriptionsTbody) return;

  if (subscriptions.length === 0) {
    subscriptionsTbody.innerHTML = '';
    if (subscriptionsEmptyState) {
      subscriptionsEmptyState.style.display = 'block';
    }
    return;
  }

  if (subscriptionsEmptyState) {
    subscriptionsEmptyState.style.display = 'none';
  }

  subscriptionsTbody.innerHTML = subscriptions
    .map(sub => {
      const price = Number(sub.monthly_price) || 0;
      const day = sub.billing_day || '';
      const category = sub.category || '';

      return `
        <tr data-id="${sub.id}">
          <td>
            <input type="text" name="name" value="${sub.name || ''}">
          </td>
          <td>
            <input type="number" name="price" min="0" step="0.01" value="${price.toFixed(2)}">
          </td>
          <td>
            <input type="number" name="day" min="1" max="31" value="${day}">
          </td>
          <td>
            <input type="text" name="category" value="${category}">
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-small btn-save" onclick="saveSubscription(${sub.id})">
                <i class="fas fa-save"></i> Kaydet
              </button>
              <button type="button" class="btn-small btn-delete" onclick="deleteSubscription(${sub.id})">
                <i class="fas fa-trash"></i> Sil
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function calculateTotalMonthlyCost() {
  return subscriptions.reduce((sum, sub) => {
    const price = Number(sub.monthly_price) || 0;
    return sum + price;
  }, 0);
}

function updateSummary() {
  const total = calculateTotalMonthlyCost();
  if (totalMonthlyCostEl) {
    totalMonthlyCostEl.textContent = formatCurrency(total);
  }
  if (totalSubscriptionsEl) {
    totalSubscriptionsEl.textContent = subscriptions.length.toString();
  }
}

function resetSubscriptionForm() {
  if (subscriptionNameInput) subscriptionNameInput.value = '';
  if (subscriptionPriceInput) subscriptionPriceInput.value = '';
  if (subscriptionDayInput) subscriptionDayInput.value = '';
  if (subscriptionCategoryInput) subscriptionCategoryInput.value = '';
  clearError();
}

async function createSubscription() {
  clearError();

  const name = subscriptionNameInput ? subscriptionNameInput.value.trim() : '';
  const priceValue = subscriptionPriceInput ? subscriptionPriceInput.value : '';
  const dayValue = subscriptionDayInput ? subscriptionDayInput.value : '';
  const category = subscriptionCategoryInput ? subscriptionCategoryInput.value.trim() : '';

  if (!name || !priceValue || !dayValue) {
    showError('Ad, aylık fiyat ve fatura günü zorunludur.');
    return;
  }

  const price = parseFloat(priceValue);
  const day = parseInt(dayValue, 10);

  if (isNaN(price) || price <= 0) {
    showError('Aylık fiyat 0\'dan büyük bir sayı olmalıdır.');
    return;
  }

  if (isNaN(day) || day < 1 || day > 31) {
    showError('Fatura günü 1 ile 31 arasında olmalıdır.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name,
        monthly_price: price,
        billing_day: day,
        category
      })
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || 'Abonelik oluşturulamadı.');
      return;
    }

    subscriptions.push(result);
    renderSubscriptions();
    updateSummary();
    resetSubscriptionForm();
  } catch (error) {
    console.error('Abonelik oluşturma hatası:', error);
    showError('Abonelik oluşturulurken bir hata oluştu.');
  }
}

async function saveSubscription(id) {
  clearError();

  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) {
    showError('Abonelik satırı bulunamadı.');
    return;
  }

  const nameInput = row.querySelector('input[name="name"]');
  const priceInput = row.querySelector('input[name="price"]');
  const dayInput = row.querySelector('input[name="day"]');
  const categoryInput = row.querySelector('input[name="category"]');

  const name = nameInput ? nameInput.value.trim() : '';
  const priceValue = priceInput ? priceInput.value : '';
  const dayValue = dayInput ? dayInput.value : '';
  const category = categoryInput ? categoryInput.value.trim() : '';

  if (!name || !priceValue || !dayValue) {
    showError('Ad, aylık fiyat ve fatura günü zorunludur.');
    return;
  }

  const price = parseFloat(priceValue);
  const day = parseInt(dayValue, 10);

  if (isNaN(price) || price <= 0) {
    showError('Aylık fiyat 0\'dan büyük bir sayı olmalıdır.');
    return;
  }

  if (isNaN(day) || day < 1 || day > 31) {
    showError('Fatura günü 1 ile 31 arasında olmalıdır.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name,
        monthly_price: price,
        billing_day: day,
        category
      })
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      showError(result.error || 'Abonelik güncellenemedi.');
      return;
    }

    const index = subscriptions.findIndex(sub => sub.id === id);
    if (index !== -1) {
      subscriptions[index] = result;
    }

    renderSubscriptions();
    updateSummary();
  } catch (error) {
    console.error('Abonelik güncelleme hatası:', error);
    showError('Abonelik güncellenirken bir hata oluştu.');
  }
}

async function deleteSubscription(id) {
  clearError();

  const confirmed = window.confirm('Bu aboneliği silmek istediğinizden emin misiniz?');
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      showError(result.error || 'Abonelik silinemedi.');
      return;
    }

    subscriptions = subscriptions.filter(sub => sub.id !== id);
    renderSubscriptions();
    updateSummary();
  } catch (error) {
    console.error('Abonelik silme hatası:', error);
    showError('Abonelik silinirken bir hata oluştu.');
  }
}

// --- ÇIKIŞ FONKSİYONLARI ---
function deleteCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function logout() {
  deleteCookie('token');
  window.location.href = '/';
}

