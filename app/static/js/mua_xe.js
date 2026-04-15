// mua_xe.js - Phiên bản ổn định nhất

console.log("✅ mua_xe.js loaded successfully");

// ==================== LOAD & RENDER ====================
async function loadCars() {
  try {
    const res = await fetch('/api/cars');
    if (res.ok) {
      const data = await res.json();
      allCars = Array.isArray(data) ? data : (data.cars || []);
      renderCars(allCars);
    }
  } catch (e) {
    console.error("Lỗi load xe:", e);
  }
}

function renderCars(cars) {
  const grid = document.getElementById('carGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!cars || cars.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888;">Không tìm thấy xe phù hợp.</p>';
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
          <span>${Number(car.km || 0).toLocaleString('vi-VN')} km</span>
          <span>${car.loai}</span>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:12px;" onclick="viewCar(${car.id})">Xem chi tiết</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function handleSearch(e) {
  e.preventDefault();
  const brand = document.getElementById('brandSelect').value;
  const priceRange = document.getElementById('priceSelect').value;
  const year = document.getElementById('yearSelect').value;
  const type = document.getElementById('typeSelect').value;

  let filtered = allCars;

  if (brand) filtered = filtered.filter(car => car.hang === brand);
  if (year) {
    if (year === 'before2018') filtered = filtered.filter(car => parseInt(car.nam) < 2018);
    else filtered = filtered.filter(car => parseInt(car.nam) == year);
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

function viewCar(id) {
  window.location.href = `/xe/${id}`;
}

function loadMoreCars() {
  alert("Chức năng xem thêm xe sẽ được phát triển sau.");
}

// ==================== MODAL ====================
function showAddCarModal() {
  console.log("🔥 showAddCarModal được gọi");
  const modal = document.getElementById('addCarModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddCarModal() {
  const modal = document.getElementById('addCarModal');
  if (modal) modal.style.display = 'none';
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

    if (res.ok) {
      alert('Thêm xe thành công!');
      closeAddCarModal();
      document.getElementById('addCarForm').reset();
      loadCars();
    } else {
      const err = await res.json();
      alert(err.detail || 'Thêm xe thất bại');
    }
  } catch (err) {
    alert('Lỗi kết nối server');
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ mua_xe.js loaded successfully");

  // Gắn sự kiện cho nút Thêm xe
  const addBtn = document.getElementById('btnAddCar');
  if (addBtn) {
    addBtn.addEventListener('click', showAddCarModal);
    console.log("✅ Đã gắn sự kiện click cho nút Thêm xe");
  } else {
    console.warn("⚠️ Không tìm thấy nút #btnAddCar");
  }

  loadCars();
});