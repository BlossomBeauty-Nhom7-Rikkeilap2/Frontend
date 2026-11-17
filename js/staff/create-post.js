// ==========================================================================
// BLOSSOM BEAUTY STORE - STAFF CREATE & SUBMIT LOGIC (FR-08)
// ==========================================================================

const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  spark: '<path d="M12 2c.6 5 2.5 7.4 8 8-5.5.6-7.4 3-8 12-.6-9-2.5-11.4-8-12 5.5-.6 7.4-3 8-8z"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>'
};

function renderIcons(root = document) {
  root.querySelectorAll('i[data-icon]:not([data-done])').forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[el.dataset.icon] || ''}</svg>`;
    el.dataset.done = '1';
  });
}

let editingPostId = null;
let currentMockupTab = 'fb';
let uploadedMediaUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  renderIcons();
  setupMinDate();
  bindEvents();
  checkEditMode();
});

function setupMinDate() {
  const dateInput = document.getElementById('publishDate');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minStr = now.toISOString().slice(0, 16);
  dateInput.min = minStr;

  // Default to tomorrow 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  dateInput.value = tomorrow.toISOString().slice(0, 16);
}

function bindEvents() {
  const titleInput = document.getElementById('postTitle');
  const captionInput = document.getElementById('postCaption');
  const mediaUrlInput = document.getElementById('mediaUrlInput');
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const removeMediaBtn = document.getElementById('removeMediaBtn');

  // Char counts & Mockup sync
  titleInput.addEventListener('input', () => {
    document.getElementById('titleCharCount').textContent = `${titleInput.value.length}/150 ký tự`;
    document.getElementById('titleError').classList.remove('show');
    titleInput.classList.remove('input-error');
    updateMockup();
  });

  captionInput.addEventListener('input', () => {
    document.getElementById('captionCharCount').textContent = `${captionInput.value.length}/2000`;
    document.getElementById('captionError').classList.remove('show');
    captionInput.classList.remove('input-error');
    updateMockup();
  });

  // Platforms checkbox styling
  ['fb', 'ig', 'tiktok'].forEach(pl => {
    const chk = document.getElementById(`chk${capitalize(pl)}`);
    const lbl = document.getElementById(`lbl${capitalize(pl)}`);
    chk.addEventListener('change', () => {
      lbl.classList.toggle('checked', chk.checked);
      document.getElementById('platformError').classList.remove('show');
      updateMockup();
    });
  });

  // Media URL input
  mediaUrlInput.addEventListener('input', () => {
    const url = mediaUrlInput.value.trim();
    if (url) {
      setMediaPreview(url);
    } else {
      clearMedia();
    }
  });

  // Dropzone file upload
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--pink)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--pink-line)';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--pink-line)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  removeMediaBtn.addEventListener('click', clearMedia);

  // Mockup Tabs
  document.querySelectorAll('.preview-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMockupTab = btn.dataset.mockup;
      updateMockup();
    });
  });

  // Save Draft
  document.getElementById('saveDraftBtn').addEventListener('click', handleSaveDraft);

  // Submit Approval
  document.getElementById('submitApprovalBtn').addEventListener('click', handleSubmitApproval);

  // User Dropdown
  const userBtn = document.getElementById('userBtn');
  const menu = document.getElementById('menu');
  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) menu.classList.remove('open');
  });

  // Mobile menu
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.body.classList.toggle('sb-open');
  });
  document.getElementById('overlay').addEventListener('click', () => {
    document.body.classList.remove('sb-open');
  });
}

function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    setMediaPreview(base64);
    document.getElementById('mediaUrlInput').value = '';
  };
  reader.readAsDataURL(file);
}

function setMediaPreview(url) {
  uploadedMediaUrl = url;
  document.getElementById('mediaPreviewImg').src = url;
  document.getElementById('mediaPreviewBox').classList.add('show');
  document.getElementById('mockupImage').src = url;
}

function clearMedia() {
  uploadedMediaUrl = '';
  document.getElementById('mediaPreviewImg').src = '';
  document.getElementById('mediaPreviewBox').classList.remove('show');
  document.getElementById('mediaUrlInput').value = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('mockupImage').src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80';
}

function updateMockup() {
  const caption = document.getElementById('postCaption').value.trim();
  const title = document.getElementById('postTitle').value.trim();
  const mockupCaption = document.getElementById('mockupCaption');
  const mockupPlatform = document.getElementById('mockupPlatformText');
  const mockupFooter = document.getElementById('mockupFooter');

  if (title || caption) {
    mockupCaption.innerHTML = `<b>${escapeHtml(title)}</b><br>${escapeHtml(caption)}`;
  } else {
    mockupCaption.textContent = 'Nội dung bài viết sẽ hiển thị trực quan tại đây khi bạn soạn thảo...';
  }

  if (currentMockupTab === 'fb') {
    mockupPlatform.textContent = 'Facebook · Vừa xong · 🌐';
    mockupFooter.innerHTML = '<span>👍 Thích</span><span>💬 Bình luận</span><span>↗️ Chia sẻ</span>';
  } else if (currentMockupTab === 'ig') {
    mockupPlatform.textContent = 'Instagram · Đã tài trợ';
    mockupFooter.innerHTML = '<span>❤️ 1.2K</span><span>💬 84</span><span>✈️ Chia sẻ</span>';
  } else if (currentMockupTab === 'tiktok') {
    mockupPlatform.textContent = 'TikTok · Video Creator';
    mockupFooter.innerHTML = '<span>❤️ Thả tim</span><span>💬 Đánh giá</span><span>🔥 Duet</span>';
  }
}

window.appendHashtag = function(tag) {
  const captionInput = document.getElementById('postCaption');
  captionInput.value = captionInput.value ? `${captionInput.value} ${tag}` : tag;
  captionInput.dispatchEvent(new Event('input'));
};

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  const post = PostsStore.getPostById(id);
  if (!post) return;

  editingPostId = post.id;
  document.getElementById('formHeading').textContent = `Chỉnh sửa bài viết #${post.id}`;
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postCaption').value = post.caption || '';
  document.getElementById('submitNote').value = post.submitNote || '';

  if (post.date) {
    const d = new Date(post.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('publishDate').value = d.toISOString().slice(0, 16);
  }

  const platforms = Array.isArray(post.platforms) ? post.platforms : (post.platform || '').split('·').map(s => s.trim());
  platforms.forEach(pl => {
    if (pl.toLowerCase().includes('face')) {
      document.getElementById('chkFb').checked = true;
      document.getElementById('lblFb').classList.add('checked');
    }
    if (pl.toLowerCase().includes('insta')) {
      document.getElementById('chkIg').checked = true;
      document.getElementById('lblIg').classList.add('checked');
    }
    if (pl.toLowerCase().includes('tik')) {
      document.getElementById('chkTiktok').checked = true;
      document.getElementById('lblTiktok').classList.add('checked');
    }
  });

  if (post.mediaUrl) {
    setMediaPreview(post.mediaUrl);
    document.getElementById('mediaUrlInput').value = post.mediaUrl;
  }

  if (post.status === 'edit' && post.revisionReason) {
    document.getElementById('revisionAlert').style.display = 'block';
    document.getElementById('revisionReasonText').textContent = post.revisionReason;
  }

  document.getElementById('titleCharCount').textContent = `${(post.title || '').length}/150 ký tự`;
  document.getElementById('captionCharCount').textContent = `${(post.caption || '').length}/2000`;
  updateMockup();
}

function getSelectedPlatforms() {
  const platforms = [];
  if (document.getElementById('chkFb').checked) platforms.push('Facebook');
  if (document.getElementById('chkIg').checked) platforms.push('Instagram');
  if (document.getElementById('chkTiktok').checked) platforms.push('TikTok');
  return platforms;
}

function handleSaveDraft() {
  const title = document.getElementById('postTitle').value.trim();
  if (!title) {
    document.getElementById('titleError').classList.add('show');
    document.getElementById('postTitle').classList.add('input-error');
    showToast('Vui lòng nhập ít nhất tiêu đề bài viết để lưu nháp!', 'error');
    return;
  }

  const platforms = getSelectedPlatforms();
  const caption = document.getElementById('postCaption').value.trim();
  const date = document.getElementById('publishDate').value;
  const submitNote = document.getElementById('submitNote').value.trim();
  const mediaUrl = uploadedMediaUrl || document.getElementById('mediaUrlInput').value.trim();

  const postData = {
    title,
    caption,
    platforms: platforms.length ? platforms : ['Facebook'],
    platform: platforms.length ? platforms.join(' · ') : 'Facebook',
    date,
    submitNote,
    mediaUrl,
    status: 'draft'
  };

  if (editingPostId) {
    PostsStore.updatePost(editingPostId, postData);
  } else {
    PostsStore.addPost(postData);
  }

  showToast('Đã lưu bài viết vào Bản nháp thành công!', 'success');
  setTimeout(() => location.href = 'posts.html', 800);
}

function handleSubmitApproval() {
  let hasError = false;

  const title = document.getElementById('postTitle').value.trim();
  if (!title) {
    document.getElementById('titleError').classList.add('show');
    document.getElementById('postTitle').classList.add('input-error');
    hasError = true;
  }

  const platforms = getSelectedPlatforms();
  if (!platforms.length) {
    document.getElementById('platformError').classList.add('show');
    hasError = true;
  }

  const caption = document.getElementById('postCaption').value.trim();
  if (!caption) {
    document.getElementById('captionError').classList.add('show');
    document.getElementById('postCaption').classList.add('input-error');
    hasError = true;
  }

  const dateVal = document.getElementById('publishDate').value;
  if (!dateVal) {
    document.getElementById('dateError').textContent = '[ERR-03] Vui lòng chọn ngày giờ xuất bản dự kiến!';
    document.getElementById('dateError').classList.add('show');
    hasError = true;
  } else {
    const selectedTime = new Date(dateVal).getTime();
    const nowTime = new Date().getTime();
    if (selectedTime <= nowTime) {
      document.getElementById('dateError').textContent = '[ERR-02] Thời gian dự kiến xuất bản phải lớn hơn thời điểm hiện tại!';
      document.getElementById('dateError').classList.add('show');
      hasError = true;
    }
  }

  if (hasError) {
    showToast('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  const submitNote = document.getElementById('submitNote').value.trim();
  const mediaUrl = uploadedMediaUrl || document.getElementById('mediaUrlInput').value.trim();

  const postData = {
    title,
    caption,
    platforms,
    platform: platforms.join(' · '),
    date: dateVal,
    submitNote,
    mediaUrl,
    status: 'review'
  };

  if (editingPostId) {
    PostsStore.updatePost(editingPostId, postData);
    PostsStore.submitPost(editingPostId, submitNote);
  } else {
    const newPost = PostsStore.addPost(postData);
    PostsStore.submitPost(newPost.id, submitNote);
  }

  showToast('Đã gửi bài viết lên hàng đợi chờ Quản lý phê duyệt (FR-08)!', 'success');
  setTimeout(() => location.href = 'posts.html', 1000);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-icon="${type === 'success' ? 'check' : 'alert'}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  renderIcons(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
