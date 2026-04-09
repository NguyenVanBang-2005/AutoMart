// ── News Search & Filter ──────────────────────────────

const newsData = [
  { id: 1,  title: 'Omoda C5 hybrid ra mắt Việt Nam, giá từ 669 triệu đồng',              tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 2,  title: 'Mazda nâng cấp hệ thống treo và lái, CX-5 2026 vận hành mượt mà',    tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 3,  title: 'SUV điện BYD Song Ultra EV gây sốc với công nghệ sạc 9 phút',         tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 4,  title: 'Mitsubishi Xpander HEV 2026 ra mắt: tiết kiệm nhiên liệu',           tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 5,  title: 'SUV cỡ lớn Hyundai Palisade thế hệ mới sắp trình làng khách Việt',   tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 6,  title: 'Quy định ghế trẻ em trên ô tô và mức phạt cha mẹ cần biết',          tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 7,  title: 'Hyundai Stargazer 2026 ra mắt: Giá cao nhất 615 triệu đồng',         tag: 'TIN TỨC MỚI', time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 8,  title: 'Kia K3 2022 - Có nên mua hay không?',                                 tag: 'HỎI ĐÁP',     time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 9,  title: 'Ô tô trung bình mỗi năm đi bao nhiêu kilomet?',                      tag: 'HỎI ĐÁP',     time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
  { id: 10, title: 'Thủ tục đổi từ biển vuông sang biển dài cần những loại giấy tờ gì?', tag: 'HỎI ĐÁP',     time: '22 giờ trước', author: 'Biên tham vấn AutoMart' },
];

// ── Highlight từ khóa ────────────────────────────────
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, `<mark style="background:#fff3cd;border-radius:2px;padding:0 2px;">$1</mark>`);
}

// ── Render kết quả xuống dưới search bar ─────────────
function renderSearchResults(results, keyword) {
  let box = document.getElementById('newsSearchResults');

  // Tạo box nếu chưa có
  if (!box) {
    box = document.createElement('div');
    box.id = 'newsSearchResults';
    box.style.cssText = `
      max-width: 640px;
      margin: 12px auto 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,.1);
      overflow: hidden;
      border: 1px solid #eaeae0;
    `;
    // Chèn ngay sau search bar section
    const searchSection = document.querySelector('section[style*="search"], section:first-of-type');
    searchSection.after(box);
  }

  if (results.length === 0) {
    box.innerHTML = `
      <div style="text-align:center;padding:32px 20px;color:#888;">
        <div style="margin-bottom:10px;display:flex;justify-content:center;">
          <i data-lucide="search-x" style="width:40px;height:40px;color:#ccc;"></i>
        </div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Không tìm thấy kết quả</div>
        <div style="font-size:12px;">Thử tìm với từ khóa khác</div>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  box.innerHTML = `
    <!-- Header kết quả -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f0f0ea;background:#fafaf8;">
      <div style="font-size:13px;color:#888;">
        Tìm thấy <strong style="color:var(--text-primary);">${results.length}</strong> kết quả cho
        "<span style="color:var(--accent-primary);font-weight:600;">${keyword}</span>"
      </div>
      <button onclick="closeNewsSearch()" style="background:none;border:none;cursor:pointer;
        width:24px;height:24px;border-radius:50%;background:#eaeae0;display:flex;
        align-items:center;justify-content:center;font-size:13px;color:#555;">✕</button>
    </div>

    <!-- Danh sách kết quả -->
    <div style="max-height:400px;overflow-y:auto;">
      ${results.map(item => `
        <a href="#" style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f0;
          text-decoration:none;color:inherit;transition:.15s;"
          onmouseover="this.style.background='#fafaf8'"
          onmouseout="this.style.background='transparent'">
          <div style="width:72px;height:52px;border-radius:8px;background:#e8e8e0;flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <span style="font-size:10px;font-weight:700;color:var(--accent-primary);letter-spacing:.5px;">${item.tag}</span>
            <div style="font-size:13px;font-weight:600;line-height:1.4;margin:3px 0 5px;
              display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${highlightKeyword(item.title, keyword)}
            </div>
            <div style="font-size:11px;color:#aaa;">${item.author} • ${item.time}</div>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function closeNewsSearch() {
  const box = document.getElementById('newsSearchResults');
  if (box) box.remove();
  const input = document.querySelector('input[placeholder="Tìm kiếm"]');
  if (input) input.value = '';
}

// ── Xử lý tìm kiếm ───────────────────────────────────
function handleNewsSearch(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) { closeNewsSearch(); return; }

  const results = newsData.filter(item =>
    item.title.toLowerCase().includes(kw) ||
    item.tag.toLowerCase().includes(kw)
  );

  renderSearchResults(results, keyword.trim());
}

// ── Thêm button tìm kiếm vào search bar ──────────────
function initNewsSearch() {
  const input = document.querySelector('input[placeholder="Tìm kiếm"]');
  if (!input) return;

  // Thêm button vào search bar
  const searchBar = input.closest('div[style*="border-radius:24px"], div[style*="border-radius: 24px"]');
  if (searchBar) {
    const btn = document.createElement('button');
    btn.innerHTML = '<i data-lucide="search" style="width:16px;height:16px;color:#fff;"></i>';
    btn.style.cssText = `
      background: var(--accent-primary);
      border: none;
      border-radius: 18px;
      padding: 6px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      font-family: inherit;
      flex-shrink: 0;
      white-space: nowrap;
    `;
    btn.innerHTML += '<span>Tìm kiếm</span>';
    btn.onclick = () => handleNewsSearch(input.value);
    searchBar.appendChild(btn);
    if (window.lucide) lucide.createIcons();
  }

  // Enter để tìm
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleNewsSearch(input.value);
    if (e.key === 'Escape') closeNewsSearch();
  });

  // Real-time debounce
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const kw = input.value.trim();
    if (kw.length >= 2) {
      debounceTimer = setTimeout(() => handleNewsSearch(kw), 300);
    } else if (kw.length === 0) {
      closeNewsSearch();
    }
  });

  // Click ngoài để đóng
  document.addEventListener('click', (e) => {
    const box = document.getElementById('newsSearchResults');
    const searchSection = document.querySelector('section[style*="search"], section:first-of-type');
    if (box && !box.contains(e.target) && !searchSection?.contains(e.target)) {
      closeNewsSearch();
    }
  });
}

initNewsSearch();