// @ts-nocheck

// ── Toast (local fallback nếu main.js chưa định nghĩa) ──
function showToast(message, type = 'success') {
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toastIcon');
  const msg   = document.getElementById('toastMessage');
  if (!toast || !msg) return;
  if (icon) icon.textContent = type === 'success' ? '✓' : '✕';
  msg.textContent = message;
  toast.style.borderLeft = `4px solid ${type === 'success' ? '#22c55e' : '#ef4444'}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Modal ─────────────────────────────────────────────
function openNewsModal() {
  const modal = document.getElementById('newsModal');
  if (!modal) return;
  modal.classList.add('active');
}

function closeNewsModal() {
  document.getElementById('newsModal').classList.remove('active');
  ['newsTitle', 'newsDesc', 'newsContent', 'newsThumbnail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('newsCategory');
  if (cat) cat.value = 'tin_tuc';
}

// Đóng modal khi click backdrop
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('newsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNewsModal();
    });
  }
});

// ── Submit đăng tin ───────────────────────────────────
async function submitNews() {
  const title     = document.getElementById('newsTitle').value.trim();
  const desc      = document.getElementById('newsDesc').value.trim();
  const content   = document.getElementById('newsContent').value.trim();
  const thumbnail = document.getElementById('newsThumbnail').value.trim();
  const category  = document.getElementById('newsCategory').value;

  if (!title || !desc || !content) {
    showToast('Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung', 'error');
    return;
  }

  const btn = document.getElementById('newsSubmitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const res = await fetch('/api/v1/tin-tuc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        description: desc,
        content,
        thumbnail_url: thumbnail || '',
        category,
        author: 'AutoMart'
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Đăng tin thất bại');
    }

    showToast('Đăng tin thành công!');
    closeNewsModal();
    setTimeout(() => location.reload(), 800);

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ── Xóa tin ──────────────────────────────────────────
async function deleteNews(newsId, event) {
  event.preventDefault();
  event.stopPropagation();

  if (!confirm('Xóa bài viết này?')) return;

  try {
    const res = await fetch(`/api/v1/tin-tuc/${newsId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Xóa thất bại');
    showToast('Đã xóa bài viết');
    setTimeout(() => location.reload(), 600);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Search ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('newsSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    // Ẩn/hiện các item tin tức theo từ khóa
    document.querySelectorAll('#news a[href^="/tin-tuc/"]').forEach(card => {
      const title = card.querySelector('[style*="font-weight:600"], [style*="font-weight:700"]');
      if (!title) return;
      card.style.display = !q || title.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
});

function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isYoutube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

async function submitNews() {
  const title     = document.getElementById('newsTitle').value.trim();
  const desc      = document.getElementById('newsDesc').value.trim();
  const content   = document.getElementById('newsContent').value.trim();
  const thumbnail = document.getElementById('newsThumbnail').value.trim();
  const category  = document.getElementById('newsCategory').value;
  const videoRaw  = document.getElementById('newsVideo')?.value.trim() || '';

  if (!title || !desc || !content) {
    showToast('Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung', 'error');
    return;
  }

  // Nếu là YouTube thì convert sang embed, còn lại giữ nguyên URL gốc
  let video_url = '';
  if (videoRaw) {
    if (isYoutube(videoRaw)) {
      const videoId = extractYoutubeId(videoRaw);
      if (!videoId) {
        showToast('URL YouTube không hợp lệ', 'error');
        return;
      }
      video_url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    } else {
      video_url = videoRaw; // URL gốc — hiện nút xem ngoài
    }
  }

  const btn = document.getElementById('newsSubmitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const res = await fetch('/api/v1/tin-tuc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title, description: desc, content,
        thumbnail_url: thumbnail || '',
        video_url,
        category,
        author: 'AutoMart'
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Đăng tin thất bại');
    }

    showToast('Đăng tin thành công!');
    closeNewsModal();
    setTimeout(() => location.reload(), 800);

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}