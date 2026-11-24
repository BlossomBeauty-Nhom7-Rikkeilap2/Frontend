/* =========================================================
   MANAGER – Tổng quan: Tiến độ bài viết + Theo dõi nhân viên
   Sidebar / Header / dropdown / đăng xuất: js/layout.js
   Component: js/components.js (UI.*)
   Dữ liệu: js/data-scope.js (Scope) – cùng nguồn với trang Bài viết,
   nên mọi con số ở đây là số liệu THẬT từ danh sách bài viết.

   Quy ước nhóm trạng thái (Scope.GROUPS):
     Đã đăng         = PUBLISHED
     Chờ duyệt       = PENDING_APPROVAL
     Cần chỉnh sửa   = REVISION_REQUESTED
     Đang xử lý      = DRAFT, REJECTED, APPROVED, SCHEDULED
   => 4 nhóm cộng lại luôn bằng tổng số bài viết.
   Bấm vào thẻ thống kê => mở Danh sách bài viết với đúng bộ lọc tương ứng.
   ========================================================= */

(function () {
    "use strict";

    const G = Scope.GROUPS;
    const DONUT_COLORS = { PUBLISHED: "#6cc08b", IN_PROGRESS: "#f6c56d", PENDING: "#f48fb1", REVISION: "#a897d8" };

    let allPosts = [];
    let currentTab = "board"; // "board" | "members"
    const filters = { author: "ALL", campaign: "ALL", range: "ALL" };

    function loadAll() {
        allPosts = Scope.loadPosts().filter(function (p) { return !p.deleted_at; });
    }

    /* ---------- Bộ lọc: nhân viên + chiến dịch + thời gian ---------- */
    function filteredPosts() {
        return allPosts.filter(function (p) {
            if (filters.author !== "ALL" && Scope.ownerKey(p) !== filters.author) return false;
            if (filters.campaign !== "ALL" && p.campaign !== filters.campaign) return false;
            if (!Scope.inRange(p, filters.range)) return false;
            return true;
        });
    }

    // Link sang danh sách bài viết, giữ nguyên bộ lọc đang chọn ở Tổng quan
    function listUrl(statuses, label) {
        return Scope.postsUrl("posts.html", {
            statuses: statuses,
            label: label,
            author: filters.author,
            campaign: filters.campaign,
            range: filters.range
        });
    }

    /* ---------- Danh sách nhân viên ---------- */
    function memberKeys() {
        const keys = [];
        Scope.STAFF.forEach(function (s) { keys.push(s.username); });
        allPosts.forEach(function (p) {
            const k = Scope.ownerKey(p);
            if (keys.indexOf(k) === -1 && Scope.MANAGER_USERNAMES.indexOf(k) === -1) keys.push(k);
        });
        return keys;
    }

    function initials(name) {
        const parts = String(name || "?").trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function avatarHtml(name, usernameKey) {
        const src = (window.Auth && typeof Auth.getAvatarFor === "function")
            ? Auth.getAvatarFor({ username: usernameKey || "", fullName: name || "" })
            : "";
        if (src) {
            return '<span class="dash-avatar" style="background:transparent;overflow:hidden;padding:0">' +
                '<img src="' + UI.esc(src) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">' +
            '</span>';
        }
        const palette = ["#f48fb1", "#a897d8", "#6cc08b", "#f6c56d", "#7fb3e6"];
        let h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
        return '<span class="dash-avatar" style="background:' + palette[h % palette.length] + '">' + UI.esc(initials(name)) + '</span>';
    }

    function relTime(p) {
        const d = Scope.activityDate(p);
        if (!d) return "—";
        const min = Math.round((Date.now() - d.getTime()) / 60000);
        if (min < 1) return "Vừa xong";
        if (min < 60) return min + " phút trước";
        if (min < 60 * 24) return Math.round(min / 60) + " giờ trước";
        if (min < 60 * 24 * 7) return Math.round(min / 1440) + " ngày trước";
        return d.toLocaleDateString("vi-VN");
    }

    function pct(part, total) { return total ? Math.round((part / total) * 100) : 0; }

    /* =========================================================
       1. THẺ THỐNG KÊ (số liệu thật, bấm vào để lọc danh sách)
       ========================================================= */
    function renderStats(posts) {
        const statsEl = document.getElementById("stats");
        if (!statsEl) return;
        const c = Scope.countByGroup(posts);

        const items = [
            { icon: "doc", tone: "pink", label: "Tổng số bài viết", value: UI.pad(c.TOTAL),
              note: pct(c.PUBLISHED, c.TOTAL) + "% hoàn thành kế hoạch", href: listUrl([], "") },
            { icon: "check", tone: "green", label: "Đã đăng", value: UI.pad(c.PUBLISHED),
              note: "Trạng thái PUBLISHED", noteTone: "green", href: listUrl(G.PUBLISHED.statuses, "Đã đăng") },
            { icon: "clock", tone: "orange", label: "Đang xử lý", value: UI.pad(c.IN_PROGRESS),
              note: "Nháp · Đã duyệt · Đã lên lịch", href: listUrl(G.IN_PROGRESS.statuses, "Đang xử lý") },
            { icon: "clipboard", tone: "purple", label: "Chờ duyệt", value: UI.pad(c.PENDING),
              note: c.PENDING ? "Cần Manager phê duyệt" : "Không có bài chờ duyệt", noteTone: c.PENDING ? "pink" : "green",
              href: listUrl(G.PENDING.statuses, "Chờ duyệt") },
            { icon: "edit", tone: "pink", label: "Cần chỉnh sửa", value: UI.pad(c.REVISION),
              note: c.REVISION ? "Đang chờ nhân viên sửa" : "Không có bài cần sửa", noteTone: c.REVISION ? "pink" : "green",
              href: listUrl(G.REVISION.statuses, "Cần chỉnh sửa") }
        ];

        statsEl.classList.add("stats--5");
        statsEl.innerHTML = items.map(function (it) {
            return '<a class="stat-link" href="' + UI.esc(it.href) + '" title="Xem danh sách: ' + UI.esc(it.label) + '">' + UI.statCard(it) + '</a>';
        }).join("");
    }

    /* =========================================================
       2. BẢNG TIẾN ĐỘ (kanban)
       ========================================================= */
    function postCard(post, showAuthor) {
        const plat = post.platform_label || (Array.isArray(post.platforms) ? post.platforms.join(" & ") : "Mạng xã hội");
        return '<div class="post" data-post-id="' + post.post_id + '" role="button" tabindex="0" title="Nhấn để xem chi tiết bài viết">' +
            '<b>' + UI.esc(post.title) + '</b>' +
            '<small>' + (showAuthor ? UI.esc(post.author) + ' · ' : '') + UI.esc(plat) + '</small>' +
        '</div>';
    }

    function renderBoard(posts) {
        const boardEl = document.getElementById("board");
        if (!boardEl) return;

        if (currentTab === "members") {
            renderMembersView(posts, boardEl);
            return;
        }

        const by = function (statuses) { return posts.filter(function (p) { return statuses.indexOf(p.status) !== -1; }); };
        const columns = [
            { cls: "draft", title: "Bản nháp / Bị từ chối", empty: "Không có bản nháp", statuses: ["DRAFT", "REJECTED"] },
            { cls: "review", title: "Chờ duyệt", empty: "Không có bài chờ duyệt", statuses: ["PENDING_APPROVAL"] },
            { cls: "edit", title: "Cần chỉnh sửa", empty: "Không có bài cần sửa", statuses: ["REVISION_REQUESTED"] },
            { cls: "ready", title: "Sẵn sàng đăng", empty: "Không có bài đã lên lịch", statuses: ["APPROVED", "SCHEDULED"] }
        ];

        boardEl.classList.remove("board--members");
        boardEl.innerHTML = columns.map(function (col) {
            const list = by(col.statuses);
            const cards = list.length ? list.map(function (p) { return postCard(p, true); }).join("") : UI.emptyState({ text: col.empty });
            return '<div class="kb-col ' + col.cls + '">' +
                '<div class="kb-head"><h3>' + UI.esc(col.title) + '</h3><span class="count">' + UI.pad(list.length) + '</span></div>' +
                '<div class="cards">' + cards + '</div>' +
                '<a href="' + UI.esc(listUrl(col.statuses, col.title)) + '" class="see-all">Xem tất cả ' + list.length + ' bài viết →</a>' +
            '</div>';
        }).join("");
    }

    /* =========================================================
       3. THEO DÕI NHÂN VIÊN (Task 04)
       ========================================================= */
    function memberRows(posts) {
        let keys = memberKeys();
        if (filters.author !== "ALL") keys = keys.filter(function (k) { return k === filters.author; });

        return keys.map(function (key) {
            const mine = posts.filter(function (p) { return Scope.ownerKey(p) === key; });
            const c = Scope.countByGroup(mine);
            return { key: key, name: Scope.ownerName(key, allPosts), total: c.TOTAL, c: c, percent: pct(c.PUBLISHED, c.TOTAL) };
        });
    }

    function memberUrl(key, statuses, label) {
        return Scope.postsUrl("posts.html", { statuses: statuses, label: label, author: key, campaign: filters.campaign, range: filters.range });
    }

    function renderMemberCard(m) {
        const barTone = m.percent >= 60 ? "ok" : (m.percent >= 40 ? "mid" : "low");
        const stat = function (cls, label, n, statuses) {
            return '<a class="mem-stat ' + cls + '" href="' + UI.esc(memberUrl(m.key, statuses, label + " · " + m.name)) + '"><i></i>' + label + ': <b>' + n + '</b></a>';
        };
        return '<div class="mem-row">' +
            avatarHtml(m.name, m.key) +
            '<div class="mem-id"><b>' + UI.esc(m.name) + '</b><small>Staff · Được giao ' + m.total + ' bài</small></div>' +
            '<div class="mem-progress">' +
                '<span>' + m.c.PUBLISHED + ' / ' + m.total + ' bài hoàn thành</span>' +
                '<strong>' + m.percent + '%</strong>' +
                '<div class="mem-bar"><div class="mem-bar__fill ' + barTone + '" style="width:' + m.percent + '%"></div></div>' +
            '</div>' +
            '<div class="mem-stats">' +
                stat("green", "Đã đăng", m.c.PUBLISHED, G.PUBLISHED.statuses) +
                stat("orange", "Đang xử lý", m.c.IN_PROGRESS, G.IN_PROGRESS.statuses) +
                stat("pink", "Chờ duyệt", m.c.PENDING, G.PENDING.statuses) +
                stat("purple", "Cần chỉnh sửa", m.c.REVISION, G.REVISION.statuses) +
            '</div>' +
            '<a class="mem-go" href="' + UI.esc(memberUrl(m.key, [], "")) + '" title="Xem tất cả bài của ' + UI.esc(m.name) + '" aria-label="Xem bài của ' + UI.esc(m.name) + '">›</a>' +
        '</div>';
    }

    function donutSvg(c) {
        const R = 70, C = 2 * Math.PI * R;
        const order = ["PUBLISHED", "IN_PROGRESS", "PENDING", "REVISION"];
        let offset = 0;
        const rings = c.TOTAL === 0
            ? '<circle cx="90" cy="90" r="' + R + '" fill="none" stroke="#f3e6ec" stroke-width="26"/>'
            : order.map(function (k) {
                const len = (c[k] / c.TOTAL) * C;
                if (!len) return "";
                const ring = '<circle cx="90" cy="90" r="' + R + '" fill="none" stroke="' + DONUT_COLORS[k] + '" stroke-width="26" ' +
                    'stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 90 90)"/>';
                offset += len;
                return ring;
            }).join("");
        return '<svg viewBox="0 0 180 180" class="donut-svg" role="img" aria-label="Biểu đồ tiến độ đội ngũ">' + rings + '</svg>' +
            '<div class="donut-center"><b>' + pct(c.PUBLISHED, c.TOTAL) + '%</b><small>Hoàn thành</small></div>';
    }

    function renderTeamPanel(teamPosts) {
        const c = Scope.countByGroup(teamPosts);
        const rangeBtn = function (val, label) {
            return '<button type="button" class="range-pill' + (filters.range === val ? " active" : "") + '" data-range="' + val + '">' + label + '</button>';
        };
        const legend = ["PUBLISHED", "IN_PROGRESS", "PENDING", "REVISION"].map(function (k) {
            return '<a class="legend-row" href="' + UI.esc(listUrl(G[k].statuses, G[k].label)) + '">' +
                '<span class="legend-dot" style="background:' + DONUT_COLORS[k] + '"></span>' +
                '<span class="legend-name">' + G[k].label + '</span>' +
                '<span class="legend-val">' + c[k] + ' (' + pct(c[k], c.TOTAL) + '%)</span></a>';
        }).join("");

        const recent = teamPosts.slice().sort(function (a, b) {
            return (Scope.activityDate(b) || 0) - (Scope.activityDate(a) || 0);
        }).slice(0, 5);

        const recentRows = recent.length ? recent.map(function (p) {
            const st = Scope.STATUS_LABEL[p.status] || p.status;
            const plat = p.platform_label || (Array.isArray(p.platforms) ? p.platforms.join(" & ") : "—");
            return '<div class="recent-row" data-post-id="' + p.post_id + '" role="button" tabindex="0">' +
                '<span class="recent-who">' + avatarHtml(p.author || "?", Scope.ownerKey(p)) + UI.esc(p.author) + '</span>' +
                '<span class="recent-plat">' + UI.esc(plat) + '</span>' +
                '<span><em class="dash-pill pill-' + Scope.groupOfStatus(p.status).toLowerCase() + '">' + UI.esc(st) + '</em></span>' +
                '<span class="recent-time">' + UI.esc(relTime(p)) + '</span></div>';
        }).join("") : '<p class="empty-message">Chưa có bài đăng nào trong khoảng thời gian này.</p>';

        return '<div class="team-panel">' +
            '<section class="dash-card">' +
                '<div class="dash-card__head"><h3>Thống kê tiến độ đội ngũ</h3><div class="range-pills">' +
                    rangeBtn("7D", "7 ngày") + rangeBtn("30D", "30 ngày") + rangeBtn("MONTH", "Tháng này") + rangeBtn("ALL", "Tất cả") +
                '</div></div>' +
                '<div class="donut-wrap"><div class="donut">' + donutSvg(c) + '</div><div class="legend">' + legend + '</div></div>' +
            '</section>' +
            '<section class="dash-card">' +
                '<div class="dash-card__head"><h3>Bài đăng gần đây</h3></div>' +
                '<div class="recent-head"><span>Nhân viên</span><span>Nền tảng</span><span>Trạng thái</span><span>Thời gian</span></div>' +
                recentRows +
            '</section>' +
        '</div>';
    }

    function renderMembersView(posts, boardEl) {
        const rows = memberRows(posts);
        boardEl.classList.add("board--members");

        const list = rows.length
            ? rows.map(renderMemberCard).join("")
            : '<p class="empty-message">Chưa có nhân viên nào.</p>';

        boardEl.innerHTML = '<div class="members-layout">' +
            '<section class="dash-card members-card">' +
                '<div class="dash-card__head"><h3>Tiến độ theo thành viên</h3><span class="chip">' + rows.length + ' nhân viên</span></div>' +
                list +
            '</section>' +
            renderTeamPanel(posts) +
        '</div>';
    }

    /* =========================================================
       4. BANNER ƯU TIÊN
       ========================================================= */
    function updatePriorityBanner(posts) {
        const titleEl = document.getElementById("priorityTitle");
        const descEl = document.getElementById("priorityDesc");
        const linkEl = document.getElementById("priorityLink");
        if (!titleEl || !descEl || !linkEl) return;

        const todayIso = Scope.isoDate(new Date());
        const overdue = posts.filter(function (p) {
            return p.status !== "PUBLISHED" && p.planned_date && p.planned_date < todayIso;
        });
        const pending = posts.filter(function (p) { return p.status === "PENDING_APPROVAL"; });

        if (overdue.length > 0) {
            titleEl.textContent = "Ưu tiên hôm nay: Có " + overdue.length + " bài viết quá hạn";
            descEl.textContent = "Có " + overdue.length + " bài viết đã quá ngày đăng dự kiến nhưng chưa xuất bản. Kiểm tra và sắp xếp lại lịch phát hành.";
            linkEl.textContent = "Kiểm tra lịch";
            linkEl.href = "calendar.html";
        } else if (pending.length > 0) {
            titleEl.textContent = "Cần phê duyệt: " + pending.length + " bài viết chờ duyệt";
            descEl.textContent = "Đội ngũ sáng tạo đã gửi " + pending.length + " bài viết mới. Vui lòng duyệt bài để kịp thời gian phát hành theo kế hoạch.";
            linkEl.textContent = "Duyệt bài viết";
            linkEl.href = "approvals.html";
        } else {
            titleEl.textContent = "Tiến độ hôm nay rất tốt!";
            descEl.textContent = "Tất cả các bài viết đều đang được thực hiện theo đúng kế hoạch và tiến độ đã định.";
            linkEl.textContent = "Xem tất cả bài";
            linkEl.href = "posts.html";
        }
    }

    /* =========================================================
       5. BỘ LỌC + SỰ KIỆN
       ========================================================= */
    function populateFilters() {
        const authorSel = document.getElementById("filterAuthor");
        if (authorSel) {
            authorSel.innerHTML = '<option value="ALL">Tất cả nhân viên</option>' + memberKeys().map(function (k) {
                return '<option value="' + UI.esc(k) + '">' + UI.esc(Scope.ownerName(k, allPosts)) + '</option>';
            }).join("");
            authorSel.value = filters.author;
        }

        const campSel = document.getElementById("filterCampaign");
        if (campSel) {
            const names = Scope.CAMPAIGNS.slice();
            allPosts.forEach(function (p) { if (p.campaign && names.indexOf(p.campaign) === -1) names.push(p.campaign); });
            campSel.innerHTML = '<option value="ALL">Tất cả chiến dịch</option>' + names.map(function (n) {
                return '<option value="' + UI.esc(n) + '">' + UI.esc(n) + '</option>';
            }).join("");
            campSel.value = filters.campaign;
        }

        const rangeSel = document.getElementById("filterRange");
        if (rangeSel) rangeSel.value = filters.range;
    }

    function openDetail(postId) {
        if (window.PostDetailModal && typeof window.PostDetailModal.open === "function") {
            window.PostDetailModal.open(postId);
        } else {
            location.href = "posts.html?view=" + encodeURIComponent(postId);
        }
    }

    function bindEvents() {
        const bind = function (id, key) {
            const el = document.getElementById(id);
            if (el) el.addEventListener("change", function () { filters[key] = el.value; refreshUI(); });
        };
        bind("filterAuthor", "author");
        bind("filterCampaign", "campaign");
        bind("filterRange", "range");

        const tabProgress = document.getElementById("tabProgress");
        const tabMembers = document.getElementById("tabMembers");
        if (tabProgress && tabMembers) {
            tabProgress.addEventListener("click", function () {
                currentTab = "board";
                tabProgress.classList.add("active");
                tabMembers.classList.remove("active");
                refreshUI();
            });
            tabMembers.addEventListener("click", function () {
                currentTab = "members";
                tabMembers.classList.add("active");
                tabProgress.classList.remove("active");
                refreshUI();
            });
        }

        const boardEl = document.getElementById("board");
        if (boardEl) {
            boardEl.addEventListener("click", function (e) {
                const pill = e.target.closest("[data-range]");
                if (pill) {
                    filters.range = pill.dataset.range;
                    const rangeSel = document.getElementById("filterRange");
                    if (rangeSel) rangeSel.value = filters.range;
                    refreshUI();
                    return;
                }
                const card = e.target.closest("[data-post-id]");
                if (card) openDetail(Number(card.dataset.postId));
            });
            boardEl.addEventListener("keydown", function (e) {
                if (e.key !== "Enter" && e.key !== " ") return;
                const card = e.target.closest("[data-post-id]");
                if (card) { e.preventDefault(); openDetail(Number(card.dataset.postId)); }
            });
        }

        window.addEventListener("blossom_posts_updated", function () { loadAll(); populateFilters(); refreshUI(); });
        window.addEventListener("storage", function (e) {
            if (e.key === Scope.POSTS_KEY) { loadAll(); populateFilters(); refreshUI(); }
        });
    }

    function refreshUI() {
        const posts = filteredPosts();
        renderStats(posts);
        renderBoard(posts);
        updatePriorityBanner(allPosts);
    }

    loadAll();
    populateFilters();
    refreshUI();
    bindEvents();
})();
