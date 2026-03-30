**Tiêu đề**: Đặc tả yêu cầu phần mềm — Quản lý đơn hàng (Next.js + Supabase)  
**Doc-ID**: SRS-BH-ORD-001  
**Owner**: Product/BA  
**Phiên bản**: 0.1 **Trạng thái**: Draft **Cập nhật lần cuối**: 2026-03-30  
**Liên quan**: API: `doc/02-Architecture/API/`; Data: `doc/02-Architecture/Data_Model/`; CICD: `doc/03-LifeCycle/CICD/01-CICD-Pipeline.md`; Quy tắc code: `doc/04-Supporting/Clean_Code_NextJS.md`

---

## 1. Mục đích và phạm vi

### 1.1 Mục đích
Tài liệu mô tả yêu cầu chức năng (FR) và phi chức năng (NFR) cho website quản lý đơn hàng đơn giản, backend **Supabase** (PostgreSQL + Auth + API tự động), frontend **Next.js**.

### 1.2 Phạm vi trong phạm vi (In scope)
- Đăng nhập người dùng và duy trì phiên đăng nhập lâu dài (không tự đăng xuất theo thời gian rảnh trên trình duyệt đã cấu hình).
- CRUD đơn hàng: mỗi đơn gồm các dòng với **mã sản phẩm**, **tên sản phẩm**, **giá tiền**, **số lượng**.
- Dữ liệu cô lập theo người dùng (mỗi user chỉ thấy/sửa đơn của mình).

### 1.3 Ngoài phạm vi (Out of scope) — giai đoạn này
- Thanh toán, kho, vận chuyển, đa chi nhánh.
- Ứng dụng di động native.
- Đồng bộ realtime đa thiết bị ngoài cơ chế session Supabase mặc định.

---

## 2. Thuật ngữ và tài liệu tham chiếu

| Thuật ngữ | Định nghĩa |
|-----------|------------|
| Supabase Auth | Dịch vụ xác thực; JWT access/refresh; client SDK lưu session. |
| RLS | Row Level Security — chính sách PostgreSQL lọc dòng theo `auth.uid()`. |
| PostgREST | API REST sinh tự động từ schema PostgreSQL (Supabase Data API). |
| Phiên lâu dài | Session được lưu trữ cục bộ (ví dụ `localStorage`) và tự làm mới token theo cấu hình Supabase; không có hết hạn phiên do “nhàn rỗi” phía client trong phạm vi dự án này trừ khi người dùng xóa dữ liệu trình duyệt hoặc đổi mật khẩu/thu hồi session phía server. |

**Tham chiếu**: Tài liệu Supabase (Auth, Database, RLS); Next.js App Router.

---

## 3. Bối cảnh và ràng buộc

### 3.1 Bên liên quan
- Người dùng nội bộ/quản trị đơn giản: tạo và quản lý đơn.
- Đội phát triển: triển khai Next.js + Supabase.

### 3.2 Giả định
- Một tài khoản Supabase cho môi trường dev/staging/prod tách biệt theo biến môi trường.
- Tiền tệ hiển thị: **VND**; làm tròn hiển thị **2 chữ số thập phân** (half-up) trừ khi có quyết định khác trong LLD.

### 3.3 Ràng buộc kỹ thuật
- Backend: Supabase (không tự host API business logic phức tạp trong giai đoạn 1 trừ khi cần Edge Function sau này).
- Frontend: Next.js (App Router khuyến nghị theo repo).

---

## 4. Giao diện bên ngoài (tóm tắt)

| Loại | Mô tả |
|------|--------|
| UI Web | Trang đăng nhập; danh sách đơn; form tạo/sửa đơn và dòng hàng. |
| Supabase | Auth API; Data API (REST) tới bảng có RLS. |

Chi tiết endpoint và schema: xem `doc/02-Architecture/API/` và `doc/02-Architecture/Data_Model/`.

---

## 5. Yêu cầu chức năng (FR)

Mỗi FR dùng **SHALL**; có **Tiêu chí chấp nhận (AC)** và **V&V** (Kiểm thử/API/Kiểm tra).

### REQ-AUTH-001 — Đăng nhập
**Phát biểu**: Hệ thống SHALL cho phép người dùng đăng nhập bằng email/mật khẩu (hoặc phương thức Supabase Auth được bật trong dự án) và nhận session hợp lệ.  
**Ưu tiên**: Must  
**AC**:
- Given thông tin đăng nhập đúng, When gửi yêu cầu đăng nhập, Then client lưu session và có thể gọi API dữ liệu với quyền của user đó.
- Given sai mật khẩu, When đăng nhập, Then hiển thị thông báo lỗi chuẩn hóa (không lộ chi tiết nội bộ).  
**V&V**: Test API Auth + Test UI  
**Thiết kế**: LLD Auth; API Supabase Auth  
**DB**: `auth.users` (quản lý bởi Supabase)  
**Trạng thái**: Draft

### REQ-AUTH-002 — Duy trì phiên lâu dài
**Phát biểu**: Ứng dụng SHALL cấu hình client Supabase để **persist session** (ví dụ `localStorage`) và **tự làm mới** access token; SHALL **không** triển khai đăng xuất tự động theo thời gian nhàn rỗi trên client trong phạm vi MVP.  
**Ưu tiên**: Must  
**AC**:
- Given user đã đăng nhập và đóng/mở lại tab trong cùng trình duyệt (không xóa site data), When tải lại app, Then user vẫn ở trạng thái đã đăng nhập sau khi SDK hoàn tất khôi phục session.
- Given refresh token còn hiệu lực theo cấu hình Supabase, When access token hết hạn, Then client tự refresh thành công không cần nhập lại mật khẩu.  
**V&V**: Test thủ công + Test tích hợp SDK  
**Thiết kế**: LLD Session  
**API**: Supabase Auth session  
**DB**: N/A (token/session do Supabase)  
**Trạng thái**: Draft  
**Ghi chú rủi ro**: Lưu session lâu trên thiết bị dùng chung tăng rủi ro truy cập trái phép — xem REQ-SEC-001.

### REQ-ORD-001 — Danh sách đơn hàng
**Phát biểu**: Hệ thống SHALL hiển thị danh sách đơn hàng thuộc về người dùng đang đăng nhập.  
**Ưu tiên**: Must  
**AC**:
- Given user A đăng nhập, When mở danh sách, Then chỉ thấy đơn của A (RLS).  
**V&V**: Test API + Test RLS  
**Thiết kế**: LLD Orders List  
**API**: GET qua Supabase Data API  
**DB**: bảng `orders` (xem Data Model)  
**Trạng thái**: Draft

### REQ-ORD-002 — Tạo đơn hàng kèm dòng hàng
**Phát biểu**: Hệ thống SHALL cho phép tạo đơn mới với một hoặc nhiều dòng; mỗi dòng có **mã sản phẩm**, **tên sản phẩm**, **giá tiền** (số ≥ 0), **số lượng** (số nguyên > 0).  
**Ưu tiên**: Must  
**AC**:
- Given dữ liệu hợp lệ, When tạo đơn, Then một bản ghi `orders` và các bản ghi `order_line_items` được tạo, `user_id` = `auth.uid()`.
- Given số lượng ≤ 0 hoặc giá âm, When tạo, Then từ chối với thông báo lỗi validation.  
**V&V**: Test API + Test DB constraint  
**Thiết kế**: LLD Create Order  
**API**: INSERT qua Supabase (hoặc RPC giao dịch nếu dùng)  
**DB**: `orders`, `order_line_items`  
**Trạng thái**: Draft

### REQ-ORD-003 — Xem chi tiết đơn
**Phát biểu**: Hệ thống SHALL cho phép xem một đơn và toàn bộ dòng hàng của đơn đó.  
**Ưu tiên**: Must  
**AC**:
- Given đơn thuộc user, When GET theo id, Then trả về đơn + lines.
- Given đơn của user khác, When GET, Then không trả dữ liệu (RLS).  
**V&V**: Test RLS  
**Trạng thái**: Draft

### REQ-ORD-004 — Cập nhật đơn
**Phát biểu**: Hệ thống SHALL cho phép cập nhật thông tin đơn và/hoặc thay thế danh sách dòng hàng theo quy tắc nghiệp vụ (ghi rõ trong LLD: update từng dòng hoặc sync full list).  
**Ưu tiên**: Must  
**AC**:
- Given đơn thuộc user, When cập nhật, Then dữ liệu mới được lưu và không ảnh hưởng đơn user khác.  
**V&V**: Test API + RLS  
**Trạng thái**: Draft

### REQ-ORD-005 — Xóa đơn
**Phát biểu**: Hệ thống SHALL cho phép xóa đơn thuộc user; dòng hàng liên quan SHALL bị xóa theo **ON DELETE CASCADE** hoặc xóa tường minh trong giao dịch.  
**Ưu tiên**: Must  
**AC**:
- Given đơn thuộc user, When xóa, Then không còn `orders` và `order_line_items` tương ứng.  
**V&V**: Test DB + API  
**Trạng thái**: Draft

---

## 6. Yêu cầu phi chức năng (NFR)

### REQ-NFR-PERF-001
**Phát biểu**: Trang danh sách đơn (≤ 100 đơn, mỗi đơn ≤ 50 dòng) SHALL tải dữ liệu hiển thị được với **P95 thời gian phản hồi phía client ≤ 2000 ms** trên mạng băng thông cố định 20 Mbps trong môi trường staging đo bằng DevTools Performance hoặc APM.  
**V&V**: Đo P95 trên staging; kiểm tra chỉ số mạng ghi trong báo cáo.

### REQ-NFR-SEC-001
**Phát biểu**: Mọi truy cập dữ liệu đơn hàng SHALL đi qua **RLS**; không được trả lỗi chi tiết stack cho client production.  
**V&V**: Kiểm tra policy; quét lỗi thông tin nhạy cảm trong response.

### REQ-NFR-AVL-001
**Phát biểu**: Phụ thuộc SLA của Supabase/Vercel (hoặc host); mục tiêu vận hành SHALL được ghi trong kế hoạch triển khai với **mục tiêu độ sẵn sàng 99,5%/tháng** cho MVP (đo bằng trạng thái health endpoint và incident log).  
**V&V**: Giám sát uptime nhà cung cấp.

### REQ-SEC-001 — Cảnh báo thiết bị dùng chung
**Phát biểu**: Tài liệu vận hành SHALL khuyến nghị không dùng “ghi nhớ vĩnh viễn” trên máy công cộng; tùy chọn bổ sung “Đăng xuất” manual ngoài phạm vi MVP nếu PO yêu cầu.  
**V&V**: Inspection tài liệu + UX review.

---

## 7. Dữ liệu và quyền riêng tư

- **PII**: Email trong `auth.users`; có thể mirror vào `profiles` nếu cần hiển thị.
- **Phân loại**: Dữ liệu đơn hàng là dữ liệu nội bộ người dùng; không lưu PAN/CVV.
- **Retention**: Giữ đơn theo chính sách doanh nghiệp; mặc định không xóa tự động trong MVP (ghi trong Data Retention khi triển khai production).

---

## 8. Ma trận truy vết (RTM)

| REQ-ID | Mô tả ngắn | Thiết kế (AD/LLD) | API / Supabase | DB | Test (gợi ý) | Trạng thái |
|--------|------------|-------------------|----------------|-----|--------------|------------|
| REQ-AUTH-001 | Đăng nhập | LLD Auth | Supabase Auth | auth.users | TEST-AUTH-01 | Draft |
| REQ-AUTH-002 | Session lâu dài | LLD Session | Supabase session | — | TEST-AUTH-02 | Draft |
| REQ-ORD-001 | Danh sách đơn | LLD Orders | REST select + RLS | orders | TEST-ORD-01 | Draft |
| REQ-ORD-002 | Tạo đơn | LLD Create | insert/RPC | orders, order_line_items | TEST-ORD-02 | Draft |
| REQ-ORD-003 | Chi tiết đơn | LLD Detail | REST select | orders, order_line_items | TEST-ORD-03 | Draft |
| REQ-ORD-004 | Cập nhật đơn | LLD Update | update/RPC | orders, order_line_items | TEST-ORD-04 | Draft |
| REQ-ORD-005 | Xóa đơn | LLD Delete | delete | orders, order_line_items | TEST-ORD-05 | Draft |

---

## 9. Phụ thuộc Supabase (tóm tắt triển khai)

1. Bật **Email** provider (hoặc provider đã chọn) trong Supabase Dashboard.  
2. Tạo bảng `orders`, `order_line_items`, index, FK, RLS (chi tiết file Data Model).  
3. Cấu hình biến môi trường Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
4. Client: `createBrowserClient` với `auth: { persistSession: true }` (mặc định), không gọi `signOut` trên timer idle cho MVP.

---

## 10. TBD / Mở

| ID | Nội dung | Owner | Hạn |
|----|----------|-------|-----|
| TBD-01 | Quy tắc cập nhật dòng hàng (partial vs full replace) | Tech Lead | — |
| TBD-02 | Trường trạng thái đơn (draft/confirmed) có cần MVP không | PO | — |

---

## 11. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|--------|
| 0.1 | 2026-03-30 | Khởi tạo SRS cho MVP Supabase |
