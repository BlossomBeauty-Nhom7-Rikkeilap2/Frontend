/* =========================================================
   MANAGER – Trang Tiến độ bài viết (logic riêng của trang)
   Sidebar / Header / dropdown / đăng xuất: js/layout.js
   Component: js/components.js (UI.*)
   ========================================================= */

// ==============================
// STATISTICS
// ==============================
const stats = [
    { icon: 'doc',   tone: 'pink', label: 'Hoàn thành kế hoạch', value: '0%', note: '0 / 1 bài đã xuất bản' },
    { icon: 'tick',  tone: 'pink', label: 'Đúng tiến độ',        value: '0%', note: '1 bài cần phân công lại', noteTone: 'green' },
    { icon: 'clock', tone: 'pink', label: 'Cần xử lý hôm nay',   value: '00', note: '0 bài duyệt · 0 chỉnh sửa', noteTone: 'green' },
    { icon: 'alert', tone: 'pink', label: 'Quá hạn',             value: '01', note: 'Cần ưu tiên xử lý', noteTone: 'pink' }
];

document.getElementById('stats').innerHTML = stats.map(UI.statCard).join('');


// ==============================
// KANBAN BOARD
// ==============================
const columns = [
    { cls: 'draft',  title: 'Bản nháp',        empty: 'Không có bản nháp',         posts: [] },
    { cls: 'review', title: 'Chờ duyệt',       empty: 'Không có bài chờ duyệt',    posts: [] },
    { cls: 'edit',   title: 'Đang chỉnh sửa',  empty: 'Không có bài cần sửa',      posts: [] },
    { cls: 'ready',  title: 'Sẵn sàng đăng',   empty: 'Không có bài đã lên lịch',  posts: [] }
];

function renderBoard() {
    document.getElementById('board').innerHTML = columns.map(column => `
        <div class="kb-col ${column.cls}">
            <div class="kb-head">
                <h3>${column.title}</h3>
                <span class="count">${UI.pad(column.posts.length)}</span>
            </div>

            <div class="cards">
                ${column.posts.length
                    ? column.posts.map(post => `
                        <div class="post">
                            <b>${UI.esc(post.title)}</b>
                            <small>${UI.esc(post.author)}</small>
                        </div>`).join('')
                    : UI.emptyState({ text: column.empty })}
            </div>

            <a href="#" class="see-all">Xem tất cả ${column.posts.length} bài viết →</a>
        </div>
    `).join('');
}

renderBoard();
