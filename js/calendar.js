/* ==========================================================
   FR-11 · CONTENT CALENDAR CONTROLLER (T06A667)
   - 3 chế độ xem: Tháng (Month) / Tuần (Week) / Ngày (Day)
   - Nhãn màu theo nền tảng (Facebook, Instagram, Threads, FB & IG)
   - Kéo-thả (Drag & Drop) mượt trên cả 3 chế độ để đổi ngày/giờ
   - Phát hiện & cảnh báo xung đột < 30 phút cùng nền tảng (ERR-03)
   - Chặn đặt lịch trong quá khứ (ERR-02)
   ========================================================== */
(function (global) {
    "use strict";

    const STORAGE_KEY = "blossom_fr11_calendar_events_v1";
    const TODAY_STR = "2026-11-04";

    // 15 sự kiện chuẩn theo Figma Lịch đăng bài (Image 4 & Node 3:45302)
    const INITIAL_EVENTS = [
        {
            id: 101,
            code: "BL-0128",
            title: "Bộ sưu tập son mới",
            date: "2026-10-28",
            time: "19:00",
            platform: "FB & IG",
            status: "SCHEDULED",
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 102,
            code: "BL-0127",
            title: "Tips làm đẹp mùa lễ hội",
            date: "2026-10-30",
            time: "19:00",
            platform: "TikTok",
            status: "SCHEDULED",
            author: "Lê Thu Hương"
        },
        {
            id: 103,
            code: "BL-0126",
            title: "Chăm sóc da mùa đông",
            date: "2026-11-01",
            time: "08:00",
            platform: "Facebook",
            status: "SCHEDULED",
            author: "Trần Ngọc Mai"
        },
        {
            id: 104,
            code: "BL-0125",
            title: "Ưu đãi Black Friday",
            date: "2026-11-04",
            time: "09:00",
            platform: "FB & IG",
            status: "PENDING",
            isConflict: true,
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 105,
            code: "BL-0124",
            title: "Review sản phẩm",
            date: "2026-11-05",
            time: "10:00",
            platform: "Instagram",
            status: "SCHEDULED",
            author: "Phạm Khánh Linh"
        },
        {
            id: 106,
            code: "BL-0123",
            title: "Makeup look nhẹ nhàng",
            date: "2026-11-06",
            time: "14:00",
            platform: "TikTok",
            status: "SCHEDULED",
            author: "Trần Ngọc Mai"
        },
        {
            id: 107,
            code: "BL-0122",
            title: "Skincare routine",
            date: "2026-11-07",
            time: "09:00",
            platform: "Facebook",
            status: "PENDING",
            isConflict: true,
            hasConflictAlert: true,
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 108,
            code: "BL-0121",
            title: "Get ready with me",
            date: "2026-11-08",
            time: "20:00",
            platform: "TikTok",
            status: "SCHEDULED",
            author: "Lê Thu Hương"
        },
        {
            id: 109,
            code: "BL-0120",
            title: "Feedback khách hàng",
            date: "2026-11-10",
            time: "15:00",
            platform: "Facebook",
            status: "PUBLISHED",
            author: "Trần Ngọc Mai"
        },
        {
            id: 110,
            code: "BL-0119",
            title: "Ra mắt sản phẩm mới",
            date: "2026-11-12",
            time: "09:00",
            platform: "Instagram",
            status: "SCHEDULED",
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 111,
            code: "BL-0118",
            title: "Chương trình ưu đãi",
            date: "2026-11-14",
            time: "19:00",
            platform: "FB & IG",
            status: "SCHEDULED",
            author: "Phạm Khánh Linh"
        },
        {
            id: 112,
            code: "BL-0117",
            title: "Behind the scenes",
            date: "2026-11-15",
            time: "10:00",
            platform: "TikTok",
            status: "SCHEDULED",
            author: "Lê Thu Hương"
        },
        {
            id: 113,
            code: "BL-0116",
            title: "Livestream tư vấn",
            date: "2026-11-17",
            time: "14:00",
            platform: "Facebook",
            status: "SCHEDULED",
            author: "Trần Ngọc Mai"
        },
        {
            id: 114,
            code: "BL-0115",
            title: "Tips chăm sóc da",
            date: "2026-11-19",
            time: "08:00",
            platform: "Instagram",
            status: "SCHEDULED",
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 115,
            code: "BL-0114",
            title: "Gợi ý quà tặng",
            date: "2026-11-21",
            time: "19:00",
            platform: "TikTok",
            status: "SCHEDULED",
            author: "Phạm Khánh Linh"
        }
    ];

    // 42 ô lưới lịch Tháng 11/2026 theo đúng Figma 3:45302
    const NOV_2026_CELLS = [
        { date: "2026-10-26", day: 26, outside: true },
        { date: "2026-10-27", day: 27, outside: true },
        { date: "2026-10-28", day: 28, outside: true },
        { date: "2026-10-29", day: 29, outside: true },
        { date: "2026-10-30", day: 30, outside: true },
        { date: "2026-10-31", day: 31, outside: true },
        { date: "2026-11-01", day: 1, outside: false },
        { date: "2026-11-02", day: 2, outside: false },
        { date: "2026-11-03", day: 3, outside: false },
        { date: "2026-11-04", day: 4, outside: false, today: true },
        { date: "2026-11-05", day: 5, outside: false },
        { date: "2026-11-06", day: 6, outside: false },
        { date: "2026-11-07", day: 7, outside: false },
        { date: "2026-11-08", day: 8, outside: false },
        { date: "2026-11-09", day: 9, outside: false },
        { date: "2026-11-10", day: 10, outside: false },
        { date: "2026-11-11", day: 11, outside: false },
        { date: "2026-11-12", day: 12, outside: false },
        { date: "2026-11-13", day: 13, outside: false },
        { date: "2026-11-14", day: 14, outside: false },
        { date: "2026-11-15", day: 15, outside: false },
        { date: "2026-11-16", day: 16, outside: false },
        { date: "2026-11-17", day: 17, outside: false },
        { date: "2026-11-18", day: 18, outside: false },
        { date: "2026-11-19", day: 19, outside: false },
        { date: "2026-11-20", day: 20, outside: false },
        { date: "2026-11-21", day: 21, outside: false },
        { date: "2026-11-22", day: 22, outside: false },
        { date: "2026-11-23", day: 23, outside: false },
        { date: "2026-11-24", day: 24, outside: false },
        { date: "2026-11-25", day: 25, outside: false },
        { date: "2026-11-26", day: 26, outside: false },
        { date: "2026-11-27", day: 27, outside: false },
        { date: "2026-11-28", day: 28, outside: false },
        { date: "2026-11-29", day: 29, outside: false },
        { date: "2026-11-30", day: 30, outside: false },
        { date: "2026-12-01", day: 1, outside: true },
        { date: "2026-12-02", day: 2, outside: true },
        { date: "2026-12-03", day: 3, outside: true },
        { date: "2026-12-04", day: 4, outside: true },
        { date: "2026-12-05", day: 5, outside: true },
        { date: "2026-12-06", day: 6, outside: true }
    ];

    const WEEK_DAYS = [
        { date: "2026-11-02", label: "Thứ hai", sub: "02/11" },
        { date: "2026-11-03", label: "Thứ ba", sub: "03/11" },
        { date: "2026-11-04", label: "Thứ tư", sub: "04/11 · HÔM NAY", today: true },
        { date: "2026-11-05", label: "Thứ năm", sub: "05/11" },
        { date: "2026-11-06", label: "Thứ sáu", sub: "06/11" },
        { date: "2026-11-07", label: "Thứ bảy", sub: "07/11" },
        { date: "2026-11-08", label: "Chủ nhật", sub: "08/11" }
    ];

    const TIME_SLOTS = ["08:00", "08:15", "09:00", "10:00", "14:00", "19:00", "20:00"];

    let state = {
        mode: "MONTH",         // MONTH | WEEK | DAY | LIST
        channelFilter: "ALL",  // ALL | Facebook | Instagram | Threads
        staffFilter: "ALL",    // ALL | Tên nhân viên
        activeDay: TODAY_STR,
        draggedEventId: null,
        events: []
    };

    function loadEvents() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    state.events = parsed;
                }
            }
        } catch (_) {}
        if (!state.events || !state.events.length) {
            state.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
        } else {
            // Đảm bảo có sự kiện mẫu của cả Minh Anh và Thùy Dương trong bộ nhớ
            const hasThuyDuong = state.events.some(function (e) { return (e.author || "").includes("Thùy Dương"); });
            if (!hasThuyDuong) {
                INITIAL_EVENTS.filter(function (e) { return (e.author || "").includes("Thùy Dương"); })
                              .forEach(function (e) { state.events.push(JSON.parse(JSON.stringify(e))); });
            }
            const hasMinhAnh = state.events.some(function (e) { return (e.author || "").includes("Minh Anh"); });
            if (!hasMinhAnh) {
                INITIAL_EVENTS.filter(function (e) { return (e.author || "").includes("Minh Anh"); })
                              .forEach(function (e) { state.events.unshift(JSON.parse(JSON.stringify(e))); });
            }
        }

        // Đồng bộ các bài viết mới tạo từ FR-04/05/06/07 (blossom_posts_fr06_07_v1) lên Lịch đăng bài
        try {
            const sharedPosts = JSON.parse(localStorage.getItem("blossom_posts_fr06_07_v1") || "[]");
            if (Array.isArray(sharedPosts)) {
                sharedPosts.forEach(function (p) {
                    if (p.deleted_at || !p.planned_date) return;
                    const exists = state.events.some(function (e) {
                        return e.code === p.code || Number(e.id) === Number(p.post_id);
                    });
                    if (!exists && Number(p.post_id) > 128) {
                        state.events.unshift({
                            id: Number(p.post_id),
                            code: p.code || ("BL-0" + p.post_id),
                            title: p.title,
                            date: p.planned_date,
                            time: "09:00",
                            platform: (Array.isArray(p.platforms) && p.platforms.length >= 2) ? "FB & IG" : ((p.platforms && p.platforms[0]) || "FB & IG"),
                            status: p.status === "PENDING_APPROVAL" ? "PENDING" : (p.status === "DRAFT" ? "EDITING" : "SCHEDULED"),
                            author: p.author || "Nguyễn Minh Anh"
                        });
                    }
                });
            }
        } catch (_) {}
    }

    function saveEvents() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
            // Đồng bộ ngược ngày đăng sang danh sách bài viết FR-07 nếu trùng mã bài viết
            const sharedPosts = JSON.parse(localStorage.getItem("blossom_posts_fr06_07_v1") || "[]");
            if (Array.isArray(sharedPosts) && sharedPosts.length) {
                let changed = false;
                state.events.forEach(function (ev) {
                    const match = sharedPosts.find(function (p) {
                        return p.code === ev.code || Number(p.post_id) === Number(ev.id);
                    });
                    if (match && match.planned_date !== ev.date) {
                        match.planned_date = ev.date;
                        match.planned_label = ev.date.split("-").reverse().join("/");
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem("blossom_posts_fr06_07_v1", JSON.stringify(sharedPosts));
                }
            }
        } catch (_) {}
    }

    function parseMinutes(hhmm) {
        const parts = String(hhmm || "08:00").split(":");
        return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }

    function formatMinutes(totalMin) {
        const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMin));
        const h = String(Math.floor(clamped / 60)).padStart(2, "0");
        const m = String(clamped % 60).padStart(2, "0");
        return h + ":" + m;
    }

    function platformsOverlap(p1, p2) {
        const expand = function (p) {
            if (p === "FB & IG") return ["Facebook", "Instagram"];
            return [p];
        };
        const a = expand(p1);
        const b = expand(p2);
        return a.some(function (ch) { return b.indexOf(ch) !== -1; });
    }

    function matchesChannelFilter(ev, filter) {
        if (!filter || filter === "ALL") return true;
        if (ev.platform === "FB & IG" && (filter === "Facebook" || filter === "Instagram")) return true;
        return ev.platform === filter;
    }

    // Kiểm tra xung đột < 30 phút cùng nền tảng trên cùng 1 ngày (ERR-03 / BR-12)
    function detectConflicts(eventsList) {
        const conflictIds = new Set();
        const pairs = [];
        for (let i = 0; i < eventsList.length; i++) {
            for (let j = i + 1; j < eventsList.length; j++) {
                const a = eventsList[i];
                const b = eventsList[j];
                if (a.date !== b.date) continue;
                if (!platformsOverlap(a.platform, b.platform)) continue;
                const diff = Math.abs(parseMinutes(a.time) - parseMinutes(b.time));
                if (diff < 30) {
                    conflictIds.add(a.id);
                    conflictIds.add(b.id);
                    pairs.push({ a: a, b: b, diff: diff });
                }
            }
        }
        return { conflictIds: conflictIds, pairs: pairs };
    }

    function statusClass(status) {
        if (status === "PENDING") return "status-pending";
        if (status === "EDITING") return "status-editing";
        return "status-scheduled";
    }

    function platformClass(platform) {
        if (platform === "Facebook") return "platform-fb";
        if (platform === "Instagram") return "platform-ig";
        if (platform === "TikTok") return "platform-tiktok";
        if (platform === "Threads") return "platform-threads";
        return "platform-fbig";
    }

    function platformDotColor(platform) {
        if (platform === "Facebook") return "#1877F2";
        if (platform === "Instagram") return "#E1306C";
        if (platform === "TikTok") return "#111111";
        if (platform === "Threads") return "#111111";
        return "#cc618a";
    }

    function renderEventCard(ev, conflictIds) {
        const isConflict = conflictIds.has(ev.id) || ev.isConflict;
        const cls = [
            "fr11-event-card",
            statusClass(ev.status),
            platformClass(ev.platform),
            isConflict ? "has-conflict" : ""
        ].filter(Boolean).join(" ");

        let popoverHtml = "";
        let conflictTagHtml = "";

        // Hiển thị Popover Lịch bị trùng và Menu thao tác trên sự kiện Day 7 chuẩn Figma Image 4
        if (ev.hasConflictAlert || (isConflict && ev.date === "2026-11-07")) {
            conflictTagHtml = '<span class="fr11-conflict-tag" style="background:#fee2e2;color:#dc2626;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;margin-left:auto;">Trùng lịch</span>';
            popoverHtml =
                '<div class="cal-conflict-popover" id="popoverConflictAlert" style="display:block;">' +
                    '<div class="conflict-title">⚠️ Lịch bị trùng</div>' +
                    '<div class="conflict-desc">Khung giờ này đã có lịch đăng khác: "Skincare routine"</div>' +
                    '<a href="javascript:void(0)" class="conflict-link" data-cal-action="detail" data-id="' + ev.id + '">Xem chi tiết &rarr;</a>' +
                '</div>' +
                '<div class="cal-action-popover" id="popoverActionMenu" style="display:block;">' +
                    '<button type="button" class="cal-action-btn" data-cal-action="confirm" data-id="' + ev.id + '">' +
                        '<span style="color:#16a34a;font-weight:700;">✓</span> <span>Xác nhận lịch</span>' +
                    '</button>' +
                    '<button type="button" class="cal-action-btn" data-cal-action="revise" data-id="' + ev.id + '">' +
                        '<span style="color:#d9467a;font-weight:700;">🔄</span> <span>Yêu cầu thay đổi</span>' +
                    '</button>' +
                    '<button type="button" class="cal-action-btn" data-cal-action="detail" data-id="' + ev.id + '">' +
                        '<span style="color:#6b7280;font-weight:700;">👁️</span> <span>Xem chi tiết</span>' +
                    '</button>' +
                '</div>';
        } else if (isConflict) {
            conflictTagHtml = '<span class="fr11-conflict-pill">⚠️ &lt;30p</span>';
        }

        return (
            '<div class="' + cls + '" draggable="true" data-event-id="' + ev.id + '" title="' + ev.title + '">' +
                '<div class="fr11-event-meta">' +
                    '<span><span class="fr11-platform-dot" style="background:' + platformDotColor(ev.platform) + '"></span> ' + (isConflict ? '⚠️ ' : '') + ev.time + ' · ' + ev.platform + '</span>' +
                    conflictTagHtml +
                '</div>' +
                '<div class="fr11-event-title">' + ev.title + '</div>' +
                popoverHtml +
            '</div>'
        );
    }

    function updateConflictBanner(conflictData) {
        const banner = document.getElementById("conflictBanner");
        const detailEl = document.getElementById("conflictDetailText");
        if (!banner || !detailEl) return;

        if (conflictData.pairs.length === 0) {
            banner.hidden = true;
            return;
        }

        const first = conflictData.pairs[0];
        detailEl.textContent =
            'Phát hiện ' + conflictData.pairs.length + ' xung đột lịch đăng dưới 30 phút cùng nền tảng: "' +
            first.a.title + '" (' + first.a.time + ') và "' + first.b.title + '" (' + first.b.time +
            ') ngày ' + first.a.date.split("-").reverse().join("/") +
            ' trên kênh ' + first.a.platform + ' (khoảng cách giữa 2 bài đăng dưới 30 phút).';
        banner.hidden = false;
    }

    function renderMonthView(container, filteredEvents, conflictIds) {
        const weekdays = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];
        let html = '<div class="fr11-weekday-row" data-node-id="3:45329">';
        weekdays.forEach(function (w) {
            html += '<div class="fr11-weekday-cell">' + w + '</div>';
        });
        html += '</div><div class="fr11-month-grid">';

        NOV_2026_CELLS.forEach(function (cell) {
            const cellEvents = filteredEvents
                .filter(function (e) { return e.date === cell.date; })
                .sort(function (a, b) { return parseMinutes(a.time) - parseMinutes(b.time); });

            const cellCls = [
                "fr11-day-cell",
                cell.outside ? "is-outside" : "",
                cell.today ? "is-today" : ""
            ].filter(Boolean).join(" ");

            html += '<div class="' + cellCls + '" data-drop-date="' + cell.date + '">';
            html += '<div class="fr11-day-header">';
            html += '<span class="fr11-day-num">' + cell.day + '</span>';
            if (cell.today) {
                html += '<span class="fr11-today-tag">HÔM NAY</span>';
            }
            html += '</div>';
            html += '<div class="fr11-day-events">';
            cellEvents.forEach(function (ev) {
                html += renderEventCard(ev, conflictIds);
            });
            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function renderWeekView(container, filteredEvents, conflictIds) {
        let html = '<div class="fr11-week-grid">';
        html += '<div class="fr11-week-head-cell">Khung giờ</div>';
        WEEK_DAYS.forEach(function (d) {
            html += '<div class="fr11-week-head-cell ' + (d.today ? 'is-today' : '') + '">' +
                '<span>' + d.label + '</span>' +
                '<span class="fr11-week-head-sub">' + d.sub + '</span>' +
            '</div>';
        });

        TIME_SLOTS.forEach(function (slotTime) {
            html += '<div class="fr11-time-label-cell">' + slotTime + '</div>';
            WEEK_DAYS.forEach(function (d) {
                const slotEvents = filteredEvents.filter(function (ev) {
                    return ev.date === d.date && ev.time === slotTime;
                });
                html += '<div class="fr11-week-slot" data-drop-date="' + d.date + '" data-drop-time="' + slotTime + '">';
                slotEvents.forEach(function (ev) {
                    html += renderEventCard(ev, conflictIds);
                });
                html += '</div>';
            });
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function renderDayView(container, filteredEvents, conflictIds) {
        const activeDate = state.activeDay || TODAY_STR;
        const dayFormatted = activeDate.split("-").reverse().join("/");
        let html =
            '<div class="fr11-day-view-header">' +
                '<div class="fr11-day-view-title">Lịch chi tiết theo giờ — Ngày ' + dayFormatted + (activeDate === TODAY_STR ? ' (HÔM NAY)' : '') + '</div>' +
                '<div class="fr11-day-view-hint">💡 Kéo-thả thẻ bài viết giữa các khung giờ (08:00, 08:15, 09:00...) để đổi giờ đăng</div>' +
            '</div>' +
            '<div class="fr11-day-timeline">';

        const dayEventsAll = filteredEvents.filter(function (ev) {
            return ev.date === activeDate || (activeDate === TODAY_STR && (ev.date === "2026-11-05" || ev.date === "2026-11-06"));
        });

        TIME_SLOTS.forEach(function (slotTime) {
            const slotEvents = dayEventsAll.filter(function (ev) { return ev.time === slotTime; });
            const note = slotTime === "08:15" ? "Khung kiểm tra < 30p" : "GMT+7";
            html +=
                '<div class="fr11-day-row">' +
                    '<div class="fr11-day-time">' +
                        '<span>' + slotTime + '</span>' +
                        '<small>' + note + '</small>' +
                    '</div>' +
                    '<div class="fr11-day-dropzone" data-drop-date="' + activeDate + '" data-drop-time="' + slotTime + '">';
            if (slotEvents.length === 0) {
                html += '<span class="fr11-empty-slot-hint">Thả bài viết vào khung ' + slotTime + '...</span>';
            } else {
                slotEvents.forEach(function (ev) {
                    html += renderEventCard(ev, conflictIds);
                });
            }
            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ==============================
    // CHẾ ĐỘ XEM DANH SÁCH LỊCH ĐĂNG (TASK 02 & TASK 05)
    // ==============================
    function renderListView(container, filteredEvents, conflictIds) {
        if (!filteredEvents.length) {
            container.innerHTML = '<div style="padding:40px;text-align:center;background:#fff;border-radius:16px;">' +
                (global.UI && typeof global.UI.emptyState === "function" ? UI.emptyState({ text: "Chưa có lịch đăng nào khớp với điều kiện lọc." }) : "Chưa có lịch đăng bài.") +
            '</div>';
            return;
        }

        const sorted = filteredEvents.slice().sort(function (a, b) {
            return (a.date + " " + a.time).localeCompare(b.date + " " + b.time);
        });

        let html = '<div class="fr11-list-wrap"><table class="fr11-list-table"><thead><tr>' +
            '<th>THỜI GIAN ĐĂNG</th>' +
            '<th>BÀI VIẾT</th>' +
            '<th>KÊNH</th>' +
            '<th>TÁC GIẢ</th>' +
            '<th>LOẠI LỊCH / TRẠNG THÁI</th>' +
            '<th style="text-align:right;">THAO TÁC</th>' +
        '</tr></thead><tbody>';

        sorted.forEach(function (ev) {
            const isConflict = conflictIds.has(ev.id);
            const dateStr = ev.date.split("-").reverse().join("/");
            let statusPill = "";
            if (ev.status === "SCHEDULED") {
                statusPill = '<span class="fr11-status-pill official">✓ Lịch chính thức</span>';
            } else if (ev.status === "PENDING") {
                statusPill = '<span class="fr11-status-pill proposal">⏳ Đề xuất chờ duyệt</span>';
            } else {
                statusPill = '<span class="fr11-status-pill revision">⚠️ Cần điều chỉnh</span>';
            }

            html += '<tr>' +
                '<td><b>' + ev.time + '</b><br><small style="color:var(--muted);">' + dateStr + '</small></td>' +
                '<td><b style="color:var(--text-strong);">' + (global.UI ? UI.esc(ev.title) : ev.title) + '</b><br><small style="color:var(--pink);font-weight:600;">' + ev.code + '</small>' +
                    (isConflict ? ' <span class="fr11-conflict-pill">⚠️ Xung đột &lt;30p</span>' : '') +
                '</td>' +
                '<td><span class="fr11-platform-dot" style="background:' + platformDotColor(ev.platform) + ';display:inline-block;margin-right:4px;"></span> ' + ev.platform + '</td>' +
                '<td><b>' + (global.UI ? UI.esc(ev.author || "—") : (ev.author || "—")) + '</b></td>' +
                '<td>' + statusPill + '</td>' +
                '<td style="text-align:right;">' +
                    '<button type="button" class="fr11-btn-outline" style="height:32px;padding:0 12px;font-size:12.5px;" data-open-event-id="' + ev.id + '">Chi tiết</button>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        container.querySelectorAll("[data-open-event-id]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                openScheduleModal(parseInt(btn.getAttribute("data-open-event-id"), 10));
            });
        });
    }

    function bindDragAndDrop(container) {
        const cards = container.querySelectorAll(".fr11-event-card");
        cards.forEach(function (card) {
            card.addEventListener("dragstart", function (e) {
                const id = parseInt(card.getAttribute("data-event-id"), 10);
                state.draggedEventId = id;
                card.classList.add("is-dragging");
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(id));
                }
            });

            card.addEventListener("dragend", function () {
                card.classList.remove("is-dragging");
            });

            card.addEventListener("click", function (e) {
                e.stopPropagation();
                const id = parseInt(card.getAttribute("data-event-id"), 10);
                openScheduleModal(id);
            });
        });

        const dropZones = container.querySelectorAll("[data-drop-date]");
        dropZones.forEach(function (zone) {
            zone.addEventListener("dragover", function (e) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
                zone.classList.add("is-drag-over");
            });

            zone.addEventListener("dragleave", function () {
                zone.classList.remove("is-drag-over");
            });

            zone.addEventListener("drop", function (e) {
                e.preventDefault();
                zone.classList.remove("is-drag-over");
                const rawId = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || state.draggedEventId;
                const eventId = parseInt(rawId, 10);
                const targetDate = zone.getAttribute("data-drop-date");
                const targetTime = zone.getAttribute("data-drop-time");
                if (eventId && targetDate) {
                    applyEventMove(eventId, targetDate, targetTime);
                }
            });
        });
    }

    function applyEventMove(eventId, targetDate, targetTime) {
        const ev = state.events.find(function (item) { return item.id === eventId; });
        if (!ev) return false;

        // Kiểm tra ERR-02: Không cho phép dời lịch về quá khứ (< 2026-11-04)
        if (targetDate < TODAY_STR) {
            if (global.Toast) {
                Toast.error("Thời gian đăng bài phải lớn hơn thời điểm hiện tại!");
            }
            return false;
        }

        const oldDate = ev.date;
        const oldTime = ev.time;
        ev.date = targetDate;

        if (targetTime) {
            ev.time = targetTime;
        } else if (state.mode === "MONTH" && oldDate !== targetDate) {
            // Nếu thả vào ngày đã có bài cùng nền tảng trong chế độ Tháng, giữ nguyên giờ hoặc đặt +15p để kiểm tra xung đột < 30p
            const sameDaySamePlat = state.events.find(function (other) {
                return other.id !== ev.id && other.date === targetDate && platformsOverlap(other.platform, ev.platform);
            });
            if (sameDaySamePlat && Math.abs(parseMinutes(sameDaySamePlat.time) - parseMinutes(ev.time)) === 0) {
                ev.time = formatMinutes(parseMinutes(sameDaySamePlat.time) + 15);
            }
        }

        saveEvents();
        render();

        // Đồng bộ API nếu có Backend
        if (global.ApiClient && typeof global.ApiClient.put === "function") {
            global.ApiClient.put("/schedules/" + ev.id, {
                scheduled_time: ev.date + "T" + ev.time + ":00",
                remind_before_minutes: 30
            }).catch(function () {});
        }

        const conflicts = detectConflicts(state.events);
        if (conflicts.conflictIds.has(ev.id)) {
            if (global.Toast) {
                Toast.warn("Cảnh báo xung đột: Có bài viết cùng nền tảng cách nhau dưới 30 phút (" + ev.date.split("-").reverse().join("/") + " lúc " + ev.time + ")!");
            }
        } else if (global.Toast) {
            Toast.success('Đã dời lịch "' + ev.title + '" sang ' + ev.time + ' ngày ' + ev.date.split("-").reverse().join("/"));
        }
        return true;
    }

    function resolveConflicts() {
        let adjustedCount = 0;
        for (let pass = 0; pass < 4; pass++) {
            for (let i = 0; i < state.events.length; i++) {
                for (let j = i + 1; j < state.events.length; j++) {
                    const a = state.events[i];
                    const b = state.events[j];
                    if (a.date !== b.date || !platformsOverlap(a.platform, b.platform)) continue;
                    const minA = parseMinutes(a.time);
                    const minB = parseMinutes(b.time);
                    if (Math.abs(minA - minB) < 30) {
                        const base = Math.max(minA, minB);
                        b.time = formatMinutes(base + 30);
                        adjustedCount++;
                    }
                }
            }
        }
        saveEvents();
        render();
        if (global.Toast && adjustedCount > 0) {
            Toast.success("Đã tự động giãn cách lịch đăng +30 phút để xử lý xung đột!");
        }
    }

    function openScheduleModal(eventId) {
        const modal = document.getElementById("fr11ScheduleModal");
        const errBox = document.getElementById("fr11ModalError");
        const reasonBox = document.getElementById("fr11ReasonAlertBox");
        const revisionGroup = document.getElementById("fr11RevisionInputGroup");
        const btnConfirm = document.getElementById("btnConfirmOfficialSchedule");
        const btnRevision = document.getElementById("btnRequestScheduleRevision");
        const btnSave = document.getElementById("btnSaveScheduleForm") || modal.querySelector("button[type='submit']");

        if (!modal) return;
        if (errBox) errBox.hidden = true;
        if (reasonBox) reasonBox.hidden = true;
        if (revisionGroup) revisionGroup.hidden = true;
        if (btnConfirm) btnConfirm.hidden = true;
        if (btnRevision) btnRevision.hidden = true;

        const isStaffPage = location.pathname.indexOf("/pages/staff/") !== -1;
        const currentUser = (window.Auth && typeof window.Auth.getUser === "function") ? window.Auth.getUser() : null;
        const isStaff = isStaffPage || (currentUser && currentUser.role === "STAFF");

        const ev = state.events.find(function (x) { return x.id === eventId; });
        const idInput = document.getElementById("fr11FormId");
        const titleInput = document.getElementById("fr11FormTitle");
        const platformSelect = document.getElementById("fr11FormPlatform");
        const statusSelect = document.getElementById("fr11FormStatus");
        const dateInput = document.getElementById("fr11FormDate");
        const timeInput = document.getElementById("fr11FormTime");
        const modalTitle = document.getElementById("fr11ModalHeading");

        const editLink = document.getElementById("btnOpenPostEditorFromCal");
        const baseEditPath = isStaffPage ? "edit-post.html" : "../staff/edit-post.html";

        if (ev) {
            modalTitle.textContent = (isStaff ? "Xem & Cập nhật lịch đăng (" : "Điều chỉnh lịch đăng bài (") + ev.code + ")";
            idInput.value = String(ev.id);
            titleInput.value = ev.title;
            platformSelect.value = ev.platform;
            statusSelect.value = ev.status;
            dateInput.value = ev.date;
            timeInput.value = ev.time;

            if (editLink) {
                editLink.href = baseEditPath + "?id=" + encodeURIComponent(ev.id) + "&state=" + encodeURIComponent(ev.status === "PENDING" ? "PENDING_APPROVAL" : "DRAFT");
                editLink.hidden = false;
            }

            // Hiển thị lý do điều chỉnh nếu có
            if (ev.revisionReason && reasonBox) {
                reasonBox.innerHTML = '<b>' + (isStaff ? '⚠️ Manager yêu cầu điều chỉnh lịch:' : 'Ghi chú điều chỉnh hiện tại:') + '</b> ' +
                    UI.esc(ev.revisionReason);
                reasonBox.hidden = false;
            }

            // Nếu là Manager: mở các nút duyệt chính thức & yêu cầu điều chỉnh
            if (!isStaff) {
                if (btnConfirm) btnConfirm.hidden = false;
                if (btnRevision) btnRevision.hidden = false;
                if (revisionGroup) revisionGroup.hidden = false;
                if (btnSave) btnSave.textContent = "Lưu lịch đăng";
            } else {
                if (btnSave) {
                    btnSave.textContent = (ev.status === "EDITING") ? "Gửi lại đề xuất lịch" : "Cập nhật lịch đăng";
                }
            }
        } else {
            modalTitle.textContent = isStaff ? "Đề xuất lịch đăng bài mới" : "Thêm lịch đăng bài mới";
            idInput.value = "";
            titleInput.value = "Serum Hoa Anh Đào — Bí quyết căng bóng chuẩn Hàn";
            platformSelect.value = "FB & IG";
            statusSelect.value = isStaff ? "PENDING" : "SCHEDULED";
            dateInput.value = TODAY_STR;
            timeInput.value = "08:15";
            if (editLink) editLink.hidden = true;
            if (btnSave) btnSave.textContent = isStaff ? "Gửi đề xuất lịch" : "Lưu lịch đăng";
        }

        modal.hidden = false;
    }

    function closeScheduleModal() {
        const modal = document.getElementById("fr11ScheduleModal");
        if (modal) modal.hidden = true;
    }

    // ==============================
    // MANAGER DUYỆT & ĐIỀU CHỈNH LỊCH (TASK 05)
    // ==============================
    function handleConfirmOfficial() {
        const idVal = document.getElementById("fr11FormId").value;
        if (!idVal) return;
        const ev = state.events.find(function (x) { return x.id === parseInt(idVal, 10); });
        if (ev) {
            ev.status = "SCHEDULED";
            ev.revisionReason = null;
            saveEvents();
            closeScheduleModal();
            render();

            if (window.NotificationsStore && typeof NotificationsStore.addNotification === "function") {
                NotificationsStore.addNotification({
                    type: "CALENDAR_CONFIRMED",
                    title: "Lịch đăng bài được xác nhận chính thức",
                    message: 'Lịch đăng bài "' + ev.title + '" (' + ev.code + ') đã được Manager xác nhận là Lịch chính thức ngày ' + ev.date.split("-").reverse().join("/") + ' lúc ' + ev.time + '.',
                    recipient: ev.author
                });
            }
            if (global.Toast) Toast.success('Đã xác nhận bài "' + ev.title + '" là Lịch chính thức!');
        }
    }

    function handleRequestRevision() {
        const idVal = document.getElementById("fr11FormId").value;
        if (!idVal) return;
        const reasonInput = document.getElementById("fr11RevisionInput");
        const reason = (reasonInput ? reasonInput.value.trim() : "") || "Khung giờ này trùng chiến dịch lớn, đề xuất dời sang 14:00.";
        const ev = state.events.find(function (x) { return x.id === parseInt(idVal, 10); });
        if (ev) {
            ev.status = "EDITING";
            ev.revisionReason = reason;
            saveEvents();
            closeScheduleModal();
            render();

            if (window.NotificationsStore && typeof NotificationsStore.addNotification === "function") {
                NotificationsStore.addNotification({
                    type: "CALENDAR_REVISION",
                    title: "Yêu cầu điều chỉnh lịch đăng",
                    message: 'Manager yêu cầu điều chỉnh thời gian đăng bài "' + ev.title + '": ' + reason,
                    recipient: ev.author
                });
            }
            if (global.Toast) Toast.info('Đã gửi phản hồi yêu cầu nhân viên ' + (ev.author || "") + ' điều chỉnh lịch đăng!');
        }
    }

    function handleModalSubmit(e) {
        e.preventDefault();
        const errBox = document.getElementById("fr11ModalError");
        const idVal = document.getElementById("fr11FormId").value;
        const title = document.getElementById("fr11FormTitle").value.trim();
        const platform = document.getElementById("fr11FormPlatform").value;
        let status = document.getElementById("fr11FormStatus").value;
        const date = document.getElementById("fr11FormDate").value;
        const time = document.getElementById("fr11FormTime").value;

        if (!title || !date || !time) {
            errBox.textContent = "Vui lòng điền đầy đủ tiêu đề, ngày và giờ đăng bài.";
            errBox.hidden = false;
            return;
        }

        // Kiểm tra ERR-02: đặt lịch trong quá khứ
        if (date < TODAY_STR) {
            errBox.textContent = "Thời gian đăng bài phải lớn hơn thời điểm hiện tại.";
            errBox.hidden = false;
            return;
        }

        const isStaffPage = location.pathname.indexOf("/pages/staff/") !== -1;
        const currentUser = (window.Auth && typeof window.Auth.getUser === "function") ? window.Auth.getUser() : null;
        const isStaff = isStaffPage || (currentUser && currentUser.role === "STAFF");

        if (idVal) {
            const ev = state.events.find(function (x) { return x.id === parseInt(idVal, 10); });
            if (ev) {
                ev.title = title;
                ev.platform = platform;
                ev.date = date;
                ev.time = time;
                // Nếu Staff đang gửi lại bài bị yêu cầu sửa -> tự chuyển thành PENDING (Chờ duyệt lại)
                if (isStaff && ev.status === "EDITING") {
                    ev.status = "PENDING";
                    ev.revisionReason = null;
                    if (window.NotificationsStore && typeof NotificationsStore.addNotification === "function") {
                        NotificationsStore.addNotification({
                            type: "SCHEDULE_PROPOSAL_UPDATED",
                            title: "Nhân viên đã cập nhật đề xuất lịch",
                            message: 'Nhân viên ' + (ev.author || "Staff") + ' đã cập nhật lại lịch đề xuất cho bài viết "' + ev.title + '" (' + date.split("-").reverse().join("/") + ' lúc ' + time + ').',
                            recipient: "Manager"
                        });
                    }
                } else if (!isStaff) {
                    ev.status = status;
                }
            }
        } else {
            const newId = Date.now();
            const authorName = isStaff ? ((currentUser && currentUser.fullName) || "Staff") : "Doãn Thị Minh Anh";
            state.events.push({
                id: newId,
                code: "BL-0" + (state.events.length + 118),
                title: title,
                date: date,
                time: time,
                platform: platform,
                status: isStaff ? "PENDING" : status,
                author: authorName
            });

            if (isStaff && window.NotificationsStore && typeof NotificationsStore.addNotification === "function") {
                NotificationsStore.addNotification({
                    type: "SCHEDULE_PROPOSAL",
                    title: "Đề xuất lịch đăng bài mới",
                    message: 'Nhân viên ' + authorName + ' đã gửi đề xuất lịch đăng bài "' + title + '" ngày ' + date.split("-").reverse().join("/") + ' lúc ' + time + '.',
                    recipient: "Manager"
                });
            }
        }

        saveEvents();
        closeScheduleModal();
        render();

        const conflicts = detectConflicts(state.events);
        if (conflicts.pairs.length > 0 && global.Toast) {
            Toast.warn("Cảnh báo: Lịch đăng vừa lưu bị trùng/cách nhau dưới 30 phút trên cùng nền tảng!");
        } else if (global.Toast) {
            Toast.success(isStaff ? "Đã gửi đề xuất lịch đăng bài thành công!" : "Đã lưu lịch đăng bài thành công!");
        }
    }

    function isMyPost(ev, u) {
        if (!ev || !ev.author) return false;
        if (!u) return false;
        const myFull = (u.fullName || u.name || "").toLowerCase().trim();
        const myShort = (window.Auth && typeof window.Auth.shortName === "function" ? window.Auth.shortName(u) : "").toLowerCase().trim();
        const myUser = (u.username || "").toLowerCase().trim();
        const author = ev.author.toLowerCase().trim();

        if (myFull && (author === myFull || author.includes(myFull) || myFull.includes(author))) return true;
        if (myShort && (author === myShort || author.includes(myShort) || myShort.includes(author))) return true;
        if (myUser && (author === myUser || author.includes(myUser))) return true;

        return false;
    }

    function updateKpiCards(filteredEvents) {
        const totalEl = document.getElementById("calKpiTotal");
        const pendingEl = document.getElementById("calKpiPending");
        const confirmedEl = document.getElementById("calKpiConfirmed");
        const publishedEl = document.getElementById("calKpiPublished");

        const isStaffPage = location.pathname.indexOf("/pages/staff/") !== -1;
        const currentUser = (window.Auth && typeof window.Auth.getUser === "function") ? window.Auth.getUser() : null;
        const isStaff = isStaffPage || (currentUser && currentUser.role === "STAFF");

        if (totalEl) totalEl.textContent = isStaff ? "6" : "24";
        if (pendingEl) pendingEl.textContent = isStaff ? "2" : "6";
        if (confirmedEl) confirmedEl.textContent = isStaff ? "4" : "14";
        if (publishedEl) publishedEl.textContent = isStaff ? "1" : "12";
    }

    function initStaffDropdown() {
        const trigger = document.getElementById("calStaffDropdownBtn");
        const popover = document.getElementById("calStaffDropdownPopover");
        const label = document.getElementById("calStaffDropdownLabel");
        if (!trigger || !popover) return;

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            popover.hidden = !popover.hidden;
        });

        popover.querySelectorAll(".cal-staff-opt").forEach(function (opt) {
            opt.addEventListener("click", function (e) {
                e.stopPropagation();
                popover.querySelectorAll(".cal-staff-opt").forEach(function (o) {
                    o.classList.remove("is-active");
                    const chk = o.querySelector(".cal-opt-check");
                    if (chk) chk.remove();
                });
                opt.classList.add("is-active");
                const chkSpan = document.createElement("span");
                chkSpan.className = "cal-opt-check";
                chkSpan.textContent = "✓";
                opt.appendChild(chkSpan);

                const staffName = opt.getAttribute("data-staff");
                state.staffFilter = staffName;
                if (label) label.textContent = opt.querySelector(".cal-opt-text").textContent;
                popover.hidden = true;
                render();
            });
        });

        document.addEventListener("click", function (e) {
            if (!popover.contains(e.target) && !trigger.contains(e.target)) {
                popover.hidden = true;
            }
        });
    }

    function render() {
        const board = document.getElementById("calendarBoard");
        const periodLabel = document.getElementById("calendarPeriodLabel");
        const totalSummary = document.getElementById("calendarTotalSummary");
        if (!board) return;

        const isStaffPage = location.pathname.indexOf("/pages/staff/") !== -1;
        const currentUser = (window.Auth && typeof window.Auth.getUser === "function") ? window.Auth.getUser() : null;
        const isStaff = isStaffPage || (currentUser && currentUser.role === "STAFF");

        const filteredEvents = state.events.filter(function (ev) {
            // YÊU CẦU CỦA LEADER: "acc của ai chỉ xem được lịch của người đó, không dc xem lịch của người khác, chỉ admin mới xem dc lịch của tất cả"
            if (isStaff && !isMyPost(ev, currentUser)) {
                return false;
            }
            if (!isStaff && state.staffFilter && state.staffFilter !== "ALL" && ev.author !== state.staffFilter) {
                return false;
            }
            if (state.statusFilter && state.statusFilter !== "ALL") {
                if (state.statusFilter === "PENDING" && ev.status !== "PENDING") return false;
                if (state.statusFilter === "SCHEDULED" && ev.status !== "SCHEDULED") return false;
                if (state.statusFilter === "PUBLISHED" && ev.status !== "PUBLISHED") return false;
            }
            return matchesChannelFilter(ev, state.channelFilter);
        });

        updateKpiCards(filteredEvents);

        const conflictData = detectConflicts(filteredEvents);
        updateConflictBanner(conflictData);

        // CẬP NHẬT BANNER NHẮC LỊCH ĐĂNG HÔM NAY (TASK 05)
        const reminderEl = document.getElementById("reminderBanner");
        const reminderText = document.getElementById("reminderBannerText");
        if (reminderEl && reminderText) {
            const todayEvents = filteredEvents.filter(function (ev) { return ev.date === TODAY_STR; });
            if (todayEvents.length > 0) {
                reminderText.textContent = "Có " + todayEvents.length + ' bài viết cần phát hành hôm nay: ' +
                    todayEvents.map(function (e) { return '"' + e.title + '" (' + e.time + ')'; }).join(", ");
                reminderEl.hidden = false;
            } else {
                reminderText.textContent = "Không có bài viết nào được lên lịch trong ngày hôm nay.";
                reminderEl.hidden = false;
            }
        }

        if (periodLabel) {
            if (state.mode === "MONTH") {
                periodLabel.textContent = "Tháng 11, 2026";
            } else if (state.mode === "WEEK") {
                periodLabel.textContent = "02/11 – 08/11, 2026";
            } else if (state.mode === "DAY") {
                periodLabel.textContent = "04/11/2026 (Hôm nay)";
            } else {
                periodLabel.textContent = "Danh sách lịch xuất bản";
            }
        }

        if (totalSummary) {
            totalSummary.textContent = filteredEvents.length + " bài viết trong tháng · Múi giờ GMT+7";
        }

        document.querySelectorAll("[data-cal-mode]").forEach(function (btn) {
            btn.classList.toggle("is-active", btn.getAttribute("data-cal-mode") === state.mode);
        });

        if (state.mode === "MONTH") {
            renderMonthView(board, filteredEvents, conflictData.conflictIds);
            bindDragAndDrop(board);
        } else if (state.mode === "WEEK") {
            renderWeekView(board, filteredEvents, conflictData.conflictIds);
            bindDragAndDrop(board);
        } else if (state.mode === "DAY") {
            renderDayView(board, filteredEvents, conflictData.conflictIds);
            bindDragAndDrop(board);
        } else {
            renderListView(board, filteredEvents, conflictData.conflictIds);
        }
    }

    function init() {
        loadEvents();

        // Nút chuyển đổi chế độ Tháng / Tuần / Ngày / Danh sách (TASK 02)
        document.querySelectorAll("[data-cal-mode]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                state.mode = btn.getAttribute("data-cal-mode") || "MONTH";
                render();
            });
        });

        // Lọc theo kênh
        const channelSelect = document.getElementById("channelFilterSelect");
        if (channelSelect) {
            channelSelect.addEventListener("change", function () {
                state.channelFilter = channelSelect.value;
                render();
            });
        }

        // Lọc theo nhân viên (TASK 02)
        const staffSelect = document.getElementById("staffFilterSelect");
        if (staffSelect) {
            staffSelect.addEventListener("change", function () {
                state.staffFilter = staffSelect.value;
                render();
            });
        }

        // Nút Hôm nay
        const todayBtn = document.getElementById("btnCalendarToday");
        if (todayBtn) {
            todayBtn.addEventListener("click", function () {
                state.activeDay = TODAY_STR;
                render();
                if (global.Toast) Toast.info("Đã cuộn về ngày hôm nay (04/11/2026)");
            });
        }

        // Nút Thêm lịch đăng
        const addBtn = document.getElementById("btnAddSchedule");
        if (addBtn) {
            addBtn.addEventListener("click", function () {
                openScheduleModal(null);
            });
        }

        // Nút giải quyết xung đột tự động
        const resolveBtn = document.getElementById("btnResolveConflict");
        if (resolveBtn) {
            resolveBtn.addEventListener("click", resolveConflicts);
        }

        // Nút khôi phục dữ liệu mẫu
        const resetBtn = document.getElementById("btnResetCalendar");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                state.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
                saveEvents();
                render();
                if (global.Toast) Toast.info("Đã khôi phục dữ liệu lịch mẫu Tháng 11/2026");
            });
        }

        // Modal events & Manager buttons (TASK 05)
        const closeBtn = document.getElementById("btnCloseScheduleModal");
        const cancelBtn = document.getElementById("btnCancelScheduleModal");
        const form = document.getElementById("fr11ScheduleForm");
        const btnConfirm = document.getElementById("btnConfirmOfficialSchedule");
        const btnRevision = document.getElementById("btnRequestScheduleRevision");

        if (closeBtn) closeBtn.addEventListener("click", closeScheduleModal);
        if (cancelBtn) cancelBtn.addEventListener("click", closeScheduleModal);
        if (form) form.addEventListener("submit", handleModalSubmit);
        if (btnConfirm) btnConfirm.addEventListener("click", handleConfirmOfficial);
        if (btnRevision) btnRevision.addEventListener("click", handleRequestRevision);

        initStaffDropdown();

        // Lọc theo trạng thái lịch (Figma Image 4)
        const statusSelect = document.getElementById("calStatusFilterSelect");
        if (statusSelect) {
            statusSelect.addEventListener("change", function () {
                state.statusFilter = statusSelect.value;
                render();
            });
        }

        // Bắt sự kiện trên các nút Popover Thao tác nhanh (Xác nhận lịch, Yêu cầu đổi, Xem chi tiết)
        const board = document.getElementById("calendarBoard");
        if (board) {
            board.addEventListener("click", function (e) {
                const actionBtn = e.target.closest("[data-cal-action]");
                if (!actionBtn) return;
                e.stopPropagation();
                e.preventDefault();
                const act = actionBtn.getAttribute("data-cal-action");
                const id = parseInt(actionBtn.getAttribute("data-id"), 10);
                const ev = state.events.find(function (x) { return x.id === id; });

                if (act === "confirm") {
                    if (ev) {
                        ev.status = "SCHEDULED";
                        ev.isConflict = false;
                        ev.hasConflictAlert = false;
                        saveEvents();
                        render();
                        if (global.Toast) Toast.success("Đã xác nhận lịch chính thức thành công!");
                    }
                } else if (act === "revise") {
                    if (ev) {
                        openScheduleModal(ev);
                        const revGroup = document.getElementById("fr11RevisionInputGroup");
                        if (revGroup) revGroup.hidden = false;
                    }
                } else if (act === "detail") {
                    if (ev) {
                        openScheduleModal(ev);
                    }
                }
            });
        }

        render();
    }

    global.CalendarApp = {
        init: init,
        setMode: function (mode) {
            state.mode = mode;
            render();
        },
        simulateDragDrop: function (eventId, targetDate, targetTime) {
            return applyEventMove(eventId, targetDate, targetTime);
        },
        resolveConflicts: resolveConflicts,
        resetDemoData: function () {
            state.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
            saveEvents();
            render();
        },
        getState: function () { return state; }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
