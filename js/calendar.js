/* ==========================================================
   FR-11 · LỊCH ĐĂNG BÀI (T06A667) – có phân quyền + quy trình xác nhận

   PHÂN QUYỀN (Scope trong js/data-scope.js)
   - Staff  : chỉ thấy lịch của chính mình (tháng / tuần / ngày / danh sách).
              Chỉ tạo & sửa được lịch của mình khi lịch chưa được xác nhận.
   - Manager: thấy lịch toàn đội, lọc theo nhân viên, xác nhận / yêu cầu
              điều chỉnh / tự chỉnh giờ đăng.

   QUY TRÌNH (giữ nguyên tên status cũ để dùng lại CSS)
     PENDING   = Chờ xác nhận  (Staff đề xuất)
     SCHEDULED = Đã xác nhận   (lịch CHÍNH THỨC; quá giờ => "Đã đăng")
     EDITING   = Cần điều chỉnh (Manager yêu cầu, kèm lý do)
     Staff xem lý do -> cập nhật -> lịch quay về PENDING để Manager duyệt lại.

   CẢNH BÁO TRÙNG: 2 lịch cùng nền tảng cách nhau < 30 phút. Việc phát hiện
   chạy trên TOÀN BỘ lịch; Staff chỉ nhận cảnh báo chung, không lộ nội dung
   lịch của người khác.
   ========================================================== */
(function (global) {
    "use strict";

    const CONFLICT_MINUTES = 30;
    const BASE_SLOTS = ["08:00", "08:15", "09:00", "10:00", "14:00", "19:00", "20:00"];
    const WEEKDAYS = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];
    const STATUS_TEXT = { PENDING: "Chờ xác nhận", SCHEDULED: "Đã xác nhận", EDITING: "Cần điều chỉnh" };

    const me = Auth.getUser();
    const isMgr = Scope.isManager(me);

    const state = {
        mode: "MONTH",        // MONTH | WEEK | DAY | LIST
        channelFilter: "ALL",
        staffFilter: "ALL",   // chỉ Manager dùng
        statusFilter: "ALL",
        cursor: new Date(),
        events: [],           // TOÀN BỘ lịch (để dò trùng); hiển thị luôn qua visible()
        draggedEventId: null,
        reasonMode: false
    };

    const $ = function (id) { return document.getElementById(id); };
    const esc = UI.esc;

    /* ---------------------------------------------------------
       Thời gian
       --------------------------------------------------------- */
    function todayStr() { return Scope.isoDate(new Date()); }
    function parseMinutes(hhmm) {
        const p = String(hhmm || "08:00").split(":");
        return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
    }
    function formatMinutes(total) {
        const t = Math.max(0, Math.min(23 * 60 + 59, total));
        return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
    }
    function isPast(date, time) {
        const t = Scope.eventTime({ date: date, time: time });
        return t !== null && t < Date.now();
    }
    function mondayOf(d) {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = (x.getDay() + 6) % 7; // Thứ hai = 0
        x.setDate(x.getDate() - diff);
        return x;
    }
    function sameMonth(iso, cursor) {
        return iso.slice(0, 7) === Scope.isoDate(cursor).slice(0, 7);
    }

    /* ---------------------------------------------------------
       Dữ liệu + quyền
       --------------------------------------------------------- */
    function reload() { state.events = Scope.loadEvents(); }
    async function persist(ev) {
        Scope.saveEvents(state.events);
        if (ev && ev.post_id && window.BlossomAPI && typeof window.BlossomAPI.request === "function") {
            const dtStr = ev.date + "T" + (ev.time || "09:00") + ":00";
            try {
                await BlossomAPI.request("/schedules/" + ev.post_id, {
                    method: "PUT",
                    body: { scheduled_time: dtStr, remind_before_minutes: 30 }
                });
            } catch (e) {
                console.warn("[Calendar] PUT schedule error:", e.message);
            }
        }
    }
    function findEvent(id) {
        return state.events.find(function (e) { return Number(e.id) === Number(id); }) || null;
    }
    function ownerName(ev) { return ev.author || Scope.ownerName(ev.owner_username, []) || "—"; }

    // Lịch người dùng hiện tại được phép thấy + bộ lọc giao diện
    function visible() {
        return state.events.filter(function (ev) {
            if (!Scope.canViewEvent(ev)) return false;
            if (!matchesChannel(ev, state.channelFilter)) return false;
            if (state.statusFilter !== "ALL" && ev.status !== state.statusFilter) return false;
            if (isMgr && state.staffFilter !== "ALL" && Scope.ownerOf(ev) !== state.staffFilter) return false;
            return true;
        });
    }

    function canEditFields(ev) {
        if (isMgr) return true;
        if (!ev) return true;                         // tạo mới
        return Scope.isOwner(ev, me) && ev.status !== "SCHEDULED";
    }
    function canDrag(ev) { return !!ev && canEditFields(ev); }

    /* ---------------------------------------------------------
       Nền tảng + xung đột
       --------------------------------------------------------- */
    function expandPlatform(p) { return p === "FB & IG" ? ["Facebook", "Instagram"] : [p]; }
    function platformsOverlap(a, b) {
        const x = expandPlatform(a), y = expandPlatform(b);
        return x.some(function (c) { return y.indexOf(c) !== -1; });
    }
    function matchesChannel(ev, f) {
        if (!f || f === "ALL") return true;
        return expandPlatform(ev.platform).indexOf(f) !== -1;
    }
    function platformClass(p) {
        if (p === "Facebook") return "platform-fb";
        if (p === "Instagram") return "platform-ig";
        if (p === "Threads") return "platform-threads";
        return "platform-fbig";
    }
    function platformDot(p) {
        if (p === "Facebook") return "#1877F2";
        if (p === "Instagram") return "#E1306C";
        if (p === "Threads") return "#111111";
        return "#cc618a";
    }

    function conflictsOf(candidate, ignoreId) {
        return state.events.filter(function (o) {
            if (ignoreId != null && Number(o.id) === Number(ignoreId)) return false;
            if (o.date !== candidate.date) return false;
            if (!platformsOverlap(o.platform, candidate.platform)) return false;
            return Math.abs(parseMinutes(o.time) - parseMinutes(candidate.time)) < CONFLICT_MINUTES;
        });
    }

    function detectConflicts(list) {
        const ids = new Set();
        const pairs = [];
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i], b = list[j];
                if (a.date !== b.date || !platformsOverlap(a.platform, b.platform)) continue;
                if (Math.abs(parseMinutes(a.time) - parseMinutes(b.time)) < CONFLICT_MINUTES) {
                    ids.add(Number(a.id)); ids.add(Number(b.id));
                    pairs.push({ a: a, b: b });
                }
            }
        }
        return { ids: ids, pairs: pairs };
    }

    /* ---------------------------------------------------------
       Thông báo
       --------------------------------------------------------- */
    function notify(n) {
        if (global.NotificationsStore) NotificationsStore.addNotification(n);
    }
    function when(ev) { return ev.time + " ngày " + Scope.viDate(ev.date); }
    function notifyManagers(type, title, message, ev) {
        notify({ type: type, title: title, message: message, author: me.fullName, recipientRole: "MANAGER", eventId: ev.id });
    }
    function notifyOwner(type, title, message, ev) {
        if (!ev.owner_username) return;
        notify({ type: type, title: title, message: message, author: me.fullName + " (Manager)", recipientRole: "STAFF", recipientUser: ev.owner_username, eventId: ev.id });
    }
    function toast(type, title, msg) { UI.toast(type, title, msg, type === "error" ? 4200 : 3200); }

    /* ---------------------------------------------------------
       Hiển thị thẻ lịch
       --------------------------------------------------------- */
    function statusLabel(ev) {
        if (ev.status === "SCHEDULED" && isPast(ev.date, ev.time)) return "Đã đăng";
        return STATUS_TEXT[ev.status] || ev.status;
    }
    function statusClass(s) {
        if (s === "PENDING") return "status-pending";
        if (s === "EDITING") return "status-editing";
        return "status-scheduled";
    }

    function eventCard(ev, conflictIds) {
        const conflict = conflictIds.has(Number(ev.id));
        const official = ev.status === "SCHEDULED";
        const cls = ["fr11-event-card", statusClass(ev.status), platformClass(ev.platform),
            conflict ? "has-conflict" : "", official ? "is-official" : "is-proposal"].filter(Boolean).join(" ");
        const drag = canDrag(ev);
        const quick = (isMgr && ev.status === "PENDING")
            ? '<span class="fr11-quick">' +
                '<button type="button" class="fr11-quick-btn ok" data-quick="confirm" title="Xác nhận lịch">✓</button>' +
                '<button type="button" class="fr11-quick-btn" data-quick="change" title="Yêu cầu thay đổi">↺</button>' +
              '</span>' : "";

        return '<div class="' + cls + '" draggable="' + (drag ? "true" : "false") + '" data-event-id="' + ev.id + '" ' +
            'title="' + esc(drag ? "Kéo-thả để đổi lịch hoặc nhấn để xem / chỉnh (" : "Nhấn để xem chi tiết (") + esc(statusLabel(ev)) + ')">' +
            '<div class="fr11-event-meta">' +
                '<span><span class="fr11-platform-dot" style="background:' + platformDot(ev.platform) + '"></span> ' + esc(ev.time) + ' · ' + esc(ev.platform) + '</span>' +
                (conflict ? '<span class="fr11-conflict-pill">⚠️ Trùng lịch</span>' : "") +
            '</div>' +
            '<div class="fr11-event-title">' + esc(ev.title) + '</div>' +
            '<div class="fr11-event-foot">' +
                '<span class="fr11-event-chip">' + esc(statusLabel(ev)) + '</span>' +
                (isMgr ? '<span class="fr11-event-owner">' + esc(ownerName(ev)) + '</span>' : "") +
                quick +
            '</div>' +
        '</div>';
    }

    /* ---------------------------------------------------------
       Các chế độ xem
       --------------------------------------------------------- */
    function renderMonth(box, list, ids) {
        const first = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1);
        const start = mondayOf(first);
        let html = '<div class="fr11-weekday-row">' + WEEKDAYS.map(function (w) { return '<div class="fr11-weekday-cell">' + w + '</div>'; }).join("") + '</div><div class="fr11-month-grid">';

        for (let i = 0; i < 42; i++) {
            const d = Scope.addDays(start, i);
            const iso = Scope.isoDate(d);
            const outside = d.getMonth() !== state.cursor.getMonth();
            const cellEvents = list.filter(function (e) { return e.date === iso; })
                .sort(function (a, b) { return parseMinutes(a.time) - parseMinutes(b.time); });
            html += '<div class="fr11-day-cell' + (outside ? " is-outside" : "") + (iso === todayStr() ? " is-today" : "") + '" data-drop-date="' + iso + '">' +
                '<div class="fr11-day-header"><span class="fr11-day-num">' + d.getDate() + '</span>' + (iso === todayStr() ? '<span class="fr11-today-tag">HÔM NAY</span>' : "") + '</div>' +
                '<div class="fr11-day-events">' + cellEvents.map(function (e) { return eventCard(e, ids); }).join("") + '</div></div>';
        }
        box.innerHTML = html + '</div>';
    }

    function slotsFor(events) {
        const set = BASE_SLOTS.slice();
        events.forEach(function (e) { if (set.indexOf(e.time) === -1) set.push(e.time); });
        return set.sort(function (a, b) { return parseMinutes(a) - parseMinutes(b); });
    }

    function renderWeek(box, list, ids) {
        const start = mondayOf(state.cursor);
        const days = [];
        for (let i = 0; i < 7; i++) days.push(Scope.addDays(start, i));
        const isos = days.map(Scope.isoDate);
        const inWeek = list.filter(function (e) { return isos.indexOf(e.date) !== -1; });
        const slots = slotsFor(inWeek);

        let html = '<div class="fr11-week-grid"><div class="fr11-week-head-cell">Khung giờ</div>';
        days.forEach(function (d, i) {
            const iso = isos[i];
            html += '<div class="fr11-week-head-cell ' + (iso === todayStr() ? "is-today" : "") + '"><span>' + WEEKDAYS[i] + '</span>' +
                '<span class="fr11-week-head-sub">' + String(d.getDate()).padStart(2, "0") + '/' + String(d.getMonth() + 1).padStart(2, "0") + (iso === todayStr() ? " · HÔM NAY" : "") + '</span></div>';
        });
        slots.forEach(function (slot) {
            html += '<div class="fr11-time-label-cell">' + slot + '</div>';
            isos.forEach(function (iso) {
                html += '<div class="fr11-week-slot" data-drop-date="' + iso + '" data-drop-time="' + slot + '">' +
                    inWeek.filter(function (e) { return e.date === iso && e.time === slot; }).map(function (e) { return eventCard(e, ids); }).join("") + '</div>';
            });
        });
        box.innerHTML = html + '</div>';
    }

    function renderDay(box, list, ids) {
        const iso = Scope.isoDate(state.cursor);
        const dayEvents = list.filter(function (e) { return e.date === iso; });
        const slots = slotsFor(dayEvents);
        let html = '<div class="fr11-day-view-header"><div class="fr11-day-view-title">Lịch chi tiết theo giờ — Ngày ' + Scope.viDate(iso) + (iso === todayStr() ? " (HÔM NAY)" : "") + '</div>' +
            '<div class="fr11-day-view-hint">💡 Kéo-thả thẻ bài viết giữa các khung giờ để đổi giờ đăng</div></div><div class="fr11-day-timeline">';
        slots.forEach(function (slot) {
            const here = dayEvents.filter(function (e) { return e.time === slot; });
            html += '<div class="fr11-day-row"><div class="fr11-day-time"><span>' + slot + '</span><small>GMT+7</small></div>' +
                '<div class="fr11-day-dropzone" data-drop-date="' + iso + '" data-drop-time="' + slot + '">' +
                (here.length ? here.map(function (e) { return eventCard(e, ids); }).join("") : '<span class="fr11-empty-slot-hint">Thả bài viết vào khung ' + slot + '...</span>') +
                '</div></div>';
        });
        box.innerHTML = html + '</div>';
    }

    function renderList(box, list, ids) {
        const rows = list.filter(function (e) { return sameMonth(e.date, state.cursor); })
            .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
        if (!rows.length) {
            box.innerHTML = '<div class="fr11-list-empty">' + UI.emptyState({ text: isMgr ? "Không có lịch đăng nào trong tháng này." : "Bạn chưa có lịch đăng nào trong tháng này. Nhấn “Thêm lịch đăng” để đề xuất." }) + '</div>';
            return;
        }
        box.innerHTML = '<div class="fr11-list-wrap"><table class="fr11-list-table"><thead><tr>' +
            '<th>Thời gian</th><th>Bài viết</th>' + (isMgr ? '<th>Nhân viên</th>' : "") + '<th>Nền tảng</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
            rows.map(function (e) {
                const conflict = ids.has(Number(e.id));
                return '<tr data-event-id="' + e.id + '">' +
                    '<td><b>' + esc(e.time) + '</b><br><small>' + Scope.viDate(e.date) + '</small></td>' +
                    '<td>' + esc(e.title) + (conflict ? ' <span class="fr11-conflict-pill">⚠️ Trùng lịch</span>' : "") +
                        (e.status === "EDITING" && e.change_reason ? '<br><small class="fr11-reason-inline">Lý do: ' + esc(e.change_reason) + '</small>' : "") + '</td>' +
                    (isMgr ? '<td>' + esc(ownerName(e)) + '</td>' : "") +
                    '<td>' + esc(e.platform) + '</td>' +
                    '<td><span class="fr11-event-chip ' + statusClass(e.status) + '">' + esc(statusLabel(e)) + '</span></td>' +
                    '<td class="fr11-list-actions">' +
                        (isMgr && e.status === "PENDING" ? '<button type="button" class="fr11-quick-btn ok" data-quick="confirm" title="Xác nhận lịch">✓</button><button type="button" class="fr11-quick-btn" data-quick="change" title="Yêu cầu thay đổi">↺</button>' : "") +
                        '<button type="button" class="fr11-btn-outline fr11-list-open">' + (canEditFields(e) ? "Điều chỉnh" : "Xem") + '</button>' +
                    '</td></tr>';
            }).join("") + '</tbody></table></div>';
    }

    /* ---------------------------------------------------------
       KPI + banner cảnh báo
       --------------------------------------------------------- */
    function renderKpis() {
        const el = $("calendarKpis");
        if (!el) return;
        const mine = state.events.filter(function (e) {
            if (!Scope.canViewEvent(e) || !sameMonth(e.date, state.cursor)) return false;
            if (isMgr && state.staffFilter !== "ALL" && Scope.ownerOf(e) !== state.staffFilter) return false;
            return true;
        });
        const posted = mine.filter(function (e) { return e.status === "SCHEDULED" && isPast(e.date, e.time); }).length;
        const confirmed = mine.filter(function (e) { return e.status === "SCHEDULED" && !isPast(e.date, e.time); }).length;
        const pending = mine.filter(function (e) { return e.status === "PENDING"; }).length;
        const editing = mine.filter(function (e) { return e.status === "EDITING"; }).length;
        const card = function (cls, label, value, note) {
            return '<div class="fr11-kpi ' + cls + '"><small>' + label + '</small><strong>' + value + '</strong><span>' + note + '</span></div>';
        };
        el.innerHTML =
            card("total", "Tổng lịch đăng", mine.length, "Trong " + (state.cursor.getMonth() + 1) + "/" + state.cursor.getFullYear()) +
            card("pending", "Chờ xác nhận", pending, editing ? editing + " lịch cần điều chỉnh" : "Cần xem xét") +
            card("confirmed", "Đã xác nhận", confirmed, "Lịch chính thức") +
            card("posted", "Đã đăng", posted, "Đã qua giờ đăng");
    }

    function updateConflictBanner() {
        const banner = $("conflictBanner");
        const text = $("conflictDetailText");
        const resolveBtn = $("btnResolveConflict");
        if (!banner || !text) return;

        const all = detectConflicts(state.events);
        // Chỉ tính những cặp có liên quan tới lịch mà người dùng được phép thấy
        const relevant = all.pairs.filter(function (p) { return Scope.canViewEvent(p.a) || Scope.canViewEvent(p.b); });
        if (!relevant.length) { banner.hidden = true; return; }

        if (isMgr) {
            const f = relevant[0];
            text.textContent = "Phát hiện " + relevant.length + " cặp lịch đăng cùng nền tảng cách nhau dưới " + CONFLICT_MINUTES + " phút. Ví dụ: “" +
                f.a.title + "” (" + ownerName(f.a) + ", " + f.a.time + ") và “" + f.b.title + "” (" + ownerName(f.b) + ", " + f.b.time + ") ngày " + Scope.viDate(f.a.date) + ".";
        } else {
            const mineCount = new Set();
            relevant.forEach(function (p) {
                if (Scope.canViewEvent(p.a)) mineCount.add(p.a.id);
                if (Scope.canViewEvent(p.b)) mineCount.add(p.b.id);
            });
            text.textContent = "Bạn có " + mineCount.size + " lịch đăng bị trùng thời gian (cùng nền tảng, cách nhau dưới " + CONFLICT_MINUTES + " phút) với một lịch đăng khác. Hãy đổi giờ để tránh trùng.";
        }
        if (resolveBtn) resolveBtn.hidden = !isMgr;
        banner.hidden = false;
    }

    /* ---------------------------------------------------------
       Render tổng
       --------------------------------------------------------- */
    function periodLabel() {
        const c = state.cursor;
        if (state.mode === "MONTH" || state.mode === "LIST") return "Tháng " + (c.getMonth() + 1) + ", " + c.getFullYear();
        if (state.mode === "WEEK") {
            const s = mondayOf(c), e = Scope.addDays(s, 6);
            const f = function (d) { return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };
            return f(s) + " – " + f(e) + ", " + e.getFullYear();
        }
        return Scope.viDate(Scope.isoDate(c)) + (Scope.isoDate(c) === todayStr() ? " (Hôm nay)" : "");
    }

    function render() {
        const board = $("calendarBoard");
        if (!board) return;
        const list = visible();
        const ids = detectConflicts(state.events).ids;

        const label = $("calendarPeriodLabel");
        if (label) label.textContent = periodLabel();

        document.querySelectorAll("[data-cal-mode]").forEach(function (b) {
            b.classList.toggle("is-active", b.getAttribute("data-cal-mode") === state.mode);
        });

        if (state.mode === "MONTH") renderMonth(board, list, ids);
        else if (state.mode === "WEEK") renderWeek(board, list, ids);
        else if (state.mode === "DAY") renderDay(board, list, ids);
        else renderList(board, list, ids);

        const summary = $("calendarTotalSummary");
        if (summary) {
            const inMonth = list.filter(function (e) { return sameMonth(e.date, state.cursor); }).length;
            summary.textContent = inMonth + " lịch đăng trong tháng · Múi giờ GMT+7" + (isMgr ? "" : " · Chỉ hiển thị lịch của bạn");
        }

        renderKpis();
        updateConflictBanner();
        bindBoard(board);
    }

    /* ---------------------------------------------------------
       Tương tác trên bảng lịch
       --------------------------------------------------------- */
    function bindBoard(board) {
        board.querySelectorAll(".fr11-event-card").forEach(function (card) {
            const id = Number(card.getAttribute("data-event-id"));
            card.addEventListener("dragstart", function (e) {
                if (card.getAttribute("draggable") !== "true") { e.preventDefault(); return; }
                state.draggedEventId = id;
                card.classList.add("is-dragging");
                if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(id)); }
            });
            card.addEventListener("dragend", function () { card.classList.remove("is-dragging"); });
            card.addEventListener("click", function (e) {
                e.stopPropagation();
                const q = e.target.closest("[data-quick]");
                if (q) { quickAction(id, q.getAttribute("data-quick")); return; }
                openScheduleModal(id);
            });
        });

        board.querySelectorAll("tr[data-event-id]").forEach(function (row) {
            const id = Number(row.getAttribute("data-event-id"));
            row.addEventListener("click", function (e) {
                const q = e.target.closest("[data-quick]");
                if (q) { quickAction(id, q.getAttribute("data-quick")); return; }
                if (e.target.closest(".fr11-list-open")) openScheduleModal(id);
            });
        });

        board.querySelectorAll("[data-drop-date]").forEach(function (zone) {
            zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("is-drag-over"); });
            zone.addEventListener("dragleave", function () { zone.classList.remove("is-drag-over"); });
            zone.addEventListener("drop", function (e) {
                e.preventDefault();
                zone.classList.remove("is-drag-over");
                const raw = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || state.draggedEventId;
                const id = parseInt(raw, 10);
                if (id) applyMove(id, zone.getAttribute("data-drop-date"), zone.getAttribute("data-drop-time"));
            });
        });
    }

    /* ---------------------------------------------------------
       Hành động trên lịch
       --------------------------------------------------------- */
    function conflictWarningText(ev, others) {
        if (!others.length) return "";
        return isMgr
            ? "Lịch bị trùng: khung giờ này đã có “" + others[0].title + "” (" + ownerName(others[0]) + ", " + others[0].time + " · " + others[0].platform + ")."
            : "Khung giờ này trùng (cách nhau dưới " + CONFLICT_MINUTES + " phút, cùng nền tảng) với một lịch đăng khác.";
    }

    function applyMove(eventId, targetDate, targetTime) {
        const ev = findEvent(eventId);
        if (!ev) return false;
        if (!Scope.canViewEvent(ev) || !canDrag(ev)) {
            toast("error", "Không thể đổi lịch", isMgr ? "Không tìm thấy lịch." : "Lịch đã được xác nhận hoặc không thuộc về bạn. Hãy liên hệ Manager để thay đổi.");
            return false;
        }
        const newTime = targetTime || ev.time;
        if (isPast(targetDate, newTime)) {
            toast("error", "Thời gian không hợp lệ", "Thời gian đăng bài phải lớn hơn thời điểm hiện tại!");
            return false;
        }
        if (targetDate === ev.date && newTime === ev.time) return false;

        const old = when(ev);
        ev.date = targetDate;
        ev.time = newTime;
        ev.remind_sent = false;

        if (isMgr) {
            if (ev.owner_username && !Scope.sameUser(ev.owner_username, me.username)) {
                notifyOwner("revision", "Lịch đăng đã được thay đổi", "Lịch đăng “" + ev.title + "” được dời từ " + old + " sang " + when(ev) + ".", ev);
            }
        } else {
            ev.status = "PENDING";   // Staff đổi lịch => gửi lại để Manager xác nhận
            ev.change_reason = "";
            notifyManagers("submitted", "Nhân viên đã cập nhật lịch đăng", me.fullName + " dời lịch “" + ev.title + "” sang " + when(ev) + " – chờ xác nhận.", ev);
        }

        persist();
        render();
        const others = conflictsOf(ev, ev.id);
        if (others.length) {
            notifyManagers("conflict", "Có lịch đăng bị trùng", "Lịch “" + ev.title + "” (" + when(ev) + " · " + ev.platform + ") bị trùng với “" + others[0].title + "” (" + others[0].time + ").", ev);
            toast("warning", "Cảnh báo trùng lịch", conflictWarningText(ev, others));
        } else {
            toast("success", "Đã dời lịch", "“" + ev.title + "” → " + when(ev));
        }
        return true;
    }

    async function confirmEvent(ev) {
        if (isPast(ev.date, ev.time)) {
            toast("error", "Lịch đăng trong quá khứ", "Không thể xác nhận lịch đăng có thời gian trong quá khứ (" + when(ev) + ").");
            return false;
        }
        const others = conflictsOf(ev, ev.id);
        if (others.length) {
            const ok = await UI.confirm({
                title: "Lịch đang bị trùng",
                message: conflictWarningText(ev, others) + " Bạn vẫn muốn xác nhận lịch này?",
                confirmText: "Vẫn xác nhận", cancelText: "Quay lại"
            });
            if (!ok) return false;
        }
        ev.status = "SCHEDULED";
        ev.change_reason = "";
        ev.reviewed_by = me.fullName;
        ev.reviewed_at = new Date().toISOString();
        ev.remind_sent = false;
        persist();
        if (ev.owner_username && !Scope.sameUser(ev.owner_username, me.username)) {
            notifyOwner("approved", "Lịch đăng đã được xác nhận", "Lịch đăng “" + ev.title + "” lúc " + when(ev) + " đã được Manager xác nhận và trở thành lịch chính thức.", ev);
        }
        if (global.Scope) Scope.runReminders();
        render();
        toast("success", "Đã xác nhận lịch", "“" + ev.title + "” là lịch đăng chính thức.");
        return true;
    }

    function requestChange(ev, reason) {
        if (isPast(ev.date, ev.time)) {
            toast("error", "Lịch đăng trong quá khứ", "Không thể yêu cầu chỉnh sửa lịch đăng có thời gian trong quá khứ (" + when(ev) + ").");
            return;
        }
        ev.status = "EDITING";
        ev.change_reason = reason;
        ev.reviewed_by = me.fullName;
        ev.reviewed_at = new Date().toISOString();
        persist();
        if (ev.owner_username && !Scope.sameUser(ev.owner_username, me.username)) {
            notifyOwner("revision", "Lịch đăng cần điều chỉnh", "Lịch đăng “" + ev.title + "” cần điều chỉnh. Lý do: " + reason, ev);
        }
        render();
        toast("info", "Đã gửi yêu cầu thay đổi", "Nhân viên sẽ nhận được thông báo kèm lý do.");
    }

    function quickAction(id, kind) {
        const ev = findEvent(id);
        if (!ev || !isMgr) return;
        if (kind === "confirm") confirmEvent(ev);
        else openScheduleModal(id, { askReason: true });
    }

    /* ---------------------------------------------------------
       Modal thêm / điều chỉnh / duyệt lịch
       --------------------------------------------------------- */
    function showEl(id, on) { const el = $(id); if (el) el.hidden = !on; }

    function setFormDisabled(disabled) {
        ["fr11FormTitle", "fr11FormPlatform", "fr11FormDate", "fr11FormTime", "fr11FormOwner"].forEach(function (id) {
            const el = $(id); if (el) el.disabled = disabled;
        });
    }

    function refreshModalConflict() {
        const box = $("fr11ConflictBox");
        if (!box) return;
        const date = $("fr11FormDate").value, time = $("fr11FormTime").value, platform = $("fr11FormPlatform").value;
        if (!date || !time) { box.hidden = true; return; }
        const idVal = $("fr11FormId").value;
        const others = conflictsOf({ date: date, time: time, platform: platform }, idVal ? Number(idVal) : null);
        if (!others.length) { box.hidden = true; return; }
        box.innerHTML = "<strong>⚠️ Lịch bị trùng</strong><span>" + esc(conflictWarningText(null, others)) +
            (isMgr ? "" : " Bạn vẫn có thể gửi, Manager sẽ xem xét.") + "</span>";
        box.hidden = false;
    }

    function openScheduleModal(eventId, opts) {
        const modal = $("fr11ScheduleModal");
        if (!modal) return;
        const ev = eventId ? findEvent(eventId) : null;

        if (eventId && (!ev || !Scope.canViewEvent(ev))) {
            toast("error", "Không có quyền truy cập", "Bạn chỉ được xem lịch đăng của chính mình.");
            return;
        }

        state.reasonMode = false;
        showEl("fr11ModalError", false);
        showEl("fr11ReasonGroup", false);
        $("fr11FormReason").value = "";

        const editable = canEditFields(ev);
        const heading = $("fr11ModalHeading");
        $("fr11FormId").value = ev ? String(ev.id) : "";

        // Ô chọn nhân viên phụ trách (chỉ Manager khi tạo mới)
        const ownerGroup = $("fr11OwnerGroup");
        const ownerSel = $("fr11FormOwner");
        if (ownerGroup && ownerSel) {
            ownerGroup.hidden = !(isMgr && !ev);
            if (isMgr && !ev) {
                ownerSel.innerHTML = Scope.STAFF.map(function (s) { return '<option value="' + esc(s.username) + '">' + esc(s.fullName) + '</option>'; }).join("");
                if (state.staffFilter !== "ALL") ownerSel.value = state.staffFilter;
            }
        }

        if (ev) {
            heading.textContent = (editable ? "Điều chỉnh lịch đăng bài" : "Chi tiết lịch đăng bài") + " (" + ev.code + ")";
            $("fr11FormTitle").value = ev.title;
            $("fr11FormPlatform").value = ev.platform;
            $("fr11FormDate").value = ev.date;
            $("fr11FormTime").value = ev.time;
        } else {
            heading.textContent = isMgr ? "Thêm lịch đăng bài (lịch chính thức)" : "Đề xuất lịch đăng bài";
            $("fr11FormTitle").value = "";
            $("fr11FormPlatform").value = "FB & IG";
            const base = Scope.isoDate(state.cursor) < todayStr() ? todayStr() : Scope.isoDate(state.cursor);
            $("fr11FormDate").value = base;
            $("fr11FormTime").value = "09:00";
        }
        $("fr11FormDate").min = todayStr();
        setFormDisabled(!editable);

        // Banner trạng thái / lý do
        const banner = $("fr11StatusBanner");
        if (banner) {
            let html = "";
            if (ev) {
                html = '<span class="fr11-event-chip ' + statusClass(ev.status) + '">' + esc(statusLabel(ev)) + '</span> ';
                if (ev.status === "EDITING") {
                    html += '<div><strong>Manager yêu cầu điều chỉnh:</strong> ' + esc(ev.change_reason || "(không có ghi chú)") +
                        (isMgr ? "" : '<br><small>Hãy cập nhật ngày/giờ rồi bấm “Cập nhật & gửi lại”.</small>') + '</div>';
                } else if (ev.status === "SCHEDULED") {
                    html += '<div>Lịch chính thức' + (ev.reviewed_by ? " · xác nhận bởi " + esc(ev.reviewed_by) : "") + '.' +
                        (isMgr ? "" : " Bạn không thể tự thay đổi, hãy liên hệ Manager nếu cần dời lịch.") + '</div>';
                } else {
                    html += '<div>Đang chờ Manager xác nhận.</div>';
                }
                if (isMgr) html += '<div class="fr11-banner-owner">Nhân viên phụ trách: <b>' + esc(ownerName(ev)) + '</b></div>';
            } else if (!isMgr) {
                html = '<div>Lịch bạn tạo là <b>lịch đề xuất</b> – sau khi Manager xác nhận mới trở thành lịch chính thức.</div>';
            }
            banner.innerHTML = html;
            banner.hidden = !html;
        }

        // Nút theo vai trò / trạng thái
        const existing = !!ev;
        showEl("btnConfirmSchedule", isMgr && existing && ev.status !== "SCHEDULED");
        showEl("btnRequestChange", isMgr && existing);
        const saveBtn = $("btnSaveSchedule");
        showEl("btnSaveSchedule", editable);
        if (saveBtn) {
            saveBtn.textContent = isMgr
                ? (existing ? "Lưu điều chỉnh" : "Tạo lịch chính thức")
                : (existing ? (ev.status === "EDITING" ? "Cập nhật & gửi lại" : "Lưu đề xuất") : "Gửi đề xuất lịch");
        }
        const reqBtn = $("btnRequestChange");
        if (reqBtn) reqBtn.textContent = "Yêu cầu thay đổi";

        const editLink = $("btnOpenPostEditorFromCal");
        if (editLink) {
            const base = location.pathname.indexOf("/pages/admin/") !== -1 ? "../staff/edit-post.html" : "edit-post.html";
            const post = ev && ev.post_id != null ? Scope.getPostById(ev.post_id) : null;
            if (post && Scope.isMine(post) && post.status !== "PUBLISHED") {
                editLink.href = base + "?id=" + encodeURIComponent(post.post_id) + "&state=" + encodeURIComponent(post.status);
                editLink.hidden = false;
            } else {
                editLink.hidden = true;
            }
        }

        refreshModalConflict();
        modal.hidden = false;

        if (opts && opts.askReason && isMgr && existing) startReasonMode();
    }

    function startReasonMode() {
        state.reasonMode = true;
        showEl("fr11ReasonGroup", true);
        const ev = findEvent($("fr11FormId").value);
        if (ev && ev.change_reason) $("fr11FormReason").value = ev.change_reason;
        const btn = $("btnRequestChange");
        if (btn) btn.textContent = "Gửi yêu cầu thay đổi";
        $("fr11FormReason").focus();
    }

    function closeScheduleModal() {
        const modal = $("fr11ScheduleModal");
        if (modal) modal.hidden = true;
        state.reasonMode = false;
    }

    function showError(msg) {
        const box = $("fr11ModalError");
        box.textContent = msg;
        box.hidden = false;
    }

    function readForm() {
        return {
            idVal: $("fr11FormId").value,
            title: $("fr11FormTitle").value.trim(),
            platform: $("fr11FormPlatform").value,
            date: $("fr11FormDate").value,
            time: $("fr11FormTime").value,
            owner: $("fr11FormOwner") ? $("fr11FormOwner").value : ""
        };
    }

    function handleModalSubmit(e) {
        e.preventDefault();
        showEl("fr11ModalError", false);
        const f = readForm();
        const ev = f.idVal ? findEvent(f.idVal) : null;

        if (!f.title || !f.date || !f.time) { showError("Vui lòng điền đầy đủ tiêu đề, ngày và giờ đăng bài."); return; }

        if (ev && !canEditFields(ev)) { showError("Lịch này đã được xác nhận, bạn không thể tự thay đổi."); return; }

        const changedTime = !ev || ev.date !== f.date || ev.time !== f.time;
        if (isPast(f.date, f.time)) { showError("Thời gian đăng bài không được nằm trong quá khứ. Vui lòng chọn thời gian trong tương lai."); return; }

        if (!ev) {
            const id = Date.now();
            const owner = isMgr ? Scope.STAFF.find(function (s) { return s.username === f.owner; }) : null;
            const entry = {
                id: id, code: "LCH-" + String(id).slice(-5), title: f.title, date: f.date, time: f.time, platform: f.platform,
                status: isMgr ? "SCHEDULED" : "PENDING",
                author: isMgr ? (owner ? owner.fullName : me.fullName) : me.fullName,
                owner_username: isMgr ? (owner ? owner.username : me.username) : me.username,
                created_by: me.username
            };
            if (isMgr) { entry.reviewed_by = me.fullName; entry.reviewed_at = new Date().toISOString(); }
            state.events.push(entry);
            persist();
            if (isMgr) {
                if (entry.owner_username && !Scope.sameUser(entry.owner_username, me.username)) {
                    notifyOwner("approved", "Lịch đăng đã được xác nhận", "Manager đã tạo lịch đăng chính thức cho bài “" + entry.title + "” lúc " + when(entry) + " (" + entry.platform + ").", entry);
                }
                Scope.runReminders();
            } else {
                notifyManagers("submitted", "Có lịch đăng mới cần xác nhận", me.fullName + " đề xuất đăng “" + entry.title + "” lúc " + when(entry) + " (" + entry.platform + ").", entry);
            }
        } else {
            const old = when(ev) + " · " + ev.platform;
            const wasEditing = ev.status === "EDITING";
            ev.title = f.title; ev.platform = f.platform; ev.date = f.date; ev.time = f.time;
            if (changedTime || old.indexOf(ev.platform) === -1) ev.remind_sent = false;

            if (isMgr) {
                if ((changedTime || old.split(" · ")[1] !== ev.platform) && ev.owner_username && !Scope.sameUser(ev.owner_username, me.username)) {
                    notifyOwner("revision", "Lịch đăng đã được thay đổi", "Lịch đăng “" + ev.title + "” đã được điều chỉnh: " + old + " → " + when(ev) + " · " + ev.platform + ".", ev);
                }
            } else {
                ev.status = "PENDING";
                ev.last_change_reason = ev.change_reason || ev.last_change_reason;
                ev.change_reason = "";
                notifyManagers("submitted", "Nhân viên đã cập nhật lịch đăng",
                    me.fullName + " " + (wasEditing ? "đã cập nhật lịch theo yêu cầu" : "cập nhật lịch") + " “" + ev.title + "” sang " + when(ev) + " (" + ev.platform + ") – chờ xác nhận.", ev);
            }
            persist();
        }

        closeScheduleModal();
        render();

        const target = ev || state.events[state.events.length - 1];
        const others = conflictsOf(target, target.id);
        if (others.length) {
            notifyManagers("conflict", "Có lịch đăng bị trùng", "Lịch “" + target.title + "” (" + when(target) + " · " + target.platform + ") bị trùng với “" + others[0].title + "” (" + others[0].time + ").", target);
            toast("warning", "Cảnh báo trùng lịch", conflictWarningText(target, others));
        } else {
            toast("success", isMgr ? "Đã lưu lịch đăng" : "Đã gửi lịch đề xuất", isMgr ? "Lịch đăng bài đã được cập nhật." : "Manager sẽ xác nhận hoặc phản hồi cho bạn.");
        }
    }

    async function handleConfirmClick() {
        const ev = findEvent($("fr11FormId").value);
        if (!ev || !isMgr) return;
        // Cho phép Manager vừa chỉnh giờ vừa xác nhận, nhưng luôn chặn thời gian ở quá khứ
        const f = readForm();
        const checkDate = f.date || ev.date;
        const checkTime = f.time || ev.time;
        if (isPast(checkDate, checkTime)) { showError("Thời gian đăng bài không được nằm trong quá khứ. Vui lòng chọn thời gian trong tương lai."); return; }
        if (f.title && f.date && f.time && (ev.date !== f.date || ev.time !== f.time || ev.platform !== f.platform || ev.title !== f.title)) {
            ev.title = f.title; ev.platform = f.platform; ev.date = f.date; ev.time = f.time;
        }
        const ok = await confirmEvent(ev);
        if (ok) closeScheduleModal();
    }

    function handleRequestChangeClick() {
        const ev = findEvent($("fr11FormId").value);
        if (!ev || !isMgr) return;
        if (!state.reasonMode) { startReasonMode(); return; }
        const reason = $("fr11FormReason").value.trim();
        if (!reason) { showError("Vui lòng nhập lý do yêu cầu thay đổi để nhân viên biết cần sửa gì."); return; }
        requestChange(ev, reason);
        closeScheduleModal();
    }

    /* ---------------------------------------------------------
       Xử lý xung đột tự động (chỉ Manager)
       --------------------------------------------------------- */
    function resolveConflicts() {
        if (!isMgr) return;
        let adjusted = 0;
        for (let pass = 0; pass < 6; pass++) {
            const { pairs } = detectConflicts(state.events);
            if (!pairs.length) break;
            const p = pairs[0];
            // Ưu tiên dời lịch chưa xác nhận; nếu cùng trạng thái thì dời lịch đến sau
            const rank = function (e) { return e.status === "SCHEDULED" ? 1 : 0; };
            let mover = rank(p.a) !== rank(p.b) ? (rank(p.a) < rank(p.b) ? p.a : p.b)
                : (parseMinutes(p.a.time) <= parseMinutes(p.b.time) ? p.b : p.a);
            const stay = mover === p.a ? p.b : p.a;
            const old = when(mover);
            mover.time = formatMinutes(parseMinutes(stay.time) + CONFLICT_MINUTES);
            mover.remind_sent = false;
            if (mover.owner_username && !Scope.sameUser(mover.owner_username, me.username)) {
                notifyOwner("revision", "Lịch đăng đã được thay đổi", "Lịch đăng “" + mover.title + "” được dời từ " + old + " sang " + when(mover) + " để tránh trùng giờ.", mover);
            }
            adjusted++;
        }
        persist();
        render();
        if (adjusted) toast("success", "Đã giãn cách lịch", "Đã tự động dời " + adjusted + " lịch cách nhau tối thiểu " + CONFLICT_MINUTES + " phút.");
    }

    /* ---------------------------------------------------------
       Khởi tạo
       --------------------------------------------------------- */
    function stepPeriod(dir) {
        const c = state.cursor;
        if (state.mode === "WEEK") state.cursor = Scope.addDays(c, 7 * dir);
        else if (state.mode === "DAY") state.cursor = Scope.addDays(c, dir);
        else state.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
        render();
    }

    function initFilters() {
        const staffSel = $("staffFilterSelect");
        if (staffSel) {
            if (!isMgr) {
                staffSel.hidden = true;   // Staff không có bộ lọc nhân viên
            } else {
                const names = Scope.STAFF.slice();
                state.events.forEach(function (e) {
                    const k = Scope.ownerOf(e);
                    if (k && !names.some(function (s) { return s.username === k; })) names.push({ username: k, fullName: e.author || k });
                });
                staffSel.innerHTML = '<option value="ALL">Tất cả nhân viên</option>' + names.map(function (s) {
                    return '<option value="' + esc(s.username) + '">' + esc(s.fullName) + '</option>';
                }).join("");
                staffSel.addEventListener("change", function () { state.staffFilter = staffSel.value; render(); });
            }
        }
        const ch = $("channelFilterSelect");
        if (ch) ch.addEventListener("change", function () { state.channelFilter = ch.value; render(); });
        const st = $("statusFilterSelect");
        if (st) st.addEventListener("change", function () { state.statusFilter = st.value; render(); });
    }

    function init() {
        reload();
        initFilters();

        document.querySelectorAll("[data-cal-mode]").forEach(function (btn) {
            btn.addEventListener("click", function () { state.mode = btn.getAttribute("data-cal-mode") || "MONTH"; render(); });
        });

        const prev = $("btnCalendarPrev"), next = $("btnCalendarNext"), today = $("btnCalendarToday");
        if (prev) prev.addEventListener("click", function () { stepPeriod(-1); });
        if (next) next.addEventListener("click", function () { stepPeriod(1); });
        if (today) today.addEventListener("click", function () { state.cursor = new Date(); render(); });

        const add = $("btnAddSchedule");
        if (add) add.addEventListener("click", function () { openScheduleModal(null); });

        const resolve = $("btnResolveConflict");
        if (resolve) resolve.addEventListener("click", resolveConflicts);

        const reset = $("btnResetCalendar");
        if (reset) reset.hidden = true;

        $("btnCloseScheduleModal").addEventListener("click", closeScheduleModal);
        $("btnCancelScheduleModal").addEventListener("click", closeScheduleModal);
        $("fr11ScheduleForm").addEventListener("submit", handleModalSubmit);
        $("btnConfirmSchedule").addEventListener("click", handleConfirmClick);
        $("btnRequestChange").addEventListener("click", handleRequestChangeClick);
        ["fr11FormDate", "fr11FormTime", "fr11FormPlatform"].forEach(function (id) {
            $(id).addEventListener("input", refreshModalConflict);
            $(id).addEventListener("change", refreshModalConflict);
        });

        // Đồng bộ khi dữ liệu thay đổi ở tab khác / sau khi nhắc lịch
        global.addEventListener("storage", function (e) {
            if (e.key === Scope.CAL_KEY || e.key === Scope.POSTS_KEY) { reload(); render(); }
        });
        global.addEventListener("blossom_events_updated", function () { reload(); render(); });

        render();
    }

    global.CalendarApp = {
        init: init,
        getState: function () { return state; },
        simulateDragDrop: function (id, date, time) { return applyMove(id, date, time); },
        setMode: function (m) { state.mode = m; render(); },
        resolveConflicts: resolveConflicts
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window);
