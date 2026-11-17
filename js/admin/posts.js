// Admin posts list script
document.addEventListener('DOMContentLoaded', () => {
  renderAdminPosts();

  document.getElementById('authorSelect').addEventListener('change', renderAdminPosts);
  document.getElementById('statusSelect').addEventListener('change', renderAdminPosts);
  document.getElementById('platformSelect').addEventListener('change', renderAdminPosts);
  document.getElementById('searchInput').addEventListener('input', renderAdminPosts);
});

const STATUS_MAP = {
  draft:    { label: 'Bản nháp', class: 'draft' },
  review:   { label: 'Chờ duyệt', class: 'review' },
  edit:     { label: 'Cần chỉnh sửa', class: 'edit' },
  ready:    { label: 'Sẵn sàng đăng', class: 'ready' },
  done:     { label: 'Đã xuất bản', class: 'done' },
  rejected: { label: 'Bị từ chối', class: 'rejected' }
};

function renderAdminPosts() {
  const author = document.getElementById('authorSelect').value;
  const status = document.getElementById('statusSelect').value;
  const platform = document.getElementById('platformSelect').value;
  const search = document.getElementById('searchInput').value.toLowerCase().trim();

  let posts = PostsStore.getPosts();

  // Pending count
  const pending = posts.filter(p => p.status === 'review').length;
  document.getElementById('pendingCountBadge').textContent = pending;

  if (author !== 'all') {
    posts = posts.filter(p => p.author === author);
  }
  if (status !== 'all') {
    posts = posts.filter(p => p.status === status);
  }
  if (platform !== 'all') {
    posts = posts.filter(p => (p.platforms || [p.platform]).some(pl => pl.toLowerCase().includes(platform.toLowerCase())));
  }
  if (search) {
    posts = posts.filter(p => (p.title && p.title.toLowerCase().includes(search)) || (p.caption && p.caption.toLowerCase().includes(search)));
  }

  const tbody = document.getElementById('adminPostsTbody');
  if (!posts.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">Không tìm thấy bài viết phù hợp</td></tr>`;
    return;
  }

  tbody.innerHTML = posts.map(p => {
    const st = STATUS_MAP[p.status] || { label: p.status, class: 'draft' };
    const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80';
    const imgUrl = p.mediaUrl || defaultImg;
    const d = new Date(p.date);
    const dateStr = isNaN(d.getTime()) ? p.date : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.toLocaleDateString('vi-VN')}`;

    return `
      <tr>
        <td>
          <div class="post-media-cell">
            <img src="${imgUrl}" class="post-media-img" onerror="this.src='${defaultImg}'">
            <div class="post-info-text">
              <b>${escapeHtml(p.title)}</b>
              <p>${escapeHtml(p.caption || '')}</p>
            </div>
          </div>
        </td>
        <td><b>${p.author}</b><br><small style="color:var(--muted);">${p.authorRole || 'Marketing'}</small></td>
        <td><span class="platform-pill">${p.platforms ? p.platforms.join(' · ') : p.platform}</span></td>
        <td>${dateStr}</td>
        <td><span class="badge ${st.class}">${st.label}</span></td>
        <td style="text-align: right;">
          ${p.status === 'review' ? `
            <a href="approvals.html" class="btn btn-warning btn-sm">Duyệt bài ngay</a>
          ` : `
            <button class="btn btn-outline btn-sm" onclick="alert('Chi tiết bài: ' + '${escapeHtml(p.title)}')">Xem</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
