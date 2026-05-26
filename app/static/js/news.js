// @ts-nocheck

// ── Toast ─────────────────────────────────────────────
function showToast(message, type) {
  type = type || 'success';
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }
  var toast = document.getElementById('toast');
  var icon  = document.getElementById('toastIcon');
  var msg   = document.getElementById('toastMessage');
  if (!toast || !msg) return;
  if (icon) icon.textContent = type === 'success' ? '✓' : '✕';
  msg.textContent = message;
  toast.style.borderLeft = '4px solid ' + (type === 'success' ? '#22c55e' : '#ef4444');
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ── Modal Đăng tin ────────────────────────────────────
function openNewsModal() {
  var modal = document.getElementById('newsModal');
  if (!modal) return;
  modal.classList.add('active');
}

function closeNewsModal() {
  document.getElementById('newsModal').classList.remove('active');
  ['newsTitle', 'newsDesc', 'newsContent', 'newsThumbnail', 'newsVideo'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var cat = document.getElementById('newsCategory');
  if (cat) cat.value = 'tin_tuc';
}

// ── Modal Chỉnh sửa ──────────────────────────────────
function openEditModal() {
  var modal = document.getElementById('newsEditModal');
  if (!modal) return;
  modal.classList.add('active');
  lucide.createIcons();
}

function closeEditModal() {
  var modal = document.getElementById('newsEditModal');
  if (modal) modal.classList.remove('active');
}

// Fetch data rồi mở modal edit
function openEditNewsModal(newsId, event) {
  event.preventDefault();
  event.stopPropagation();

  fetch('/api/v1/tin-tuc/' + newsId, { credentials: 'include' })
    .then(function(res) {
      if (!res.ok) throw new Error('Không tải được bài viết');
      return res.json();
    })
    .then(function(news) {
      document.getElementById('editNewsId').value = news.id;
      document.getElementById('editNewsTitle').value = news.title;
      document.getElementById('editNewsDesc').value = news.description;
      document.getElementById('editNewsContent').value = news.content;
      document.getElementById('editNewsThumbnail').value = news.thumbnail_url || '';
      document.getElementById('editNewsCategory').value = news.category;

      // Nếu video_url là embed YouTube, convert ngược lại thành URL gốc
      var videoVal = news.video_url || '';
      var embedMatch = videoVal.match(/youtube\.com\/embed\/([^?]+)/);
      if (embedMatch) {
        videoVal = 'https://www.youtube.com/watch?v=' + embedMatch[1];
      }
      document.getElementById('editNewsVideo').value = videoVal;

      openEditModal();
    })
    .catch(function(err) {
      showToast(err.message, 'error');
    });
}

// Submit chỉnh sửa
function submitEditNews() {
  var newsId    = document.getElementById('editNewsId').value;
  var title     = document.getElementById('editNewsTitle').value.trim();
  var desc      = document.getElementById('editNewsDesc').value.trim();
  var content   = document.getElementById('editNewsContent').value.trim();
  var thumbnail = document.getElementById('editNewsThumbnail').value.trim();
  var category  = document.getElementById('editNewsCategory').value;
  var videoRaw  = document.getElementById('editNewsVideo').value.trim();

  if (!title || !desc || !content) {
    showToast('Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung', 'error');
    return;
  }

  // Xử lý video URL
  var video_url = '';
  if (videoRaw) {
    if (isYoutube(videoRaw)) {
      var videoId = extractYoutubeId(videoRaw);
      if (!videoId) {
        showToast('URL YouTube không hợp lệ', 'error');
        return;
      }
      video_url = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1';
    } else {
      video_url = videoRaw;
    }
  }

  var btn = document.getElementById('editNewsSubmitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  fetch('/api/v1/tin-tuc/' + newsId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: title,
      description: desc,
      content: content,
      thumbnail_url: thumbnail || '',
      video_url: video_url,
      category: category
    })
  })
  .then(function(res) {
    if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail || 'Cập nhật thất bại'); });
    return res.json();
  })
  .then(function() {
    showToast('Cập nhật thành công!');
    closeEditModal();
    setTimeout(function() { location.reload(); }, 800);
  })
  .catch(function(err) {
    showToast(err.message, 'error');
  })
  .finally(function() {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  });
}

// Đóng modal khi click backdrop
document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById('newsModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeNewsModal();
    });
  }
  var editModal = document.getElementById('newsEditModal');
  if (editModal) {
    editModal.addEventListener('click', function(e) {
      if (e.target === editModal) closeEditModal();
    });
  }
});

// ── YouTube helpers ───────────────────────────────────
function extractYoutubeId(url) {
  if (!url) return null;
  var patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = url.match(patterns[i]);
    if (match) return match[1];
  }
  return null;
}

function isYoutube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

// ── Submit đăng tin ───────────────────────────────────
function submitNews() {
  var title     = document.getElementById('newsTitle').value.trim();
  var desc      = document.getElementById('newsDesc').value.trim();
  var content   = document.getElementById('newsContent').value.trim();
  var thumbnail = document.getElementById('newsThumbnail').value.trim();
  var category  = document.getElementById('newsCategory').value;
  var videoRaw  = document.getElementById('newsVideo') ? document.getElementById('newsVideo').value.trim() : '';

  if (!title || !desc || !content) {
    showToast('Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung', 'error');
    return;
  }

  var video_url = '';
  if (videoRaw) {
    if (isYoutube(videoRaw)) {
      var videoId = extractYoutubeId(videoRaw);
      if (!videoId) {
        showToast('URL YouTube không hợp lệ', 'error');
        return;
      }
      video_url = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1';
    } else {
      video_url = videoRaw;
    }
  }

  var btn = document.getElementById('newsSubmitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  fetch('/api/v1/tin-tuc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: title,
      description: desc,
      content: content,
      thumbnail_url: thumbnail || '',
      video_url: video_url,
      category: category,
      author: 'AutoMart'
    })
  })
  .then(function(res) {
    if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail || 'Đăng tin thất bại'); });
    return res.json();
  })
  .then(function() {
    showToast('Đăng tin thành công!');
    closeNewsModal();
    setTimeout(function() { location.reload(); }, 800);
  })
  .catch(function(err) {
    showToast(err.message, 'error');
  })
  .finally(function() {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  });
}

// ── Xóa tin ──────────────────────────────────────────
function deleteNews(newsId, event) {
  event.preventDefault();
  event.stopPropagation();

  if (!confirm('Xóa bài viết này?')) return;

  fetch('/api/v1/tin-tuc/' + newsId, {
    method: 'DELETE',
    credentials: 'include'
  })
  .then(function(res) {
    if (!res.ok) throw new Error('Xóa thất bại');
    showToast('Đã xóa bài viết');
    setTimeout(function() { location.reload(); }, 600);
  })
  .catch(function(err) {
    showToast(err.message, 'error');
  });
}

// ── Search ────────────────────────────────────────────
function clearNewsSearch() {
  var input = document.getElementById('newsSearchInput');
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input'));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('newsSearchInput');
  if (!input) return;

  input.addEventListener('input', function() {
    var q = input.value.toLowerCase().trim();
    document.querySelectorAll('.nf-card, .ni-card').forEach(function(card) {
      var titleEl = card.querySelector('.nf-title, .ni-title');
      if (!titleEl) return;
      card.style.display = !q || titleEl.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  });
});