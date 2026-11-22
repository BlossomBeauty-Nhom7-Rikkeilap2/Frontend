/* =========================================================
   FR-04 & FR-05 · TẠO & CHỈNH SỬA BÀI VIẾT (Task T06A660)
   - Form nhiều nền tảng (Facebook, Instagram, Threads)
   - Upload & kiểm tra định dạng/dung lượng: JPG/PNG/WEBP (≤ 10MB), MP4/MOV (≤ 50MB)
   - Auto-save tự động mỗi 30 giây + lưu tạm LocalStorage
   - Live Preview đa nền tảng
   - Chặn chỉnh sửa bài viết đã Published (ERR-01)
   - Cảnh báo & chuyển bài đã Approved về Pending Approval khi sửa (BR-04/BR-05)
   ========================================================= */
(function () {
    "use strict";

    const POSTS_STORAGE_KEY = "blossom_posts_fr06_07_v1";
    const AUTOSAVE_DRAFT_KEY = "blossom_autosave_draft_v1";
    const AUTOSAVE_INTERVAL_SEC = 30;

    // Danh sách bài viết dùng chung (đọc/ghi qua Scope để mọi trang cùng một nguồn dữ liệu)
    function getSharedPostList() {
        return Scope.loadPosts();
    }

    function getPostListHref() {
        return "posts.html";
    }

    const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
    const ALLOWED_VIDEO_EXT = [".mp4", ".mov"];
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

    const isEditMode = document.body.dataset.editorMode === "edit";
    let currentPostStatus = "DRAFT";
    let currentPostId = null;
    let currentMedia = null;      // null = chưa tải ảnh/video nào
    let originalPlanned = "";     // giờ đăng khi mở bài (để biết người dùng có đổi giờ không)
    let activePreviewTab = "Facebook";
    let countdownRemaining = AUTOSAVE_INTERVAL_SEC;

    function formatTimeNow() {
        const d = new Date();
        return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }

    function getSelectedPlatforms() {
        const boxes = document.querySelectorAll('#platformCheckboxes input[type="checkbox"]:checked');
        return Array.prototype.map.call(boxes, function (b) { return b.value; });
    }

    function setSelectedPlatforms(platforms) {
        const list = Array.isArray(platforms) ? platforms : ["Facebook", "Instagram"];
        const boxes = document.querySelectorAll('#platformCheckboxes input[type="checkbox"]');
        boxes.forEach(function (box) {
            box.checked = list.indexOf(box.value) !== -1;
        });
        syncPlatformPresetSelect();
    }

    function syncPlatformPresetSelect() {
        const plats = getSelectedPlatforms();
        const select = document.getElementById("platformSelect");
        if (plats.length === 3) {
            select.value = "Facebook, Instagram & Threads";
        } else if (plats.indexOf("Facebook") !== -1 && plats.indexOf("Instagram") !== -1 && plats.length === 2) {
            select.value = "Facebook & Instagram";
        } else if (plats.length === 1) {
            select.value = plats[0];
        }
    }

    function updateWordAndCharStats() {
        const title = document.getElementById("postTitle").value || "";
        const headline = document.getElementById("postHeadline").value || "";
        const caption = document.getElementById("postCaption").value || "";
        const hashtags = document.getElementById("postHashtags").value || "";
        const combined = (title + " " + headline + " " + caption + " " + hashtags).trim();

        const words = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
        const chars = combined.length;
        document.getElementById("wordCharStat").textContent =
            words.toLocaleString("vi-VN") + " từ · " + chars.toLocaleString("vi-VN") + " ký tự";
    }

    function updateChecklist() {
        const titleEl = document.getElementById("chkItemTitle");
        const mediaEl = document.getElementById("chkItemMedia");
        const schedEl = document.getElementById("chkItemSchedule");
        if (!titleEl || !mediaEl || !schedEl) return;

        const hasTitle = Boolean(document.getElementById("postTitle").value.trim());
        const hasMedia = Boolean(currentMedia && currentMedia.url);
        const hasPlatformAndDate = getSelectedPlatforms().length > 0 && Boolean(document.getElementById("plannedPublishInput").value.trim());

        titleEl.classList.toggle("is-done", hasTitle);
        mediaEl.classList.toggle("is-done", hasMedia);
        schedEl.classList.toggle("is-done", hasPlatformAndDate);
    }

    function updateLivePreview() {
        const headline = document.getElementById("postHeadline").value.trim() || document.getElementById("postTitle").value.trim();
        const caption = document.getElementById("postCaption").value;
        const hashtags = document.getElementById("postHashtags").value;
        const planned = document.getElementById("plannedPublishInput").value.trim();
        const plats = getSelectedPlatforms();

        document.getElementById("previewHeadline").textContent = headline || "Chưa có tiêu đề bài viết";
        document.getElementById("previewBody").textContent = caption || "Nội dung bài viết sẽ hiển thị trực tiếp tại đây...";
        document.getElementById("previewTags").textContent = hashtags || "";
        document.getElementById("previewActivePlatforms").textContent = plats.length ? plats.join(" · ") : "Chưa chọn kênh";
        document.getElementById("previewChannelMeta").textContent =
            activePreviewTab + " · Dự kiến " + (planned.replace(/\s+/g, " ") || "Chưa đặt lịch");

        const pImg = document.getElementById("previewMediaImg");
        const pVid = document.getElementById("previewMediaVideo");
        const mediaBox = pImg.parentElement;
        if (!currentMedia || !currentMedia.url) {
            pImg.hidden = true; pVid.hidden = true;
            pImg.removeAttribute("src");
            if (mediaBox) mediaBox.hidden = true;
        } else {
            if (mediaBox) mediaBox.hidden = false;
            const mediaSrc = (window.BlossomAPI && BlossomAPI.resolveMediaUrl) ? BlossomAPI.resolveMediaUrl(currentMedia.url) : currentMedia.url;
            if (currentMedia.type === "VIDEO") {
                pImg.hidden = true;
                pVid.hidden = false;
                if (pVid.src !== mediaSrc) pVid.src = mediaSrc;
            } else {
                pVid.hidden = true;
                pImg.hidden = false;
                pImg.src = mediaSrc;
            }
        }
    }

    function renderMediaAttachment() {
        const has = Boolean(currentMedia && currentMedia.url);
        document.getElementById("mediaFileName").textContent = currentMedia && currentMedia.name ? currentMedia.name : "Chưa đính kèm tệp";
        document.getElementById("mediaFileMeta").textContent = currentMedia && currentMedia.meta
            ? currentMedia.meta : "Vui lòng tải lên JPG/PNG/WEBP hoặc MP4/MOV";

        const thumbImg = document.getElementById("mediaThumbImg");
        const thumbVid = document.getElementById("mediaThumbVideo");
        if (!has) {
            thumbImg.hidden = true; thumbVid.hidden = true;
            thumbImg.removeAttribute("src");
        } else {
            const mediaSrc = (window.BlossomAPI && BlossomAPI.resolveMediaUrl) ? BlossomAPI.resolveMediaUrl(currentMedia.url) : currentMedia.url;
            if (currentMedia.type === "VIDEO") {
                thumbImg.hidden = true;
                thumbVid.hidden = false;
                if (thumbVid.src !== mediaSrc) thumbVid.src = mediaSrc;
            } else {
                thumbVid.hidden = true;
                thumbImg.hidden = false;
                thumbImg.src = mediaSrc;
            }
        }
        const rm = document.getElementById("btnRemoveMedia");
        if (rm) rm.hidden = !has;
        updateLivePreview();
        updateChecklist();
    }

    // Đọc tệp -> dataURL; ảnh được thu nhỏ (tối đa 1280px) để lưu được trong bộ nhớ trình duyệt
    function readAsDataUrl(file) {
        return new Promise(function (resolve, reject) {
            const r = new FileReader();
            r.onload = function () { resolve(r.result); };
            r.onerror = function () { reject(new Error("Không đọc được tệp.")); };
            r.readAsDataURL(file);
        });
    }

    function compressImage(file) {
        return readAsDataUrl(file).then(function (src) {
            return new Promise(function (resolve, reject) {
                const img = new Image();
                img.onerror = function () { reject(new Error("Tệp không phải ảnh hợp lệ.")); };
                img.onload = function () {
                    const MAX = 1280;
                    const k = Math.min(1, MAX / Math.max(img.width, img.height));
                    const c = document.createElement("canvas");
                    c.width = Math.round(img.width * k);
                    c.height = Math.round(img.height * k);
                    const ctx = c.getContext("2d");
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                    resolve({ url: c.toDataURL("image/jpeg", 0.85), w: img.width, h: img.height });
                };
                img.src = src;
            });
        });
    }

    /* ---------- KIỂM TRA ĐỊNH DẠNG & DUNG LƯỢNG MEDIA (JPG/PNG/WEBP/MP4/MOV) ---------- */
    async function handleFileSelected(file) {
        if (!file) return;
        const errEl = document.getElementById("errMedia");
        errEl.classList.remove("is-visible");
        errEl.textContent = "";

        const fileName = file.name || "";
        const dotIdx = fileName.lastIndexOf(".");
        const ext = dotIdx !== -1 ? fileName.slice(dotIdx).toLowerCase() : "";

        const isImage = ALLOWED_IMAGE_EXT.indexOf(ext) !== -1 || ["image/jpeg", "image/png", "image/webp"].indexOf(file.type) !== -1;
        const isVideo = ALLOWED_VIDEO_EXT.indexOf(ext) !== -1 || ["video/mp4", "video/quicktime"].indexOf(file.type) !== -1;

        if (!isImage && !isVideo) {
            const msg = "Định dạng tệp '" + (ext || file.type || "không rõ") + "' không hợp lệ! Chỉ chấp nhận JPG, PNG, WEBP, MP4, MOV.";
            errEl.textContent = msg;
            errEl.classList.add("is-visible");
            UI.toast("error", "Sai định dạng tệp", msg);
            return;
        }

        const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        const maxMb = isVideo ? 50 : 10;
        if (file.size > maxBytes) {
            const msgSize = "Dung lượng tệp vượt quá giới hạn cho phép (" + maxMb + "MB).";
            errEl.textContent = msgSize;
            errEl.classList.add("is-visible");
            UI.toast("error", "Tệp vượt quá dung lượng", msgSize);
            return;
        }

        const sizeMb = (file.size / (1024 * 1024)).toFixed(2).replace(".", ",");
        let url = "";
        let dims = "";
        let persistable = true;
        try {
            if (isImage) {
                const out = await compressImage(file);
                url = out.url;
                dims = " · " + out.w + " × " + out.h + " px";
            } else {
                url = URL.createObjectURL(file);
                persistable = false;
                if (file.size <= 2.5 * 1024 * 1024) {      // video nhỏ mới lưu được vào trình duyệt
                    url = await readAsDataUrl(file);
                    persistable = true;
                }
            }
        } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.add("is-visible");
            UI.toast("error", "Không thể đọc tệp", e.message);
            return;
        }
        currentMedia = {
            name: fileName,
            meta: sizeMb + " MB" + dims + " · " + (isVideo ? "Video ngắn (MP4/MOV)" : "Hình ảnh (JPG/PNG/WEBP)"),
            type: isVideo ? "VIDEO" : "IMAGE",
            url: url,
            sizeBytes: file.size,
            persistable: persistable
        };

        renderMediaAttachment();
        UI.toast("success", "Đã tải tệp Media hợp lệ", fileName + " (" + sizeMb + " MB)");

        // Thử upload lên Backend /api/posts/upload-media nếu server đang chạy
        try {
            if (window.BlossomAPI && typeof window.BlossomAPI.uploadMedia === "function") {
                const uploaded = await window.BlossomAPI.uploadMedia(file);
                if (uploaded && uploaded.file_url) {
                    currentMedia.serverUrl = uploaded.file_url;
                }
            }
        } catch (e) {
            console.warn("[PostEditor] Upload media fallback:", e.message);
            /* fallback local preview URL */
        }
    }

    /* ---------- AUTO-SAVE MỖI 30 GIÂY (FR-04 & NFR-05) ---------- */
    async function performAutoSave(isManualTrigger) {
        if (currentPostStatus === "PUBLISHED") return;

        const payload = collectFormPayload();
        try {
            localStorage.setItem(AUTOSAVE_DRAFT_KEY, JSON.stringify({
                savedAt: new Date().toISOString(),
                mode: isEditMode ? "edit" : "create",
                data: Object.assign({}, payload, { media: payload.media ? { name: payload.media.name, meta: payload.media.meta, type: payload.media.type } : null })
            }));
        } catch (e) {
            /* ignore */
        }

        try {
            if (window.BlossomAPI && typeof window.BlossomAPI.request === "function") {
                const platformCodeMap = { facebook: 1, instagram: 2, threads: 3 };
                const platKey = (payload.platforms && payload.platforms[0]) || "facebook";
                const platId = platformCodeMap[platKey] || 1;
                const mType = currentMedia && currentMedia.type === "VIDEO" ? "VIDEO" : "IMAGE";

                await BlossomAPI.request("/posts/autosave", {
                    method: "POST",
                    body: {
                        post_id: currentPostId,
                        title: payload.title || "Bản nháp",
                        caption: (payload.headline ? payload.headline + "\n\n" : "") + (payload.caption || ""),
                        hashtags: payload.hashtags || null,
                        platform_id: platId,
                        media_type: mType,
                        media_files: currentMedia && currentMedia.serverUrl ? [currentMedia.serverUrl] : [],
                        total_media_size_bytes: (currentMedia || {}).sizeBytes || 0
                    }
                });
            }
        } catch (e) {
            /* offline fallback already saved to localStorage */
        }

        const timeLabel = formatTimeNow();
        document.getElementById("autoSaveText").textContent = "✓ Đã tự động lưu lúc " + timeLabel;
        if (isEditMode) {
            const code = currentPostId ? ("BL-0" + currentPostId) : "Bài mới";
            document.getElementById("editorSubTitle").textContent =
                code + " · " + (payload.title || "Bài viết") + " · Đã lưu lúc " + timeLabel;
        }
        countdownRemaining = AUTOSAVE_INTERVAL_SEC;
        document.getElementById("autoSaveCountdown").textContent = String(countdownRemaining);

        if (isManualTrigger) {
            UI.toast("success", "Auto-save 30 giây", "Đã tự động lưu tạm dữ liệu bài viết lúc " + timeLabel + ".");
        }
    }

    function startAutoSaveTimer() {
        setInterval(function () {
            if (currentPostStatus === "PUBLISHED") return;
            countdownRemaining -= 1;
            if (countdownRemaining <= 0) {
                performAutoSave(false);
            } else {
                const el = document.getElementById("autoSaveCountdown");
                if (el) el.textContent = String(countdownRemaining);
            }
        }, 1000);
    }

    function collectFormPayload() {
        return {
            post_id: currentPostId,
            title: document.getElementById("postTitle").value.trim(),
            category: document.getElementById("postCategory").value,
            campaign: document.getElementById("postCampaign").value,
            headline: document.getElementById("postHeadline").value.trim(),
            caption: document.getElementById("postCaption").value.trim(),
            hashtags: document.getElementById("postHashtags").value.trim(),
            platforms: getSelectedPlatforms(),
            planned_time: document.getElementById("plannedPublishInput").value.trim(),
            approver: document.getElementById("approverSelect").value,
            status: currentPostStatus,
            media: currentMedia
        };
    }

    /* ---------- ÁP DỤNG TRẠNG THÁI BÀI VIẾT TRONG FR-05 (DRAFT / APPROVED / PUBLISHED / REVISION) ---------- */
    function applyPostObject(post) {
        currentPostStatus = post.status;
        currentPostId = post.post_id;

        document.getElementById("editorCrumb").textContent = "Blossom / Bài viết / " + post.code + " / Chỉnh sửa";
        document.getElementById("editorSubTitle").textContent = post.code + " · " + post.title + " · Đã lưu lúc " + formatTimeNow();
        document.getElementById("postTitle").value = post.title;
        setSelectValue("postCategory", post.category);
        setSelectValue("postCampaign", post.campaign);
        document.getElementById("postHeadline").value = post.headline;
        document.getElementById("postCaption").value = post.caption;
        document.getElementById("postHashtags").value = post.hashtags;
        document.getElementById("plannedPublishInput").value = post.planned_time;
        setSelectValue("approverSelect", post.approver);
        originalPlanned = String(post.planned_time || "").replace(/\s+/g, " ").trim();

        setSelectedPlatforms(post.platforms);

        currentMedia = post.media_url ? {
            name: post.media_name,
            meta: post.media_meta,
            type: post.media_type || "IMAGE",
            url: post.media_url,
            sizeBytes: post.media_size || 0
        } : (post.media_name ? { name: post.media_name, meta: post.media_meta, type: post.media_type || "IMAGE", url: "", sizeBytes: 0 } : null);
        renderMediaAttachment();

        // Status badge
        const badgeEl = document.getElementById("postStatusBadge");
        badgeEl.textContent = post.status_label;
        badgeEl.className = "fr04-status-pill";
        if (post.status === "APPROVED") badgeEl.classList.add("is-approved");
        else if (post.status === "PUBLISHED") badgeEl.classList.add("is-published");
        else if (post.status === "PENDING_APPROVAL") badgeEl.classList.add("is-pending");
        else if (post.status === "REVISION_REQUESTED") badgeEl.classList.add("is-revision");

        // History list
        const histEl = document.getElementById("editHistoryList");
        if (histEl && Array.isArray(post.history)) {
            histEl.innerHTML = post.history.map(function (item) {
                return '<div class="fr04-review-item">' +
                    '<img src="../../assets/figma/history.svg" alt="" width="16" height="16">' +
                    '<span>' + UI.esc(item) + '</span>' +
                '</div>';
            }).join("");
        }

        // Banner & locking rules (ERR-01 Published lock & BR-04/BR-05 Approved warning)
        const bannerEl = document.getElementById("stateWarningBanner");
        const isPublished = post.status === "PUBLISHED";

        if (isPublished) {
            bannerEl.hidden = false;
            bannerEl.className = "fr05-banner fr05-banner--published";
            bannerEl.innerHTML =
                '<div><b>🔒 Bài viết đã xuất bản:</b> ' +
                'Bài viết này đã được đăng chính thức (' + UI.esc(post.published_url || "") + '). ' +
                'Hệ thống khóa chức năng chỉnh sửa nội dung bài viết đã xuất bản, chỉ cho phép cập nhật liên kết thực tế và theo dõi số liệu thống kê.</div>';
        } else if (post.status === "APPROVED") {
            bannerEl.hidden = false;
            bannerEl.className = "fr05-banner fr05-banner--approved";
            bannerEl.innerHTML =
                '<div><b>⚠️ Cảnh báo chỉnh sửa bài viết đã phê duyệt:</b> ' +
                'Bài viết này đã được Quản lý phê duyệt. Nếu bạn lưu thay đổi nội dung hoặc Media, hệ thống sẽ tự động chuyển trạng thái bài viết về <b>Chờ phê duyệt (Pending Approval)</b> và tạm gỡ khỏi Lịch đăng bài để duyệt lại.</div>';
        } else if (post.status === "REVISION_REQUESTED") {
            bannerEl.hidden = false;
            bannerEl.className = "fr05-banner fr05-banner--revision";
            bannerEl.innerHTML = '<div><b>💬 Yêu cầu chỉnh sửa từ Marketing Manager:</b> ' + UI.esc(post.manager_comment || "") + '</div>';
        } else {
            bannerEl.hidden = true;
            bannerEl.innerHTML = "";
        }

        // Khóa hoặc mở khóa toàn bộ trường nhập liệu khi bài đã Published
        const lockableIds = [
            "postTitle", "postCategory", "postCampaign", "postHeadline",
            "postCaption", "postHashtags", "platformSelect", "plannedPublishInput",
            "approverSelect", "btnReplaceMedia", "btnRemoveMedia", "btnUploadIcon",
            "btnSaveDraft", "btnSubmitApproval"
        ];
        lockableIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.disabled = isPublished;
        });
        document.querySelectorAll('#platformCheckboxes input[type="checkbox"]').forEach(function (cb) {
            cb.disabled = isPublished;
        });

        updateWordAndCharStats();
        updateLivePreview();
    }

    // Gán giá trị cho <select>; nếu giá trị chưa có trong danh sách thì thêm vào
    function setSelectValue(id, value) {
        const el = document.getElementById(id);
        if (!el || !value) return;
        if (!Array.from(el.options).some(function (o) { return o.value === value; })) {
            const opt = document.createElement("option");
            opt.value = value; opt.textContent = value;
            el.appendChild(opt);
        }
        el.value = value;
    }

    const STATUS_LABEL_FULL = {
        DRAFT: "Bản nháp", PENDING_APPROVAL: "Chờ phê duyệt (Pending Approval)", APPROVED: "Đã phê duyệt",
        PUBLISHED: "Đã xuất bản", REVISION_REQUESTED: "Cần chỉnh sửa", REJECTED: "Bị từ chối", SCHEDULED: "Đã lên lịch"
    };

    // Nạp bài viết THẬT (dữ liệu người dùng đã lưu) vào form
    function loadRealPost(p) {
        const media = Scope.getPostMedia(p.post_id);
        const planned = p.planned_date ? (Scope.viDate(p.planned_date) + " " + (p.planned_time || "09:00")) : "";
        const resolvedMediaUrl = (media && media.url) || p.media_url || p.mediaUrl || (Array.isArray(p.media_files) && p.media_files[0]) || "";
        const mType = (media && media.type) || p.media_type || "IMAGE";
        applyPostObject({
            post_id: p.post_id, code: p.code || ("BL-0" + p.post_id), title: p.title || "",
            category: p.category, campaign: p.campaign, headline: p.headline || "", caption: p.caption || "",
            hashtags: p.hashtags || "", platforms: p.platforms && p.platforms.length ? p.platforms : ["Facebook"],
            planned_time: planned, approver: p.approver,
            status: p.status, status_label: STATUS_LABEL_FULL[p.status] || p.status,
            media_name: (media && media.name) || (resolvedMediaUrl ? "Tệp đính kèm" : ""),
            media_meta: (media && media.meta) || "",
            media_type: mType,
            media_url: resolvedMediaUrl,
            media_size: (media && media.sizeBytes) || p.total_media_size_bytes || 0,
            history: p.history || [], manager_comment: p.revision_note || p.revision_reason || p.manager_comment || "",
            published_url: p.published_url || ""
        });
        const author = document.getElementById("postAuthor");
        if (author) author.value = p.author || "";
    }

    // Form tạo mới luôn trống: không có nội dung, ảnh hay giờ đăng có sẵn
    function resetFormForCreate() {
        ["postTitle", "postHeadline", "postCaption", "postHashtags", "plannedPublishInput"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        const u = (window.Auth && Auth.getUser()) || null;
        const author = document.getElementById("postAuthor");
        if (author) author.value = u ? u.fullName : "";
        currentMedia = null;
        originalPlanned = "";
        renderMediaAttachment();
        updateWordAndCharStats();
    }

    /* ---------- Ngày giờ đăng dự kiến: DD/MM/YYYY HH:mm, không được ở quá khứ ---------- */
    function parsePlanned(str) {
        const m = String(str || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const d = +m[1], mo = +m[2], y = +m[3], h = +m[4], mi = +m[5];
        const dt = new Date(y, mo - 1, d, h, mi, 0);
        if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || h > 23 || mi > 59) return null;
        const pad = function (n) { return String(n).padStart(2, "0"); };
        return { date: y + "-" + pad(mo) + "-" + pad(d), time: pad(h) + ":" + pad(mi), dt: dt, text: pad(d) + "/" + pad(mo) + "/" + y + " " + pad(h) + ":" + pad(mi) };
    }

    function showPlannedError(msg) {
        const input = document.getElementById("plannedPublishInput");
        const wrap = input.closest(".fr04-date-input-wrap");
        let err = document.getElementById("errPlanned");
        if (!err) {
            err = document.createElement("p");
            err.id = "errPlanned";
            err.className = "fr04-error";
            err.style.cssText = "color:#d6336c;font-size:12.5px;margin:6px 0 0;";
            wrap.parentElement.appendChild(err);
        }
        err.textContent = msg || "";
        err.hidden = !msg;
    }

    function setupDatePicker() {
        const input = document.getElementById("plannedPublishInput");
        const wrap = input.closest(".fr04-date-input-wrap");
        const icon = wrap.querySelector("img");
        const pick = document.createElement("input");
        pick.type = "datetime-local";
        pick.setAttribute("aria-hidden", "true");
        pick.tabIndex = -1;
        pick.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;";
        wrap.style.position = "relative";
        wrap.appendChild(pick);

        const toLocalIso = function (d) {
            const pad = function (n) { return String(n).padStart(2, "0"); };
            return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
        };
        const open = function () {
            if (input.disabled) return;
            pick.min = toLocalIso(new Date());           // không cho chọn quá khứ
            const cur = parsePlanned(input.value);
            pick.value = cur ? toLocalIso(cur.dt) : "";
            if (pick.showPicker) { try { pick.showPicker(); } catch (e) { pick.focus(); } } else { pick.focus(); }
        };
        if (icon) { icon.style.cursor = "pointer"; icon.addEventListener("click", open); }
        pick.addEventListener("change", function () {
            if (!pick.value) return;
            const d = new Date(pick.value);
            const pad = function (n) { return String(n).padStart(2, "0"); };
            input.value = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
            showPlannedError("");
            updateChecklist(); updateLivePreview();
        });
        input.addEventListener("blur", function () {
            const v = parsePlanned(input.value);
            if (v) input.value = v.text;                 // chuẩn hóa khoảng trắng
        });
        input.addEventListener("input", function () { showPlannedError(""); });
    }

    function validatePlannedTime() {
        const raw = document.getElementById("plannedPublishInput").value;
        const v = parsePlanned(raw);
        if (!v) {
            const msg = "Vui lòng nhập ngày giờ đăng đúng định dạng DD/MM/YYYY HH:mm (hoặc bấm biểu tượng lịch để chọn).";
            showPlannedError(msg);
            UI.toast("error", "Ngày đăng chưa hợp lệ", msg);
            return null;
        }
        if (v.dt.getTime() <= Date.now()) {
            const msg = "Lịch đăng dự kiến không được nằm trong quá khứ. Vui lòng chọn thời gian trong tương lai.";
            showPlannedError(msg);
            UI.toast("error", "Thời gian ở quá khứ", msg);
            return null;
        }
        showPlannedError("");
        return v;
    }

    function validateRequiredFields() {
        const title = document.getElementById("postTitle").value.trim();
        const plats = getSelectedPlatforms();
        const errTitle = document.getElementById("errTitle");
        const errPlat = document.getElementById("errPlatform");

        errTitle.classList.toggle("is-visible", !title);
        errPlat.classList.toggle("is-visible", plats.length === 0);

        if (!title || plats.length === 0) {
            UI.toast("error", "Thiếu thông tin bắt buộc", "Vui lòng nhập đầy đủ Tiêu đề bài viết và chọn ít nhất một Nền tảng đích.");
            return false;
        }
        return true;
    }

    function prependHistoryEntry(text) {
        const histEl = document.getElementById("editHistoryList");
        if (!histEl) return;
        const row = document.createElement("div");
        row.className = "fr04-review-item";
        row.innerHTML = '<img src="../../assets/figma/history.svg" alt="" width="16" height="16"><span>' + UI.esc(formatTimeNow() + " · " + text) + '</span>';
        histEl.prepend(row);
    }

    async function handleSavePost(targetAction) {
        if (currentPostStatus === "PUBLISHED") {
            UI.toast("error", "Không thể chỉnh sửa", "Bài viết đã ở trạng thái Published, không được phép chỉnh sửa nội dung!");
            return;
        }

        if (!validateRequiredFields()) return;
        const plannedParsed = validatePlannedTime();
        if (!plannedParsed) return;
        let historyText = "";
        const userNow = (window.Auth && Auth.getUser()) || { fullName: "Nhân viên" };

        // Nếu đang sửa bài đã APPROVED -> Hiển thị hộp thoại cảnh báo xác nhận chuyển về PENDING_APPROVAL (FR-05 Step 4a)
        if (currentPostStatus === "APPROVED") {
            const confirmed = await UI.confirm({
                title: "Cảnh báo chỉnh sửa bài viết đã duyệt (Approved)",
                message: "Bài viết này đang ở trạng thái Đã phê duyệt. Việc lưu thay đổi sẽ đưa bài viết quay lại trạng thái Chờ duyệt và cập nhật trên Lịch đăng bài. Bạn có chắc chắn muốn tiếp tục?",
                confirmText: "Đồng ý & Gửi duyệt lại",
                cancelText: "Hủy thay đổi"
            });
            if (!confirmed) return;

            currentPostStatus = "PENDING_APPROVAL";
            const badgeEl = document.getElementById("postStatusBadge");
            badgeEl.textContent = "Chờ phê duyệt (Pending Approval)";
            badgeEl.className = "fr04-status-pill is-pending";
            historyText = "Chỉnh sửa bài Approved → Tự động chuyển về Pending Approval"; prependHistoryEntry(historyText);
        } else if (targetAction === "SUBMIT") {
            currentPostStatus = "PENDING_APPROVAL";
            const badgeEl = document.getElementById("postStatusBadge");
            badgeEl.textContent = "Chờ phê duyệt (Pending Approval)";
            badgeEl.className = "fr04-status-pill is-pending";
            historyText = userNow.fullName + " gửi duyệt bài viết"; prependHistoryEntry(historyText);
        } else {
            historyText = "Đã lưu thay đổi bản nháp"; prependHistoryEntry(historyText);
        }

        const payload = collectFormPayload();

        // Lưu vào danh sách bài viết dùng chung (Tổng quan, Danh sách, Lịch đều đọc từ đây)
        const platLabel = payload.platforms.length >= 2
            ? payload.platforms.slice(0, 2).join(" & ")
            : (payload.platforms[0] || "Facebook");
        const authorName = userNow.fullName;
        const ownerUsername = userNow.username;
        const nowIso = new Date().toISOString();

        const list = getSharedPostList();
        let post = currentPostId ? list.find(function (it) { return Number(it.post_id) === Number(currentPostId); }) : null;
        const isNew = !post;
        const prevStatus = post ? post.status : "";
        if (isNew) {
            const maxId = list.reduce(function (m, it) { return Math.max(m, Number(it.post_id) || 0); }, 132);
            post = { post_id: maxId + 1, code: "BL-0" + (maxId + 1), author: authorName, owner_username: ownerUsername, deleted_at: null, history: [] };
            list.unshift(post);
            currentPostId = post.post_id;
        }

        post.title = payload.title;
        post.category = payload.category;
        post.campaign = payload.campaign || post.campaign;
        post.headline = payload.headline;
        post.caption = payload.caption;
        post.hashtags = payload.hashtags;
        post.platforms = payload.platforms;
        post.platform_label = platLabel;
        post.approver = payload.approver;
        post.status = currentPostStatus;
        post.planned_date = plannedParsed.date;
        post.planned_time = plannedParsed.time;
        post.planned_label = Scope.viDate(plannedParsed.date) + " " + plannedParsed.time;
        post.updated_label = new Date().toLocaleDateString("vi-VN");
        post.updated_at = nowIso;
        post._touched = true;
        if (currentMedia && currentMedia.url && currentMedia.persistable !== false) {
            post.mediaUrl = currentMedia.url;
        } else if (!currentMedia) {
            post.mediaUrl = "";
        }
        post.history = post.history || [];
        post.history.unshift(formatTimeNow() + " · " + (historyText || (isNew ? "Tạo bài viết mới" : "Cập nhật bài viết")));
        if (isNew && !historyText) post.history[0] = formatTimeNow() + " · Tạo bài viết mới";

        // Ảnh/video: lưu cùng bài để mở lại vẫn thấy đủ
        let mediaSaved = true;
        if (!currentMedia) {
            Scope.savePostMedia(post.post_id, null);
        } else {
            mediaSaved = Scope.savePostMedia(post.post_id, {
                name: currentMedia.name, meta: currentMedia.meta, type: currentMedia.type,
                url: currentMedia.persistable === false ? "" : currentMedia.url, sizeBytes: currentMedia.sizeBytes
            });
            if (currentMedia.persistable === false) {
                UI.toast("warning", "Video chưa lưu được bản xem trước", "Video lớn hơn 2,5 MB chỉ lưu tên tệp (cần backend để lưu file thật).");
            }
        }
        if (!mediaSaved) UI.toast("warning", "Bộ nhớ trình duyệt đầy", "Không lưu được ảnh đính kèm. Hãy chọn ảnh nhỏ hơn.");

        Scope.savePosts(list);
        Scope.upsertEventForPost(post);   // lịch đăng + Tổng quan cập nhật ngay theo bài vừa lưu
        originalPlanned = plannedParsed.text;

        // Gọi API Backend nếu đang chạy
        try {
            if (window.BlossomAPI && typeof window.BlossomAPI.request === "function") {
                const platformCodeMap = { facebook: 1, instagram: 2, threads: 3 };
                const platKey = (payload.platforms && payload.platforms[0]) || "facebook";
                const platId = platformCodeMap[platKey] || 1;
                const mType = currentMedia && currentMedia.type === "VIDEO" ? "VIDEO" : "IMAGE";
                const mediaUrls = currentMedia ? [currentMedia.serverUrl || currentMedia.url].filter(Boolean) : [];

                const backendBody = {
                    title: payload.title,
                    caption: (payload.headline ? payload.headline + "\n\n" : "") + (payload.caption || ""),
                    hashtags: payload.hashtags || null,
                    platform_id: platId,
                    media_type: mType,
                    media_files: mediaUrls,
                    total_media_size_bytes: (currentMedia || {}).sizeBytes || 0,
                    planned_publish_time: plannedParsed && plannedParsed.isoString ? plannedParsed.isoString : null
                };

                let savedBackendPost = null;
                const isNumericId = currentPostId && !isNaN(Number(currentPostId)) && !String(currentPostId).startsWith("demo_");

                if (!isNew && isNumericId) {
                    savedBackendPost = await BlossomAPI.request("/posts/" + currentPostId, {
                        method: "PUT",
                        body: backendBody
                    });
                } else {
                    savedBackendPost = await BlossomAPI.request("/posts", {
                        method: "POST",
                        body: backendBody
                    });
                    if (savedBackendPost && savedBackendPost.post_id) {
                        post.post_id = savedBackendPost.post_id;
                        currentPostId = savedBackendPost.post_id;
                    }
                }

                // Nếu người dùng chọn Gửi duyệt (SUBMIT):
                if (targetAction === "SUBMIT" && currentPostId) {
                    try {
                        await BlossomAPI.request("/posts/" + currentPostId + "/submit", { method: "POST" });
                    } catch (subErr) {
                        console.warn("[PostEditor] Submit approval endpoint:", subErr.message);
                    }
                }
            }
        } catch (e) {
            console.warn("[PostEditor] Backend save error:", e.message);
            /* offline fallback */
        }

        const sub = document.getElementById("editorSubTitle");
        if (sub) sub.textContent = post.code + " · " + post.title + " · Đã lưu lúc " + formatTimeNow();
        await performAutoSave(false);

        if (currentPostStatus === "PENDING_APPROVAL") {
            // Chỉ gửi thông báo cho Manager khi Staff gửi bài; Manager tự tạo/gửi bài KHÔNG tự thông báo cho chính mình
            if (window.NotificationsStore && !Scope.isManager(userNow)) {
                const isResubmit = prevStatus === "REVISION_REQUESTED";
                window.NotificationsStore.addNotification({
                    type: "submitted",
                    postId: currentPostId,
                    title: isResubmit ? "Nhân viên đã gửi lại bài viết" : "Có bài viết mới chờ duyệt",
                    message: isResubmit
                        ? (authorName + " đã chỉnh sửa và gửi duyệt lại bài '" + payload.title + "' (" + post.code + ").")
                        : (authorName + " vừa gửi duyệt bài viết mới '" + payload.title + "' (" + post.code + ")."),
                    author: authorName,
                    recipientRole: "MANAGER"
                });
            }
            UI.toast("success", "Đã gửi duyệt bài viết", "Bài viết '" + payload.title + "' đã được cập nhật và gửi duyệt.");
            setTimeout(function () {
                location.href = getPostListHref();
            }, 1000);
        } else {
            UI.toast("success", "Đã lưu bài viết thành công", "Bản ghi '" + payload.title + "' đã được lưu nháp lúc " + formatTimeNow() + ".");
        }
    }

    function bindEvents() {
        ["postTitle", "postHeadline", "postCaption", "postHashtags", "plannedPublishInput"].forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", function () {
                updateWordAndCharStats();
                updateChecklist();
                updateLivePreview();
            });
        });

        document.getElementById("platformSelect").addEventListener("change", function (e) {
            const val = e.target.value;
            if (val === "Facebook & Instagram") setSelectedPlatforms(["Facebook", "Instagram"]);
            else if (val === "Facebook, Instagram & Threads") setSelectedPlatforms(["Facebook", "Instagram", "Threads"]);
            else setSelectedPlatforms([val]);
            updateChecklist();
            updateLivePreview();
        });

        document.querySelectorAll('#platformCheckboxes input[type="checkbox"]').forEach(function (cb) {
            cb.addEventListener("change", function () {
                syncPlatformPresetSelect();
                updateChecklist();
                updateLivePreview();
            });
        });

        // Media upload handlers
        const fileInput = document.getElementById("mediaFileInput");
        ["btnReplaceMedia", "btnUploadIcon"].forEach(function (id) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener("click", function () {
                    if (currentPostStatus === "PUBLISHED") return;
                    fileInput.click();
                });
            }
        });

        fileInput.addEventListener("change", function (e) {
            if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
            }
        });

        document.getElementById("btnRemoveMedia").addEventListener("click", function () {
            if (currentPostStatus === "PUBLISHED") return;
            currentMedia = null;
            renderMediaAttachment();
            UI.toast("warning", "Đã xóa tệp đính kèm", "Hãy tải lên hình ảnh hoặc video trước khi gửi duyệt.");
        });

        // Preview tabs
        document.getElementById("previewTabs").addEventListener("click", function (e) {
            const btn = e.target.closest("[data-tab]");
            if (!btn) return;
            activePreviewTab = btn.dataset.tab;
            document.querySelectorAll("#previewTabs .fr04-preview-tab").forEach(function (b) {
                b.classList.toggle("is-active", b === btn);
            });
            updateLivePreview();
        });

        // Formatting toolbar quick actions
        document.querySelectorAll("[data-format]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (currentPostStatus === "PUBLISHED") return;
                const fmt = btn.dataset.format;
                const area = document.getElementById("postCaption");
                if (fmt === "bullet") area.value += "\n• Điểm nhấn chăm sóc da dịu nhẹ.";
                else if (fmt === "number") area.value += "\n4. Xịt khoáng cấp ẩm tức thì.";
                else if (fmt === "image") fileInput.click();
                updateWordAndCharStats();
                updateLivePreview();
            });
        });

        document.getElementById("btnTriggerAutoSave").addEventListener("click", function () {
            performAutoSave(true);
        });

        document.getElementById("btnSaveDraft").addEventListener("click", function () {
            handleSavePost("DRAFT");
        });

        document.getElementById("btnSubmitApproval").addEventListener("click", function () {
            handleSavePost("SUBMIT");
        });

        const cancelBtn = document.getElementById("btnCancelEdit");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", function () {
                if (isEditMode) { location.reload(); return; }
                resetFormForCreate();
                UI.toast("info", "Đã xóa nội dung", "Biểu mẫu đã được làm trống.");
            });
        }

        const backLink = document.getElementById("btnBackToPostList");
        if (backLink) {
            backLink.href = getPostListHref();
        }

        const urlId = Number(new URLSearchParams(location.search).get("id") || 0);
        setupDatePicker();

        if (isEditMode) {
            let target = urlId ? Scope.getPostById(urlId) : null;
            const userNow = (window.Auth && Auth.getUser()) || {};
            const isMgr = userNow.role === "MANAGER";

            const proceedWithPost = function (postObj) {
                if (!postObj || (!Scope.isMine(postObj) && !isMgr)) {
                    Auth.setFlash({
                        type: "error",
                        title: postObj ? "Không có quyền chỉnh sửa" : "Không tìm thấy bài viết",
                        message: postObj ? "Bạn chỉ được chỉnh sửa bài viết của chính mình hoặc bài viết thuộc thẩm quyền quản lý." : "Bài viết không tồn tại hoặc đã bị xóa."
                    });
                    location.replace(getPostListHref());
                    return;
                }
                loadRealPost(postObj);
                currentPostId = postObj.post_id;
            };

            if (!target && urlId && window.BlossomAPI && BlossomAPI.getToken()) {
                BlossomAPI.request("/posts/" + urlId)
                    .then(function (backendPost) {
                        const platNameMap = { 1: "Facebook", 2: "Instagram", 3: "Threads" };
                        const platName = platNameMap[backendPost.platform_id] || "Facebook";
                        target = {
                            post_id: backendPost.post_id,
                            code: "BL-0" + backendPost.post_id,
                            title: backendPost.title,
                            category: "Chăm sóc da",
                            campaign: "Chiến dịch chung",
                            headline: "",
                            caption: backendPost.caption || "",
                            hashtags: backendPost.hashtags || "",
                            platforms: [platName],
                            platform_label: platName,
                            author: backendPost.author ? backendPost.author.full_name : "",
                            owner_username: backendPost.author ? backendPost.author.username : "",
                            status: backendPost.status,
                            planned_date: backendPost.planned_publish_time ? backendPost.planned_publish_time.slice(0, 10) : "",
                            planned_time: backendPost.planned_publish_time ? backendPost.planned_publish_time.slice(11, 16) : "09:00",
                            media_files: backendPost.media_files || [],
                            media_type: backendPost.media_type || "IMAGE",
                            media_url: (backendPost.media_files && backendPost.media_files[0]) || "",
                            history: []
                        };
                        proceedWithPost(target);
                    })
                    .catch(function (err) {
                        console.warn("[PostEditor] Could not fetch post from backend:", err.message);
                        proceedWithPost(null);
                    });
            } else {
                proceedWithPost(target);
            }
        } else {
            resetFormForCreate();
        }
    }

    updateWordAndCharStats();
    updateChecklist();
    updateLivePreview();
    bindEvents();
    startAutoSaveTimer();
})();
