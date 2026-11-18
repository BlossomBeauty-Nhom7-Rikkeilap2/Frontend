/* =========================================================
   FR-03 · QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (Task T06A65F)
   - Thêm / sửa tài khoản
   - Phân vai Staff / Manager (RBAC)
   - Khóa / Mở khóa / Vô hiệu hóa mềm (bảo toàn lịch sử Post)
   - Mã hóa mật khẩu Bcrypt
   - Kiểm tra Email trùng (ERR-01) và độ phức tạp mật khẩu (ERR-02)
   ========================================================= */
(function () {
    "use strict";

    const ACCOUNTS_KEY = "blossom_accounts_v1";
    const PAGE_SIZE = 6;

    const ROLE_CONFIG = {
        MANAGER_ADMIN: {
            code: "MANAGER",
            displayRole: "Quản trị viên",
            isHighlight: true,
            description: "Toàn quyền quản trị hệ thống, quản lý tài khoản & phân quyền, duyệt bài viết và xuất báo cáo thống kê."
        },
        MANAGER: {
            code: "MANAGER",
            displayRole: "Quản lý",
            isHighlight: false,
            description: "Quản lý bài viết, lịch đăng, duyệt nội dung và xem báo cáo. Không quản lý tài khoản."
        },
        STAFF: {
            code: "STAFF",
            displayRole: "Nhân viên",
            isHighlight: false,
            description: "Khởi tạo bài viết nháp, tải lên hình ảnh/video, gửi duyệt nội dung và xác nhận đăng bài theo lịch."
        }
    };

    const INITIAL_ACCOUNTS = [
        {
            user_id: 1,
            username: "minhanh",
            full_name: "Nguyễn Minh Anh",
            email: "minhanh@blossom.vn",
            phone: "0901234567",
            role_key: "MANAGER_ADMIN",
            role_code: "MANAGER",
            status: "ACTIVE",
            last_login_label: "Hôm nay, 09:30",
            password_hash: BlossomAPI.simulateBcryptHash("Manager@123"),
            posts_count: 8
        },
        {
            user_id: 2,
            username: "ngocmai",
            full_name: "Trần Ngọc Mai",
            email: "ngocmai@blossom.vn",
            phone: "0902345678",
            role_key: "MANAGER",
            role_code: "MANAGER",
            status: "ACTIVE",
            last_login_label: "Hôm nay, 09:15",
            password_hash: BlossomAPI.simulateBcryptHash("Manager@123"),
            posts_count: 14
        },
        {
            user_id: 3,
            username: "thuhuong",
            full_name: "Lê Thu Hương",
            email: "thuhuong@blossom.vn",
            phone: "0903456789",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm nay, 09:05",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 11
        },
        {
            user_id: 4,
            username: "khanhlinh",
            full_name: "Phạm Khánh Linh",
            email: "khanhlinh@blossom.vn",
            phone: "0904567890",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm qua, 18:22",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 9
        },
        {
            user_id: 5,
            username: "hoangyen",
            full_name: "Đỗ Hoàng Yến",
            email: "hoangyen@blossom.vn",
            phone: "0905678901",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "LOCKED",
            last_login_label: "02/11/2026, 08:40",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 5
        },
        {
            user_id: 6,
            username: "baongoc",
            full_name: "Vũ Bảo Ngọc",
            email: "baongoc@blossom.vn",
            phone: "0906789012",
            role_key: "MANAGER",
            role_code: "MANAGER",
            status: "ACTIVE",
            last_login_label: "Hôm qua, 14:05",
            password_hash: BlossomAPI.simulateBcryptHash("Manager@123"),
            posts_count: 7
        },
        {
            user_id: 7,
            username: "conghuy",
            full_name: "Trịnh Trần Công Huy",
            email: "conghuy@blossom.vn",
            phone: "0907890123",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm nay, 08:50",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 12
        },
        {
            user_id: 8,
            username: "phatdat",
            full_name: "Nguyễn Phát Đạt",
            email: "phatdat@blossom.vn",
            phone: "0908901234",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm nay, 08:45",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 10
        },
        {
            user_id: 9,
            username: "hoangson",
            full_name: "Phan Hoàng Sơn",
            email: "hoangson@blossom.vn",
            phone: "0909012345",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm qua, 21:10",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 6
        },
        {
            user_id: 10,
            username: "thuthao",
            full_name: "Lê Thị Thu Thảo",
            email: "thuthao@blossom.vn",
            phone: "0910123456",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "Hôm qua, 17:30",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 4
        },
        {
            user_id: 11,
            username: "thanhha",
            full_name: "Ngô Thanh Hà",
            email: "thanhha@blossom.vn",
            phone: "0911234567",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "ACTIVE",
            last_login_label: "14/11/2026, 16:00",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 3
        },
        {
            user_id: 12,
            username: "quynhanh",
            full_name: "Bùi Quỳnh Anh",
            email: "quynhanh@blossom.vn",
            phone: "0912345678",
            role_key: "STAFF",
            role_code: "STAFF",
            status: "LOCKED",
            last_login_label: "01/11/2026, 11:20",
            password_hash: BlossomAPI.simulateBcryptHash("Staff@123"),
            posts_count: 2
        }
    ];

    let accounts = loadAccounts();
    let selectedUserId = 2; // Mặc định chọn Trần Ngọc Mai khớp Figma
    let currentPage = 1;

    function loadAccounts() {
        try {
            const raw = JSON.parse(localStorage.getItem(ACCOUNTS_KEY));
            if (Array.isArray(raw) && raw.length) return raw;
        } catch (e) {
            /* ignore */
        }
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
        return INITIAL_ACCOUNTS.slice();
    }

    function saveAccounts() {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    function getInitials(fullName) {
        const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "U";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function getFilteredAccounts() {
        const keyword = (document.getElementById("accountSearchInput").value || "").trim().toLowerCase();
        const roleFilter = document.getElementById("roleFilterSelect").value;
        const statusFilter = document.getElementById("statusFilterSelect").value;

        return accounts.filter(function (acc) {
            const matchKeyword = !keyword ||
                acc.full_name.toLowerCase().includes(keyword) ||
                acc.email.toLowerCase().includes(keyword) ||
                (acc.username && acc.username.toLowerCase().includes(keyword));

            const matchRole = roleFilter === "ALL" || acc.role_code === roleFilter;
            const isLocked = acc.status === "LOCKED" || acc.status === "DEACTIVATED";
            const matchStatus = statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && acc.status === "ACTIVE") ||
                (statusFilter === "LOCKED" && isLocked);

            return matchKeyword && matchRole && matchStatus;
        });
    }

    function renderMetrics() {
        const total = accounts.length;
        const active = accounts.filter(function (a) { return a.status === "ACTIVE"; }).length;
        const locked = accounts.filter(function (a) { return a.status !== "ACTIVE"; }).length;

        document.getElementById("metricTotal").textContent = UI.pad(total);
        document.getElementById("metricActive").textContent = UI.pad(active);
        document.getElementById("metricLocked").textContent = UI.pad(locked);
        document.getElementById("metricRoles").textContent = "03";
        document.getElementById("memberCountPill").textContent = total + " thành viên";
    }

    function renderTable() {
        const filtered = getFilteredAccounts();
        const totalFiltered = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        const rowsEl = document.getElementById("accountRows");

        if (!pageItems.length) {
            rowsEl.innerHTML = UI.emptyState({ text: "Không tìm thấy tài khoản nào khớp với bộ lọc." });
        } else {
            rowsEl.innerHTML = pageItems.map(function (acc) {
                const roleCfg = ROLE_CONFIG[acc.role_key] || ROLE_CONFIG[acc.role_code] || ROLE_CONFIG.STAFF;
                const isSelected = acc.user_id === selectedUserId;
                const isActive = acc.status === "ACTIVE";

                return '<div class="fr03-row' + (isSelected ? " is-selected" : "") + '" data-user-id="' + acc.user_id + '">' +
                    '<div class="fr03-member-cell">' +
                        '<span class="fr03-checkbox"></span>' +
                        '<span class="fr03-avatar">' + UI.esc(getInitials(acc.full_name)) + '</span>' +
                        '<div class="fr03-member-identity">' +
                            '<span class="fr03-member-name">' + UI.esc(acc.full_name) + '</span>' +
                            '<span class="fr03-member-email">' + UI.esc(acc.email) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<span class="fr03-role-text' + (roleCfg.isHighlight ? " is-admin" : "") + '">' + UI.esc(roleCfg.displayRole) + '</span>' +
                    '<div><span class="fr03-status-pill ' + (isActive ? "is-active" : "is-locked") + '">' +
                        (isActive ? "Hoạt động" : "Đã khóa") +
                    '</span></div>' +
                    '<span class="fr03-last-login">' + UI.esc(acc.last_login_label || "Chưa đăng nhập") + '</span>' +
                    '<button type="button" class="fr03-edit-btn" data-edit-id="' + acc.user_id + '" title="Chỉnh sửa thông tin tài khoản">' +
                        '<img src="../../assets/figma/pencil.svg" alt="Sửa" width="13" height="13">' +
                    '</button>' +
                '</div>';
            }).join("");
        }

        // Pagination summary & controls
        const summaryEl = document.getElementById("paginationSummary");
        if (totalFiltered === 0) {
            summaryEl.textContent = "Hiển thị 0 tài khoản";
        } else {
            const from = startIdx + 1;
            const to = Math.min(startIdx + PAGE_SIZE, totalFiltered);
            summaryEl.textContent = "Hiển thị " + from + "–" + to + " trên " + totalFiltered + " tài khoản";
        }

        const controlsEl = document.getElementById("paginationControls");
        let btnsHtml = '<button type="button" class="fr03-page-btn" data-page="prev"' + (currentPage <= 1 ? " disabled" : "") + '>‹</button>';
        for (let p = 1; p <= totalPages; p++) {
            btnsHtml += '<button type="button" class="fr03-page-btn' + (p === currentPage ? " is-active" : "") + '" data-page="' + p + '">' + p + '</button>';
        }
        btnsHtml += '<button type="button" class="fr03-page-btn" data-page="next"' + (currentPage >= totalPages ? " disabled" : "") + '>›</button>';
        controlsEl.innerHTML = btnsHtml;
    }

    function getSelectedAccount() {
        return accounts.find(function (a) { return a.user_id === selectedUserId; }) || accounts[0] || null;
    }

    function renderDetailPanel() {
        const acc = getSelectedAccount();
        if (!acc) return;
        selectedUserId = acc.user_id;

        document.getElementById("detailAvatar").textContent = getInitials(acc.full_name);
        document.getElementById("detailName").textContent = acc.full_name;
        document.getElementById("detailEmail").textContent = acc.email;

        const roleSelect = document.getElementById("detailRoleSelect");
        roleSelect.value = acc.role_key || acc.role_code || "STAFF";
        updateRoleDescription(roleSelect.value);

        const isActive = acc.status === "ACTIVE";
        const switchBtn = document.getElementById("detailLoginSwitch");
        switchBtn.classList.toggle("is-on", isActive);
        switchBtn.setAttribute("aria-checked", String(isActive));

        const lockBtn = document.getElementById("btnToggleLock");
        lockBtn.textContent = isActive ? "♙ Khóa tài khoản" : "♙ Mở khóa tài khoản";

        const hashEl = document.getElementById("detailPasswordHash");
        const fullHash = acc.password_hash || BlossomAPI.simulateBcryptHash("Staff@123");
        hashEl.textContent = fullHash.slice(0, 22) + "...";
        hashEl.title = fullHash;
    }

    function updateRoleDescription(roleKey) {
        const cfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.STAFF;
        document.getElementById("detailRoleDesc").textContent = cfg.description;
    }

    function isDuplicateEmail(email, ignoreUserId) {
        const clean = String(email || "").trim().toLowerCase();
        return accounts.some(function (acc) {
            return acc.email.toLowerCase() === clean && acc.user_id !== ignoreUserId;
        });
    }

    function bindPasswordComplexityLive(inputEl, containerEl) {
        function update() {
            const res = BlossomAPI.validatePasswordComplexity(inputEl.value);
            const r = res.rules;
            containerEl.querySelector('[data-rule="len"]').classList.toggle("is-ok", r.minLength);
            containerEl.querySelector('[data-rule="upper"]').classList.toggle("is-ok", r.hasUpper);
            containerEl.querySelector('[data-rule="lower"]').classList.toggle("is-ok", r.hasLower);
            containerEl.querySelector('[data-rule="digit"]').classList.toggle("is-ok", r.hasDigit);
        }
        inputEl.addEventListener("input", update);
        update();
    }

    /* ---------- MODAL THÊM / SỬA TÀI KHOẢN ---------- */
    function openAccountFormModal(mode, accountToEdit) {
        const isEdit = mode === "edit" && accountToEdit;
        const title = isEdit ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới (FR-03)";
        const currentRoleKey = isEdit ? (accountToEdit.role_key || accountToEdit.role_code) : "STAFF";
        const currentStatus = isEdit ? accountToEdit.status : "ACTIVE";

        const bodyHtml =
            '<form id="accountModalForm" class="fr03-form-grid" novalidate>' +
                '<div class="field" id="fFullName">' +
                    '<label class="field__label" for="mFullName">Họ và tên *</label>' +
                    '<input class="input" id="mFullName" type="text" placeholder="VD: Nguyễn Thị Lan Anh" value="' + UI.esc(isEdit ? accountToEdit.full_name : "") + '">' +
                    '<span class="field__error" id="eFullName"></span>' +
                '</div>' +
                '<div class="fr03-form-row">' +
                    '<div class="field" id="fEmail">' +
                        '<label class="field__label" for="mEmail">Email công việc (Unique) *</label>' +
                        '<input class="input" id="mEmail" type="email" placeholder="lananh@blossom.vn" value="' + UI.esc(isEdit ? accountToEdit.email : "") + '">' +
                        '<span class="field__error" id="eEmail"></span>' +
                    '</div>' +
                    '<div class="field" id="fPhone">' +
                        '<label class="field__label" for="mPhone">Số điện thoại</label>' +
                        '<input class="input" id="mPhone" type="tel" placeholder="0901234567" value="' + UI.esc(isEdit ? (accountToEdit.phone || "") : "") + '">' +
                    '</div>' +
                '</div>' +
                '<div class="fr03-form-row">' +
                    '<div class="field" id="fRole">' +
                        '<label class="field__label" for="mRole">Vai trò phân quyền *</label>' +
                        '<select class="select" id="mRole">' +
                            '<option value="STAFF"' + (currentRoleKey === "STAFF" ? " selected" : "") + '>Marketing Staff (Nhân viên)</option>' +
                            '<option value="MANAGER"' + (currentRoleKey === "MANAGER" ? " selected" : "") + '>Marketing Manager (Quản lý)</option>' +
                            '<option value="MANAGER_ADMIN"' + (currentRoleKey === "MANAGER_ADMIN" ? " selected" : "") + '>Quản trị viên (Manager)</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="field" id="fStatus">' +
                        '<label class="field__label" for="mStatus">Trạng thái *</label>' +
                        '<select class="select" id="mStatus">' +
                            '<option value="ACTIVE"' + (currentStatus === "ACTIVE" ? " selected" : "") + '>Hoạt động (Active)</option>' +
                            '<option value="LOCKED"' + (currentStatus !== "ACTIVE" ? " selected" : "") + '>Đã khóa (Inactive / Locked)</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="field" id="fPassword">' +
                    '<label class="field__label" for="mPassword">' + (isEdit ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu khởi tạo *") + '</label>' +
                    '<input class="input" id="mPassword" type="password" placeholder="Tối thiểu 8 ký tự: chữ hoa, thường, số (VD: Blossom@123)">' +
                    '<span class="field__error" id="ePassword"></span>' +
                    '<div class="fr03-pw-rules" id="pwRulesBox">' +
                        '<span class="fr03-pw-rule" data-rule="len">✓ Tối thiểu 8 ký tự</span>' +
                        '<span class="fr03-pw-rule" data-rule="upper">✓ Ít nhất 1 chữ hoa (A-Z)</span>' +
                        '<span class="fr03-pw-rule" data-rule="lower">✓ Ít nhất 1 chữ thường (a-z)</span>' +
                        '<span class="fr03-pw-rule" data-rule="digit">✓ Ít nhất 1 chữ số (0-9)</span>' +
                    '</div>' +
                '</div>' +
            '</form>';

        const previous = document.activeElement;
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop";
        backdrop.innerHTML =
            '<div class="modal modal--lg" role="dialog" aria-modal="true">' +
                '<div class="modal__head">' +
                    '<h3 class="modal__title">' + UI.esc(title) + '</h3>' +
                    '<button type="button" class="modal__close" data-close aria-label="Đóng">' + UI.icon("close") + '</button>' +
                '</div>' +
                '<div class="modal__body">' + bodyHtml + '</div>' +
                '<div class="modal__foot">' +
                    UI.button({ label: "Hủy", variant: "secondary", id: "mBtnCancel" }) +
                    UI.button({ label: isEdit ? "Lưu cập nhật" : "Tạo tài khoản", variant: "primary", id: "mBtnSubmit" }) +
                '</div>' +
            '</div>';

        document.body.classList.add("modal-open");
        document.body.appendChild(backdrop);

        const pwInput = backdrop.querySelector("#mPassword");
        const pwRulesBox = backdrop.querySelector("#pwRulesBox");
        bindPasswordComplexityLive(pwInput, pwRulesBox);

        function closeModal() {
            backdrop.remove();
            document.body.classList.remove("modal-open");
            if (previous && previous.focus) previous.focus();
        }

        backdrop.addEventListener("click", function (e) {
            if (e.target === backdrop || e.target.closest("[data-close]") || e.target.closest("#mBtnCancel")) {
                closeModal();
            }
        });

        backdrop.querySelector("#mBtnSubmit").addEventListener("click", async function () {
            const fullName = backdrop.querySelector("#mFullName").value.trim();
            const email = backdrop.querySelector("#mEmail").value.trim().toLowerCase();
            const phone = backdrop.querySelector("#mPhone").value.trim();
            const roleKey = backdrop.querySelector("#mRole").value;
            const statusVal = backdrop.querySelector("#mStatus").value;
            const password = backdrop.querySelector("#mPassword").value;

            // Clear errors
            ["#fFullName", "#fEmail", "#fPassword"].forEach(function (sel) {
                backdrop.querySelector(sel).classList.remove("is-error");
            });
            backdrop.querySelector("#eFullName").textContent = "";
            backdrop.querySelector("#eEmail").textContent = "";
            backdrop.querySelector("#ePassword").textContent = "";

            let hasError = false;
            if (!fullName) {
                backdrop.querySelector("#fFullName").classList.add("is-error");
                backdrop.querySelector("#eFullName").textContent = "Vui lòng nhập họ và tên nhân sự.";
                hasError = true;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                backdrop.querySelector("#fEmail").classList.add("is-error");
                backdrop.querySelector("#eEmail").textContent = "Vui lòng nhập địa chỉ Email hợp lệ.";
                hasError = true;
            } else if (isDuplicateEmail(email, isEdit ? accountToEdit.user_id : null)) {
                backdrop.querySelector("#fEmail").classList.add("is-error");
                backdrop.querySelector("#eEmail").textContent = "[ERR-01] Email này đã được sử dụng. Vui lòng nhập Email khác.";
                UI.toast("error", "Trùng Email (ERR-01)", "Email này đã được sử dụng trên hệ thống.");
                hasError = true;
            }

            if (!isEdit || password.length > 0) {
                const pwCheck = BlossomAPI.validatePasswordComplexity(password);
                if (!pwCheck.valid) {
                    backdrop.querySelector("#fPassword").classList.add("is-error");
                    backdrop.querySelector("#ePassword").textContent = pwCheck.message;
                    UI.toast("error", "Mật khẩu chưa đạt chuẩn (ERR-02)", pwCheck.message);
                    hasError = true;
                }
            }

            if (hasError) return;

            const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.STAFF;
            const roleId = roleCfg.code === "MANAGER" ? 1 : 2;
            const bcryptHash = password ? BlossomAPI.simulateBcryptHash(password) : (accountToEdit && accountToEdit.password_hash);

            if (isEdit) {
                // Thử đồng bộ API nếu có
                try {
                    await BlossomAPI.request("/users/" + accountToEdit.user_id, {
                        method: "PUT",
                        body: JSON.stringify({
                            full_name: fullName,
                            email: email,
                            phone: phone,
                            role_id: roleId,
                            status: statusVal,
                            password: password || undefined
                        })
                    });
                } catch (err) {
                    /* fallback localStorage */
                }

                accountToEdit.full_name = fullName;
                accountToEdit.email = email;
                accountToEdit.phone = phone;
                accountToEdit.role_key = roleKey;
                accountToEdit.role_code = roleCfg.code;
                accountToEdit.status = statusVal;
                if (password) accountToEdit.password_hash = bcryptHash;

                saveAccounts();
                selectedUserId = accountToEdit.user_id;
                renderMetrics();
                renderTable();
                renderDetailPanel();
                closeModal();
                UI.toast("success", "Đã cập nhật tài khoản", "Thông tin & quyền của " + fullName + " đã được áp dụng ngay lập tức.");
            } else {
                const nextId = accounts.reduce(function (m, a) { return Math.max(m, a.user_id); }, 0) + 1;
                const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || ("user" + nextId);

                try {
                    await BlossomAPI.request("/users", {
                        method: "POST",
                        body: JSON.stringify({
                            username: username,
                            full_name: fullName,
                            email: email,
                            phone: phone,
                            password: password,
                            role_id: roleId,
                            status: statusVal
                        })
                    });
                } catch (err) {
                    /* fallback localStorage */
                }

                const newAcc = {
                    user_id: nextId,
                    username: username,
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    role_key: roleKey,
                    role_code: roleCfg.code,
                    status: statusVal,
                    last_login_label: "Vừa khởi tạo",
                    password_hash: bcryptHash,
                    posts_count: 0
                };
                accounts.unshift(newAcc);
                saveAccounts();
                selectedUserId = newAcc.user_id;
                currentPage = 1;
                renderMetrics();
                renderTable();
                renderDetailPanel();
                closeModal();
                UI.toast("success", "Tạo tài khoản thành công", "Đã tạo " + fullName + " (" + roleCfg.displayRole + ") với mật khẩu băm Bcrypt.");
            }
        });
    }

    /* ---------- MODAL ĐẶT LẠI MẬT KHẨU ---------- */
    function openResetPasswordModal(acc) {
        if (!acc) return;

        const bodyHtml =
            '<div class="fr03-form-grid">' +
                '<p style="font-size:13px;color:#574b50;">Đặt lại mật khẩu cho <b>' + UI.esc(acc.full_name) + '</b> (' + UI.esc(acc.email) + ').</p>' +
                '<div class="field" id="fResetPw">' +
                    '<label class="field__label" for="mResetPw">Mật khẩu mới *</label>' +
                    '<input class="input" id="mResetPw" type="password" placeholder="Nhập mật khẩu mới (VD: Blossom@2026)">' +
                    '<span class="field__error" id="eResetPw"></span>' +
                    '<div class="fr03-pw-rules" id="resetPwRules">' +
                        '<span class="fr03-pw-rule" data-rule="len">✓ Tối thiểu 8 ký tự</span>' +
                        '<span class="fr03-pw-rule" data-rule="upper">✓ Ít nhất 1 chữ hoa (A-Z)</span>' +
                        '<span class="fr03-pw-rule" data-rule="lower">✓ Ít nhất 1 chữ thường (a-z)</span>' +
                        '<span class="fr03-pw-rule" data-rule="digit">✓ Ít nhất 1 chữ số (0-9)</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop";
        backdrop.innerHTML =
            '<div class="modal" role="dialog" aria-modal="true">' +
                '<div class="modal__head">' +
                    '<h3 class="modal__title">Đặt lại mật khẩu</h3>' +
                    '<button type="button" class="modal__close" data-close aria-label="Đóng">' + UI.icon("close") + '</button>' +
                '</div>' +
                '<div class="modal__body">' + bodyHtml + '</div>' +
                '<div class="modal__foot">' +
                    UI.button({ label: "Hủy", variant: "secondary", id: "rBtnCancel" }) +
                    UI.button({ label: "Lưu mật khẩu mới", variant: "primary", id: "rBtnSave" }) +
                '</div>' +
            '</div>';

        document.body.classList.add("modal-open");
        document.body.appendChild(backdrop);

        const pwInput = backdrop.querySelector("#mResetPw");
        bindPasswordComplexityLive(pwInput, backdrop.querySelector("#resetPwRules"));

        function close() {
            backdrop.remove();
            document.body.classList.remove("modal-open");
        }

        backdrop.addEventListener("click", function (e) {
            if (e.target === backdrop || e.target.closest("[data-close]") || e.target.closest("#rBtnCancel")) close();
        });

        backdrop.querySelector("#rBtnSave").addEventListener("click", async function () {
            const newPw = pwInput.value;
            const check = BlossomAPI.validatePasswordComplexity(newPw);
            if (!check.valid) {
                backdrop.querySelector("#fResetPw").classList.add("is-error");
                backdrop.querySelector("#eResetPw").textContent = check.message;
                UI.toast("error", "Mật khẩu không hợp lệ (ERR-02)", check.message);
                return;
            }

            try {
                await BlossomAPI.request("/users/" + acc.user_id + "/reset-password", {
                    method: "PATCH",
                    body: JSON.stringify({ new_password: newPw })
                });
            } catch (e) {
                /* fallback localStorage */
            }

            acc.password_hash = BlossomAPI.simulateBcryptHash(newPw);
            saveAccounts();
            renderDetailPanel();
            close();
            UI.toast("success", "Đã mã hóa & cập nhật mật khẩu", "Mật khẩu của " + acc.full_name + " đã được băm bằng Bcrypt.");
        });
    }

    /* ---------- SỰ KIỆN TRÊN TRANG ---------- */
    function bindEvents() {
        document.getElementById("btnAddAccount").addEventListener("click", function () {
            openAccountFormModal("create", null);
        });

        document.getElementById("btnEditAccountModal").addEventListener("click", function () {
            const acc = getSelectedAccount();
            if (acc) openAccountFormModal("edit", acc);
        });

        document.getElementById("accountSearchInput").addEventListener("input", function () {
            currentPage = 1;
            renderTable();
        });

        // Đồng bộ ô tìm kiếm trên topbar nếu người dùng gõ vào đó
        const topSearch = document.getElementById("searchInput");
        if (topSearch) {
            topSearch.addEventListener("input", function () {
                document.getElementById("accountSearchInput").value = topSearch.value;
                currentPage = 1;
                renderTable();
            });
        }

        document.getElementById("roleFilterSelect").addEventListener("change", function () {
            currentPage = 1;
            renderTable();
        });

        document.getElementById("statusFilterSelect").addEventListener("change", function () {
            currentPage = 1;
            renderTable();
        });

        document.getElementById("accountRows").addEventListener("click", function (e) {
            const editBtn = e.target.closest("[data-edit-id]");
            if (editBtn) {
                e.stopPropagation();
                const id = Number(editBtn.dataset.editId);
                const acc = accounts.find(function (a) { return a.user_id === id; });
                if (acc) {
                    selectedUserId = acc.user_id;
                    renderTable();
                    renderDetailPanel();
                    openAccountFormModal("edit", acc);
                }
                return;
            }

            const row = e.target.closest(".fr03-row");
            if (!row) return;
            selectedUserId = Number(row.dataset.userId);
            renderTable();
            renderDetailPanel();
        });

        document.getElementById("paginationControls").addEventListener("click", function (e) {
            const btn = e.target.closest("[data-page]");
            if (!btn || btn.disabled) return;
            const p = btn.dataset.page;
            if (p === "prev") currentPage = Math.max(1, currentPage - 1);
            else if (p === "next") currentPage += 1;
            else currentPage = Number(p);
            renderTable();
        });

        document.getElementById("detailRoleSelect").addEventListener("change", function (e) {
            updateRoleDescription(e.target.value);
        });

        document.getElementById("detailLoginSwitch").addEventListener("click", function () {
            const btn = document.getElementById("detailLoginSwitch");
            const nextState = !btn.classList.contains("is-on");
            btn.classList.toggle("is-on", nextState);
            btn.setAttribute("aria-checked", String(nextState));
        });

        document.getElementById("btnSaveDetail").addEventListener("click", async function () {
            const acc = getSelectedAccount();
            if (!acc) return;

            const newRoleKey = document.getElementById("detailRoleSelect").value;
            const roleCfg = ROLE_CONFIG[newRoleKey] || ROLE_CONFIG.STAFF;
            const allowLogin = document.getElementById("detailLoginSwitch").classList.contains("is-on");
            const newStatus = allowLogin ? "ACTIVE" : "LOCKED";

            try {
                await BlossomAPI.request("/users/" + acc.user_id, {
                    method: "PUT",
                    body: JSON.stringify({
                        role_id: roleCfg.code === "MANAGER" ? 1 : 2,
                        status: newStatus
                    })
                });
            } catch (e) {
                /* fallback localStorage */
            }

            acc.role_key = newRoleKey;
            acc.role_code = roleCfg.code;
            acc.status = newStatus;
            saveAccounts();
            renderMetrics();
            renderTable();
            renderDetailPanel();

            UI.toast(
                "success",
                "Đã lưu phân quyền & trạng thái",
                acc.full_name + " → " + roleCfg.displayRole + " (" + (allowLogin ? "Hoạt động" : "Đã khóa, ngắt phiên hiện hành & giữ nguyên lịch sử bài viết") + ")."
            );
        });

        document.getElementById("btnResetPassword").addEventListener("click", function () {
            openResetPasswordModal(getSelectedAccount());
        });

        document.getElementById("btnToggleLock").addEventListener("click", async function () {
            const acc = getSelectedAccount();
            if (!acc) return;

            const isCurrentlyActive = acc.status === "ACTIVE";
            const nextStatus = isCurrentlyActive ? "LOCKED" : "ACTIVE";
            const actionLabel = isCurrentlyActive ? "Khóa tài khoản" : "Mở khóa tài khoản";

            const ok = await UI.confirm({
                title: actionLabel + " — " + acc.full_name,
                message: isCurrentlyActive
                    ? "Khi khóa sang trạng thái Đã khóa (Inactive), hệ thống sẽ ngắt phiên đăng nhập hiện hành của nhân sự này nhưng giữ nguyên toàn bộ " + (acc.posts_count || 0) + " bài viết đã tạo. Bạn có chắc chắn muốn khóa?"
                    : "Khôi phục quyền đăng nhập hệ thống cho tài khoản " + acc.full_name + "?",
                confirmText: actionLabel,
                cancelText: "Hủy",
                tone: isCurrentlyActive ? "danger" : "primary"
            });

            if (!ok) return;

            try {
                await BlossomAPI.request("/users/" + acc.user_id + "/status", {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus })
                });
            } catch (e) {
                /* fallback localStorage */
            }

            acc.status = nextStatus;
            saveAccounts();
            renderMetrics();
            renderTable();
            renderDetailPanel();

            UI.toast(
                "success",
                "Đã " + actionLabel.toLowerCase(),
                acc.full_name + " hiện ở trạng thái " + (nextStatus === "ACTIVE" ? "Hoạt động." : "Đã khóa (bảo toàn lịch sử Post).")
            );
        });

        document.getElementById("btnDeactivateAccount").addEventListener("click", async function () {
            const acc = getSelectedAccount();
            if (!acc) return;

            const ok = await UI.confirm({
                title: "Vô hiệu hóa tài khoản (Soft Deactivate)",
                message: "Theo quy tắc nghiệp vụ BR-01 & SDD 3.2.2, hệ thống không xóa cứng (Hard Delete) để bảo toàn lịch sử " + (acc.posts_count || 0) + " bài viết và lịch sử phê duyệt của " + acc.full_name + ". Tài khoản sẽ chuyển sang trạng thái Đã khóa (DEACTIVATED).",
                confirmText: "Vô hiệu hóa",
                cancelText: "Hủy",
                tone: "danger"
            });

            if (!ok) return;

            try {
                await BlossomAPI.request("/users/" + acc.user_id + "/status", {
                    method: "PATCH",
                    body: JSON.stringify({ status: "DEACTIVATED" })
                });
            } catch (e) {
                /* fallback localStorage */
            }

            acc.status = "DEACTIVATED";
            saveAccounts();
            renderMetrics();
            renderTable();
            renderDetailPanel();
            UI.toast("warning", "Đã vô hiệu hóa tài khoản", "Phiên của " + acc.full_name + " đã ngắt, lịch sử bài viết được bảo toàn.");
        });
    }

    renderMetrics();
    renderTable();
    renderDetailPanel();
    bindEvents();
})();
