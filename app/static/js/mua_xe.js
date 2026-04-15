// mua_xe.js - Chức năng lọc và tìm kiếm xe

let allCars = [];

// Load dữ liệu xe từ API
async function loadCars() {
  try {
    const res = await fetch('/api/car_listings');
    if (res.ok) {
      allCars = await res.json();
      renderCars(allCars);
    } else {
      console.error("Lỗi khi lấy dữ liệu xe");
    }
  } catch (e) {
    console.error("Lỗi kết nối API:", e);
  }
}

// Render danh sách xe
function renderCars(cars) {
  const grid = document.getElementById('carGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (cars.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:#888; font-size:15px;">Không tìm thấy xe phù hợp với tiêu chí lọc.</p>`;
    return;
  }

  cars.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';
    card.innerHTML = `
      <div class="car-image" style="background-image: url('${car.image || '/static/images/placeholder-car.jpg'}')"></div>
      <div class="car-body">
        <h3 class="car-title">${car.hang} ${car.dong}</h3>
        <p class="car-price">${Number(car.gia).toLocaleString('vi-VN')} triệu</p>
        <div class="car-specs">
          <span>${car.nam}</span>
          <span>${Number(car.km || 0).toLocaleString('vi-VN')} km</span>
          <span>${car.nhien_lieu || 'Xăng'}</span>
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:12px;" onclick="viewCar(${car.id})">
          Xem chi tiết
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Xử lý form lọc
function handleSearch(e) {
  e.preventDefault();

  const brand = document.getElementById('brandSelect').value;
  const priceRange = document.getElementById('priceSelect').value;
  const year = document.getElementById('yearSelect').value;
  const type = document.getElementById('typeSelect').value;

  let filtered = allCars;

  if (brand) filtered = filtered.filter(car => car.hang === brand);

  if (year) {
    if (year === 'before2018') {
      filtered = filtered.filter(car => parseInt(car.nam) < 2018);
    } else {
      filtered = filtered.filter(car => parseInt(car.nam) == year);
    }
  }

  if (type) filtered = filtered.filter(car => car.loai === type);

  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    filtered = filtered.filter(car => {
      const price = parseInt(car.gia);
      if (max) return price >= min && price <= max;
      return price >= min;
    });
  }

  renderCars(filtered);
}

// Xem chi tiết xe
function viewCar(id) {
  window.location.href = `/xe/${id}`;
}

// Load thêm xe (nếu cần)
function loadMoreCars() {
  // Tạm thời alert, sau này có thể implement phân trang
  alert("Đang tải thêm xe... (Chức năng này sẽ được phát triển sau)");
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
  loadCars();
});

// mua_xe.js

let allCars = [];

async function loadCars() {
  try {
    const res = await fetch('/api/cars');
    if (res.ok) {
      const data = await res.json();
      allCars = data.cars || data;
      renderCars(allCars);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderCars(cars) {
  const grid = document.getElementById('carGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (cars.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Không tìm thấy xe phù hợp.</p>';
    return;
  }

  cars.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';
    card.innerHTML = `
      <div class="car-image" style="background-image:url('${car.anh || '/static/images/placeholder-car.jpg'}')"></div>
      <div class="car-body">
        <h3 class="car-title">${car.hang} ${car.dong}</h3>
        <p class="car-price">${Number(car.gia).toLocaleString('vi-VN')} triệu</p>
        <div class="car-specs">
          <span>${car.nam}</span>
          <span>${Number(car.km).toLocaleString('vi-VN')} km</span>
          <span>${car.loai}</span>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:12px;" onclick="viewCar(${car.id})">Xem chi tiết</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function viewCar(id) {
  window.location.href = `/xe/${id}`;
}

// Modal Thêm xe
function showAddCarModal() {
  document.getElementById('addCarModal').style.display = 'flex';
}

function closeAddCarModal() {
  document.getElementById('addCarModal').style.display = 'none';
}

async function handleAddCar(e) {
  e.preventDefault();

  const payload = {
    hang: document.getElementById('carHang').value.trim(),
    dong: document.getElementById('carDong').value.trim(),
    nam: parseInt(document.getElementById('carNam').value),
    gia: parseInt(document.getElementById('carGia').value),
    km: parseInt(document.getElementById('carKm').value) || 0,
    loai: document.getElementById('carLoai').value
  };

  try {
    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      alert('Thêm xe thành công!');
      closeAddCarModal();
      document.getElementById('addCarForm').reset();
      loadCars(); // reload danh sách
    } else {
      alert(result.detail || 'Thêm xe thất bại');
    }
  } catch (err) {
    alert('Lỗi kết nối server');
  }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', loadCars);