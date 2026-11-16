/* =========================================================
   STAFF – Trang Dashboard nhân viên (logic riêng của trang)
   Sidebar / Header / dropdown / đăng xuất / Ctrl+K: js/layout.js
   Component: js/components.js (UI.*)
   ========================================================= */

// ==============================
// DATA (thay bằng dữ liệu từ API/Thymeleaf khi nối backend)
// status: draft | review | edit | ready | done
// ==============================
const posts = [
  { title:'Bộ sưu tập chăm sóc da',        platform:'TikTok',               date:'2026-11-17T09:00', status:'edit'   },
  { title:'Giới thiệu sản phẩm mới',        platform:'Facebook · Instagram', date:'2026-11-18T14:00', status:'review' },
  { title:'Nội dung chăm sóc khách hàng',   platform:'Instagram',            date:'2026-11-20T10:00', status:'draft'  },
  { title:'Hướng dẫn skincare mùa khô',     platform:'Facebook · Instagram', date:'2026-11-19T08:30', status:'ready'  },
  { title:'Quà tặng Black Friday',          platform:'Facebook',             date:'2026-11-21T19:00', status:'ready'  },
  { title:'Ưu đãi tháng 11',                platform:'Facebook',             date:'2026-11-13T09:00', status:'done'   },
  { title:'Mẹo trang điểm tự nhiên',        platform:'Instagram',            date:'2026-11-10T20:00', status:'done'   },
  { title:'Review serum vitamin C',         platform:'TikTok',               date:'2026-11-08T18:00', status:'done'   }
];
const fmtDate = iso => new Date(iso).toLocaleDateString('vi-VN');
const count = s => posts.filter(p => p.status === s).length;

// ==============================
// WELCOME + PROGRESS
// ==============================
const now = new Date();
const weekday = now.toLocaleDateString('vi-VN', { weekday:'long' });
document.getElementById('greeting').textContent = `Xin chào, ${Auth.shortName(Auth.getUser())}!`;
document.getElementById('todayText').textContent =
  `${weekday}, ${now.toLocaleDateString('vi-VN')} · Cùng hoàn thành những nội dung thật chỉn chu hôm nay.`;
document.getElementById('monthChip').textContent = `Tháng ${now.getMonth() + 1} / ${now.getFullYear()}`;

const total = posts.length, done = count('done');
const percent = total ? Math.round(done / total * 100) : 0;
document.getElementById('progressPercent').textContent = percent + '%';
document.getElementById('progressCount').textContent = `${done} / ${total} bài viết đã xuất bản`;
requestAnimationFrame(() => { document.getElementById('progressFill').style.width = percent + '%'; });

// ==============================
// STATS
// ==============================
const stats = [
  { icon:'doc',   tone:'pink',   label:'Bài viết của tôi', value:UI.pad(total),          note:'Tổng bài viết' },
  { icon:'clock', tone:'orange', label:'Chờ duyệt',        value:UI.pad(count('review')), note:'Đang chờ Manager' },
  { icon:'edit',  tone:'purple', label:'Cần chỉnh sửa',    value:UI.pad(count('edit')),   note:'Cần hoàn thiện' },
  { icon:'check', tone:'green',  label:'Đã xuất bản',      value:UI.pad(done),            note:'Hoàn thành' }
];
document.getElementById('stats').innerHTML = stats.map(UI.statCard).join('');

// ==============================
// TASKS (ưu tiên: cần sửa > chờ duyệt > nháp > sẵn sàng; bỏ bài đã xuất bản)
// ==============================
const order = { edit:0, review:1, draft:2, ready:3, done:4 };
function renderTasks(list) {
  const el = document.getElementById('taskList');
  if (!list.length) { el.innerHTML = '<p class="empty-message">Không tìm thấy bài viết phù hợp.</p>'; return; }
  el.innerHTML = list.map(t => `
    <a href="posts.html" class="task">
      <div><b>${UI.esc(t.title)}</b><small>${UI.esc(t.platform)} · ${fmtDate(t.date)}</small></div>
      ${UI.statusBadge(t.status)}
    </a>`).join('');
}
const defaultTasks = posts.filter(p => p.status !== 'done').sort((a, b) => order[a.status] - order[b.status]).slice(0, 5);
renderTasks(defaultTasks);

// ==============================
// SCHEDULE
// ==============================
const upcoming = posts.filter(p => p.status === 'ready' || p.status === 'review')
  .filter(p => new Date(p.date) >= new Date(now.toDateString()))
  .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
document.getElementById('scheduleList').innerHTML = upcoming.length ? upcoming.map(p => {
  const d = new Date(p.date);
  return `<div class="schedule-item">
    <div class="date-box"><b>${UI.pad(d.getDate())}</b><small>TH ${d.getMonth() + 1}</small></div>
    <div class="schedule-info"><b>${UI.esc(p.title)}</b>
      <small>${UI.pad(d.getHours())}:${UI.pad(d.getMinutes())} · ${UI.esc(p.platform)}</small></div>
  </div>`;
}).join('') : '<p class="empty-message">Chưa có bài nào được lên lịch.</p>';

// ==============================
// SEARCH (ô tìm kiếm do layout.js render; Ctrl/⌘ + K do layout.js xử lý)
// ==============================
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
  const k = searchInput.value.toLowerCase().trim();
  if (!k) return renderTasks(defaultTasks);
  renderTasks(posts.filter(p => [p.title, p.platform, UI.POST_STATUS[p.status].label].some(v => v.toLowerCase().includes(k))));
});
