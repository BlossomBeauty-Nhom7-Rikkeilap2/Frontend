
/* =====================================================
   BLOSSOM BEAUTY STORE - XỬ LÝ ĐĂNG NHẬP

   Mục lục:
   1. Cấu hình và dữ liệu mẫu
   2. Lấy phần tử DOM
   3. Hàm tiện ích
   4. Toast thông báo
   5. Xác thực đăng nhập và phân quyền
   6. Sự kiện và khởi tạo
   ===================================================== */

(() => {
    "use strict";

    /* ---------- 1. CẤU HÌNH VÀ DỮ LIỆU MẪU ---------- */

    const TOAST_DURATION = 1000;
    const MANAGER_URL = "../admin/dashboard.html";
    const STAFF_URL = "../staff/dashboard.html";

    const REMEMBER_KEY = "blossom_remember_user";
    const USER_KEY = "blossom_user";

    // Tài khoản demo
    const USERS = [
        {
            username: "admin",
            email: "admin@blossom.vn",
            password: "Blossom@123",
            role: "MANAGER",
            fullName: "Đoàn Thị Minh Anh",
            position: "Marketing Manager"
        },
        {
            username: "minhanh",
            email: "minhanh@blossom.vn",
            password: "Staff@123",
            role: "STAFF",
            fullName: "Doãn Thị Minh Anh",
            position: "Marketing Staff"
        },
        {
            username: "thuyduong",
            email: "thuyduong@blossom.vn",
            password: "Staff@123",
            role: "STAFF",
            fullName: "Nguyễn Thùy Dương",
            position: "Marketing Staff"
        },
        {
            username: "manh",
            email: "manh@blossom.vn",
            password: "Manh@2026",
            role: "STAFF",
            fullName: "Doãn Thị Minh Anh",
            position: "Marketing Staff"
        }
    ];

    /* ---------- 2. LẤY PHẦN TỬ DOM ---------- */

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    const rememberBox = document.getElementById("remember");

    const btnLogin = document.getElementById("btnLogin");
    const btnToggle = document.getElementById("togglePassword");
    const eyeIcon = document.getElementById("eyeIcon");

    const fieldEmail = document.getElementById("fieldEmail");
    const fieldPass = document.getElementById("fieldPassword");

    const emailError = document.getElementById("emailError");
    const passError = document.getElementById("passwordError");

    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastTitle = document.getElementById("toastTitle");
    const toastMsg = document.getElementById("toastMessage");

    const ICON_EYE = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';

    const ICON_EYE_OFF = '<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 004.4-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>';

    /* ---------- 3. HÀM TIỆN ÍCH ---------- */

    function setError(field, errorEl, message) {
        field.classList.add("is-error");
        errorEl.textContent = message;
    }

    function clearErrors() {
        [fieldEmail, fieldPass].forEach((field) => {
            field.classList.remove("is-error");
        });

        emailError.textContent = "";
        passError.textContent = "";
    }

    /* ---------- 4. TOAST THÔNG BÁO ---------- */

    let toastTimer = null;

    function showToast(type, title, message) {
        clearTimeout(toastTimer);

        toast.className = "toast toast--" + type;

        toastIcon.textContent = type === "success" ? "✓" : "!";
        toastTitle.textContent = title;
        toastMsg.textContent = message;

        toast.hidden = false;

        void toast.offsetWidth;

        toast.classList.add("is-running");

        toastTimer = setTimeout(() => {
            toast.hidden = true;
        }, TOAST_DURATION);
    }

    /* ---------- 5. XÁC THỰC VÀ PHÂN QUYỀN ---------- */

    // Kiểm tra tài khoản trực tiếp từ AccountStore (đồng bộ 100% với mục Tài khoản & Phân quyền + Đổi mật khẩu)
    function authenticate(identifier, password) {
        const key = identifier.trim().toLowerCase();

        if (window.AccountStore && typeof AccountStore.findByIdentifier === "function") {
            const acc = AccountStore.findByIdentifier(key);
            if (!acc) {
                return { ok: false, reason: "email" };
            }

            // Tài khoản đã bị khóa -> tuyệt đối không cho đăng nhập
            if (acc.status === "locked") {
                return { ok: false, reason: "locked" };
            }

            if (!AccountStore.verifyPassword(acc, password)) {
                return { ok: false, reason: "password" };
            }

            const role = acc.role === "MANAGER" ? "MANAGER" : "STAFF";
            return {
                ok: true,
                user: {
                    id: acc.id,
                    username: acc.username || AccountStore.usernameFromEmail(acc.email),
                    email: acc.email,
                    role: role,
                    fullName: acc.fullName,
                    position: role === "MANAGER" ? "Marketing Manager" : "Marketing Staff"
                }
            };
        }

        const user = USERS.find((u) => {
            return u.email === key || u.username === key;
        });

        if (!user) {
            return { ok: false, reason: "email" };
        }

        if (window.AccountStore && AccountStore.isLocked(user.email)) {
            return { ok: false, reason: "locked" };
        }

        if (user.password !== password) {
            return { ok: false, reason: "password" };
        }

        return { ok: true, user: user };
    }

    // Xử lý đăng nhập
    function handleSubmit(e) {
        e.preventDefault();

        clearErrors();

        const identifier = emailInput.value.trim();
        const password = passInput.value;

        // 5.1 Kiểm tra bỏ trống
        let hasEmpty = false;

        if (!identifier) {
            setError(
                fieldEmail,
                emailError,
                "Vui lòng nhập email hoặc tên đăng nhập."
            );

            hasEmpty = true;
        }

        if (!password) {
            setError(
                fieldPass,
                passError,
                "Vui lòng nhập mật khẩu."
            );

            hasEmpty = true;
        }

        if (hasEmpty) {
            showToast(
                "error",
                "Đăng nhập thất bại",
                "Vui lòng nhập đầy đủ thông tin."
            );

            return;
        }

        // 5.2 Giả lập gọi API
        btnLogin.disabled = true;
        btnLogin.classList.add("is-loading");

        setTimeout(() => {
            const result = authenticate(identifier, password);

            btnLogin.disabled = false;
            btnLogin.classList.remove("is-loading");

            // 5.3 Đăng nhập thất bại
            if (!result.ok) {

                if (result.reason === "locked") {
                    setError(
                        fieldEmail,
                        emailError,
                        "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
                    );

                    showToast(
                        "error",
                        "Đăng nhập thất bại",
                        "Tài khoản của bạn đã bị khóa."
                    );

                    emailInput.focus();

                } else if (result.reason === "email") {
                    setError(
                        fieldEmail,
                        emailError,
                        "Email hoặc tên đăng nhập không tồn tại."
                    );

                    showToast(
                        "error",
                        "Đăng nhập thất bại",
                        "Sai email hoặc tên đăng nhập."
                    );

                    emailInput.focus();

                } else {
                    setError(
                        fieldPass,
                        passError,
                        "Mật khẩu không chính xác."
                    );

                    showToast(
                        "error",
                        "Đăng nhập thất bại",
                        "Sai mật khẩu, vui lòng thử lại."
                    );

                    passInput.select();
                }

                return;
            }

            // 5.4 Đăng nhập thành công
            const user = result.user;

            // Ghi nhớ tài khoản
            if (rememberBox.checked) {
                localStorage.setItem(REMEMBER_KEY, identifier);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
            }

            // Lưu thông tin người dùng
            localStorage.setItem(
                USER_KEY,
                JSON.stringify({
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    fullName: user.fullName,
                    position: user.position
                })
            );

            // Phân quyền chuyển trang
            let redirectURL;

            if (user.role === "MANAGER") {
                redirectURL = MANAGER_URL;
            } else if (user.role === "STAFF") {
                redirectURL = STAFF_URL;
            } else {
                showToast(
                    "error",
                    "Không có quyền truy cập",
                    "Vai trò tài khoản không hợp lệ."
                );

                localStorage.removeItem(USER_KEY);

                return;
            }

            // Hiển thị thông báo
            showToast(
                "success",
                "Đăng nhập thành công",
                "Chào mừng " + user.username + " quay trở lại!"
            );

            // Chuyển trang
            setTimeout(() => {
                window.location.href = redirectURL;
            }, TOAST_DURATION);

        }, 600);
    }

    /* ---------- 6. SỰ KIỆN VÀ KHỞI TẠO ---------- */

    // 6.1 Ẩn / hiện mật khẩu
    function renderEye(visible) {
        eyeIcon.innerHTML = visible ? ICON_EYE : ICON_EYE_OFF;

        btnToggle.setAttribute(
            "aria-label",
            visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"
        );
    }

    btnToggle.addEventListener("click", () => {
        const show = passInput.type === "password";

        passInput.type = show ? "text" : "password";

        renderEye(show);
    });

    // 6.2 Xóa lỗi khi nhập lại
    emailInput.addEventListener("input", () => {
        fieldEmail.classList.remove("is-error");
        emailError.textContent = "";
    });

    passInput.addEventListener("input", () => {
        fieldPass.classList.remove("is-error");
        passError.textContent = "";
    });

    // 6.3 Gửi form
    form.addEventListener("submit", handleSubmit);

    // 6.4 Khởi tạo
    renderEye(false);

    const saved = localStorage.getItem(REMEMBER_KEY);

    if (saved) {
        emailInput.value = saved;
        rememberBox.checked = true;
    }

})();
