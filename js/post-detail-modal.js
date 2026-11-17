/**
 * Blossom Beauty Store - Post Detail Modal (FR-12 & Task T06A668)
 * Tính năng xem chi tiết bài viết với nút "Sao chép Caption" và "Tải xuống Media"
 */

(function (global) {
  "use strict";

  function ensureModalElement() {
    let modal = document.getElementById('postDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'postDetailModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 820px;">
          <div class="modal-header">
            <h3 id="pdmTitle">Chi tiết bài viết</h3>
            <span class="modal-close-btn" onclick="closePostDetailModal()">&times;</span>
          </div>
          <div class="modal-body" id="pdmBody">
            <!-- Dynamic content -->
          </div>
          <div class="modal-footer" id="pdmFooter">
            <button class="btn btn-outline" onclick="closePostDetailModal()">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closePostDetailModal();
      });
    }
    return modal;
  }

  function openPostDetailModal(postId) {
    if (!global.PostsStore) {
      console.error('PostsStore not loaded');
      return;
    }

    const post = global.PostsStore.getPostById(postId);
    if (!post) {
      alert('Không tìm thấy thông tin bài viết!');
      return;
    }

    const modal = ensureModalElement();
    const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';
    const mediaUrl = post.mediaUrl || defaultImg;

    const statusMap = {
      draft:    { label: 'Bản nháp', class: 'draft' },
      review:   { label: 'Chờ duyệt', class: 'review' },
      edit:     { label: 'Cần chỉnh sửa', class: 'edit' },
      ready:    { label: 'Sẵn sàng đăng', class: 'ready' },
      done:     { label: 'Đã xuất bản', class: 'done' },
      rejected: { label: 'Bị từ chối', class: 'rejected' }
    };
    const st = statusMap[post.status] || { label: post.status, class: 'draft' };

    const platforms = Array.isArray(post.platforms) ? post.platforms : (post.platform || '').split('·').map(s => s.trim());
    const platformPills = platforms.map(pl => {
      let cls = 'fb';
      if (pl.toLowerCase().includes('insta')) cls = 'ig';
      else if (pl.toLowerCase().includes('tik')) cls = 'tiktok';
      return `<span class="platform-pill ${cls}">${escapeHtml(pl)}</span>`;
    }).join(' ');

    const dateStr = formatDateTime(post.date);

    document.getElementById('pdmTitle').textContent = `Chi tiết bài viết #${post.id}`;
    document.getElementById('pdmBody').innerHTML = `
      <div class="post-detail-modal-grid">
        <!-- LEFT: MEDIA & DOWNLOAD MEDIA ACTION -->
        <div class="detail-media-pane">
          <img src="${escapeHtml(mediaUrl)}" alt="media preview" class="detail-media-preview-img" onerror="this.src='${defaultImg}'">
          <div class="detail-media-actions">
            <!-- NÚT TẢI XUỐNG MEDIA (FR-12 CORE) -->
            <button type="button" class="btn-download-media" id="btnDownloadMedia" onclick="downloadPostMedia(${post.id}, '${escapeHtml(mediaUrl)}', '${escapeHtml(post.title)}')">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Tải xuống Media</span>
            </button>
            <small style="color: var(--muted); text-align: center; font-size: 11px;">Hỗ trợ ảnh phân giải cao & video phục vụ xuất bản</small>
          </div>
        </div>

        <!-- RIGHT: POST CONTENT & COPY CAPTION ACTION -->
        <div class="detail-content-pane">
          <div class="detail-header-meta">
            <div style="display: flex; gap: 6px; align-items: center;">
              ${platformPills}
            </div>
            <span class="badge ${st.class}">${st.label}</span>
          </div>

          <h3 style="font-family: 'Playfair Display', serif; font-size: 18px; color: var(--text); line-height: 1.4;">
            ${escapeHtml(post.title)}
          </h3>

          <!-- CAPTION CONTAINER WITH COPY BUTTON (FR-12 CORE) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <small style="font-weight: 600; color: var(--muted); text-transform: uppercase; font-size: 11.5px;">Nội dung bài viết (Caption):</small>
              <!-- NÚT SAO CHÉP CAPTION -->
              <button type="button" class="btn-copy-caption" id="btnCopyCaption" onclick="copyPostCaption(${post.id})">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Sao chép Caption</span>
              </button>
            </div>
            <div class="detail-caption-box" id="postCaptionText">${escapeHtml(post.caption)}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px; background: #fffafc; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--pink-line);">
            <div><span style="color: var(--muted);">Tác giả:</span> <b>${escapeHtml(post.author)}</b></div>
            <div><span style="color: var(--muted);">Lịch xuất bản:</span> <b>${dateStr}</b></div>
          </div>

          ${post.revisionReason ? `
            <div style="background: var(--purple-bg); border-left: 3px solid var(--purple); padding: 10px 14px; border-radius: 6px; font-size: 12.5px; color: var(--purple);">
              <b>Góp ý từ Manager:</b> ${escapeHtml(post.revisionReason)}
            </div>
          ` : ''}

          <!-- AUDIT LOG TIMELINE -->
          <div style="border-top: 1px solid var(--pink-line); padding-top: 12px;">
            <small style="font-weight: 600; color: var(--muted); text-transform: uppercase; font-size: 11.5px; display: block; margin-bottom: 8px;">Lịch sử thao tác (Audit Trail):</small>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; max-height: 120px; overflow-y: auto;">
              ${(post.auditLogs || []).map(log => `
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <div style="width: 7px; height: 7px; border-radius: 50%; background: var(--pink); margin-top: 5px; flex-shrink: 0;"></div>
                  <div>
                    <b>${escapeHtml(log.user)}</b> · <span style="color: var(--pink); font-weight: 600;">${escapeHtml(log.action)}</span> · <small style="color: var(--muted);">${formatDateTime(log.time)}</small>
                    <div style="color: #666;">${escapeHtml(log.note || '')}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function closePostDetailModal() {
    const modal = document.getElementById('postDetailModal');
    if (modal) modal.classList.remove('active');
  }

  // TÍNH NĂNG 1: SAO CHÉP CAPTION VÀO CLIPBOARD (FR-12)
  function copyPostCaption(postId) {
    const post = global.PostsStore.getPostById(postId);
    if (!post || !post.caption) return;

    navigator.clipboard.writeText(post.caption).then(() => {
      const btn = document.getElementById('btnCopyCaption');
      if (btn) {
        btn.classList.add('copied');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>✓ Đã sao chép!</span>
        `;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Sao chép Caption</span>
          `;
        }, 2200);
      }
      showToast('Đã sao chép toàn bộ Caption bài viết vào bộ nhớ tạm!', 'success');
    }).catch(err => {
      console.error('Clipboard copy error:', err);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = post.caption;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Đã sao chép Caption bài viết!', 'success');
    });
  }

  // TÍNH NĂNG 2: TẢI XUỐNG MEDIA VỀ MÁY (FR-12)
  function downloadPostMedia(postId, url, title) {
    showToast('Đang tải xuống tệp media của bài viết...', 'success');

    // Fetch and download as Blob to avoid CORS download restrictions
    fetch(url, { mode: 'cors' })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        const safeTitle = (title || 'post').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
        a.download = `blossom_post_${postId}_${safeTitle}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        showToast('Tải xuống media thành công!', 'success');
      })
      .catch(() => {
        // Fallback open direct
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `blossom_post_${postId}_media.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }

  function formatDateTime(iso) {
    if (!iso) return 'Chưa lên lịch';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `${time} · ${date}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showToast(msg, type = 'success') {
    if (global.UI && global.UI.toast) {
      global.UI.toast(type, type === 'success' ? 'Thành công' : 'Thông báo', msg, 3000);
      return;
    }
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  global.openPostDetailModal = openPostDetailModal;
  global.closePostDetailModal = closePostDetailModal;
  global.copyPostCaption = copyPostCaption;
  global.downloadPostMedia = downloadPostMedia;

})(window);
