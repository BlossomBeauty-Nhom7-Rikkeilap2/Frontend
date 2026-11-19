// ==========================================================================
// BLOSSOM BEAUTY STORE - STAFF POSTS LOGIC
// ==========================================================================

const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M12 20h9M16 4l4 4L8 20H4v-4z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l3 3"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  spark: '<path d="M12 2c.6 5 2.5 7.4 8 8-5.5.6-7.4 3-8 12-.6-9-2.5-11.4-8-12 5.5-.6 7.4-3 8-8z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'
};

function renderIcons(root = document) {
  root.querySelectorAll('i[data-icon]:not([data-done])').forEach(el => {
    el.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[el.dataset.icon] || ''}</svg>`;
    el.dataset.done = '1';
  });
}

const STATUS_MAP = {
  draft:    { label: 'Bản nháp', class: 'draft' },
  review:   { label: 'Chờ duyệt', class: 'review' },
  edit:     { label: 'Cần chỉnh sửa', class: 'edit' },
  ready:    { label: 'Sẵn sàng đăng', class: 'ready' },
  done:     { label: 'Đã xuất bản', class: 'done' },
  rejected: { label: 'Bị từ chối', class: 'rejected' }
};

let currentFilter = 'all';
let currentPlatform = 'all';
let currentSearch = '';
let currentView = 'table';
let deletingPostId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadData();
});

function initUI() {
  // Tabs
  document.querySelectorAll('#statusTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#statusTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      renderPosts();
    });
  });

  // Stat Chips
  document.querySelectorAll('#statsRow .stat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const tab = document.querySelector(`#statusTabs .tab-btn[data-status="${filter}"]`);
      if (tab) tab.click();
    });
  });

  // Platform Filter
  document.getElementById('platformSelect').addEventListener('change', (e) => {
    currentPlatform = e.target.value;
    renderPosts();
  });

  // Search Input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderPosts();
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // View Mode Toggles
  const viewTableBtn = document.getElementById('viewTableBtn');
  const viewGridBtn = document.getElementById('viewGridBtn');

  viewTableBtn.addEventListener('click', () => {
    currentView = 'table';
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    renderPosts();
  });

  viewGridBtn.addEventListener('click', () => {
    currentView = 'grid';
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderPosts();
  });

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

  // Mobile Menu
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.body.classList.toggle('sb-open');
  });
  document.getElementById('overlay').addEventListener('click', () => {
    document.body.classList.remove('sb-open');
  });

  // Logout
  document.getElementById('logout').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) location.href = '../auth/login.html';
  });

  // Delete modal confirm
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deletingPostId) {
      PostsStore.deletePost(deletingPostId);
      closeDeleteModal();
      showToast('Đã xóa bài viết thành công!', 'success');
      loadData();
    }
  });

  window.addEventListener('blossom_posts_updated', () => {
    loadData();
  });
}

function loadData() {
  updateStats();
  renderPosts();
}

function updateStats() {
  const posts = PostsStore.getPosts();
  document.getElementById('statTotal').textContent = posts.length;
  document.getElementById('statReview').textContent = posts.filter(p => p.status === 'review').length;
  document.getElementById('statEdit').textContent = posts.filter(p => p.status === 'edit').length;
  document.getElementById('statReady').textContent = posts.filter(p => p.status === 'ready').length;
  document.getElementById('statDone').textContent = posts.filter(p => p.status === 'done').length;
}

function getFilteredPosts() {
  let posts = PostsStore.getPosts();

  // Filter status
  if (currentFilter !== 'all') {
    posts = posts.filter(p => p.status === currentFilter);
  }

  // Filter platform
  if (currentPlatform !== 'all') {
    posts = posts.filter(p => {
      const plats = Array.isArray(p.platforms) ? p.platforms : (p.platform || '').split('·').map(s => s.trim());
      return plats.some(pl => pl.toLowerCase() === currentPlatform.toLowerCase());
    });
  }

  // Filter search
  if (currentSearch) {
    posts = posts.filter(p =>
      (p.title && p.title.toLowerCase().includes(currentSearch)) ||
      (p.caption && p.caption.toLowerCase().includes(currentSearch)) ||
      (p.author && p.author.toLowerCase().includes(currentSearch))
    );
  }

  return posts;
}

function renderPosts() {
  const container = document.getElementById('postsContainer');
  const posts = getFilteredPosts();

  if (!posts.length) {
    container.innerHTML = `
      <div class="table-card empty-state">
        <i data-icon="doc"></i>
        <h4>Không tìm thấy bài viết nào</h4>
        <p>Thử thay đổi bộ lọc hoặc tạo một bài viết mới để bắt đầu.</p>
        <a href="create-post.html" class="btn btn-primary"><i data-icon="plus"></i> Tạo bài viết mới</a>
      </div>
    `;
    renderIcons(container);
    return;
  }

  if (currentView === 'table') {
    renderTableView(container, posts);
  } else {
    renderGridView(container, posts);
  }

  renderIcons(container);
}

function formatPlatformBadges(platformsStr) {
  if (!platformsStr) return '';
  const list = Array.isArray(platformsStr) ? platformsStr : platformsStr.split('·').map(s => s.trim());
  return list.map(pl => {
    let cls = 'fb';
    if (pl.toLowerCase().includes('insta')) cls = 'ig';
    else if (pl.toLowerCase().includes('tik')) cls = 'tiktok';
    return `<span class="platform-pill ${cls}">${escapeHtml(pl)}</span>`;
  }).join(' ');
}

function formatDateTime(iso) {
  if (!iso) return 'Chưa lên lịch';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${time} · ${date}`;
}

function renderTableView(container, posts) {
  const html = `
    <div class="table-card">
      <table class="posts-table">
        <thead>
          <tr>
            <th>Bài viết & Tiêu đề</th>
            <th>Nền tảng</th>
            <th>Lịch xuất bản</th>
            <th>Trạng thái</th>
            <th style="text-align: right;">Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${posts.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, class: 'draft' };
            const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80';
            const imgUrl = p.mediaUrl || defaultImg;
            return `
              <tr>
                <td>
                  <div class="post-media-cell">
                    <img src="${escapeHtml(imgUrl)}" alt="thumbnail" class="post-media-img" onerror="this.src='${defaultImg}'">
                    <div class="post-info-text">
                      <b>${escapeHtml(p.title)}</b>
                      <p>${escapeHtml(p.caption || '')}</p>
                    </div>
                  </div>
                </td>
                <td>${formatPlatformBadges(p.platforms || p.platform)}</td>
                <td>
                  <div style="font-size: 13px; font-weight: 500;">${formatDateTime(p.date)}</div>
                  <small style="color: var(--muted);">${p.author}</small>
                </td>
                <td>
                  <span class="badge ${st.class}">${st.label}</span>
                  ${p.status === 'edit' && p.revisionReason ? `<div style="font-size: 11px; color: var(--purple); margin-top: 3px; max-width: 140px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(p.revisionReason)}">💬 Sếp yêu cầu sửa</div>` : ''}
                </td>
                <td>
                  <div class="table-actions" style="justify-content: flex-end;">
                    <button class="action-icon-btn" title="Xem chi tiết" onclick="viewPostDetail(${p.id})">
                      <i data-icon="eye"></i>
                    </button>
                    ${(p.status === 'draft' || p.status === 'edit') ? `
                      <button class="action-icon-btn" title="Chỉnh sửa bài" onclick="location.href='create-post.html?id=${p.id}'">
                        <i data-icon="edit"></i>
                      </button>
                      <button class="action-icon-btn" title="Gửi duyệt nhanh" onclick="quickSubmit(${p.id})">
                        <i data-icon="send"></i>
                      </button>
                    ` : ''}
                    ${p.status === 'review' ? `
                      <button class="action-icon-btn" title="Thu hồi bài viết (về Bản nháp)" onclick="withdrawPost(${p.id})">
                        <i data-icon="undo"></i>
                      </button>
                    ` : ''}
                    <button class="action-icon-btn delete" title="Xóa bài viết" onclick="openDeleteModal(${p.id}, '${escapeHtml(p.title.replace(/'/g, ''))}')">
                      <i data-icon="trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function renderGridView(container, posts) {
  const html = `
    <div class="posts-grid">
      ${posts.map(p => {
        const st = STATUS_MAP[p.status] || { label: p.status, class: 'draft' };
        const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80';
        const imgUrl = p.mediaUrl || defaultImg;
        return `
          <div class="post-card">
            <div class="card-img-wrap">
              <img src="${escapeHtml(imgUrl)}" alt="cover" onerror="this.src='${defaultImg}'">
              <span class="badge ${st.class} card-status-badge">${st.label}</span>
            </div>
            <div class="card-body">
              <div class="card-platforms">
                ${formatPlatformBadges(p.platforms || p.platform)}
              </div>
              <h4 class="card-title">${escapeHtml(p.title)}</h4>
              <p class="card-caption">${escapeHtml(p.caption || '')}</p>
              ${p.status === 'edit' && p.revisionReason ? `
                <div style="background: var(--purple-bg); border-left: 3px solid var(--purple); padding: 6px 10px; border-radius: 4px; font-size: 12px; color: var(--purple); margin-bottom: 12px;">
                  <b>Góp ý sửa:</b> ${escapeHtml(p.revisionReason)}
                </div>
              ` : ''}
              <div class="card-footer">
                <span><i data-icon="clock" style="vertical-align: middle;"></i> ${formatDateTime(p.date)}</span>
                <div class="table-actions">
                  <button class="action-icon-btn" title="Xem chi tiết" onclick="viewPostDetail(${p.id})"><i data-icon="eye"></i></button>
                  ${(p.status === 'draft' || p.status === 'edit') ? `
                    <button class="action-icon-btn" title="Sửa bài" onclick="location.href='create-post.html?id=${p.id}'"><i data-icon="edit"></i></button>
                  ` : ''}
                  ${p.status === 'review' ? `
                    <button class="action-icon-btn" title="Thu hồi bài" onclick="withdrawPost(${p.id})"><i data-icon="undo"></i></button>
                  ` : ''}
                  <button class="action-icon-btn delete" title="Xóa" onclick="openDeleteModal(${p.id}, '${escapeHtml(p.title.replace(/'/g, ''))}')"><i data-icon="trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  container.innerHTML = html;
}

// Actions
window.viewPostDetail = function(id) {
  if (window.openPostDetailModal) {
    window.openPostDetailModal(id);
    return;
  }
  const p = PostsStore.getPostById(id);
  if (!p) return;
  const st = STATUS_MAP[p.status] || { label: p.status, class: 'draft' };

  document.getElementById('modalPostTitle').textContent = p.title;
  document.getElementById('modalPostContent').innerHTML = `
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      ${p.mediaUrl ? `
        <div style="flex: 1; min-width: 220px; max-width: 280px;">
          <img src="${escapeHtml(p.mediaUrl)}" style="width: 100%; border-radius: 8px; border: 1px solid var(--pink-line); object-fit: cover; max-height: 280px;" alt="preview">
        </div>
      ` : ''}
      <div style="flex: 2; min-width: 240px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>${formatPlatformBadges(p.platforms || p.platform)}</div>
          <span class="badge ${st.class}">${st.label}</span>
        </div>
        <div>
          <small style="color: var(--muted); display: block; font-size: 11.5px; text-transform: uppercase;">Nội dung bài viết (Caption):</small>
          <div style="background: var(--pink-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--pink-line); font-size: 13.5px; white-space: pre-line; line-height: 1.5; max-height: 160px; overflow-y: auto;">${escapeHtml(p.caption)}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12.5px;">
          <div><span style="color: var(--muted);">Tác giả:</span> <b>${p.author}</b></div>
          <div><span style="color: var(--muted);">Thời gian đăng:</span> <b>${formatDateTime(p.date)}</b></div>
        </div>
        ${p.submitNote ? `
          <div style="background: #fff8f0; border-left: 3px solid var(--orange); padding: 8px 12px; border-radius: 4px; font-size: 12.5px;">
            <b>Ghi chú gửi duyệt:</b> ${escapeHtml(p.submitNote)}
          </div>
        ` : ''}
        ${p.revisionReason ? `
          <div style="background: var(--purple-bg); border-left: 3px solid var(--purple); padding: 8px 12px; border-radius: 4px; font-size: 12.5px; color: var(--purple);">
            <b>Góp ý chỉnh sửa từ Sếp:</b> ${escapeHtml(p.revisionReason)}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- TIMELINE AUDIT LOGS -->
    <div style="margin-top: 20px; border-top: 1px solid var(--pink-line); padding-top: 16px;">
      <h4 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px; color: var(--text);">Lịch sử xử lý bài viết (Audit Log)</h4>
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12.5px;">
        ${(p.auditLogs || []).map(log => `
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--pink); margin-top: 5px; flex-shrink: 0;"></div>
            <div style="flex: 1;">
              <div><b>${escapeHtml(log.user)}</b> · <span style="color: var(--pink); font-weight: 600;">${escapeHtml(log.action)}</span> · <small style="color: var(--muted);">${formatDateTime(log.time)}</small></div>
              <div style="color: #666; margin-top: 2px;">${escapeHtml(log.note || '')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  let footerBtns = `<button class="btn btn-outline" onclick="closeDetailModal()">Đóng</button>`;
  if (p.status === 'draft' || p.status === 'edit') {
    footerBtns += `
      <a href="create-post.html?id=${p.id}" class="btn btn-secondary"><i data-icon="edit"></i> Chỉnh sửa</a>
      <button class="btn btn-primary" onclick="quickSubmit(${p.id}); closeDetailModal();"><i data-icon="send"></i> Gửi duyệt</button>
    `;
  } else if (p.status === 'review') {
    footerBtns += `
      <button class="btn btn-warning" onclick="withdrawPost(${p.id}); closeDetailModal();"><i data-icon="undo"></i> Thu hồi bài về Nháp</button>
    `;
  }
  document.getElementById('modalPostFooter').innerHTML = footerBtns;
  renderIcons(document.getElementById('detailModal'));
  document.getElementById('detailModal').classList.add('active');
};

window.closeDetailModal = function() {
  document.getElementById('detailModal').classList.remove('active');
};

window.quickSubmit = function(id) {
  const note = prompt('Nhập ghi chú gửi duyệt cho Sếp (tùy chọn):', 'Kính gửi Sếp duyệt bài viết ạ.');
  if (note !== null) {
    PostsStore.submitPost(id, note);
    showToast('Đã gửi bài viết lên hàng đợi chờ duyệt!', 'success');
    loadData();
  }
};

window.withdrawPost = function(id) {
  if (confirm('Bạn có chắc muốn THU HỒI bài viết này về lại Bản nháp để chỉnh sửa? Sếp sẽ tạm thời không nhìn thấy bài này cho đến khi bạn gửi duyệt lại.')) {
    try {
      PostsStore.withdrawPost(id);
      showToast('Thu hồi bài viết thành công! Đã chuyển về Bản nháp.', 'success');
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }
};

window.openDeleteModal = function(id, title) {
  deletingPostId = id;
  document.getElementById('deletePostTitle').textContent = title;
  document.getElementById('deleteModal').classList.add('active');
};

window.closeDeleteModal = function() {
  deletingPostId = null;
  document.getElementById('deleteModal').classList.remove('active');
};

// Utilities
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
window.showToast = showToast;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
