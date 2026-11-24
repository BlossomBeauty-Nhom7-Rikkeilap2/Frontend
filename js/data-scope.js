/* =========================================================
   SCOPE – Kho dữ liệu dùng chung + phân quyền DỮ LIỆU (bài viết / lịch)
   Nạp trong <head>, SAU auth.js (và permissions.js).

   Vì sao có file này?
   - Trước đây mỗi trang tự copy dữ liệu mẫu và tự "đoán" bài viết nào
     của mình bằng cách so sánh chuỗi tên (có cả đoạn code mặc định
     coi mọi bài của "Minh Anh" là của người đang đăng nhập).
     Nay mọi trang đọc/ghi qua Scope để có MỘT quy tắc duy nhất:

       MANAGER : xem được dữ liệu của toàn đội.
       STAFF   : chỉ xem / sửa dữ liệu do chính mình phụ trách.

   - "Của mình" được xác định bằng owner_username (gán khi tạo bài /
     tạo lịch). Dữ liệu cũ chưa có owner_username sẽ được gán tự động
     dựa trên tên tác giả KHỚP CHÍNH XÁC (không so khớp một phần).

   LƯU Ý: đây vẫn là kiểm tra phía giao diện (localStorage). Khi nối
   backend, API phải tự lọc theo JWT/role ở server.
   ========================================================= */
(function (global) {
    "use strict";

    const POSTS_KEY = "blossom_posts_fr06_07_v1";
    const CAL_KEY = "blossom_fr11_calendar_events_v2";
    const CAL_KEY_V1 = "blossom_fr11_calendar_events_v1";
    const SEED_FLAG_KEY = "blossom_scope_seed_flags_v1";
    const REAL_DATA_FLAG = "blossom_real_data_only_v1";

    /* ---------- Danh bạ nhân viên (tổng hợp động từ dữ liệu thật) ---------- */
    const STAFF = [];

    // Tài khoản Manager (không được tính là "nhân viên" trong thống kê)
    const MANAGER_USERNAMES = ["admin", "manager"];

    const CAMPAIGNS = [
        "Chăm sóc da thu đông", "Tuần lễ hoa anh đào", "Bộ sưu tập son thuần chay",
        "Nâng niu làn da · Tháng 11", "Rạng rỡ mùa lễ hội · Tháng 12", "Chăm da dịu nhẹ mỗi ngày"
    ];

    /* ---------- Nhóm trạng thái (dùng chung cho dashboard + lọc danh sách) ---------- */
    const STATUS_LABEL = {
        PUBLISHED: "Đã xuất bản",
        PENDING_APPROVAL: "Chờ duyệt",
        REVISION_REQUESTED: "Cần chỉnh sửa",
        DRAFT: "Bản nháp",
        SCHEDULED: "Đã lên lịch",
        APPROVED: "Đã phê duyệt",
        REJECTED: "Bị từ chối"
    };

    // Mỗi bài viết thuộc đúng MỘT nhóm => tổng các nhóm luôn bằng tổng số bài
    const GROUPS = {
        PUBLISHED:   { label: "Đã đăng",        statuses: ["PUBLISHED"] },
        IN_PROGRESS: { label: "Đang xử lý",     statuses: ["DRAFT", "REJECTED", "APPROVED", "SCHEDULED"] },
        PENDING:     { label: "Chờ duyệt",      statuses: ["PENDING_APPROVAL"] },
        REVISION:    { label: "Cần chỉnh sửa",  statuses: ["REVISION_REQUESTED"] }
    };

    /* ---------- Tiện ích ---------- */
    function clone(v) { return JSON.parse(JSON.stringify(v)); }

    // "Doãn Thị Minh Anh" == "doan thi minh anh" (bỏ dấu, bỏ phân biệt hoa/thường)
    function norm(s) {
        return String(s == null ? "" : s)
            .toLowerCase()
            .replace(/đ/g, "d")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function pad2(n) { return String(n).padStart(2, "0"); }

    function isoDate(d) {
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    }

    function viDate(iso) { return String(iso || "").split("-").reverse().join("/"); }

    function addDays(d, n) {
        const x = new Date(d.getTime());
        x.setDate(x.getDate() + n);
        return x;
    }

    function currentUser() {
        return (global.Auth && typeof Auth.getUser === "function") ? Auth.getUser() : null;
    }

    function isManager(user) {
        const u = user || currentUser();
        return !!u && u.role === "MANAGER";
    }

    function isStaffUser(user) {
        const u = user || currentUser();
        return !!u && u.role === "STAFF";
    }

    function staffByName(name) {
        const n = norm(name);
        if (!n) return null;
        return STAFF.find(function (s) { return norm(s.fullName) === n; }) || null;
    }

    // Tìm mục danh bạ tương ứng với tài khoản đang đăng nhập (theo username, rồi theo họ tên khớp chính xác)
    function staffForUser(user) {
        if (!user) return null;
        const byUsername = STAFF.find(function (s) { return s.username === norm(user.username); });
        if (byUsername) return byUsername;
        if (user.role === "STAFF") return staffByName(user.fullName);
        return null;
    }

    // Username chủ sở hữu của một bài viết / lịch (null nếu không xác định được)
    function ownerOf(item) {
        if (!item) return null;
        if (item.owner_username) return norm(item.owner_username);
        const s = staffByName(item.author);
        return s ? s.username : null;
    }

    function sameUser(username, user) {
        const u = user || currentUser();
        if (!u || !username) return false;
        const target = norm(username);
        if (norm(u.username) === target) return true;
        const me = staffForUser(u);
        return !!me && me.username === target;
    }

    // Bài viết / lịch này là của người dùng (STAFF) không?
    function isOwner(item, user) {
        const u = user || currentUser();
        if (!u || !item) return false;
        const owner = ownerOf(item);
        if (owner) return sameUser(owner, u);
        // Không xác định được chủ sở hữu: chỉ chấp nhận khi tên khớp CHÍNH XÁC
        const author = norm(item.author);
        return !!author && author === norm(u.fullName);
    }

    // "Của tôi" – dùng cho tab "Bài viết của tôi". Manager chỉ tính bài do chính tài khoản Manager tạo.
    function isMine(item, user) {
        const u = user || currentUser();
        if (!u || !item) return false;
        if (u.role === "MANAGER") return !!item.owner_username && norm(item.owner_username) === norm(u.username);
        return isOwner(item, u);
    }

    function canViewPost(post, user) {
        const u = user || currentUser();
        if (!u || !post) return false;
        if (u.role === "MANAGER") return true;
        return u.role === "STAFF" && isOwner(post, u);
    }

    function canViewEvent(ev, user) { return canViewPost(ev, user); }

    /* =========================================================
       BÀI VIẾT
       ========================================================= */
    function ensureRealDataMode() {
        try {
            if (!localStorage.getItem(REAL_DATA_FLAG)) {
                localStorage.removeItem(POSTS_KEY);
                localStorage.removeItem(CAL_KEY);
                localStorage.removeItem(CAL_KEY_V1);
                localStorage.setItem(REAL_DATA_FLAG, "1");
            }
        } catch (e) {}
    }
    ensureRealDataMode();

    function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    }

    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
    }

    function readFlags() { return readJson(SEED_FLAG_KEY) || {}; }
    function setFlag(name) { const f = readFlags(); f[name] = true; writeJson(SEED_FLAG_KEY, f); }

    function loadPosts() {
        const list = readJson(POSTS_KEY);
        return Array.isArray(list) ? list : [];
    }

    function savePosts(list, silent) {
        writeJson(POSTS_KEY, list);
        if (!silent) {
            try { global.dispatchEvent(new Event("blossom_posts_updated")); } catch (e) { /* bỏ qua */ }
        }
    }

    /* ---------- Ảnh / video đính kèm bài viết (lưu riêng để danh sách bài nhẹ) ---------- */
    const MEDIA_KEY = "blossom_post_media_v1";

    function getPostMedia(id) {
        const all = readJson(MEDIA_KEY) || {};
        return all[String(id)] || null;
    }

    // media = { name, meta, type, url, sizeBytes } hoặc null để xóa. Trả về false nếu bộ nhớ trình duyệt đầy.
    function savePostMedia(id, media) {
        const all = readJson(MEDIA_KEY) || {};
        if (media) all[String(id)] = media; else delete all[String(id)];
        try { localStorage.setItem(MEDIA_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
    }

    function plannedLabelOf(p) {
        if (!p.planned_date) return "";
        return viDate(p.planned_date) + (p.planned_time ? " " + p.planned_time : "");
    }

    function getPostById(id) {
        const list = loadPosts();
        return list.find(function (p) {
            return Number(p.post_id) === Number(id) || String(p.post_id) === String(id) || p.code === String(id);
        }) || null;
    }

    // Danh sách bài viết mà người dùng HIỆN TẠI được phép thấy (không gồm bài đã xóa mềm nếu includeDeleted=false)
    function visiblePosts(opts) {
        const o = opts || {};
        return loadPosts().filter(function (p) {
            if (!o.includeDeleted && p.deleted_at) return false;
            return canViewPost(p);
        });
    }

    function canViewPostId(id) {
        const p = getPostById(id);
        return !!p && canViewPost(p);
    }

    /* ---------- Chủ sở hữu hiển thị (cho thống kê theo nhân viên) ---------- */
    function ownerKey(post) {
        const o = ownerOf(post);
        if (o) return o;
        return "name:" + norm(post.author);
    }

    function ownerName(key, fallbackPosts) {
        const s = STAFF.find(function (x) { return x.username === key; });
        if (s) return s.fullName;
        const hit = (fallbackPosts || []).find(function (p) { return ownerKey(p) === key; });
        return hit ? hit.author : key;
    }

    function activityDate(p) {
        if (p.updated_at) { const d = new Date(p.updated_at); if (!isNaN(d)) return d; }
        if (p.planned_date) { const d2 = new Date(p.planned_date + "T00:00:00"); if (!isNaN(d2)) return d2; }
        return null;
    }

    // range: ALL | 7D | 30D | MONTH
    function inRange(p, range) {
        if (!range || range === "ALL") return true;
        const d = activityDate(p);
        if (!d) return false;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (range === "7D") return d >= addDays(todayStart, -6);
        if (range === "30D") return d >= addDays(todayStart, -29);
        if (range === "MONTH") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        return true;
    }

    function groupOfStatus(status) {
        for (const key in GROUPS) {
            if (GROUPS[key].statuses.indexOf(status) !== -1) return key;
        }
        return "IN_PROGRESS";
    }

    function countByGroup(posts) {
        const out = { TOTAL: posts.length, PUBLISHED: 0, IN_PROGRESS: 0, PENDING: 0, REVISION: 0 };
        posts.forEach(function (p) { out[groupOfStatus(p.status)] += 1; });
        return out;
    }

    // Tạo đường dẫn tới danh sách bài viết kèm bộ lọc (dashboard -> posts.html)
    function postsUrl(base, f) {
        const q = [];
        const o = f || {};
        if (o.statuses && o.statuses.length) q.push("statuses=" + encodeURIComponent(o.statuses.join(",")));
        if (o.author && o.author !== "ALL") q.push("author=" + encodeURIComponent(o.author));
        if (o.campaign && o.campaign !== "ALL") q.push("campaign=" + encodeURIComponent(o.campaign));
        if (o.range && o.range !== "ALL") q.push("range=" + encodeURIComponent(o.range));
        if (o.label) q.push("label=" + encodeURIComponent(o.label));
        return base + (q.length ? "?" + q.join("&") : "");
    }

    /* =========================================================
       LỊCH ĐĂNG BÀI
       status (giữ nguyên tên cũ để dùng lại CSS):
         PENDING   = Chờ xác nhận (Staff đề xuất)
         SCHEDULED = Đã xác nhận  (lịch chính thức)
         EDITING   = Cần điều chỉnh (Manager yêu cầu, kèm change_reason)
       ========================================================= */
    function postStatusToEventStatus(s) {
        if (s === "PUBLISHED" || s === "SCHEDULED" || s === "APPROVED") return "SCHEDULED";
        if (s === "REVISION_REQUESTED" || s === "REJECTED") return "EDITING";
        return "PENDING"; // DRAFT, PENDING_APPROVAL
    }

    function platformOfPost(p) {
        const plats = Array.isArray(p.platforms) ? p.platforms : [];
        if (plats.indexOf("Facebook") !== -1 && plats.indexOf("Instagram") !== -1) return "FB & IG";
        return plats[0] || "FB & IG";
    }

    function writeEvents(list, silent) {
        writeJson(CAL_KEY, list);
        if (!silent) {
            try { global.dispatchEvent(new Event("blossom_events_updated")); } catch (e) { /* bỏ qua */ }
        }
    }

    function loadEvents() {
        const list = readJson(CAL_KEY);
        return Array.isArray(list) ? list : [];
    }

    function saveEvents(list, silent) {
        writeEvents(list, silent);
        // Đồng bộ ngược ngày đăng sang bài viết liên kết (qua post_id)
        try {
            const posts = readJson(POSTS_KEY);
            if (Array.isArray(posts)) {
                let changed = false;
                list.forEach(function (ev) {
                    if (ev.post_id == null) return;
                    const match = posts.find(function (p) { return Number(p.post_id) === Number(ev.post_id); });
                    if (match && (match.planned_date !== ev.date || (match.planned_time || "") !== ev.time)) {
                        match.planned_date = ev.date;
                        match.planned_time = ev.time;
                        match.planned_label = viDate(ev.date) + " " + ev.time;
                        changed = true;
                    }
                });
                if (changed) writeJson(POSTS_KEY, posts);
            }
        } catch (e) { /* bỏ qua */ }
    }

    function eventTime(ev) {
        const t = new Date(ev.date + "T" + (ev.time || "00:00") + ":00");
        return isNaN(t) ? null : t.getTime();
    }

    function visibleEvents() {
        return loadEvents().filter(function (ev) { return canViewEvent(ev); });
    }

    // Bài viết vừa lưu -> cập nhật (hoặc tạo) lịch đăng liên kết với đúng ngày + giờ + tiêu đề của bài
    function upsertEventForPost(p) {
        const pid = Number(p.post_id);
        const list = loadEvents();
        const idx = list.findIndex(function (e) {
            return (e.post_id != null && Number(e.post_id) === pid) ||
                   (p.code && e.code && String(e.code) === String(p.code));
        });
        if (idx === -1 && pid <= 132 && !p._touched) return;
        if (!p.planned_date || p.deleted_at) {
            if (idx !== -1) { list.splice(idx, 1); writeEvents(list); }
            return;
        }
        const data = {
            title: p.title, date: p.planned_date, time: p.planned_time || "09:00", platform: platformOfPost(p),
            status: postStatusToEventStatus(p.status), post_status_seen: p.status,
            author: p.author, owner_username: p.owner_username || (ownerOf(p) || undefined)
        };
        if (idx === -1) {
            list.unshift(Object.assign({ id: pid, post_id: pid, code: p.code || ("BL-0" + pid) }, data));
        } else {
            const changedTime = list[idx].date !== data.date || list[idx].time !== data.time;
            list[idx].post_id = pid;
            Object.assign(list[idx], data);
            if (changedTime) list[idx].remind_sent = false;
        }
        writeEvents(list);
    }

    /* ---------- Nhắc lịch đăng & hạn hoàn thành (tách riêng Manager và Staff) ---------- */
    function runReminders() {
        if (!global.NotificationsStore) return;
        const list = loadEvents();
        const now = Date.now();
        let changed = false;

        list.forEach(function (ev) {
            if (ev.status !== "SCHEDULED" || ev.remind_sent) return; // chỉ nhắc lịch chính thức
            const t = eventTime(ev);
            if (!t || t <= now) return;
            const lead = (Number(ev.remind_before_minutes) || 60) * 60000;
            if (t - now > lead) return;

            ev.remind_sent = true;
            changed = true;
            const mins = Math.max(1, Math.round((t - now) / 60000));
            const msg = "Bài '" + ev.title + "' (" + ev.platform + ") sẽ được đăng lúc " + ev.time + " ngày " + viDate(ev.date) +
                " – còn khoảng " + mins + " phút.";

            if (ev.owner_username) {
                NotificationsStore.addNotification({
                    type: "reminder", title: "Sắp đến giờ đăng bài", message: msg,
                    author: "Hệ thống Blossom", recipientRole: "STAFF",
                    recipientUser: ev.owner_username, eventId: ev.id
                });
            }
            NotificationsStore.addNotification({
                type: "reminder", title: "Lịch đăng sắp diễn ra",
                message: (ev.author || "Nhân viên") + " – " + msg,
                author: "Hệ thống Blossom", recipientRole: "MANAGER", eventId: ev.id
            });
        });

        if (changed) writeEvents(list, true);

        // Kiểm tra due_date của bài viết (sắp đến hạn trong 24h hoặc quá hạn)
        const posts = loadPosts();
        let postsChanged = false;
        const DAY_MS = 24 * 3600000;
        posts.forEach(function (p) {
            if (!p || p.deleted_at || !p.due_date) return;
            if (p.status === "PUBLISHED" || p.status === "REJECTED") return;
            const dueMs = new Date(p.due_date + "T23:59:59").getTime();
            if (isNaN(dueMs)) return;
            const owner = ownerOf(p);

            if (dueMs < now && !p._overdue_notified) {
                p._overdue_notified = true;
                postsChanged = true;
                NotificationsStore.addNotification({
                    type: "overdue", postId: p.post_id,
                    title: "Bài viết quá hạn",
                    message: "Bài '" + p.title + "' (" + p.code + ") của " + (p.author || "Nhân viên") + " đã quá hạn hoàn thành (" + viDate(p.due_date) + ").",
                    author: "Hệ thống Blossom", recipientRole: "MANAGER"
                });
                if (owner) {
                    NotificationsStore.addNotification({
                        type: "overdue", postId: p.post_id,
                        title: "Bài viết đã quá hạn",
                        message: "Bài '" + p.title + "' (" + p.code + ") của bạn đã quá hạn hoàn thành (" + viDate(p.due_date) + ").",
                        author: "Hệ thống Blossom", recipientRole: "STAFF", recipientUser: owner
                    });
                }
            } else if (dueMs >= now && (dueMs - now) <= DAY_MS && !p._due_soon_notified) {
                p._due_soon_notified = true;
                postsChanged = true;
                NotificationsStore.addNotification({
                    type: "deadline", postId: p.post_id,
                    title: "Bài viết sắp đến hạn hoàn thành",
                    message: "Bài '" + p.title + "' (" + p.code + ") của " + (p.author || "Nhân viên") + " sắp đến hạn (" + viDate(p.due_date) + ").",
                    author: "Hệ thống Blossom", recipientRole: "MANAGER"
                });
                if (owner) {
                    NotificationsStore.addNotification({
                        type: "deadline", postId: p.post_id,
                        title: "Sắp đến hạn hoàn thành bài viết",
                        message: "Bài '" + p.title + "' (" + p.code + ") của bạn sắp đến hạn hoàn thành (" + viDate(p.due_date) + ").",
                        author: "Hệ thống Blossom", recipientRole: "STAFF", recipientUser: owner
                    });
                }
            }
        });
        if (postsChanged) writeJson(POSTS_KEY, posts);
    }

    function normalizePlatformName(raw) {
        const s = String(raw || "").trim().toLowerCase();
        if (!s) return "Facebook";
        if (s.indexOf("fb & ig") !== -1 || (s.indexOf("face") !== -1 && s.indexOf("insta") !== -1)) return "FB & IG";
        if (s.indexOf("insta") !== -1) return "Instagram";
        if (s.indexOf("thread") !== -1) return "Threads";
        return "Facebook";
    }

    async function syncFromBackend() {
        if (!global.BlossomAPI || !global.BlossomAPI.getToken()) return;
        try {
            const res = await global.BlossomAPI.request("/posts?page_size=100");
            let schedByPost = {};

            try {
                const cal = await global.BlossomAPI.request("/schedules/calendar");
                if (Array.isArray(cal)) {
                    const realEvents = cal.map(function (cev) {
                        const plat = normalizePlatformName(cev.platform_name);
                        const pubTime = cev.scheduled_time || cev.publish_time || "";
                        const dateStr = pubTime ? pubTime.slice(0, 10) : "";
                        const timeStr = pubTime ? pubTime.slice(11, 16) : "09:00";
                        if (cev.post_id && dateStr) {
                            schedByPost[cev.post_id] = { date: dateStr, time: timeStr, label: viDate(dateStr) + " " + timeStr };
                        }
                        const isDone = cev.post_status === "PUBLISHED" || cev.schedule_status === "COMPLETED";
                        const evStatus = (cev.schedule_status === "ACTIVE" || isDone)
                            ? "SCHEDULED"
                            : (cev.schedule_status || cev.status || "SCHEDULED");
                        return {
                            id: cev.schedule_id,
                            event_id: "ev_be_" + cev.schedule_id,
                            schedule_id: cev.schedule_id,
                            post_id: cev.post_id,
                            code: "BL-0" + cev.post_id,
                            title: cev.title || cev.post_title || "",
                            platform: plat,
                            date: dateStr,
                            time: timeStr,
                            status: evStatus,
                            post_status: cev.post_status || "",
                            published: isDone,
                            author: cev.author_name || "",
                            owner_username: cev.author_username || undefined
                        };
                    });
                    writeEvents(realEvents, false);
                }
            } catch (calErr) {}

            if (Array.isArray(res)) {
                const platNames = { 1: "Facebook", 2: "Instagram", 3: "Threads" };
                const realPosts = res.map(function (bp) {
                    const plat = platNames[bp.platform_id] || "Facebook";
                    const schedInfo = schedByPost[bp.post_id] || null;
                    const rawTime = bp.planned_publish_time || (bp.status === "PUBLISHED" ? bp.published_at : "") || "";
                    const plannedDate = schedInfo ? schedInfo.date : (rawTime ? rawTime.slice(0, 10) : "");
                    const plannedTime = schedInfo ? schedInfo.time : (rawTime ? rawTime.slice(11, 16) : "09:00");

                    const item = {
                        post_id: bp.post_id,
                        code: "BL-0" + bp.post_id,
                        title: bp.title,
                        caption: bp.caption || "",
                        hashtags: bp.hashtags || "",
                        platforms: [plat],
                        platform_label: plat,
                        author: bp.author_name || "",
                        owner_username: bp.author_username || undefined,
                        status: bp.status,
                        published_url: bp.published_url || "",
                        planned_date: plannedDate,
                        planned_time: plannedTime,
                        planned_label: plannedDate ? viDate(plannedDate) + " " + plannedTime : "",
                        updated_at: bp.updated_at || bp.created_at,
                        deleted_at: null
                    };

                    if (bp.media_files && Array.isArray(bp.media_files) && bp.media_files.length) {
                        const mUrl = (global.BlossomAPI && global.BlossomAPI.resolveMediaUrl) ? global.BlossomAPI.resolveMediaUrl(bp.media_files[0]) : bp.media_files[0];
                        item.mediaUrl = mUrl;
                        savePostMedia(bp.post_id, {
                            url: mUrl,
                            serverUrl: bp.media_files[0],
                            type: bp.media_type || "IMAGE"
                        });
                    }

                    return item;
                });

                savePosts(realPosts, false);
            }
        } catch (err) {
            console.warn("[Scope] syncFromBackend error:", err.message);
        }
    }

    global.Scope = {
        POSTS_KEY: POSTS_KEY, CAL_KEY: CAL_KEY,
        STAFF: STAFF, CAMPAIGNS: CAMPAIGNS, GROUPS: GROUPS, STATUS_LABEL: STATUS_LABEL,
        MANAGER_USERNAMES: MANAGER_USERNAMES,
        norm: norm, isoDate: isoDate, viDate: viDate, addDays: addDays,
        isManager: isManager, isStaffUser: isStaffUser,
        staffByName: staffByName, staffForUser: staffForUser, ownerOf: ownerOf, ownerKey: ownerKey, ownerName: ownerName,
        sameUser: sameUser, isOwner: isOwner, isMine: isMine,
        canViewPost: canViewPost, canViewEvent: canViewEvent, canViewPostId: canViewPostId,
        loadPosts: loadPosts, savePosts: savePosts, getPostById: getPostById, visiblePosts: visiblePosts,
        activityDate: activityDate, inRange: inRange, groupOfStatus: groupOfStatus, countByGroup: countByGroup,
        postsUrl: postsUrl, getPostMedia: getPostMedia, savePostMedia: savePostMedia, plannedLabelOf: plannedLabelOf, upsertEventForPost: upsertEventForPost,
        loadEvents: loadEvents, saveEvents: saveEvents, visibleEvents: visibleEvents, eventTime: eventTime,
        runReminders: runReminders, syncFromBackend: syncFromBackend
    };

    if (typeof window !== "undefined") {
        window.addEventListener("DOMContentLoaded", function () {
            if (global.BlossomAPI && global.BlossomAPI.getToken()) {
                syncFromBackend();
            }
        });
    }
})(window);
