**Tiêu đề**: Thiết kế API — Quản lý đơn hàng với Supabase  
**Doc-ID**: API-BH-ORD-001  
**Owner**: Tech Lead  
**Phiên bản**: 0.2 **Trạng thái**: Draft **Cập nhật lần cuối**: 2026-03-30  
**Liên quan**: SRS `doc/01-Requirements/SRS/SRS-BanHang-QuanLyDonHang-Supabase-v0.1.md`; Data Model cùng thư mục cha

---

## 1. Nguyên tắc

- **Nguồn chân lý hợp đồng dữ liệu**: Schema PostgreSQL trên Supabase + **RLS**; client tin cậy vào policy, không chỉ vào UI.
- **Auth**: JWT do Supabase phát hành; header `Authorization: Bearer <access_token>` khi gọi REST trực tiếp.
- **SDK khuyến nghị**: `@supabase/supabase-js` trong Next.js — SDK tự đính kèm session sau khi `signInWithPassword` (hoặc flow tương đương).

---

## 2. Đăng nhập và xác thực (Supabase Auth / GoTrue)

**Base Auth API**: `{SUPABASE_URL}/auth/v1/`  
Mọi request tới Auth API SHALL gửi kèm:

- `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>`
- `Content-Type: application/json`

Sau khi đăng nhập thành công, **access token** (JWT) dùng cho header `Authorization: Bearer <access_token>` khi gọi `/rest/v1/...`.

### 2.1 Luồng nghiệp vụ (tóm tắt)

1. Client gửi **email + mật khẩu** tới Auth API (hoặc qua SDK tương đương).
2. Server trả **session**: `access_token`, `refresh_token`, `expires_in`, đối tượng `user`.
3. Client **lưu session** (ví dụ `localStorage` / cookie theo cấu hình) và bật **auto refresh** để đáp ứng phiên lâu dài (REQ-AUTH-002).
4. Mọi truy vấn đơn hàng gửi kèm JWT hiện tại; RLS dùng `auth.uid()` từ JWT.

### 2.2 Đăng nhập email/mật khẩu — HTTP API

| Thuộc tính | Giá trị |
|------------|---------|
| Phương thức | `POST` |
| URL | `{SUPABASE_URL}/auth/v1/token?grant_type=password` |
| Header | `apikey`, `Content-Type: application/json` |

**Body (JSON)**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|--------|
| `email` | string | Có | Email đã đăng ký trong project. |
| `password` | string | Có | Mật khẩu. |

**Phản hồi thành công (200)** — cấu trúc điển hình (Supabase có thể bổ sung trường; lấy tài liệu phiên bản project làm chuẩn khi tích hợp):

| Trường | Kiểu | Mô tả |
|--------|------|--------|
| `access_token` | string | JWT dùng cho REST/RPC. |
| `token_type` | string | Thường là `bearer`. |
| `expires_in` | number | Thời gian sống access token (giây). |
| `expires_at` | number | Unix timestamp hết hạn (nếu có). |
| `refresh_token` | string | Dùng để lấy access token mới. |
| `user` | object | Thông tin user (`id`, `email`, …). |

**Phản hồi lỗi (4xx)** — body thường có `error`, `error_description` hoặc `msg`; **không** hiển thị nguyên văn cho end user.

| HTTP | Ý nghĩa thường gặp |
|------|---------------------|
| 400 | Thiếu field, định dạng sai. |
| 401 | Sai email/mật khẩu hoặc email chưa xác nhận (tùy cấu hình Supabase). |

### 2.3 Làm mới access token — HTTP API

Khi `access_token` hết hạn, client gọi:

| Thuộc tính | Giá trị |
|------------|---------|
| Phương thức | `POST` |
| URL | `{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token` |
| Header | `apikey`, `Content-Type: application/json` |

**Body (JSON)**

| Trường | Kiểu | Bắt buộc |
|--------|------|----------|
| `refresh_token` | string | Có |

**Phản hồi**: cấu trúc tương tự đăng nhập (session mới với `access_token` mới). SDK mặc định thực hiện bước này tự động khi `autoRefreshToken: true`.

### 2.4 Lấy thông tin user hiện tại (HTTP API)

| Thuộc tính | Giá trị |
|------------|---------|
| Phương thức | `GET` |
| URL | `{SUPABASE_URL}/auth/v1/user` |
| Header | `apikey`, `Authorization: Bearer <access_token>` |

Dùng để xác minh session còn hợp lệ sau khi mở lại trình duyệt (kết hợp lưu `refresh_token`).

### 2.5 Đăng xuất (HTTP API) — tùy chọn MVP

| Thuộc tính | Giá trị |
|------------|---------|
| Phương thức | `POST` |
| URL | `{SUPABASE_URL}/auth/v1/logout` |
| Header | `apikey`, `Authorization: Bearer <access_token>` |

Body thường gồm `scope: "global"` hoặc chỉ thu hồi session hiện tại — xem tài liệu Supabase phiên bản đang dùng. MVP “không tự đăng xuất” **không** cấm nút đăng xuất thủ công nếu sau này bổ sung.

### 2.6 SDK `@supabase/supabase-js` (khuyến nghị trong Next.js)

| Thao tác | Gọi SDK (ví dụ) | Ghi chú |
|----------|-----------------|---------|
| Đăng nhập | `auth.signInWithPassword({ email, password })` | Tương đương mục 2.2. |
| Đọc session hiện tại | `auth.getSession()` | Sau khi hydrate từ storage. |
| Theo dõi thay đổi session | `auth.onAuthStateChange((event, session) => …)` | Phù hợp để điều hướng sau login/logout. |
| Làm mới token | Tự động (`autoRefreshToken`) | Tương đương mục 2.3. |
| Đăng xuất | `auth.signOut()` | Khi cần thủ công. |

**Cấu hình client (browser) gợi ý** — lưu session lâu, không tự xóa khi nhàn rỗi:

- `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }` (giá trị cụ thể theo phiên bản SDK; kiểm tra type `SupabaseClientOptions`).

**Next.js (App Router)**: có thể dùng `@supabase/ssr` để đồng bộ session qua **cookie** (SSR + middleware); hợp đồng token vẫn là JWT của Supabase, chỉ khác nơi lưu so với `localStorage`. Chốt một phương án trong LLD và giữ nhất quán.

### 2.7 Lỗi chuẩn hóa phía UI (không expose raw)

- Sai thông tin đăng nhập: “Email hoặc mật khẩu không đúng.”
- Lỗi mạng / timeout: “Không kết nối được máy chủ. Thử lại.”
- Email chưa xác nhận (nếu bật xác nhận email): “Vui lòng kiểm tra email và xác nhận tài khoản.”

### 2.8 Biến môi trường (Next.js)

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL project (= base cho `/auth/v1` và `/rest/v1`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Khóa anon; gửi kèm mọi request Auth + REST. |

**Không** đưa `service_role` vào bundle client.

---

## 3. Data API (PostgREST / Supabase REST)

Base URL: `{SUPABASE_URL}/rest/v1/`

Header mặc định khi gọi thủ công:

- `apikey: <anon_key>`
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`
- `Prefer: return=representation` (khi cần body trả về sau insert/update)

### 3.1 Bảng `orders`

| Phương thức | Đường dẫn | Mô tả | Điều kiện RLS |
|-------------|-----------|--------|----------------|
| GET | `/rest/v1/orders?select=*` | Danh sách đơn của user | `user_id = auth.uid()` |
| GET | `/rest/v1/orders?id=eq.{uuid}&select=*,order_line_items(*)` | Chi tiết + lines (embed) | Chỉ đơn của user |
| POST | `/rest/v1/orders` | Tạo đơn | `user_id` phải khớp `auth.uid()` (policy INSERT) |
| PATCH | `/rest/v1/orders?id=eq.{uuid}` | Cập nhật metadata đơn | Chỉ owner |
| DELETE | `/rest/v1/orders?id=eq.{uuid}` | Xóa đơn | Chỉ owner; cascade lines |

**Quy ước query PostgREST**: filter `eq`, `order`, `limit`, embed quan hệ FK — xem tài liệu Supabase.

### 3.2 Bảng `order_line_items`

| Phương thức | Đường dẫn | Mô tả |
|-------------|-----------|--------|
| GET | `/rest/v1/order_line_items?order_id=eq.{uuid}` | Dòng theo đơn |
| POST | `/rest/v1/order_line_items` | Thêm dòng (sau khi có `order_id`) |
| PATCH | `/rest/v1/order_line_items?id=eq.{uuid}` | Sửa một dòng |
| DELETE | `/rest/v1/order_line_items?id=eq.{uuid}` | Xóa một dòng |

RLS: chỉ cho phép thao tác nếu `order_id` thuộc đơn của `auth.uid()` (policy qua subquery hoặc join policy pattern — chi tiết migration trong Data Model).

### 3.3 Giao dịch tạo đơn + nhiều dòng

**Phương án A (MVP)**: Gọi SDK 2 bước: insert `orders` → insert nhiều `order_line_items` (có rủi ro partial failure).

**Phương án B (khuyến nghị khi cần atomic)**: **RPC** PostgreSQL `create_order_with_lines(payload jsonb)` — `SECURITY DEFINER` + kiểm tra `auth.uid()` bên trong; một lần gọi `supabase.rpc(...)`.

SRS ghi TBD-01 để chốt; trong tài liệu API, ghi rõ phiên bản đang dùng A hoặc B sau khi LLD phê duyệt.

---

## 4. Schema rút gọn JSON (ví dụ)

### 4.1 `orders` (response)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### 4.2 `order_line_items`

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "product_code": "string",
  "product_name": "string",
  "unit_price": "number",
  "quantity": "integer"
}
```

---

## 5. Mã lỗi và xử lý

| Tình huống | HTTP (REST) | Hành vi client |
|------------|-------------|----------------|
| Chưa đăng nhập | 401 | Chuyển về trang đăng nhập. |
| Vi phạm RLS | 401 hoặc empty | Coi như không có quyền / không có dữ liệu. |
| Vi phạm constraint (CHECK) | 400 | Hiển thị map lỗi field. |
| Trùng id / conflict | 409 | Retry hoặc báo lỗi. |

---

## 6. Realtime (tùy chọn)

- Có thể bật **Realtime** cho `orders` nếu cần đồng bộ đa tab; MVP có thể bỏ qua.

---

## 7. OpenAPI

PostgREST có thể xuất OpenAPI từ project; khi dự án chốt RPC và view, nên sinh file OpenAPI trong repo và lint trong CI (xem `01-CICD-Pipeline.md`).

---

## 8. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|--------|
| 0.1 | 2026-03-30 | Khởi tạo API Supabase cho MVP |
| 0.2 | 2026-03-30 | Bổ sung đăng nhập: HTTP Auth API (token password/refresh), user, logout; SDK và cấu hình persist |
