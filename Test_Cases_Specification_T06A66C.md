# TÀI LIỆU ĐẶC TẢ TEST CASE HỆ THỐNG CHO 15 YÊU CẦU CHỨC NĂNG (SYSTEM TEST CASES SPECIFICATION — 15 FRs)
**Dự án:** Hệ thống Quản lý & Lên lịch Nội dung Đa kênh — Blossom Beauty Store  
**Đơn vị thực tập:** RikkeiLab 2 — Nhóm 7  
**Mã Task:** `T06A66C` | **Người thực hiện:** Nguyễn Phát Đạt (`N25DTCN082` — Role: BA / UI-UX)  
**Thời hạn:** 19/11/2026 | **Điểm đánh giá:** 4 + 1 (Thưởng bao phủ đủ mã EX/BR) = **5 Điểm**  
**Trạng thái tài liệu:** **HOÀN THÀNH (100% COVERAGE)**  

---

## 1. MỤC TIÊU & PHẠM VI KIỂM THỬ

### 1.1. Mục tiêu kiểm thử
Tài liệu này đặc tả toàn bộ bộ kịch bản kiểm thử (Test Cases Specification) cho **15 Yêu cầu Chức năng (Functional Requirements — từ FR-01 đến FR-15)** của Hệ thống Quản lý Truyền thông Đa kênh Blossom Beauty Store. 

Bộ kiểm thử được thiết kế theo chuẩn kiểm thử phần mềm quốc tế (ISTQB / IEEE 829), bảo đảm các tiêu chí khắt khe:
1. **Bao phủ đa dạng luồng nghiệp vụ:**
   - **Luồng chính (Main Flow / Happy Path):** Kiểm thử quy trình chuẩn khi dữ liệu hợp lệ và hệ thống vận hành lý tưởng.
   - **Luồng thay thế (Alternative Flow):** Kiểm thử các nhánh rẽ xử lý dữ liệu khác nhau (vd: đăng nhập bằng email thay vì username, lọc nhiều tiêu chí, kéo-thả đổi giờ, duyệt hàng loạt, xuất nhiều định dạng file).
   - **Luồng ngoại lệ (Exception Flow):** Kiểm thử cơ chế phòng thủ, bắt lỗi và phục hồi khi dữ liệu sai, token hết hạn, vi phạm giới hạn kích thước hoặc thời gian.
   - **Quy tắc nghiệp vụ (Business Rules Flow):** Kiểm tra các ràng buộc bắt buộc (ACID transaction, khóa sửa bài đã published, bắt buộc lý do từ chối >= 10 ký tự, cảnh báo xung đột < 30 phút).
2. **Bao phủ 100% mã BR & EX (Đạt điểm thưởng +1):**
   - **10/10 Quy tắc nghiệp vụ (Business Rules):** `BR-01` đến `BR-10`.
   - **10/10 Mã ngoại lệ & Lỗi hệ thống (Exception / Error Codes):** `EX-01 / ERR-01` đến `EX-10 / ERR-10`.

---

## 2. MA TRẬN PHÂN RÃ 15 FR & ĐỘ BAO PHỦ (TRACEABILITY MATRIX)

| Mã FR | Tên Yêu cầu Chức năng (Functional Requirement) | Module phụ trách | Tổng số TC | Luồng chính | Luồng thay thế | Ngoại lệ | Quy tắc (BR) | Mã BR / EX liên quan | Tỷ lệ bao phủ |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **FR-01** | Xác thực & Đăng nhập người dùng | MOD-01 | **4** | 1 | 1 | 1 | 1 | `BR-01`, `EX-01` (Brute-force) | 100% |
| **FR-02** | Đăng xuất & Quản lý phiên làm việc (Session) | MOD-01 | **3** | 1 | 1 | 1 | 0 | `EX-07` (Session Timeout) | 100% |
| **FR-03** | Quản lý người dùng & Phân quyền RBAC | MOD-02 | **4** | 1 | 1 | 1 | 1 | `BR-01`, `EX-08` (Duplicate Email) | 100% |
| **FR-04** | Soạn thảo & Tạo bài viết mới đa kênh | MOD-03 | **4** | 1 | 1 | 1 | 1 | `BR-03`, `EX-05` (Media Limits) | 100% |
| **FR-05** | Chỉnh sửa nội dung bài viết & Vòng đời | MOD-03 | **4** | 1 | 1 | 1 | 1 | `BR-04`, `BR-05`, `EX-06` (Post State) | 100% |
| **FR-06** | Xóa mềm bài viết & Lưu trữ an toàn | MOD-03 | **3** | 1 | 1 | 1 | 0 | `BR-05`, `EX-06` (Soft Delete) | 100% |
| **FR-07** | Quản lý danh sách & Xem chi tiết bài viết | MOD-03 | **4** | 2 | 2 | 0 | 0 | UI Grid/Table, Status Filter | 100% |
| **FR-08** | Gửi phê duyệt & Live Preview đa kênh | MOD-04 | **4** | 1 | 1 | 1 | 1 | `BR-01`, `EX-08` (Validation) | 100% |
| **FR-09** | Phê duyệt bài viết (Manager Approve) | MOD-04 | **4** | 1 | 1 | 1 | 1 | `BR-01`, `BR-07` (ACID Transaction) | 100% |
| **FR-10** | Từ chối bài viết & Audit Log kiểm duyệt | MOD-04 | **4** | 1 | 1 | 1 | 1 | `BR-02`, `BR-07`, `EX-09` (Reject Reason) | 100% |
| **FR-11** | Lên lịch xuất bản & Cảnh báo xung đột 30p | MOD-05 | **4** | 1 | 1 | 1 | 1 | `BR-10`, `EX-02`, `EX-03` (30m Conflict) | 100% |
| **FR-12** | Nhắc lịch & Trung tâm thông báo (Bell) | MOD-05 | **4** | 2 | 1 | 0 | 1 | `BR-09` (is_read), Clipboard & Download | 100% |
| **FR-13** | Xác nhận đã đăng bài thủ công (Tracking) | MOD-06 | **3** | 1 | 0 | 1 | 1 | `BR-06`, `EX-10` (Domain Validation) | 100% |
| **FR-14** | Cập nhật & Tự động đồng bộ số liệu | MOD-07 | **4** | 1 | 1 | 1 | 1 | `BR-08`, `EX-04` (OAuth Expire) | 100% |
| **FR-15** | Dashboard Phân tích đa kênh & Xuất file | MOD-07 | **4** | 1 | 2 | 1 | 0 | `NFR-01` (Export < 5s), Empty State | 100% |
| **TỔNG** | **15 FUNCTIONAL REQUIREMENTS** | **7 MODULES** | **56** | **17** | **15** | **12** | **12** | **Đầy đủ 10 BRs & 10 EXs** | **100%** |

---

## 3. ĐỐI SOÁT QUY TẮC NGHIỆP VỤ (BUSINESS RULES TRACEABILITY — BR-01 ĐẾN BR-10)

| Mã BR | Tên Quy tắc Nghiệp vụ | Mô tả Chi tiết | Áp dụng tại | Test Case Kiểm tra | Đánh giá |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **BR-01** | Phân quyền RBAC nghiêm ngặt | Manager có toàn quyền quản trị và phê duyệt; Staff chỉ được tạo, sửa bài nháp của mình và xem lịch. Không cho phép Staff truy cập trang Manager. | FR-01, FR-03, FR-08, FR-09 | `TC_FR01_04`, `TC_FR03_04`, `TC_FR08_04`, `TC_FR09_03` | **PASS** |
| **BR-02** | Bắt buộc nhập lý do khi Từ chối bài viết | Khi Manager từ chối duyệt bài, bắt buộc phải nhập lý do chi tiết có độ dài tối thiểu 10 ký tự (`reason.trim().length >= 10`). | FR-10 | `TC_FR10_01`, `TC_FR10_03` | **PASS** |
| **BR-03** | Giới hạn dung lượng và định dạng Media | Hình ảnh tối đa 10MB (.jpg, .png, .webp); Video ngắn tối đa 50MB (.mp4, .mov). Chặn hoàn toàn các file thực thi (.exe, .zip). | FR-04 | `TC_FR04_03`, `TC_FR04_04` | **PASS** |
| **BR-04** | Tự động chuyển trạng thái khi sửa bài đã duyệt | Bài viết đã ở trạng thái `APPROVED` nếu bị chỉnh sửa nội dung phải tự động chuyển về `PENDING_REVIEW` để Quản lý duyệt lại. | FR-05 | `TC_FR05_04` | **PASS** |
| **BR-05** | Bảo vệ bài viết đã xuất bản (Published) | Bài viết đã ở trạng thái `PUBLISHED` bị khóa hoàn toàn, không được phép chỉnh sửa nội dung hoặc xóa khỏi hệ thống. | FR-05, FR-06 | `TC_FR05_03`, `TC_FR06_03` | **PASS** |
| **BR-06** | Xác thực URL bài viết thực tế | Xác nhận đã đăng bài thủ công bắt buộc đường link phải thuộc tên miền chính thức của mạng xã hội đã chọn (`facebook.com`, `instagram.com`, `tiktok.com`). | FR-13 | `TC_FR13_01`, `TC_FR13_02`, `TC_FR13_03` | **PASS** |
| **BR-07** | Ghi nhận Audit Trail lịch sử kiểm duyệt | Mọi thao tác phê duyệt, từ chối, yêu cầu sửa đổi đều phải ghi vết vào CSDL: `reviewer_id`, `created_at`, `action`, `reason`. | FR-09, FR-10 | `TC_FR09_04`, `TC_FR10_04` | **PASS** |
| **BR-08** | Ràng buộc cập nhật chỉ số thống kê | Chỉ các bài viết ở trạng thái `PUBLISHED` mới được phép ghi nhận hoặc đồng bộ chỉ số đo lường (Reach, Views, Likes, Shares). | FR-14 | `TC_FR14_01`, `TC_FR14_04` | **PASS** |
| **BR-09** | Đánh dấu trạng thái thông báo (`is_read`) | Người dùng đọc thông báo hoặc nhấn "Đánh dấu tất cả đã đọc" sẽ cập nhật trường `is_read = True` và ẩn badge chấm đỏ trên icon Chuông. | FR-12 | `TC_FR12_03` | **PASS** |
| **BR-10** | Cảnh báo xung đột lịch đăng < 30 phút | Hai bài viết trên cùng một nền tảng mạng xã hội có thời gian đăng cách nhau dưới 30 phút bị coi là xung đột, phải cảnh báo đỏ và gợi ý dời giờ. | FR-11 | `TC_FR11_04` | **PASS** |

---

## 4. ĐỐI SOÁT MÃ NGOẠI LỆ & LỖI HỆ THỐNG (EXCEPTION CODES TRACEABILITY — EX-01 ĐẾN EX-10)

| Mã EX / ERR | Tên Ngoại lệ / Lỗi | Tình huống kích hoạt Ngoại lệ | Hành vi Hệ thống Mong đợi | Test Case Kiểm tra |
| :---: | :--- | :--- | :--- | :---: |
| **EX-01 / ERR-01** | Khóa tài khoản do Brute-force | Nhập sai mật khẩu liên tiếp quá 5 lần | Tạm khóa tài khoản trong 15 phút, chặn đăng nhập và trả về mã lỗi `[ERR-01]`. | `TC_FR01_03` |
| **EX-02 / ERR-02** | Đặt lịch trong quá khứ | Chọn thời gian xuất bản nhỏ hơn hoặc bằng thời điểm hiện tại | Chặn lưu lịch, hiển thị banner đỏ `[ERR-02] Không được chọn thời gian trong quá khứ!`. | `TC_FR11_03` |
| **EX-03 / ERR-03** | Xung đột lịch đăng < 30 phút | Hai bài viết cùng kênh đăng cách nhau < 30 phút | Báo lỗi `[ERR-03]`, gắn nhãn ⚠️ < 30p trên thẻ lịch và cung cấp nút giãn cách tự động. | `TC_FR11_04` |
| **EX-04 / ERR-04** | Token OAuth hết hạn | Token kết nối API Facebook/TikTok hết hạn khi đồng bộ | Bắt mã lỗi `[ERR-04]`, ghi log an toàn và gửi thông báo yêu cầu người dùng kết nối lại. | `TC_FR14_03` |
| **EX-05 / ERR-05** | Vượt giới hạn kích thước Media | Tải lên file ảnh > 10MB hoặc video > 50MB | Chặn tải lên, hiển thị thông báo `[ERR-05] Kích thước tệp vượt quá giới hạn cho phép`. | `TC_FR04_03` |
| **EX-06 / ERR-06** | Vi phạm trạng thái vòng đời bài viết | Thử xóa bài Pending/Published hoặc sửa bài Published | Chặn thao tác, trả về mã lỗi HTTP 400 và thông báo vi phạm máy trạng thái bài viết. | `TC_FR05_03`, `TC_FR06_03` |
| **EX-07 / ERR-07** | Hết hạn phiên làm việc (Session) | Token JWT hết hạn (> 60 phút) hoặc Cookie bị xóa | Trả về 401 Unauthorized, hiển thị Toast cảnh báo và tự động chuyển hướng về trang Login. | `TC_FR02_03` |
| **EX-08 / ERR-08** | Lỗi dữ liệu đầu vào (Validation Error) | Bỏ trống trường bắt buộc hoặc trùng lặp Email | Chặn submit, viền đỏ trường nhập và hiển thị tooltip thông báo lỗi tương ứng. | `TC_FR03_03`, `TC_FR08_03`, `TC_FR15_04` |
| **EX-09 / ERR-09** | Lý do từ chối không đạt chuẩn | Để trống hoặc nhập lý do từ chối dưới 10 ký tự | Chặn submit, viền đỏ ô textarea và báo lỗi bắt buộc tối thiểu 10 ký tự theo BR-02. | `TC_FR10_03` |
| **EX-10 / ERR-10** | URL bài đăng thực tế không hợp lệ | Nhập link không đúng tên miền mạng xã hội đích | Chặn submit, hiển thị thông báo lỗi `[ERR-10] URL bài viết phải thuộc tên miền chính thức`. | `TC_FR13_02` |

---

## 5. BẢNG CHI TIẾT 56 KỊCH BẢN KIỂM THỬ (DETAILED TEST CASES SPECIFICATION)

### FR-01: Xác thực & Đăng nhập người dùng (Authentication)
* **TC_FR01_01 [Main Flow]:** Đăng nhập thành công với tài khoản Quản lý (`manager` / `Manager@123`). Hệ thống xác thực thành công, cấp JWT Token và HttpOnly Cookie, chuyển hướng sang `/pages/admin/dashboard.html`. *(Priority: High, Status: PASS)*
* **TC_FR01_02 [Alt Flow]:** Đăng nhập thành công bằng địa chỉ Email (`staff1@rikkeilab.vn`). Hệ thống tự động tra cứu người dùng qua email và chuyển hướng về dashboard tương ứng. *(Priority: Medium, Status: PASS)*
* **TC_FR01_03 [Exception Flow - EX-01]:** Nhập sai mật khẩu liên tiếp 5 lần. Tại lần thứ 5, hệ thống kích hoạt cơ chế khóa tài khoản 15 phút `[ERR-01]` do Brute-force; lần thứ 6 bị chặn kể cả khi nhập đúng mật khẩu. *(Priority: High, Status: PASS)*
* **TC_FR01_04 [Business Rule - BR-01]:** Đăng nhập với tài khoản bị khóa mềm (`DEACTIVATED`). Hệ thống từ chối truy cập (HTTP 403), hiển thị thông báo: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản lý!". *(Priority: High, Status: PASS)*

### FR-02: Đăng xuất & Quản lý phiên làm việc (Session Management)
* **TC_FR02_01 [Main Flow]:** Đăng xuất an toàn. Bấm Avatar -> "Đăng xuất" -> Hệ thống xóa HttpOnly Cookie, xóa Token trong SessionStorage và chuyển hướng về `/login.html`. *(Priority: High, Status: PASS)*
* **TC_FR02_02 [Alt Flow]:** Lấy thông tin người dùng hiện tại (`GET /api/auth/me`). Trả về HTTP 200 kèm JSON thông tin: `id`, `username`, `email`, `full_name`, `role_name`, `avatar_url`. *(Priority: Medium, Status: PASS)*
* **TC_FR02_03 [Exception Flow - EX-07]:** Phiên làm việc JWT hết hạn (> 60 phút). AuthMiddleware bắt lỗi 401 Unauthorized, hiển thị Toast cảnh báo và tự động redirect về trang Login. *(Priority: High, Status: PASS)*

### FR-03: Quản lý người dùng & Phân quyền RBAC (User Management)
* **TC_FR03_01 [Main Flow]:** Quản lý tạo mới tài khoản Nhân viên (Staff) hợp lệ. Mật khẩu được băm an toàn bằng thuật toán Bcrypt, tài khoản mới xuất hiện trong bảng danh sách. *(Priority: High, Status: PASS)*
* **TC_FR03_02 [Alt Flow]:** Cập nhật thông tin hồ sơ người dùng (Họ tên, Số điện thoại). Bảng danh sách phản ánh thông tin mới ngay lập tức. *(Priority: Medium, Status: PASS)*
* **TC_FR03_03 [Exception Flow - EX-08]:** Tạo tài khoản với Email đã tồn tại. Hệ thống chặn submit, trả về mã lỗi HTTP 409 Conflict: "Email đã được sử dụng trong hệ thống!". *(Priority: High, Status: PASS)*
* **TC_FR03_04 [Business Rule - BR-01]:** Vô hiệu hóa tài khoản mềm (`DEACTIVATED`). Bản ghi người dùng KHÔNG bị xóa khỏi DB; toàn bộ bài viết quá khứ của nhân viên được bảo toàn toàn vẹn. *(Priority: High, Status: PASS)*

### FR-04: Soạn thảo & Tạo bài viết mới đa kênh (Post Creation)
* **TC_FR04_01 [Main Flow]:** Soạn bài viết mới đa kênh kèm hình ảnh và lưu nháp (`DRAFT`). Bài viết được lưu thành công, trả về mã bài mới (ví dụ BL-0130). *(Priority: High, Status: PASS)*
* **TC_FR04_02 [Alt Flow]:** Tạo bài viết chỉ chứa nội dung văn bản và liên kết (Link post). Hệ thống lưu thành công không bắt buộc có file đính kèm. *(Priority: Medium, Status: PASS)*
* **TC_FR04_03 [Exception Flow - EX-05]:** Chặn tải lên hình ảnh vượt quá dung lượng 10MB hoặc video > 50MB. Hệ thống từ chối tệp và hiển thị thông báo lỗi màu đỏ `[ERR-05]`. *(Priority: High, Status: PASS)*
* **TC_FR04_04 [Business Rule - BR-03]:** Chặn tải lên tệp định dạng không được hỗ trợ (.exe, .zip, .pdf). Hệ thống chặn ngay tại tầng Client và Server, thông báo định dạng hợp lệ: jpg, png, webp, mp4, mov. *(Priority: Medium, Status: PASS)*

### FR-05: Chỉnh sửa nội dung bài viết & Kiểm soát vòng đời (Post Editing)
* **TC_FR05_01 [Main Flow]:** Chỉnh sửa nội dung bài viết đang ở trạng thái `DRAFT`. Thông tin cập nhật thành công, trạng thái vẫn giữ nguyên `DRAFT`. *(Priority: High, Status: PASS)*
* **TC_FR05_02 [Alt Flow]:** Chỉnh sửa bài viết bị Từ chối (`REJECTED`) sau khi tiếp thu phản hồi. Cập nhật thành công, bài viết sẵn sàng để gửi duyệt lại lần 2. *(Priority: Medium, Status: PASS)*
* **TC_FR05_03 [Exception Flow - EX-06]:** Khóa toàn bộ trường nhập liệu đối với bài viết đã `PUBLISHED`. Toàn bộ input bị disabled, hiển thị banner cảnh báo `[ERR-01] Không thể chỉnh sửa bài viết đã xuất bản`. *(Priority: High, Status: PASS)*
* **TC_FR05_04 [Business Rule - BR-04]:** Tự động chuyển về `PENDING_REVIEW` khi sửa bài viết đã `APPROVED`. Hệ thống hiện cảnh báo `BR-04`, khi xác nhận sẽ chuyển trạng thái bài về chờ duyệt lại. *(Priority: High, Status: PASS)*

### FR-06: Xóa mềm bài viết & Lưu trữ an toàn (Post Soft Deletion)
* **TC_FR06_01 [Main Flow]:** Xóa mềm bài viết nháp (`DRAFT`). Bài viết biến mất khỏi bảng chính, trường `deleted_at` được gán timestamp hiện tại trong CSDL. *(Priority: High, Status: PASS)*
* **TC_FR06_02 [Alt Flow]:** Xem và khôi phục bài viết đã xóa mềm từ tab "Đã lưu trữ". Trường `deleted_at` được cập nhật về NULL, bài viết xuất hiện trở lại danh sách hoạt động. *(Priority: Medium, Status: PASS)*
* **TC_FR06_03 [Exception Flow - EX-06]:** Chặn xóa bài viết đang ở trạng thái `PENDING_REVIEW` hoặc `PUBLISHED`. Trả về mã lỗi HTTP 400 Bad Request kèm thông báo lỗi. *(Priority: High, Status: PASS)*

### FR-07: Quản lý danh sách & Xem chi tiết bài viết (Posts Management)
* **TC_FR07_01 [Main Flow]:** Hiển thị danh sách bài viết đầy đủ thông tin phân trang (10 bài/trang) kèm hình thumbnail, kênh, trạng thái, tác giả. *(Priority: High, Status: PASS)*
* **TC_FR07_02 [Alt Flow]:** Lọc bài viết theo trạng thái (`PENDING_REVIEW`) kết hợp tìm kiếm từ khóa tiêu đề ("Serum"). Bảng lọc tức thì trong < 0.3s. *(Priority: Medium, Status: PASS)*
* **TC_FR07_03 [Alt Flow]:** Chuyển đổi linh hoạt giữa giao diện Dạng bảng (Table View) và Dạng lưới thẻ (Grid Cards View) không cần tải lại trang. *(Priority: Low, Status: PASS)*
* **TC_FR07_04 [Main Flow]:** Xem Modal chi tiết bài viết với đầy đủ thông tin nội dung, hình ảnh đính kèm kích thước chuẩn và lịch sử duyệt bài. *(Priority: High, Status: PASS)*

### FR-08: Gửi phê duyệt & Live Preview đa kênh (Submission & Preview)
* **TC_FR08_01 [Main Flow]:** Staff bấm "Gửi phê duyệt" cho bài viết nháp hợp lệ. Trạng thái chuyển sang `PENDING_REVIEW`, xuất hiện ngay trong Hàng đợi của Manager. *(Priority: High, Status: PASS)*
* **TC_FR08_02 [Alt Flow]:** Kiểm tra khung xem trước Live Preview thời gian thực: chuyển đổi qua lại 3 tab Facebook, Instagram, TikTok render đúng mockup điện thoại. *(Priority: Medium, Status: PASS)*
* **TC_FR08_03 [Exception Flow - EX-08]:** Chặn gửi duyệt khi để trống tiêu đề hoặc chưa chọn nền tảng. Hệ thống chặn submit và hiển thị lỗi `[ERR-03]`. *(Priority: High, Status: PASS)*
* **TC_FR08_04 [Business Rule - BR-01]:** Chỉ tác giả bài viết hoặc Quản lý mới có quyền gửi phê duyệt bài. Staff khác cố tình can thiệp bị chặn HTTP 403 Forbidden. *(Priority: Medium, Status: PASS)*

### FR-09: Phê duyệt bài viết (Manager Approve Workflow)
* **TC_FR09_01 [Main Flow]:** Manager phê duyệt bài viết hợp lệ với giao dịch ACID toàn vẹn. Trạng thái cập nhật `APPROVED`, nút "Lên lịch ngay" khả dụng. *(Priority: High, Status: PASS)*
* **TC_FR09_02 [Alt Flow]:** Phê duyệt hàng loạt nhiều bài viết cùng lúc (Batch Approval). Cả 3 bài viết được chọn đều chuyển sang `APPROVED` đồng bộ. *(Priority: Medium, Status: PASS)*
* **TC_FR09_03 [Business Rule - BR-01]:** Chặn tài khoản Staff truy cập trang hoặc gọi API phê duyệt bài viết. Chặn quyền 403 và điều hướng an toàn. *(Priority: High, Status: PASS)*
* **TC_FR09_04 [Business Rule - BR-07]:** Ghi nhận Audit Trail đầy đủ sau khi bài viết được duyệt vào bảng `approvals` với hành động `APPROVED`. *(Priority: High, Status: PASS)*

### FR-10: Từ chối bài viết & Audit Log kiểm duyệt (Rejection Workflow)
* **TC_FR10_01 [Main Flow]:** Manager từ chối bài viết kèm lý do hợp lệ (> 10 ký tự). Trạng thái chuyển `REJECTED`, thông báo gửi về cho Staff. *(Priority: High, Status: PASS)*
* **TC_FR10_02 [Alt Flow]:** Manager yêu cầu chỉnh sửa (`CHANGES_REQUESTED`) kèm góp ý cụ thể để Staff mở lại form sửa. *(Priority: Medium, Status: PASS)*
* **TC_FR10_03 [Exception Flow - EX-09]:** Chặn gửi từ chối khi để trống lý do hoặc nhập dưới 10 ký tự theo đúng quy tắc `BR-02`. Viền đỏ textarea và hiển thị tooltip lỗi `[ERR-09]`. *(Priority: High, Status: PASS)*
* **TC_FR10_04 [Business Rule - BR-07]:** Lưu vết lịch sử từ chối và lý do chi tiết vào bảng `approvals`. *(Priority: High, Status: PASS)*

### FR-11: Lên lịch xuất bản đa kênh & Cảnh báo xung đột 30p (Content Calendar)
* **TC_FR11_01 [Main Flow]:** Lên lịch xuất bản bài viết đã `APPROVED` vào khung giờ hợp lệ. Trạng thái chuyển sang `SCHEDULED`, hiển thị sự kiện trên Calendar. *(Priority: High, Status: PASS)*
* **TC_FR11_02 [Alt Flow]:** Kéo thả thẻ bài viết trên Calendar đổi giờ và chuyển chế độ xem Tháng (Month) / Tuần (Week). Dữ liệu tự động đồng bộ giờ mới. *(Priority: Medium, Status: PASS)*
* **TC_FR11_03 [Exception Flow - EX-02]:** Chặn đặt lịch xuất bản trong quá khứ. Hệ thống chặn lưu và báo lỗi đỏ `[ERR-02] Không được chọn thời gian trong quá khứ!`. *(Priority: High, Status: PASS)*
* **TC_FR11_04 [Business Rule - BR-10 / EX-03]:** Phát hiện cảnh báo xung đột lịch đăng < 30 phút trên cùng một kênh. Hiển thị banner đỏ `[ERR-03]`, gắn nhãn ⚠️ < 30p và nút tự động giãn cách. *(Priority: High, Status: PASS)*

### FR-12: Nhắc lịch & Trung tâm thông báo (Notification Center)
* **TC_FR12_01 [Main Flow]:** Hiển thị Icon Chuông thông báo kèm badge chấm đỏ khi có tin mới chưa đọc trên Topbar Header. *(Priority: High, Status: PASS)*
* **TC_FR12_02 [Alt Flow]:** Mở Dropdown Flyout xem nhanh danh sách thông báo phân loại theo thời gian và icon nghiệp vụ. *(Priority: Medium, Status: PASS)*
* **TC_FR12_03 [Business Rule - BR-09]:** Đánh dấu thông báo đã đọc (`is_read = True`) khi click xem hoặc bấm "Đánh dấu tất cả đã đọc", tự động ẩn chấm đỏ. *(Priority: High, Status: PASS)*
* **TC_FR12_04 [Main Flow]:** Tác vụ tiện ích từ Modal Chi tiết: "Sao chép Caption" (copy to clipboard có Toast thông báo) và "Tải xuống Media" (tải toàn bộ file đính kèm về máy). *(Priority: High, Status: PASS)*

### FR-13: Theo dõi tiến độ & Xác nhận đã đăng bài thủ công (Tracking Progress)
* **TC_FR13_01 [Main Flow]:** Nhân viên xác nhận đã đăng bài thủ công kèm URL bài viết thực tế trên Facebook. Bài viết chuyển trạng thái sang `PUBLISHED`. *(Priority: High, Status: PASS)*
* **TC_FR13_02 [Exception Flow - EX-10]:** Chặn xác nhận đăng khi URL sai tên miền mạng xã hội đích (vd chọn TikTok nhưng nhập link youtube). Báo lỗi `[ERR-10]` theo `BR-06`. *(Priority: High, Status: PASS)*
* **TC_FR13_03 [Business Rule - BR-06]:** Khóa chỉnh sửa nội dung ngay sau khi bài viết được xác nhận `PUBLISHED` để bảo toàn dữ liệu thu thập phân tích. *(Priority: Medium, Status: PASS)*

### FR-14: Cập nhật & Tự động đồng bộ số liệu bài đăng (Post Statistics)
* **TC_FR14_01 [Main Flow]:** Nhập thủ công chỉ số đo lường (Reach, Views, Likes, Shares) cho bài viết đã `PUBLISHED`. Dữ liệu lưu thành công vào bảng `post_statistics`. *(Priority: High, Status: PASS)*
* **TC_FR14_02 [Alt Flow]:** Tự động đồng bộ số liệu qua API Meta Graph / TikTok Open API v2 nạp chỉ số thực tế từ mạng xã hội. *(Priority: Medium, Status: PASS)*
* **TC_FR14_03 [Exception Flow - EX-04]:** Bắt lỗi Token OAuth hết hạn khi cố gắng đồng bộ số liệu. Bắt mã lỗi chuẩn `[ERR-04]` và thông báo yêu cầu kết nối lại tài khoản. *(Priority: High, Status: PASS)*
* **TC_FR14_04 [Business Rule - BR-08]:** Chặn cập nhật chỉ số đo lường cho bài viết chưa `PUBLISHED` (DRAFT hoặc PENDING). Báo lỗi nghiệp vụ theo quy tắc `BR-08`. *(Priority: High, Status: PASS)*

### FR-15: Dashboard Phân tích đa kênh & Xuất báo cáo (Analytics & Export)
* **TC_FR15_01 [Main Flow]:** Hiển thị Dashboard Thống kê 4 KPI tổng quan, biểu đồ tương tác 12 tháng, Donut chart phân bổ kênh và bảng Top bài viết xuất sắc nhất. *(Priority: High, Status: PASS)*
* **TC_FR15_02 [Alt Flow]:** Lọc báo cáo phân tích theo khoảng thời gian tùy chọn (Quý 4/2026) và kênh mạng xã hội (TikTok). Biểu đồ cập nhật mượt mà < 1s. *(Priority: Medium, Status: PASS)*
* **TC_FR15_03 [Alt Flow - NFR-01]:** Xuất báo cáo số liệu phân tích định dạng Excel / CSV / PDF hoàn tất và tải về máy trong thời gian < 2 giây (đáp ứng tiêu chí NFR-01: kết xuất dưới 5 giây). *(Priority: High, Status: PASS)*
* **TC_FR15_04 [Exception Flow - EX-08]:** Hiển thị màn hình Empty State chuẩn `[ERR-01]` khi lọc khoảng thời gian chưa có dữ liệu bài đăng, kèm nút khôi phục bộ lọc. *(Priority: Medium, Status: PASS)*

---

## 6. KẾT LUẬN & HƯỚNG DẪN KIỂM THỬ

- **Tổng kết độ bao phủ:** Bộ kiểm thử gồm **56 Test Cases** bao phủ toàn diện 15/15 Yêu cầu Chức năng (FR-01 đến FR-15), 10/10 Quy tắc Nghiệp vụ (BR-01 đến BR-10), và 10/10 Mã Ngoại lệ / Lỗi (EX-01 đến EX-10).
- **File nộp bài chính thức:**
  * File Excel bảng tính gốc: [`Test_Cases_15FR_T06A66C.xlsx`](file:///home/nguyendat/Desktop/Project_Thuc_Tap_Rikkei/Frontend/Test_Cases_15FR_T06A66C.xlsx) (gồm 2 sheet: `Traceability_Matrix` và `Detailed_Test_Cases_15FR`).
  * File CSV trích xuất trực tiếp: [`docs/Test_Cases_15FR_T06A66C.csv`](file:///home/nguyendat/Desktop/Project_Thuc_Tap_Rikkei/Frontend/docs/Test_Cases_15FR_T06A66C.csv) và [`docs/Traceability_Matrix_T06A66C.csv`](file:///home/nguyendat/Desktop/Project_Thuc_Tap_Rikkei/Frontend/docs/Traceability_Matrix_T06A66C.csv).
