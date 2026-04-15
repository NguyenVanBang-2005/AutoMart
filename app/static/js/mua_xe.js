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

// ==================== MODAL & UPLOAD ẢNH ====================
function showAddCarModal() {
  console.log("🔥 Mở modal thêm xe");
  document.getElementById('addCarModal').style.display = 'flex';
  document.getElementById('imagePreview').innerHTML = ''; // xóa preview cũ
}

function closeAddCarModal() {
  document.getElementById('addCarModal').style.display = 'none';
}

// Preview ảnh
function setupImagePreview() {
  const input = document.getElementById('carImages');
  const preview = document.getElementById('imagePreview');

  if (!input) return;

  input.addEventListener('change', function() {
    preview.innerHTML = '';
    const files = this.files;

    if (files.length > 3) {
      alert("Chỉ được chọn tối đa 3 ảnh!");
      this.value = '';
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #ddd;';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

// Xử lý submit form + upload ảnh
async function handleAddCar(e) {
  e.preventDefault();

  const formData = new FormData();

  // Thông tin xe
  formData.append('hang', document.getElementById('carHang').value.trim());
  formData.append('dong', document.getElementById('carDong').value.trim());
  formData.append('nam', document.getElementById('carNam').value);
  formData.append('gia', document.getElementById('carGia').value);
  formData.append('km', document.getElementById('carKm').value || 0);
  formData.append('loai', document.getElementById('carLoai').value);

  // Ảnh xe
  const imageInput = document.getElementById('carImages');
  if (imageInput && imageInput.files.length > 0) {
    for (let file of imageInput.files) {
      formData.append('images', file);   // tên phải là 'images' để khớp backend
    }
  }

  try {
    console.log("Đang gửi dữ liệu lên /cars ...");

    const res = await fetch('/cars', {        // ← SỬA Ở ĐÂY: /cars thay vì /api/cars
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (res.ok) {
      alert('✅ Thêm xe thành công! ID: ' + result.car_id);
      closeAddCarModal();
      document.getElementById('addCarForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      loadCars();                    // reload danh sách xe
    } else {
      alert(result.detail || 'Thêm xe thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi kết nối server');
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