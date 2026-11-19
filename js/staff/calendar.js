// ==========================================================================
// BLOSSOM BEAUTY STORE - CONTENT CALENDAR LOGIC (FR-11)
// ==========================================================================

const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
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

// Current calendar viewing month (Year: 2026, Month: 10 is November in 0-indexed)
let viewingYear = 2026;
let viewingMonth = 10; // 0-indexed: 10 = November
let currentPlatformFilter = 'all';
let currentViewMode = 'month'; // 'month' | 'list'

let editingSchedulePostId = null;
let currentConflictData = null;

document.addEventListener('DOMContentLoaded', () => {
  renderIcons();
  bindCalendarEvents();
  renderCalendar();
});

function bindCalendarEvents() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    viewingMonth--;
    if (viewingMonth < 0) { viewingMonth = 11; viewingYear--; }
    renderCalendar();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    viewingMonth++;
    if (viewingMonth > 11) { viewingMonth = 0; viewingYear++; }
    renderCalendar();
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    const now = new Date();
    viewingYear = now.getFullYear();
    viewingMonth = now.getMonth();
    renderCalendar();
  });

  document.getElementById('platformFilter').addEventListener('change', (e) => {
    currentPlatformFilter = e.target.value;
    renderCalendar();
  });

  // View switchers
  const viewMonthBtn = document.getElementById('viewMonthBtn');
  const viewListBtn = document.getElementById('viewListBtn');

  viewMonthBtn.addEventListener('click', () => {
    currentViewMode = 'month';
    viewMonthBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    document.getElementById('calendarCard').style.display = 'block';
    document.getElementById('calendarListView').style.display = 'none';
    renderCalendar();
  });

  viewListBtn.addEventListener('click', () => {
    currentViewMode = 'list';
    viewListBtn.classList.add('active');
    viewMonthBtn.classList.remove('active');
    document.getElementById('calendarCard').style.display = 'none';
    document.getElementById('calendarListView').style.display = 'block';
    renderListView();
  });

  // Dynamic conflict check on datetime input change
  const datetimeInput = document.getElementById('scheduleDatetimeInput');
  datetimeInput.addEventListener('input', runConflictCheck);

  // Auto fix conflict button
  document.getElementById('autoFixConflictBtn').addEventListener('click', () => {
    if (currentConflictData && currentConflictData.suggestedTime) {
      datetimeInput.value = currentConflictData.suggestedTime;
      runConflictCheck();
      showToast('Đã dời thời gian sang khung giờ an toàn cách 31 phút!', 'success');
    }
  });

  // Save Schedule button
  document.getElementById('saveScheduleBtn').addEventListener('click', handleSaveSchedule);

  // Schedule post dropdown change
  document.getElementById('schedulePostSelect').addEventListener('change', onPostSelectChanged);

  // User Dropdown & Mobile Menu
  const userBtn = document.getElementById('userBtn');
  if (userBtn) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('menu');
      if (menu) menu.classList.toggle('open');
    });
  }
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => document.body.classList.toggle('sb-open'));
  }
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', () => document.body.classList.remove('sb-open'));
  }

  window.addEventListener('blossom_posts_updated', () => {
    renderCalendar();
    if (currentViewMode === 'list') renderListView();
  });
}

function renderCalendar() {
  document.getElementById('currentMonthHeading').textContent = `Tháng ${viewingMonth + 1} / ${viewingYear}`;

  const grid = document.getElementById('calendarDaysGrid');
  grid.innerHTML = '';

  const firstDayOfMonth = new Date(viewingYear, viewingMonth, 1);
  const lastDayOfMonth = new Date(viewingYear, viewingMonth + 1, 0);

  // Monday = 0, Sunday = 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(viewingYear, viewingMonth, 0).getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const allPosts = PostsStore.getPosts().filter(p => p.date && p.status !== 'rejected');

  // Days before month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const cell = createDayCell(dayNum, true);
    grid.appendChild(cell);
  }

  // Days of current month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${viewingYear}-${String(viewingMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    const cell = createDayCell(day, false, isToday, dateStr);

    // Posts for this day
    let dayPosts = allPosts.filter(p => p.date.startsWith(dateStr));

    if (currentPlatformFilter !== 'all') {
      dayPosts = dayPosts.filter(p => {
        const plats = Array.isArray(p.platforms) ? p.platforms : (p.platform || '').split('·').map(s => s.trim());
        return plats.some(pl => pl.toLowerCase() === currentPlatformFilter.toLowerCase());
      });
    }

    if (dayPosts.length) {
      const eventsList = document.createElement('div');
      eventsList.className = 'day-events-list';

      dayPosts.forEach(post => {
        const pill = document.createElement('div');
        let cls = 'fb';
        const pStr = (post.platform || '').toLowerCase();
        if (pStr.includes('insta')) cls = 'ig';
        else if (pStr.includes('tik')) cls = 'tiktok';

        pill.className = `calendar-event-pill ${cls}`;

        const d = new Date(post.date);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        pill.innerHTML = `<span><b>${timeStr}</b> ${escapeHtml(post.title)}</span>`;
        pill.title = `${timeStr} [${post.platform}] - ${post.title}`;
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          openRescheduleModal(post.id);
        });

        eventsList.appendChild(pill);
      });

      cell.appendChild(eventsList);
    }

    cell.addEventListener('click', () => {
      openNewScheduleModal(dateStr);
    });

    grid.appendChild(cell);
  }

  // Remaining days to fill 35 or 42 grid cells
  const currentTotalCells = startDayOfWeek + totalDays;
  const remainingCells = (currentTotalCells <= 35 ? 35 : 42) - currentTotalCells;
  for (let i = 1; i <= remainingCells; i++) {
    const cell = createDayCell(i, true);
    grid.appendChild(cell);
  }
}

function createDayCell(dayNumber, isOtherMonth, isToday = false, dateStr = '') {
  const cell = document.createElement('div');
  cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
  if (dateStr) cell.dataset.date = dateStr;

  const header = document.createElement('div');
  header.className = 'day-header';
  header.innerHTML = `<span class="day-number">${dayNumber}</span>`;

  cell.appendChild(header);
  return cell;
}

function renderListView() {
  const container = document.getElementById('calendarListContent');
  const posts = PostsStore.getPosts().filter(p => p.date && p.status !== 'rejected')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!posts.length) {
    container.innerHTML = `<p style="text-align: center; color: var(--muted); padding: 30px;">Chưa có bài viết nào được lên lịch.</p>`;
    return;
  }

  // Group by date
  const groups = {};
  posts.forEach(p => {
    const dStr = p.date.slice(0, 10);
    if (!groups[dStr]) groups[dStr] = [];
    groups[dStr].push(p);
  });

  container.innerHTML = Object.keys(groups).map(dStr => {
    const d = new Date(dStr);
    const dateFormatted = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayPosts = groups[dStr];

    return `
      <div class="list-day-group">
        <div class="list-day-title">📅 ${dateFormatted} (${dayPosts.length} bài)</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${dayPosts.map(p => {
            const pTime = new Date(p.date);
            const timeStr = `${String(pTime.getHours()).padStart(2, '0')}:${String(pTime.getMinutes()).padStart(2, '0')}`;
            return `
              <div style="background: #fff; border: 1px solid var(--pink-line); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div>
                  <b style="color: var(--pink); margin-right: 8px;">${timeStr}</b>
                  <b style="color: var(--text);">${escapeHtml(p.title)}</b>
                  <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">Kênh: ${escapeHtml(p.platform)} · Tác giả: ${escapeHtml(p.author)}</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="openRescheduleModal(${p.id})">Đổi giờ</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Modal functions
window.openNewScheduleModal = function(preferredDate = '') {
  editingSchedulePostId = null;
  document.getElementById('scheduleModalTitle').textContent = 'Lên lịch xuất bản bài viết';
  document.getElementById('postSelectGroup').style.display = 'block';

  // Fill posts select with posts not rejected
  const posts = PostsStore.getPosts().filter(p => p.status !== 'rejected');
  const select = document.getElementById('schedulePostSelect');
  select.innerHTML = posts.map(p => `<option value="${p.id}">#${p.id} - ${escapeHtml(p.title)} (${p.platform})</option>`).join('');

  onPostSelectChanged();

  // Set datetime
  let targetTime = preferredDate ? `${preferredDate}T10:00` : new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  document.getElementById('scheduleDatetimeInput').value = targetTime;

  runConflictCheck();
  document.getElementById('scheduleModal').classList.add('active');
};

window.openRescheduleModal = function(postId) {
  const p = PostsStore.getPostById(postId);
  if (!p) return;

  editingSchedulePostId = p.id;
  document.getElementById('scheduleModalTitle').textContent = `Đổi giờ xuất bản bài viết #${p.id}`;
  document.getElementById('postSelectGroup').style.display = 'none';

  document.getElementById('schPostTitle').textContent = p.title;
  document.getElementById('schPostMeta').textContent = `Kênh xuất bản: ${p.platform} · Tác giả: ${p.author} · Trạng thái: ${p.status}`;

  if (p.date) {
    const d = new Date(p.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('scheduleDatetimeInput').value = d.toISOString().slice(0, 16);
  }

  runConflictCheck();
  document.getElementById('scheduleModal').classList.add('active');
};

window.closeScheduleModal = function() {
  document.getElementById('scheduleModal').classList.remove('active');
  document.getElementById('conflictAlertBox').style.display = 'none';
  currentConflictData = null;
};

function onPostSelectChanged() {
  const select = document.getElementById('schedulePostSelect');
  const id = select.value;
  const p = PostsStore.getPostById(id);
  if (p) {
    document.getElementById('schPostTitle').textContent = p.title;
    document.getElementById('schPostMeta').textContent = `Kênh xuất bản: ${p.platform} · Tác giả: ${p.author}`;
    runConflictCheck();
  }
}

// CONFLICT CHECK CORE (FR-11)
function runConflictCheck() {
  const datetimeVal = document.getElementById('scheduleDatetimeInput').value;
  const conflictBox = document.getElementById('conflictAlertBox');
  const conflictText = document.getElementById('conflictAlertText');
  const dateError = document.getElementById('schDateError');

  dateError.classList.remove('show');
  conflictBox.style.display = 'none';
  currentConflictData = null;

  if (!datetimeVal) return;

  // 1. Validate past time (ERR-02)
  const targetTs = new Date(datetimeVal).getTime();
  const nowTs = Date.now();
  if (targetTs <= nowTs) {
    dateError.textContent = '[ERR-02] Không được chọn thời gian trong quá khứ!';
    dateError.classList.add('show');
    return;
  }

  // Determine current post platform
  let activePost = null;
  if (editingSchedulePostId) {
    activePost = PostsStore.getPostById(editingSchedulePostId);
  } else {
    const select = document.getElementById('schedulePostSelect');
    if (select && select.value) activePost = PostsStore.getPostById(select.value);
  }

  if (!activePost) return;

  // 2. Check conflict < 30 minutes on same platform (ERR-03)
  const conflict = PostsStore.checkConflict(activePost.platforms || activePost.platform, datetimeVal, activePost.id);

  if (conflict) {
    currentConflictData = conflict;
    const cPost = conflict.conflictingPost;
    const cTime = new Date(cPost.date);
    const timeFormatted = `${String(cTime.getHours()).padStart(2, '0')}:${String(cTime.getMinutes()).padStart(2, '0')}`;

    conflictText.innerHTML = `
      Có bài viết <b>"${escapeHtml(cPost.title)}"</b> cũng được lên lịch trên nền tảng <b>${escapeHtml(cPost.platform)}</b> lúc <b>${timeFormatted}</b> (cách thời gian bạn chọn <b>${conflict.diffMinutes} phút</b>).<br>
      Việc đăng 2 bài cách nhau dưới 30 phút sẽ làm giảm lượng tiếp cận tự nhiên của thuật toán!
    `;
    conflictBox.style.display = 'flex';
  }
}

function handleSaveSchedule() {
  const datetimeVal = document.getElementById('scheduleDatetimeInput').value;
  if (!datetimeVal) {
    document.getElementById('schDateError').textContent = 'Vui lòng chọn ngày giờ xuất bản!';
    document.getElementById('schDateError').classList.add('show');
    return;
  }

  const targetTs = new Date(datetimeVal).getTime();
  if (targetTs <= Date.now()) {
    document.getElementById('schDateError').textContent = '[ERR-02] Không được chọn thời gian trong quá khứ!';
    document.getElementById('schDateError').classList.add('show');
    return;
  }

  let targetId = editingSchedulePostId;
  if (!targetId) {
    targetId = document.getElementById('schedulePostSelect').value;
  }

  const post = PostsStore.getPostById(targetId);
  if (!post) return;

  const remind30 = document.getElementById('remind30').checked;
  const remind10 = document.getElementById('remind10').checked;

  const updatedLogs = [
    ...(post.auditLogs || []),
    {
      time: new Date().toISOString(),
      user: 'Nguyễn Phát Đạt',
      action: editingSchedulePostId ? 'Đổi giờ đăng (FR-11)' : 'Lên lịch đăng (FR-11)',
      note: `Thời gian xuất bản mới: ${datetimeVal}. Reset cờ nhắc nhở (30m: ${remind30}, 10m: ${remind10})`
    }
  ];

  PostsStore.updatePost(targetId, {
    date: datetimeVal,
    remindBefore30m: remind30,
    remindBefore10m: remind10,
    isReminded30m: false, // Reset flags per FR-11
    isReminded10m: false,
    auditLogs: updatedLogs
  });

  closeScheduleModal();
  showToast(`Đã lưu lịch xuất bản cho bài "${post.title}" thành công!`, 'success');
  renderCalendar();
  if (currentViewMode === 'list') renderListView();
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
