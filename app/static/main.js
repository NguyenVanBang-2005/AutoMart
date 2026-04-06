// ── Config ───────────────────────────────────────────
const defaultConfig = {
  site_name: 'AutoMart',
  hero_title: 'Tìm chiếc xe mơ ước của bạn',
  hero_subtitle: 'Hàng nghìn xe đã qua sử dụng chất lượng cao, giá tốt nhất thị trường. Cam kết xe chính chủ, đảm bảo pháp lý 100%.',
  contact_phone: '1900 1234',
  contact_email: 'contact@automart.vn',
  bg_primary: '#1a1a1a',
  bg_surface: '#ffffff',
  text_primary: '#1a1a1a',
  accent_primary: '#c8a96e',
  accent_secondary: '#d4b97e',
  font_family: 'Inter',
  font_size: 16
};

const API_BASE = `${window.location.origin}/api/v1`;

// ── Car & Brand Data ─────────────────────────────────
const carsData = [
  // ── Toyota ───────────────────────────────────────────
  { id: 1,  brand: 'Toyota', model: 'Camry 2.0E SX',          year: 2019, price: 850,  km: 45000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'featured', color: '#6366f1' },
  { id: 2,  brand: 'Toyota', model: 'Veloz Cross 2022 CVT Top', year: 2022, price: 720, km: 80000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#6366f1' },
  { id: 3,  brand: 'Toyota', model: 'YARIS 2015 Bản G',        year: 2015, price: 380,  km: 60000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '',         color: '#6366f1' },
  { id: 4,  brand: 'Toyota', model: 'Land Cruiser V8 2011',    year: 2011, price: 1850, km: 90000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'featured', color: '#6366f1' },
  { id: 5,  brand: 'Toyota', model: 'Fortuner 2.7V 4x2 AT',   year: 2016, price: 650,  km: 75000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#6366f1' },
  { id: 6,  brand: 'Toyota', model: 'Innova 2.0E',             year: 2017, price: 480,  km: 98000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#6366f1' },

  // ── Honda ────────────────────────────────────────────
  { id: 7,  brand: 'Honda',  model: 'CR-V 2.4 Màu Trắng',     year: 2016, price: 560,  km: 65000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#0ea5e9' },
  { id: 8,  brand: 'Honda',  model: 'Civic 2020 1.5RS',        year: 2020, price: 680,  km: 35000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: 'new',      color: '#0ea5e9' },
  { id: 9,  brand: 'Honda',  model: 'City 2025 L 1.5 AT',      year: 2025, price: 520,  km: 7000,   fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'new',      color: '#0ea5e9' },
  { id: 10, brand: 'Honda',  model: 'CRV-L 2024',              year: 2024, price: 1050, km: 8000,   fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: 'featured', color: '#0ea5e9' },
  { id: 11, brand: 'Honda',  model: 'Civic 2008 Bắc 150.000km', year: 2008, price: 220, km: 150000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#0ea5e9' },

  // ── Mazda ────────────────────────────────────────────
  { id: 12, brand: 'Mazda',  model: 'CX-5 2.0 Premium SX',    year: 2021, price: 750,  km: 30000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'featured', color: '#ef4444' },
  { id: 13, brand: 'Mazda',  model: 'CX5 2.5 2019 Màu Đỏ',    year: 2019, price: 680,  km: 45000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '',         color: '#ef4444' },
  { id: 14, brand: 'Mazda',  model: 'Mazda2 2011 Trắng',       year: 2011, price: 220,  km: 92000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#ef4444' },
  { id: 15, brand: 'Mazda',  model: '3 Sport 2020 1.5L Luxury', year: 2020, price: 560, km: 28000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#ef4444' },
  { id: 16, brand: 'Mazda',  model: '2 2018 1.5 AT Sedan',     year: 2018, price: 360,  km: 60000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#ef4444' },
  { id: 17, brand: 'Mazda',  model: '6 2014 2.0 AT',           year: 2014, price: 420,  km: 85000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#ef4444' },

  // ── Hyundai ──────────────────────────────────────────
  { id: 18, brand: 'Hyundai', model: 'Tucson ĐK T1221 Siêu Mới', year: 2021, price: 750, km: 15000, fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM', badge: 'featured', color: '#10b981' },
  { id: 19, brand: 'Hyundai', model: 'Santa Fe 2016 2.4L 4WD',  year: 2016, price: 620,  km: 98000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#10b981' },
  { id: 20, brand: 'Hyundai', model: 'Grand i10 2025 1.2 MT',   year: 2025, price: 360,  km: 5000,   fuel: 'Xăng', trans: 'Số sàn',  location: 'TP.HCM',  badge: 'new',      color: '#10b981' },
  { id: 21, brand: 'Hyundai', model: 'Avante 2011 1.6L Đen',    year: 2011, price: 270,  km: 95000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '',         color: '#10b981' },
  { id: 22, brand: 'Hyundai', model: 'Stargazer 2022 1.5 AT',   year: 2022, price: 480,  km: 22000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#10b981' },
  { id: 23, brand: 'Hyundai', model: 'SANTAFE Full Dầu T1221',  year: 2021, price: 890,  km: 30000,  fuel: 'Dầu',  trans: 'Tự động', location: 'Hà Nội',  badge: 'featured', color: '#10b981' },

  // ── Kia ──────────────────────────────────────────────
  { id: 24, brand: 'Kia',    model: 'K5',                       year: 2023, price: 750,  km: 8000,   fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#8b5cf6' },
  { id: 25, brand: 'Kia',    model: 'K3 1.6 Premium 2022',      year: 2022, price: 520,  km: 58000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#8b5cf6' },
  { id: 26, brand: 'Kia',    model: 'Sorento 2021 Máy Dầu',     year: 2021, price: 850,  km: 40000,  fuel: 'Dầu',  trans: 'Tự động', location: 'Hà Nội',  badge: 'featured', color: '#8b5cf6' },
  { id: 27, brand: 'Kia',    model: 'Sonet Màu Đỏ',             year: 2022, price: 480,  km: 15000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'new',      color: '#8b5cf6' },
  { id: 28, brand: 'Kia',    model: 'Morning Van 2016 Xanh Nhạt', year: 2016, price: 220, km: 65000, fuel: 'Xăng', trans: 'Số sàn',  location: 'Đà Nẵng', badge: '',         color: '#8b5cf6' },

  // ── Ford ─────────────────────────────────────────────
  { id: 29, brand: 'Ford',   model: 'Ranger 2016 Wildtrak 3.2 4x4', year: 2016, price: 580, km: 120000, fuel: 'Dầu', trans: 'Tự động', location: 'TP.HCM', badge: '',        color: '#3b82f6' },
  { id: 30, brand: 'Ford',   model: 'Territory 2023 Titanium X',  year: 2023, price: 820,  km: 52000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: 'new',      color: '#3b82f6' },
  { id: 31, brand: 'Ford',   model: 'EcoSport 2019 Đỏ Ruby',      year: 2019, price: 420,  km: 45000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#3b82f6' },
  { id: 32, brand: 'Ford',   model: 'Focus 2.0 Titanium 2013',    year: 2013, price: 320,  km: 90000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '',         color: '#3b82f6' },
  { id: 33, brand: 'Ford',   model: 'Escape 2007 Vàng Cát',       year: 2007, price: 180,  km: 120000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#3b82f6' },
  { id: 34, brand: 'Ford',   model: 'Everest Titanium 2.0L 4x2AT', year: 2023, price: 950, km: 18000,  fuel: 'Dầu',  trans: 'Tự động', location: 'TP.HCM',  badge: 'featured', color: '#3b82f6' },

  // ── BMW ──────────────────────────────────────────────
  { id: 35, brand: 'BMW',    model: 'X1 sDrive20i 2017',         year: 2017, price: 780,  km: 65000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#f59e0b' },
  { id: 36, brand: 'BMW',    model: '330i M Sport 2024',         year: 2024, price: 1850, km: 8000,   fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: 'new',      color: '#f59e0b' },
  { id: 37, brand: 'BMW',    model: '328i Model 2015 up M3',     year: 2015, price: 950,  km: 75000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#f59e0b' },
  { id: 38, brand: 'BMW',    model: 'X1 Nhập Mỹ 2019 52000km',  year: 2019, price: 1050, km: 52000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: 'featured', color: '#f59e0b' },
  { id: 39, brand: 'BMW',    model: '320i Sport Line 2022',      year: 2022, price: 1380, km: 28000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#f59e0b' },
  { id: 40, brand: 'BMW',    model: 'X3 xDrive20i CUV 2014',    year: 2014, price: 820,  km: 88000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#f59e0b' },

  // ── Mercedes-Benz ────────────────────────────────────
  { id: 41, brand: 'Benz',   model: 'C300 AMG sx 2015',         year: 2015, price: 980,  km: 70000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: 'featured', color: '#64748b' },
  { id: 42, brand: 'Benz',   model: 'CLA 200 2015 đk 2016',     year: 2015, price: 750,  km: 55000,  fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#64748b' },
  { id: 43, brand: 'Benz',   model: 'C200 2016 đăng ký 2017',   year: 2016, price: 850,  km: 60000,  fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#64748b' },
  { id: 44, brand: 'Benz',   model: 'GL V8 4Matic 2011',        year: 2011, price: 1050, km: 95000,  fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '',         color: '#64748b' },
  { id: 45, brand: 'Benz',   model: 'E280 2005 Đen 160.000km',  year: 2005, price: 380,  km: 160000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội',  badge: '',         color: '#64748b' },
  { id: 46, brand: 'Benz',   model: 'Sprinter 2010',             year: 2010, price: 420,  km: 180000, fuel: 'Dầu',  trans: 'Số sàn',  location: 'TP.HCM',  badge: '',         color: '#64748b' },

  // ── Vinfast ──────────────────────────────────────────
  { id: 47, brand: 'Vinfast', model: 'VF8 Plus 2023',            year: 2023, price: 850,  km: 15000,  fuel: 'Điện', trans: 'Tự động', location: 'Hà Nội',  badge: 'featured', color: '#06b6d4' },
  { id: 48, brand: 'Vinfast', model: 'VF5 2025 Plus 39000km',    year: 2025, price: 420,  km: 39000,  fuel: 'Điện', trans: 'Tự động', location: 'TP.HCM',  badge: '',         color: '#06b6d4' },
  { id: 49, brand: 'Vinfast', model: 'VF6 Plus Full Option 2024', year: 2024, price: 680, km: 12000,  fuel: 'Điện', trans: 'Tự động', location: 'Hà Nội',  badge: 'new',      color: '#06b6d4' },
  { id: 50, brand: 'Vinfast', model: 'VF3 Xám Xi Măng',          year: 2024, price: 320,  km: 8000,   fuel: 'Điện', trans: 'Tự động', location: 'TP.HCM',  badge: 'new',      color: '#06b6d4' },
  { id: 51, brand: 'Vinfast', model: 'Limo Green 2026 0km',      year: 2026, price: 1200, km: 0,      fuel: 'Điện', trans: 'Tự động', location: 'Hà Nội',  badge: 'new',      color: '#06b6d4' },
];

const brandsData = [
  { name: 'Toyota',  icon: '' },
  { name: 'Honda',   icon: '' },
  { name: 'Mazda',   icon: '' },
  { name: 'Hyundai', icon: '' },
  { name: 'Kia',     icon: '' },
  { name: 'Ford',    icon: '' },
  { name: 'BMW',     icon: '' },
  { name: 'Benz',    icon: '' },
  { name: 'Vinfast', icon: '' },
];

// ── Auth (HttpOnly Cookie) ───────────────────────────
async function handleLogout() {
  try {
    await fetch(`${API_BASE}/users/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {}
  window.location.href = '/';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  if (!email || password.length < 6) {
    const errEl = document.getElementById('loginError');
    if (errEl) { errEl.textContent = 'Email hoặc mật khẩu không hợp lệ!'; errEl.style.display = 'block'; }
    return;
  }

  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.detail || 'Đăng nhập thất bại!');
      return;
    }

    showToast(`Chào mừng, ${data.user.ho_ten}!`);
    closeModal('loginModal');
    form.reset();
    setTimeout(() => window.location.reload(), 800);

  } catch (err) {
    showToast('Không thể kết nối server!');
    console.error('Login error:', err);
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('registerSubmitBtn');
  const data = Object.fromEntries(new FormData(form));

  hideFormError('registerError');

  if (data.password !== data.confirmPassword) {
    showFormError('registerError', 'Mật khẩu xác nhận không khớp!');
    return;
  }
  if (data.password.length < 6) {
    showFormError('registerError', 'Mật khẩu phải có ít nhất 6 ký tự!');
    return;
  }
  if (!data.agree) {
    showFormError('registerError', 'Vui lòng đồng ý với điều khoản!');
    return;
  }

  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ho_ten: data.fullName,
        email: data.email,
        so_dien_thoai: data.phone,
        password: data.password
      })
    });

    const result = await res.json();
    if (!res.ok) {
      showFormError('registerError', result.detail || 'Đăng ký thất bại!');
      return;
    }

    showToast(`Chào mừng ${result.user.ho_ten}!`);
    closeModal('registerModal');
    form.reset();
    hideFormError('registerError');
    setTimeout(() => window.location.reload(), 800);

  } catch (err) {
    showFormError('registerError', 'Không thể kết nối server!');
    console.error('Register error:', err);
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ── Sell Form ────────────────────────────────────────
function tryOpenSellModal() {
  const isLoggedIn = document.querySelector('.nav-actions [onclick="handleLogout()"]') !== null;
  if (isLoggedIn) {
    openModal('sellModal');
  } else {
    showToast('Vui lòng đăng nhập để đăng tin bán xe');
    openModal('loginModal');
  }
}

async function handleSellSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const selects = form.querySelectorAll('select');
  const inputs  = form.querySelectorAll('input:not([type="hidden"]), textarea');

  const payload = {
    hang_xe:       selects[0]?.value || '',
    dong_xe:       inputs[0]?.value  || '',
    nam_san_xuat:  parseInt(selects[1]?.value) || 0,
    so_km:         parseInt(inputs[1]?.value)  || 0,
    gia_mong_muon: parseInt(inputs[2]?.value)  || 0,
    khu_vuc:       selects[2]?.value || '',
    mo_ta:         form.querySelector('textarea')?.value || '',
    ho_ten:        inputs[3]?.value  || '',
    so_dien_thoai: inputs[4]?.value  || ''
  };

  try {
    showToast('Đang đăng tin...');
    const res = await fetch(`${API_BASE}/ban-xe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.detail || 'Đăng tin thất bại!');
      return;
    }

    showToast('Đăng tin thành công!');
    closeModal('sellModal');
    form.reset();

  } catch (err) {
    showToast('Không thể kết nối server!');
    console.error('Sell error:', err);
  }
}

// ── Modal Helpers ────────────────────────────────────
function switchModal(fromId, toId) {
  closeModal(fromId);
  setTimeout(() => openModal(toId), 200);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showFormError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function hideFormError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

// ── Scroll Row ───────────────────────────────────────
function scrollRow(rowId, dir) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.scrollBy({ left: dir * 260, behavior: 'smooth' });
}

// ── Newsletter Submit ────────────────────────────────
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  if (!input?.value) return;
  showToast('Đăng ký nhận tin thành công!');
  input.value = '';
}

// ── Render ───────────────────────────────────────────
function renderCars() {
  const grid = document.getElementById('carGrid');
  if (!grid) return;
  grid.innerHTML = carsData.map(car => `
    <div class="car-card">
      <div class="car-image" style="background: linear-gradient(135deg, ${car.color} 0%, ${adjustColor(car.color, -20)} 100%);">
        <svg width="100" height="60" viewBox="0 0 100 60" fill="white" style="opacity: 0.9;">
          <path d="M15 45 L20 30 L35 25 L45 15 L70 15 L80 25 L95 30 L95 45 Z" fill="rgba(255,255,255,0.9)"/>
          <circle cx="28" cy="48" r="8" fill="rgba(255,255,255,0.7)"/>
          <circle cx="28" cy="48" r="4" fill="rgba(0,0,0,0.3)"/>
          <circle cx="78" cy="48" r="8" fill="rgba(255,255,255,0.7)"/>
          <circle cx="78" cy="48" r="4" fill="rgba(0,0,0,0.3)"/>
          <rect x="50" y="22" width="18" height="10" rx="2" fill="rgba(200,230,255,0.8)"/>
        </svg>
        ${car.badge ? `<span class="car-badge ${car.badge === 'featured' ? 'car-badge-featured' : ''}">${car.badge === 'featured' ? 'Nổi bật' : 'Mới'}</span>` : ''}
      </div>
      <div class="car-body">
        <h3 class="car-title">${car.brand} ${car.model}</h3>
        <div class="car-price">${car.price.toLocaleString('vi-VN')} triệu</div>
        <div class="car-specs">
          <span class="car-spec"><span class="icon-calendar"></span> ${car.year}</span>
          <span class="car-spec"><span class="icon-speedometer"></span> ${car.km.toLocaleString('vi-VN')} km</span>
          <span class="car-spec"><span class="icon-fuel"></span> ${car.fuel}</span>
          <span class="car-spec"><span class="icon-gear"></span> ${car.trans}</span>
        </div>
        <div class="car-footer">
          <span class="car-location"><span class="icon-location"></span> ${car.location}</span>
          <button class="btn btn-primary btn-small" onclick="viewCar(${car.id})">Xem chi tiết</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderBrands() {
  const grid = document.getElementById('brandsGrid');
  if (!grid) return;
  grid.innerHTML = brandsData.map(brand => `
    <div class="brand-card" onclick="filterBrand('${brand.name}')">
      <span class="brand-icon">${brand.icon}</span>
      <div class="brand-name">${brand.name}</div>
    </div>
  `).join('');
}

// ── Shared car card HTML builder ─────────────────────
function buildCarCard(car, isDeal = false) {
  const badge = isDeal
    ? `<span class="car-badge car-badge-deal">Ưu<br>đãi</span>`
    : car.badge
      ? `<span class="car-badge ${car.badge === 'featured' ? 'car-badge-featured' : 'car-badge-sale'}">${car.badge === 'featured' ? 'Nổi bật' : 'Mới'}</span>`
      : '';

  const imgContent = car.image_url
    ? `<img src="${car.image_url}" alt="${car.brand} ${car.model}" loading="lazy">`
    : `<svg viewBox="0 0 230 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;">
        <rect width="230" height="160" fill="#d8d8d0"/>
        <line x1="0" y1="0" x2="230" y2="160" stroke="#b0b0a8" stroke-width="1"/>
        <line x1="230" y1="0" x2="0" y2="160" stroke="#b0b0a8" stroke-width="1"/>
      </svg>`;

  return `
    <div class="car-card">
      <div class="car-image">
        ${imgContent}
        ${badge}
      </div>
      <div class="car-body">
        <h3 class="car-title">${car.brand} ${car.model}</h3>
        <div class="car-price">${Number(car.price).toLocaleString('vi-VN')} triệu</div>
        <div class="car-specs">
          <span class="car-spec"><strong>Năm Sản Xuất:</strong>  ${car.year}</span>
          <span class="car-spec"><strong>ODO: </strong> ${Number(car.km).toLocaleString('vi-VN')} km</span>
          <span class="car-spec"><strong>Loại Máy: </strong>Máy ${car.fuel}</span>
          <span class="car-spec"><strong>Hộp Số: </strong>${car.trans}</span>
        </div>
        <div class="car-footer">
          <button class="btn-quote" onclick="viewCar(${car.id})">Nhận báo giá</button>
          <button class="btn-trial" onclick="showToast('Đăng ký lái thử thành công!')">Đăng kí lái thử</button>
        </div>
      </div>
    </div>`;
}

// ── Render scroll rows (featured + deals) ────────────
function renderScrollRow(rowId, cars, isDeal = false) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = cars.map(car => buildCarCard(car, isDeal)).join('');
}

// ── Utilities ────────────────────────────────────────
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Car Detail Modal ──────────────────────────────────
function viewCar(id) {
  const car = allCars.find(c => c.id === id);
  if (!car) return;

  document.getElementById('carDetailTitle').textContent   = `${car.brand} ${car.model}`;
  document.getElementById('carDetailPrice').textContent   = `${Number(car.price).toLocaleString('vi-VN')} triệu`;
  document.getElementById('carDetailYear').textContent    = car.year;
  document.getElementById('carDetailKm').textContent      = `${Number(car.km).toLocaleString('vi-VN')} km`;
  document.getElementById('carDetailFuel').textContent    = car.fuel;
  document.getElementById('carDetailTrans').textContent   = car.trans;
  document.getElementById('carDetailLocation').textContent = car.location;

  const img = document.getElementById('carDetailImage');
  if (img) img.style.background = `linear-gradient(135deg, ${car.color} 0%, ${adjustColor(car.color, -20)} 100%)`;

  openModal('carDetailModal');
}

function filterBrand(brand) {
  const brandSelect = document.getElementById('brandSelect');
  if (brandSelect) brandSelect.value = brand;

  const filtered = allCars.filter(c => c.brand === brand);
  if (filtered.length > 0) {
    renderCarsData(filtered);
    showToast(`Hiển thị ${filtered.length} xe ${brand}`);
  } else {
    loadCarsFromAPI({ hang: brand }).then(cars => {
      renderCarsData(cars);
      showToast(`Hiển thị ${cars.length} xe ${brand}`);
    });
  }
  document.getElementById('carGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleSearch(e) {
  e.preventDefault();
  showToast('Đang tìm kiếm xe phù hợp...');
}

// ── Element SDK ──────────────────────────────────────
async function onConfigChange(config) {
  const siteName = config.site_name || defaultConfig.site_name;
  const parts = siteName.match(/^([A-Za-z]+)([A-Za-z]+)$/) || [siteName, siteName.slice(0, -4), siteName.slice(-4)];
  const logoHTML = `${parts[1]}<span class="logo-accent">${parts[2]}</span>`;

  const siteLogo = document.getElementById('siteLogo');
  const footerBrand = document.getElementById('footerBrand');
  if (siteLogo) siteLogo.innerHTML = logoHTML;
  if (footerBrand) footerBrand.innerHTML = logoHTML;

  const heroTitle    = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const contactPhone = document.getElementById('contactPhone');
  const contactEmail = document.getElementById('contactEmail');
  if (heroTitle)    heroTitle.textContent    = config.hero_title    || defaultConfig.hero_title;
  if (heroSubtitle) heroSubtitle.textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
  if (contactPhone) contactPhone.textContent = config.contact_phone || defaultConfig.contact_phone;
  if (contactEmail) contactEmail.textContent = config.contact_email || defaultConfig.contact_email;

  const root = document.documentElement;
  root.style.setProperty('--bg-primary',       config.bg_primary       || defaultConfig.bg_primary);
  root.style.setProperty('--bg-surface',        config.bg_surface       || defaultConfig.bg_surface);
  root.style.setProperty('--text-primary',      config.text_primary     || defaultConfig.text_primary);
  root.style.setProperty('--accent-primary',    config.accent_primary   || defaultConfig.accent_primary);
  root.style.setProperty('--accent-secondary',  config.accent_secondary || defaultConfig.accent_secondary);
  // Các biến bổ sung — không override bằng config cũ, giữ từ CSS
  root.style.setProperty('--accent-dark',   '#a8893e');
  root.style.setProperty('--price-color',   '#c8722a');

  document.body.style.fontFamily = `${config.font_family || defaultConfig.font_family}, -apple-system, BlinkMacSystemFont, sans-serif`;
  document.body.style.fontSize   = `${config.font_size   || defaultConfig.font_size}px`;
}

function mapToCapabilities(config) {
  return {
    recolorables: [
      { get: () => config.bg_primary       || defaultConfig.bg_primary,       set: (v) => { config.bg_primary       = v; window.elementSdk.setConfig({ bg_primary: v }); } },
      { get: () => config.bg_surface       || defaultConfig.bg_surface,       set: (v) => { config.bg_surface       = v; window.elementSdk.setConfig({ bg_surface: v }); } },
      { get: () => config.text_primary     || defaultConfig.text_primary,     set: (v) => { config.text_primary     = v; window.elementSdk.setConfig({ text_primary: v }); } },
      { get: () => config.accent_primary   || defaultConfig.accent_primary,   set: (v) => { config.accent_primary   = v; window.elementSdk.setConfig({ accent_primary: v }); } },
      { get: () => config.accent_secondary || defaultConfig.accent_secondary, set: (v) => { config.accent_secondary = v; window.elementSdk.setConfig({ accent_secondary: v }); } }
    ],
    borderables: [],
    fontEditable: {
      get: () => config.font_family || defaultConfig.font_family,
      set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); }
    },
    fontSizeable: {
      get: () => config.font_size || defaultConfig.font_size,
      set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); }
    }
  };
}

function mapToEditPanelValues(config) {
  return new Map([
    ['site_name',      config.site_name      || defaultConfig.site_name],
    ['hero_title',     config.hero_title     || defaultConfig.hero_title],
    ['hero_subtitle',  config.hero_subtitle  || defaultConfig.hero_subtitle],
    ['contact_phone',  config.contact_phone  || defaultConfig.contact_phone],
    ['contact_email',  config.contact_email  || defaultConfig.contact_email]
  ]);
}

// ── Mobile Nav Toggle ────────────────────────────────
function initMobileNav() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu    = document.getElementById('navMenu');
  const navActions = document.querySelector('.nav-actions');

  if (!menuToggle || !navMenu) return;

  let mobileActions = document.getElementById('mobileNavActions');
  if (!mobileActions) {
    mobileActions = document.createElement('li');
    mobileActions.id = 'mobileNavActions';
    mobileActions.innerHTML = navActions.innerHTML;
    navMenu.appendChild(mobileActions);
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) closeMenu();
  });

  navMenu.querySelectorAll('a.nav-link').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  function openMenu() {
    mobileActions.innerHTML = navActions.innerHTML;
    mobileActions.querySelectorAll('.btn').forEach(btn => {
      btn.style.width = '100%';
      btn.style.justifyContent = 'center';
    });
    navMenu.classList.add('open');
    menuToggle.textContent = '✕';
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    menuToggle.textContent = '☰';
    menuToggle.setAttribute('aria-expanded', 'false');
  }
}

// ── Car State ────────────────────────────────────────
let allCars = [];

// ── API: Load xe ─────────────────────────────────────
async function loadCarsFromAPI(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.hang)    params.append('hang', filters.hang);
    if (filters.nam)     params.append('nam', filters.nam);
    if (filters.gia_min) params.append('gia_min', filters.gia_min);
    if (filters.gia_max) params.append('gia_max', filters.gia_max);

    const url = `${API_BASE}/cars${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    allCars = data.cars.map(car => ({
      id:        car.id,
      brand:     car.hang      || '',
      model:     car.dong      || '',
      year:      car.nam       || 0,
      price:     car.gia       || 0,
      km:        car.km        || 0,
      fuel:      car.nhien_lieu || 'Xăng',
      trans:     car.hop_so    || 'Tự động',
      location:  car.khu_vuc  || '',
      badge:     car.badge     || '',
      color:     car.color     || '#6366f1',
      image_url: car.anh       || ''
    }));
    return allCars;
  } catch (err) {
    console.warn('Dùng dữ liệu mẫu:', err);
    allCars = carsData;
    return allCars;
  }
}

// ── Render từ API data ────────────────────────────────
function renderCarsData(cars) {
  const grid = document.getElementById('carGrid');
  if (!grid) return;

  if (cars.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888880;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <h3>Không tìm thấy xe phù hợp</h3>
        <button class="btn btn-primary" style="margin-top:16px"
          onclick="loadCarsFromAPI().then(renderCarsData)">Xem tất cả xe</button>
      </div>`;
    return;
  }

  grid.innerHTML = cars.map(car => buildCarCard(car, false)).join('');
}

// ── Override handleSearch ─────────────────────────────
async function handleSearch(e) {
  e.preventDefault();
  const filters = {};
  const brandSelect = document.getElementById('brandSelect');
  const priceSelect = document.getElementById('priceSelect');
  const yearSelect  = document.getElementById('yearSelect');

  if (brandSelect?.value) filters.hang = brandSelect.value;
  if (yearSelect?.value)  filters.nam  = parseInt(yearSelect.value);
  if (priceSelect?.value) {
    const [min, max] = priceSelect.value.split('-').map(Number);
    if (min) filters.gia_min = min;
    if (max) filters.gia_max = max;
  }

  showToast('Đang tìm kiếm...');
  const cars = await loadCarsFromAPI(filters);
  renderCarsData(cars);
  showToast(`Tìm thấy ${cars.length} xe phù hợp`);
  document.getElementById('carGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Tư vấn Form ───────────────────────────────────────
async function handleTuVanSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  if (!data.ho_ten || !data.so_dien_thoai) {
    showToast('Vui lòng điền họ tên và số điện thoại!');
    return;
  }
  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
  try {
    const res = await fetch(`${API_BASE}/tu-van`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) { showToast(result.detail || 'Gửi thất bại!'); return; }
    showToast('Đăng ký tư vấn thành công!');
    form.reset();
  } catch { showToast('Không thể kết nối server!'); }
  finally { if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); } }
}

// ── Liên hệ Form ──────────────────────────────────────
async function handleLienHeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  if (!data.ho_ten || !data.email || !data.noi_dung) {
    showToast('Vui lòng điền đầy đủ thông tin!');
    return;
  }
  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
  try {
    const res = await fetch(`${API_BASE}/lien-he`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) { showToast(result.detail || 'Gửi thất bại!'); return; }
    showToast('Gửi liên hệ thành công!');
    form.reset();
  } catch { showToast('Không thể kết nối server!'); }
  finally { if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); } }
}

// ── Init ─────────────────────────────────────────────
async function init() {
  const cars = await loadCarsFromAPI();

  // Render scroll rows (trang chủ)
  renderScrollRow('featuredRow', cars, false);
  renderScrollRow('dealsRow', cars, true);

  // Set tháng hiện tại cho "Ưu đãi tháng X"
  const dealMonth = document.getElementById('dealMonth');
  if (dealMonth) dealMonth.textContent = new Date().getMonth() + 1;

  // Render grid (mua_xe)
  renderCarsData(cars);
  renderBrands();
  initMobileNav();

  const searchForm = document.getElementById('searchForm');
  if (searchForm) searchForm.addEventListener('submit', handleSearch);

  const tuVanForm = document.getElementById('tuVanForm');
  if (tuVanForm) tuVanForm.addEventListener('submit', handleTuVanSubmit);

  const lienHeForm = document.getElementById('lienHeForm');
  if (lienHeForm) lienHeForm.addEventListener('submit', handleLienHeSubmit);

  if (window.elementSdk) {
    await window.elementSdk.init({ defaultConfig, onConfigChange, mapToCapabilities, mapToEditPanelValues });
  } else {
    onConfigChange(defaultConfig);
  }
}

// ── Register Flow (multi-step) ────────────────────────

// Dữ liệu tạm trong flow đăng ký
let _regData = { ho_ten: '', email: '', phone: '', password: '' };

function switchRegisterTab(tab) {
  const isRegister = tab === 'register';
  document.getElementById('registerSteps').style.display = isRegister ? 'block' : 'none';
  document.getElementById('loginPanel').style.display    = isRegister ? 'none'  : 'block';

  const tabReg = document.getElementById('tabRegister');
  const tabLog = document.getElementById('tabLogin');
  tabReg.style.background = isRegister ? 'var(--accent-primary)' : 'transparent';
  tabReg.style.color       = isRegister ? '#fff'    : '#64748b';
  tabLog.style.background  = isRegister ? 'transparent' : 'var(--accent-primary)';
  tabLog.style.color        = isRegister ? '#64748b' : '#fff';

  // Reset về step 1 nếu chuyển sang tab register
  if (isRegister) regShowStep(1);
}

function regShowStep(step) {
  [1, 2, 3].forEach(s => {
    const el = document.getElementById(`regStep${s}`);
    if (el) el.style.display = s === step ? 'block' : 'none';
  });
  // Clear errors
  ['regStep2Error', 'regStep3Error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function regGoStep2() {
  const email  = document.getElementById('regEmail').value.trim();
  const phone  = document.getElementById('regPhone').value.trim();
  const agreed = document.getElementById('regAgree').checked;

  if (!email || !email.includes('@')) {
    showToast('Vui lòng nhập email hợp lệ!');
    return;
  }
  if (!phone || phone.length < 9) {
    showToast('Vui lòng nhập số điện thoại hợp lệ!');
    return;
  }
  if (!agreed) {
    showToast('Vui lòng đồng ý với điều khoản!');
    return;
  }
  _regData.email = email;
  _regData.phone = phone;
  regShowStep(2);
}

async function regGoStep3() {
  const pw    = document.getElementById('regPassword').value;
  const pw2   = document.getElementById('regConfirmPassword').value;
  const errEl = document.getElementById('regStep2Error');
  if (pw.length < 6) {
    errEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự!';
    errEl.style.display = 'block'; return;
  }
  if (pw !== pw2) {
    errEl.textContent = 'Mật khẩu xác nhận không khớp!';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';
  _regData.password = pw;

  try {
    const res = await fetch(`${API_BASE}/users/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _regData.email })
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.detail || 'Gửi OTP thất bại!';
      errEl.style.display = 'block'; return;
    }
    regShowStep(3);
    initOTPBoxes();
    showToast(`Đã gửi OTP đến ${_regData.email}`);
  } catch {
    errEl.textContent = 'Không thể kết nối server!';
    errEl.style.display = 'block';
  }
}

async function regSubmitOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  const otp = Array.from(boxes).map(b => b.value).join('');
  const errEl = document.getElementById('regStep3Error');

  if (otp.length < 5) {
    errEl.textContent = 'Vui lòng nhập đủ 5 chữ số OTP!';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  // Gọi API đăng ký thật
  try {
    const res = await fetch(`${API_BASE}/users/register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ho_ten:        _regData.ho_ten || 'Người dùng',
        email:         _regData.email,
        so_dien_thoai: _regData.phone,
        password:      _regData.password,
        otp:           otp
      })
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.detail || 'Xác thực OTP thất bại!';
      errEl.style.display = 'block'; return;
    }
    showToast('Đăng ký thành công!');
    closeModal('registerModal');
    _regData = { ho_ten: '', email: '', phone: '', password: '' };
    setTimeout(() => window.location.reload(), 800);

  } catch {
    errEl.textContent = 'Không thể kết nối server!';
    errEl.style.display = 'block';
  }
}

async function regResendOTP(e) {
  e.preventDefault();
  try {
    await fetch(`${API_BASE}/users/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _regData.email })
    });
    showToast(`Đã gửi lại OTP đến ${_regData.email}`);
  } catch {
    showToast('Gửi lại OTP thất bại!');
  }
}

// Reset về step 1 mỗi khi mở modal registerModal
const _origOpenModal = openModal;
window.openModal = function(modalId) {
  _origOpenModal(modalId);
  if (modalId === 'registerModal') {
    switchRegisterTab('register');
  }
};

// ── Login Modal Helpers ───────────────────────────────
function switchLoginPanel(panel) {
  const social = document.getElementById('loginSocialPanel');
  const email  = document.getElementById('loginEmailPanel');
  if (!social || !email) return;
  if (panel === 'social') {
    social.style.display = 'block';
    email.style.display  = 'none';
  } else {
    social.style.display = 'none';
    email.style.display  = 'block';
  }
}

// Reset về social panel mỗi khi mở loginModal
const _origOpenModalLogin = window.openModal;
window.openModal = function(modalId) {
  _origOpenModalLogin(modalId);
  if (modalId === 'loginModal') {
    switchLoginPanel('social');
    const err = document.getElementById('loginError');
    if (err) err.style.display = 'none';
  }
  if (modalId === 'registerModal') {
    switchRegisterTab('register');
  }
};

function handleSocialLogin(provider) {
  const urls = {
    google:   `${API_BASE}/auth/google`,
    facebook: `${API_BASE}/auth/facebook`,
    twitter:  `${API_BASE}/auth/twitter`,
  };
  const url = urls[provider];
  if (url) {
    window.location.href = url;
  } else {
    showToast('Tính năng đang được phát triển!');
  }
}

init();

// ── Cloudflare Challenge ─────────────────────────────
(function () {
  if (document.body) {
    const iframe = document.createElement('iframe');
    iframe.height = 1;
    iframe.width = 1;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    function challenge() {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        const script = doc.createElement('script');
        script.innerHTML = `
          window.__CF$cv$params = {
            r: '9c1ecd6b84f304f9',
            t: 'MTc2OTA4MjI5OC4wMDAwMDA='
          };
          var a = document.createElement('script');
          a.nonce = '';
          a.src = '/cdn-cgi/challenge-platform/scripts/jsd/main.js';
          document.getElementsByTagName('head')[0].appendChild(a);
        `;
        doc.getElementsByTagName('head')[0].appendChild(script);
      }
    }

    if (document.readyState !== 'loading') {
      challenge();
    } else if (window.addEventListener) {
      document.addEventListener('DOMContentLoaded', challenge);
    }
  }
})();