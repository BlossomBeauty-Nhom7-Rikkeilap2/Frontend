/* ==========================================================
   BÁO CÁO & THỐNG KÊ — TỰ ĐỘNG TÍNH TOÁN ĐỒNG BỘ SỐ LIỆU THỰC TẾ
   Mọi thẻ KPI, biểu đồ 12 tháng, biểu đồ tròn 3 kênh và bảng xếp hạng
   đều tính trực tiếp từ danh sách bài viết đang được lọc.
   ========================================================== */
(function (global) {
    "use strict";

    const CHANNEL_META = [
        { name: "Facebook",  color: "#cc618a" },
        { name: "Instagram", color: "#f4b8ce" },
        { name: "Threads",   color: "#24122e" }
    ];

    let state = {
        period: "2026-11",   // 2026-11 | 2026-10 | 2026-Q4 | 2026-ALL | EMPTY
        platform: "ALL",     // ALL | Facebook | Instagram | Threads
        staff: "ALL"         // ALL | Doãn Thị Minh Anh | Nguyễn Hà Linh | Trần Ngọc Mai | Lê Thu Hương
    };

    let backendRankingPosts = null;

    function mapBackendRow(r) {
        const pubIso = r.published_at || "";
        const period = pubIso.length >= 7 ? pubIso.slice(0, 7) : "2026-11";
        const month = pubIso.length >= 7 ? (parseInt(pubIso.slice(5, 7), 10) || 11) : 11;
        const reach = Number(r.reach) || 0;
        const engagement = (Number(r.likes) || 0) + (Number(r.comments) || 0) + (Number(r.shares) || 0);
        const rate = reach > 0 ? Number(((engagement / reach) * 100).toFixed(2)) : 0;

        let channel = "Facebook";
        const pLower = String(r.platform || "").toLowerCase();
        if (pLower.indexOf("insta") !== -1) channel = "Instagram";
        else if (pLower.indexOf("thread") !== -1) channel = "Threads";

        return {
            id: Number(r.post_id),
            code: "BL-0" + r.post_id,
            title: r.title || "",
            author: r.author || "Chưa rõ",
            period: period,
            month: month,
            reach: reach,
            engagement: engagement,
            rate: rate,
            channel: channel
        };
    }

    async function loadBackendAnalytics() {
        if (!global.BlossomAPI || !global.BlossomAPI.getToken()) return;
        try {
            const rows = await global.BlossomAPI.request("/analytics/export");
            if (Array.isArray(rows) && rows.length > 0) {
                backendRankingPosts = rows.map(mapBackendRow);
                renderDashboard();
            }
        } catch (err) {
            console.warn("[Reports] Backend analytics load fallback:", err.message);
        }
    }

    function formatNumber(n) {
        return Number(n || 0).toLocaleString("vi-VN");
    }

    function getAllRankingPosts() {
        return Array.isArray(backendRankingPosts) ? backendRankingPosts.slice() : [];
    }

    function getFilteredData() {
        if (state.period === "EMPTY") return [];
        return getAllRankingPosts().filter(function (item) {
            if (state.period === "2026-11" && item.period !== "2026-11") return false;
            if (state.period === "2026-10" && item.period !== "2026-10") return false;
            if (state.period === "2026-Q4" && (item.month < 10 || item.month > 12)) return false;
            if (state.platform !== "ALL" && item.channel !== state.platform) return false;
            if (state.staff !== "ALL" && item.author !== state.staff) return false;
            return true;
        });
    }

    function renderTrendChart(filtered) {
        const plotEl = document.getElementById("trendPlotCanvas");
        const yAxisEl = document.getElementById("trendYAxis");
        const bigTotalEl = document.getElementById("trendTotalPosts");
        if (!plotEl) return;

        // Tính số liệu bài viết thực tế theo 12 tháng từ dữ liệu Backend
        const monthlyCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        filtered.forEach(function (x) {
            const idx = (Number(x.month) || 1) - 1;
            if (idx >= 0 && idx < 12) monthlyCounts[idx] += 1;
        });

        const totalYearPosts = monthlyCounts.reduce(function (s, n) { return s + n; }, 0);
        if (bigTotalEl) {
            bigTotalEl.textContent = formatNumber(filtered.length) + " bài viết (kỳ lọc) · " + formatNumber(totalYearPosts) + " bài cả năm";
        }

        const maxVal = Math.max(6, Math.ceil(Math.max.apply(null, monthlyCounts) / 2) * 2);
        if (yAxisEl) {
            yAxisEl.innerHTML =
                "<span>" + maxVal + "</span>" +
                "<span>" + Math.round(maxVal * 2 / 3) + "</span>" +
                "<span>" + Math.round(maxVal / 3) + "</span>" +
                "<span>0</span>";
        }

        const W = 690;
        const H = 190;
        const padX = 24;
        const padTop = 18;
        const padBot = 10;
        const usableW = W - padX * 2;
        const usableH = H - padTop - padBot;

        const points = monthlyCounts.map(function (val, i) {
            const x = padX + (i / 11) * usableW;
            const y = padTop + usableH - (val / maxVal) * usableH;
            return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val: val, label: "T" + (i + 1) };
        });

        const linePath = points.map(function (pt, i) {
            return (i === 0 ? "M" : "L") + pt.x + "," + pt.y;
        }).join(" ");

        const areaPath = linePath + " L" + points[points.length - 1].x + "," + (H - padBot) + " L" + points[0].x + "," + (H - padBot) + " Z";

        const gridLines = [0, 0.33, 0.66, 1].map(function (ratio) {
            const gy = (padTop + usableH * ratio).toFixed(1);
            return '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="#f4dce4" stroke-width="1" />';
        }).join("");

        const circles = points.map(function (pt) {
            return (
                '<g>' +
                    '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="4.5" fill="#ffffff" stroke="#d9467a" stroke-width="2.2">' +
                        '<title>' + pt.label + ': ' + pt.val + ' bài viết</title>' +
                    '</circle>' +
                    (pt.val > 0 ? '<text x="' + pt.x + '" y="' + Math.max(12, pt.y - 9) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#574b50">' + pt.val + '</text>' : '') +
                '</g>'
            );
        }).join("");

        plotEl.innerHTML =
            '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="190" preserveAspectRatio="none" style="display:block;overflow:visible;">' +
                '<defs>' +
                    '<linearGradient id="blossomTrendGrad" x1="0" y1="0" x2="0" y2="1">' +
                        '<stop offset="0%" stop-color="#d9467a" stop-opacity="0.22" />' +
                        '<stop offset="100%" stop-color="#d9467a" stop-opacity="0.01" />' +
                    '</linearGradient>' +
                '</defs>' +
                gridLines +
                '<path d="' + areaPath + '" fill="url(#blossomTrendGrad)" />' +
                '<path d="' + linePath + '" fill="none" stroke="#d9467a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />' +
                circles +
            '</svg>';
    }

    function renderDonutAndChannels(filtered) {
        const ringEl = document.getElementById("donutRing");
        const totalEl = document.getElementById("donutTotalText");
        const listEl = document.getElementById("fr15ChannelList");

        const totalsByChannel = { Facebook: 0, Instagram: 0, Threads: 0 };
        filtered.forEach(function (item) {
            if (totalsByChannel[item.channel] !== undefined) {
                totalsByChannel[item.channel] += item.engagement;
            }
        });

        const grandTotal = totalsByChannel.Facebook + totalsByChannel.Instagram + totalsByChannel.Threads;
        if (totalEl) totalEl.textContent = formatNumber(grandTotal);

        let accPct = 0;
        const stops = [];
        const rowsHtml = [];

        CHANNEL_META.forEach(function (ch) {
            const val = totalsByChannel[ch.name] || 0;
            const pct = grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;
            const start = accPct;
            const end = Math.min(100, accPct + (grandTotal > 0 ? (val / grandTotal) * 100 : 0));
            accPct = end;
            stops.push(ch.color + " " + start.toFixed(1) + "% " + end.toFixed(1) + "%");

            rowsHtml.push(
                '<div class="fr15-channel-row">' +
                    '<span class="fr15-channel-name">' +
                        '<span class="fr15-channel-dot" style="background:' + ch.color + '"></span>' +
                        ch.name +
                    '</span>' +
                    '<span class="fr15-channel-stats">' +
                        '<span class="fr15-channel-val">' + formatNumber(val) + '</span>' +
                        '<span class="fr15-channel-pct">' + pct + '%</span>' +
                    '</span>' +
                '</div>'
            );
        });

        if (ringEl) {
            ringEl.style.background = grandTotal > 0
                ? ("conic-gradient(" + stops.join(", ") + ")")
                : "#f4dce4";
        }
        if (listEl) {
            listEl.innerHTML = rowsHtml.join("");
        }
    }

    function renderDashboard() {
        const filtered = getFilteredData();
        const emptyCard = document.getElementById("fr15EmptyState");
        const mainContent = document.getElementById("fr15MainDashboard");

        const kpiPosts = document.getElementById("kpiPublishedPosts");
        const kpiReach = document.getElementById("kpiTotalReach");
        const kpiEng = document.getElementById("kpiTotalEngagement");
        const kpiRate = document.getElementById("kpiEngagementRate");

        if (filtered.length === 0) {
            if (kpiPosts) kpiPosts.textContent = "0";
            if (kpiReach) kpiReach.textContent = "0";
            if (kpiEng) kpiEng.textContent = "0";
            if (kpiRate) kpiRate.textContent = "0%";
            if (emptyCard) emptyCard.hidden = false;
            if (mainContent) mainContent.hidden = true;
            return;
        }

        if (emptyCard) emptyCard.hidden = true;
        if (mainContent) mainContent.hidden = false;

        // Tính tổng thực tế 100% khớp giữa 4 thẻ KPI, biểu đồ tròn 3 kênh, biểu đồ đường và bảng xếp hạng
        const sumReach = filtered.reduce(function (s, x) { return s + x.reach; }, 0);
        const sumEng = filtered.reduce(function (s, x) { return s + x.engagement; }, 0);
        const avgRate = sumReach > 0 ? ((sumEng / sumReach) * 100).toFixed(2).replace(".", ",") + "%" : "0%";

        if (kpiPosts) kpiPosts.textContent = formatNumber(filtered.length);
        if (kpiReach) kpiReach.textContent = formatNumber(sumReach);
        if (kpiEng) kpiEng.textContent = formatNumber(sumEng);
        if (kpiRate) kpiRate.textContent = avgRate;

        renderTrendChart(filtered);
        renderDonutAndChannels(filtered);

        // Render Bảng xếp hạng Bài viết nổi bật sắp theo tương tác giảm dần
        const sorted = filtered.slice().sort(function (a, b) { return b.engagement - a.engagement; });
        const tableBody = document.getElementById("fr15TopPostsBody");
        if (tableBody) {
            tableBody.innerHTML = sorted.map(function (item) {
                const channelClass = (item.channel || "facebook").toLowerCase();
                return (
                    '<div class="fr15-top-row">' +
                        '<div class="fr15-top-post-info">' +
                            '<span class="fr15-top-post-title" data-view-id="' + encodeURIComponent(item.id) + '">' +
                                UI.esc(item.title) +
                            '</span>' +
                            '<span class="fr15-top-post-meta">' + UI.esc(item.code + " · " + item.author) + '</span>' +
                        '</div>' +
                        '<span class="fr15-top-num">' + formatNumber(item.reach) + '</span>' +
                        '<span class="fr15-top-num">' + formatNumber(item.engagement) + '</span>' +
                        '<span class="fr15-top-rate">' + String(item.rate).replace(".", ",") + '%</span>' +
                        '<div><span class="fr15-channel-badge ' + channelClass + '">' + UI.esc(item.channel) + '</span></div>' +
                        '<div class="fr15-top-actions">' +
                            '<button type="button" class="btn btn--secondary btn--sm btn-view-report-detail" data-view-id="' + encodeURIComponent(item.id) + '" style="font-size:12px;padding:5px 12px;">' +
                                'Chi tiết' +
                            '</button>' +
                        '</div>' +
                    '</div>'
                );
            }).join("");

            // Gắn sự kiện click xem chi tiết bài viết
            tableBody.querySelectorAll("[data-view-id]").forEach(function (el) {
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    const postId = this.dataset.viewId;
                    if (window.openPostDetailModal) {
                        window.openPostDetailModal(postId);
                    } else if (window.PostDetailModal && window.PostDetailModal.open) {
                        window.PostDetailModal.open(postId);
                    } else {
                        location.href = "posts.html?highlight=" + encodeURIComponent(postId);
                    }
                });
            });
        }
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 300);
    }

    async function handleExport(format) {
        const menu = document.getElementById("fr15ExportMenu");
        if (menu) menu.hidden = true;

        const filtered = getFilteredData();
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

        if (format === "pdf") {
            window.print();
            UI.toast("info", "Xuất báo cáo PDF", "Đang mở cửa sổ in / xuất PDF trang thống kê.");
            return;
        }

        const rows = [
            ["BÁO CÁO THỐNG KÊ HIỆU QUẢ NỘI DUNG ĐA KÊNH - BLOSSOM BEAUTY STORE"],
            ["Thời điểm xuất: " + new Date().toLocaleString("vi-VN")],
            ["Kỳ báo cáo: " + state.period, "Kênh: " + state.platform, "Nhân sự: " + state.staff],
            [],
            ["Mã bài viết", "Tiêu đề bài viết", "Tác giả", "Kênh mạng xã hội", "Lượt tiếp cận", "Tổng tương tác", "Tỷ lệ tương tác (%)"]
        ];
        filtered.forEach(function (it) {
            rows.push([it.code, it.title, it.author, it.channel, it.reach, it.engagement, it.rate + "%"]);
        });

        const csvContent = "\ufeff" + rows.map(function (r) {
            return r.map(function (cell) {
                return '"' + String(cell ?? "").replace(/"/g, '""') + '"';
            }).join(",");
        }).join("\r\n");

        let ext = format === "xlsx" || format === "excel" ? "xlsx" : "csv";
        let mime = ext === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;"
            : "text/csv;charset=utf-8;";

        const blob = new Blob([csvContent], { type: mime });
        const filename = "Bao_Cao_Thong_Ke_Blossom_" + dateStamp + "." + ext;
        triggerDownload(blob, filename);

        UI.toast("success", "Xuất báo cáo thành công", "Tệp " + filename + " đã sẵn sàng.");
    }

    function bindEvents() {
        const periodSel = document.getElementById("reportPeriodSelect");
        const platSel = document.getElementById("reportPlatformSelect");
        const staffSel = document.getElementById("reportStaffSelect");

        if (periodSel) {
            periodSel.addEventListener("change", function () {
                state.period = periodSel.value;
                renderDashboard();
            });
        }
        if (platSel) {
            platSel.addEventListener("change", function () {
                state.platform = platSel.value;
                renderDashboard();
            });
        }
        if (staffSel) {
            staffSel.addEventListener("change", function () {
                state.staff = staffSel.value;
                renderDashboard();
            });
        }

        const resetBtn = document.getElementById("btnResetReportFilters");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                state.period = "2026-11";
                state.platform = "ALL";
                state.staff = "ALL";
                if (periodSel) periodSel.value = "2026-11";
                if (platSel) platSel.value = "ALL";
                if (staffSel) staffSel.value = "ALL";
                renderDashboard();
                UI.toast("info", "Đã đặt lại bộ lọc", "Hiển thị dữ liệu Tháng 11, 2026.");
            });
        }

        const exportBtn = document.getElementById("btnExportReport");
        const exportMenu = document.getElementById("fr15ExportMenu");
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                exportMenu.hidden = !exportMenu.hidden;
            });
            document.addEventListener("click", function () {
                exportMenu.hidden = true;
            });
        }

        document.querySelectorAll("[data-export-fmt]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                handleExport(btn.getAttribute("data-export-fmt"));
            });
        });
    }

    global.ReportsApp = {
        setFilters: function (opts) {
            if (opts.period) {
                state.period = opts.period;
                const el = document.getElementById("reportPeriodSelect");
                if (el) el.value = opts.period;
            }
            if (opts.platform) {
                state.platform = opts.platform;
                const el = document.getElementById("reportPlatformSelect");
                if (el) el.value = opts.platform;
            }
            if (opts.staff) {
                state.staff = opts.staff;
                const el = document.getElementById("reportStaffSelect");
                if (el) el.value = opts.staff;
            }
            renderDashboard();
        },
        exportReport: handleExport
    };

    function initFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get("period")) state.period = params.get("period");
            if (params.get("platform")) state.platform = params.get("platform");
            if (params.get("channel")) state.platform = params.get("channel");
            if (params.get("staff")) state.staff = params.get("staff");

            const periodSel = document.getElementById("reportPeriodSelect");
            const platSel = document.getElementById("reportPlatformSelect");
            const staffSel = document.getElementById("reportStaffSelect");

            if (periodSel && state.period) periodSel.value = state.period;
            if (platSel && state.platform) platSel.value = state.platform;
            if (staffSel && state.staff) staffSel.value = state.staff;
        } catch (_) {}
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            initFromUrl();
            bindEvents();
            renderDashboard();
            loadBackendAnalytics();
        });
    } else {
        initFromUrl();
        bindEvents();
        renderDashboard();
        loadBackendAnalytics();
    }
})(window);
