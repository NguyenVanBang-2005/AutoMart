    // Default Config
    const defaultConfig = {
      site_name: 'AutoMart',
      hero_title: 'Tìm chiếc xe mơ ước của bạn',
      hero_subtitle: 'Hàng nghìn xe đã qua sử dụng chất lượng cao, giá tốt nhất thị trường. Cam kết xe chính chủ, đảm bảo pháp lý 100%.',
      contact_phone: '1900 1234',
      contact_email: 'contact@automart.vn',
      bg_primary: '#0f172a',
      bg_surface: '#ffffff',
      text_primary: '#1e293b',
      accent_primary: '#f97316',
      accent_secondary: '#fb923c',
      font_family: 'Inter',
      font_size: 16
    };

    // Car Data
    const carsData = [
      { id: 1, brand: 'Toyota', model: 'Camry 2.5Q', year: 2022, price: 985, km: 25000, fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM', badge: 'featured', color: '#6366f1' },
      { id: 2, brand: 'Honda', model: 'Civic RS', year: 2023, price: 789, km: 12000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội', badge: 'new', color: '#0ea5e9' },
      { id: 3, brand: 'Mazda', model: 'CX-5 Premium', year: 2022, price: 825, km: 35000, fuel: 'Xăng', trans: 'Tự động', location: 'Đà Nẵng', badge: '', color: '#ef4444' },
      { id: 4, brand: 'Hyundai', model: 'Tucson 2.0', year: 2023, price: 845, km: 18000, fuel: 'Xăng', trans: 'Tự động', location: 'TP.HCM', badge: 'featured', color: '#10b981' },
      { id: 5, brand: 'Kia', model: 'Seltos 1.4 Turbo', year: 2022, price: 625, km: 28000, fuel: 'Xăng', trans: 'Tự động', location: 'Hà Nội', badge: '', color: '#8b5cf6' },
      { id: 6, brand: 'Ford', model: 'Ranger Wildtrak', year: 2023, price: 920, km: 15000, fuel: 'Dầu', trans: 'Tự động', location: 'TP.HCM', badge: 'new', color: '#3b82f6' }
    ];

    const brandsData = [
      { name: 'Toyota', icon: '🚗' },
      { name: 'Honda', icon: '🏎️' },
      { name: 'Mazda', icon: '🚙' },
      { name: 'Hyundai', icon: '🚐' },
      { name: 'Kia', icon: '🚕' },
      { name: 'Ford', icon: '🛻' },
      { name: 'Mercedes', icon: '🚘' },
      { name: 'BMW', icon: '🏁' }
    ];

// Login/Sign Up Modal
// Trạng thái đăng nhập (giả lập - sau này lấy từ localStorage hoặc cookie từ backend)
let isLoggedIn = false;          // mặc định chưa đăng nhập
let currentUser = null;          // { fullName, email, ... } nếu cần

function loginUser(userData) {
  isLoggedIn = true;
  currentUser = userData;
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('user', JSON.stringify(userData));
  updateUIAfterLogin();
}

function logoutUser() {
  isLoggedIn = false;
  currentUser = null;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  updateUIAfterLogin();
}

function checkLoggedIn() {
  const stored = localStorage.getItem('isLoggedIn');
  if (stored === 'true') {
    isLoggedIn = true;
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    updateUIAfterLogin();
  }
}

function updateUIAfterLogin() {
  const loginBtn = document.querySelector('.nav-actions button[onclick*="loginModal"]');
  const registerBtn = document.querySelector('.nav-actions button[onclick*="registerModal"]');
  const sellBtns = document.querySelectorAll('button[onclick*="sellModal"], .btn.btn-primary.btn-small');

  if (isLoggedIn) {
    // Ẩn Đăng nhập / Đăng ký, hiện tên user + Đăng xuất
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';

    // Thay nút "Đăng nhập" bằng tên user hoặc "Tài khoản"
    const userDisplay = document.createElement('span');
    userDisplay.innerHTML = `Xin chào, ${currentUser.fullName || currentUser.email || 'User'}`;
    userDisplay.style.fontWeight = '600';
    userDisplay.style.color = 'var(--primary)';
    userDisplay.style.marginRight = '1rem';

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-secondary btn-small';
    logoutBtn.innerHTML = '<span class="icon-logout"></span> Đăng xuất';
    logoutBtn.onclick = () => {
      logoutUser();
      showToast('Đã đăng xuất thành công');
    };

    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = '';
      navActions.appendChild(userDisplay);
      navActions.appendChild(logoutBtn);
      // Giữ nút + Đăng tin
      const sellBtn = document.createElement('button');
      sellBtn.className = 'btn btn-primary btn-small';
      sellBtn.innerHTML = '+ Đăng tin';
      sellBtn.onclick = () => tryOpenSellModal('sellModal');
      navActions.appendChild(sellBtn);
    }
  } else {
    // Hiện lại Đăng nhập / Đăng ký
    location.reload(); // đơn giản nhất để reset UI (hoặc viết chi tiết hơn)
  }
}



    // Render Functions
    function renderCars() {
      const grid = document.getElementById('carGrid');
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
            ${car.badge ? `<span class="car-badge ${car.badge === 'featured' ? 'car-badge-featured' : ''}">${car.badge === 'featured' ? '⭐ Nổi bật' : '🆕 Mới'}</span>` : ''}
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
      grid.innerHTML = brandsData.map(brand => `
        <div class="brand-card" onclick="filterBrand('${brand.name}')">
          <span class="brand-icon">${brand.icon}</span>
          <div class="brand-name">${brand.name}</div>
        </div>
      `).join('');
    }

    // Utility Functions
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

  function tryOpenSellModal() {
  if (isLoggedIn) {
    openModal('sellModal');
  } else {
    showToast('Vui lòng đăng nhập để đăng tin bán xe');
    openModal('loginModal');
  }
}

    function openModal(modalId) {
      document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function viewCar(id) {
      const car = carsData.find(c => c.id === id);
      if (car) showToast(`Đang xem ${car.brand} ${car.model}`);
    }

    function filterBrand(brand) {
      document.getElementById('brandSelect').value = brand;
      showToast(`Đang lọc xe ${brand}`);
    }

    // Event Handlers
    function handleSearch(e) {
      e.preventDefault();
      showToast('Đang tìm kiếm xe phù hợp...');
    }

    function handleSellSubmit(e) {
      e.preventDefault();
      showToast('Thông tin đã được gửi thành công!');
      closeModal('sellModal');
      e.target.reset();
    }

function handleLoginSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  // Giả lập kiểm tra (sau này gọi API /api/login)
  if (email && password.length >= 6) {
    // Giả lập user data từ server
    const fakeUser = {
      fullName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email: email,
      // token: "jwt-token-fake-abc123"  // sau này lưu token
    };
    loginUser(fakeUser);
    showToast('Đăng nhập thành công!');
    closeModal('loginModal');
    form.reset();
  } else {
    showToast('Email hoặc mật khẩu không đúng!');
  }
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  if (data.password !== data.confirmPassword) {
    showToast('Mật khẩu xác nhận không khớp!');
    return;
  }
  if (data.password.length < 6) {
    showToast('Mật khẩu phải ≥ 6 ký tự!');
    return;
  }
  if (!data.agree) {
    showToast('Vui lòng đồng ý điều khoản');
    return;
  }

  // Giả lập đăng ký thành công → tự động đăng nhập luôn
  const fakeUser = {
    fullName: data['fullName'] || 'Người dùng mới',
    email: data.email,
  };

  loginUser(fakeUser);
  showToast('Đăng ký & đăng nhập thành công!');
  closeModal('registerModal');
  form.reset();
}

    // Element SDK Integration
    async function onConfigChange(config) {
      const siteName = config.site_name || defaultConfig.site_name;
      const parts = siteName.match(/^([A-Za-z]+)([A-Za-z]+)$/) || [siteName, siteName.slice(0, -4), siteName.slice(-4)];
      const logoHTML = `${parts[1]}<span class="logo-accent">${parts[2]}</span>`;

      document.getElementById('siteLogo').innerHTML = logoHTML;
      document.getElementById('footerBrand').innerHTML = logoHTML;
      document.getElementById('heroTitle').textContent = config.hero_title || defaultConfig.hero_title;
      document.getElementById('heroSubtitle').textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
      document.getElementById('contactPhone').textContent = config.contact_phone || defaultConfig.contact_phone;
      document.getElementById('contactEmail').textContent = config.contact_email || defaultConfig.contact_email;

      const root = document.documentElement;
      root.style.setProperty('--bg-primary', config.bg_primary || defaultConfig.bg_primary);
      root.style.setProperty('--bg-surface', config.bg_surface || defaultConfig.bg_surface);
      root.style.setProperty('--text-primary', config.text_primary || defaultConfig.text_primary);
      root.style.setProperty('--accent-primary', config.accent_primary || defaultConfig.accent_primary);
      root.style.setProperty('--accent-secondary', config.accent_secondary || defaultConfig.accent_secondary);

      const fontFamily = config.font_family || defaultConfig.font_family;
      const fontSize = config.font_size || defaultConfig.font_size;
      document.body.style.fontFamily = `${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
      document.body.style.fontSize = `${fontSize}px`;
    }

    function mapToCapabilities(config) {
      return {
        recolorables: [
          { get: () => config.bg_primary || defaultConfig.bg_primary, set: (v) => { config.bg_primary = v; window.elementSdk.setConfig({ bg_primary: v }); } },
          { get: () => config.bg_surface || defaultConfig.bg_surface, set: (v) => { config.bg_surface = v; window.elementSdk.setConfig({ bg_surface: v }); } },
          { get: () => config.text_primary || defaultConfig.text_primary, set: (v) => { config.text_primary = v; window.elementSdk.setConfig({ text_primary: v }); } },
          { get: () => config.accent_primary || defaultConfig.accent_primary, set: (v) => { config.accent_primary = v; window.elementSdk.setConfig({ accent_primary: v }); } },
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
        ['site_name', config.site_name || defaultConfig.site_name],
        ['hero_title', config.hero_title || defaultConfig.hero_title],
        ['hero_subtitle', config.hero_subtitle || defaultConfig.hero_subtitle],
        ['contact_phone', config.contact_phone || defaultConfig.contact_phone],
        ['contact_email', config.contact_email || defaultConfig.contact_email]
      ]);
    }

    // Initialize
    async function init() {
      renderCars();
      renderBrands();

      if (window.elementSdk) {
        await window.elementSdk.init({
          defaultConfig,
          onConfigChange,
          mapToCapabilities,
          mapToEditPanelValues
        });
      } else {
        onConfigChange(defaultConfig);
      }
    }

    init();

(function () {
  function challenge() {
    // Lấy document từ iframe ẩn
    const doc = a.contentDocument || a.contentWindow.document;

    if (doc) {
      // Tạo script element
      const script = doc.createElement('script');

      // Nội dung script sẽ inject vào iframe
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

      // Chèn script vào <head> của iframe
      doc.getElementsByTagName('head')[0].appendChild(script);
    }
  }

  // Chỉ chạy khi body đã tồn tại
  if (document.body) {
    // Tạo iframe ẩn 1x1 để chạy challenge mà không ảnh hưởng giao diện
    const iframe = document.createElement('iframe');
    iframe.height = 1;
    iframe.width = 1;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    // Gọi challenge ngay nếu document đã ready
    // hoặc chờ sự kiện phù hợp
    if (document.readyState !== 'loading') {
      challenge();
    } else if (window.addEventListener) {
      document.addEventListener('DOMContentLoaded', challenge);
    } else {
      // fallback cho trình duyệt cũ
      const oldOnReadyStateChange = document.onreadystatechange || function () {};
      document.onreadystatechange = function (evt) {
        oldOnReadyStateChange(evt);
        if (document.readyState !== 'loading') {
          document.onreadystatechange = oldOnReadyStateChange;
          challenge();
          checkLoggedIn();   // Kiểm tra trạng thái đăng nhập từ localStorage
        }
      };
    }
  }
})();