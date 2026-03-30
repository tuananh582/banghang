**Tiêu đề**: Quy tắc Clean Code & kiến trúc — Next.js (App Router)  
**Doc-ID**: CC-NEXT-001  
**Owner**: Tech Lead  
**Phiên bản**: 0.1 **Trạng thái**: Draft **Cập nhật lần cuối**: 2026-03-30  
**Liên quan**: SRS/ API / Data Model dự án quản lý đơn hàng

---

## 1. Mục tiêu

- Code **dễ đọc, dễ bảo trì, dễ mở rộng** theo hướng module hóa.
- **Đặt tên theo chuẩn thông dụng** (Unicode source tiếng Việt cho chuỗi UI được phép; **mã nguồn identifier ưu tiên tiếng Anh** theo thông lệ quốc tế ECMAScript/TypeScript).
- Tổ chức gần với **MVC** trong bối cảnh Next.js: tách **Model**, **View**, **Controller** rõ ranh giới.
- Thay đổi cấu hình/hợp đồng **một nơi** (single source of truth) để hạn chế sửa nhiều file rời rạc.

---

## 2. Quy ước đặt tên (chuẩn quốc tế thông dụng)

| Đối tượng | Quy ước | Ví dụ |
|-----------|---------|--------|
| File React component | **PascalCase** | `OrderForm.tsx` |
| File không phải component (hook, util) | **camelCase** hoặc **kebab-case** thống nhất cả repo | `useOrders.ts`, `order-mapper.ts` |
| Thư mục route App Router | **kebab-case** | `app/orders/[id]/` |
| Biến, hàm | **camelCase** | `unitPrice`, `fetchOrders` |
| Hằng thật sự toàn cục | **SCREAMING_SNAKE_CASE** | `MAX_LINE_ITEMS` |
| Component / Class / Type / Interface | **PascalCase** | `OrderLine`, `OrdersPage` |
| Boolean | tiền tố `is`, `has`, `should` | `isLoading`, `hasError` |
| Async function | động từ rõ ý | `loadOrders`, `createOrder` |

**Không** đặt tên viết tắt mơ hồ (`tmp`, `data1`) trừ biến vòng lặp cực ngắn.

---

## 3. Ánh xạ MVC trong Next.js (App Router)

| Lớp MVC | Vai trò | Vị trí đề xuất trong repo |
|---------|---------|---------------------------|
| **Model** | Kiểu dữ liệu, map DB ↔ domain, hằng số schema, validator | `src/domain/`, `src/types/`, `src/lib/db/` (chỉ logic dữ liệu, không JSX) |
| **View** | UI thuần, ít logic | `src/components/`, `app/**/page.tsx` (chỉ compose + gọi hook) |
| **Controller** | Điều phối: nhận input, gọi Supabase, trả kết quả/lỗi | `src/server/actions/*.ts` (Server Actions), hoặc `src/app/api/**/route.ts` (Route Handlers) |

**Nguyên tắc**: `page.tsx` mỏng — gọi hook hoặc action; không nhồi 200 dòng business logic trong page.

---

## 4. Single source of truth — “sửa một chỗ”

| Nội dung | Một nơi duy nhất |
|----------|------------------|
| URL Supabase, tên bảng view | `src/config/env.ts` (validate zod) + không hard-code string bảng rải rác — dùng hằng `TABLES` |
| Truy vấn lặp lại | `src/lib/repositories/orders.repository.ts` (hoặc `services/orders.service.ts`) |
| Thông báo lỗi API map sang UI | `src/lib/errors/map-supabase-error.ts` |
| Quy tắc validation form (giá, số lượng) | `src/domain/order.validation.ts` dùng chung client/server |
| Kiểu `Order`, `OrderLine` | `src/types/order.ts` — import một nguồn |

Khi đổi tên cột DB: sửa **migration + types + repository**, không sửa từng component.

---

## 5. Clean code cụ thể

1. **Hàm ngắn, một nhiệm vụ**; ưu tiên early return; tránh lồng sâu > 3 cấp.
2. **TypeScript strict**; không `any` trừ biên giới thư viện (kèm comment).
3. **Xử lý lỗi có chủ đích**: mọi gọi Supabase trả `{ data, error }` phải được xử lý; không nuốt lỗi.
4. **Immutability** khi cập nhật state React; không mutate object lớn trực tiếp.
5. **Server vs Client**: file có `'use client'` chỉ khi cần hook browser; logic secrets chỉ server.
6. **Import order**: builtin → external → internal → relative (có thể enforce bằng ESLint).

---

## 6. Hiệu năng và khả năng scale

- **Fetching**: ưu tiên Server Components cho đọc dữ liệu không cần tương tác; dùng client chỗ cần form/state.
- **Caching**: dùng `revalidatePath` / `revalidateTag` sau mutation (theo tài liệu Next.js phiên bản dự án).
- **Bundle**: tách component nặng bằng `dynamic()` khi đo được FCP/LCP vượt ngưỡng đã định trong NFR.

---

## 7. Bảo trì và kiểm thử

- Mỗi repository/service có **interface** hoặc kiểu trả về rõ ràng để mock trong test.
- **Ưu tiên** test pure function (validation, mapper) trước; sau đó integration với Supabase (project test hoặc mock).

---

## 8. Cấu trúc thư mục gợi ý (MVP)

```
app/
  (auth)/login/page.tsx
  (dashboard)/orders/page.tsx
  (dashboard)/orders/[id]/page.tsx
src/
  components/orders/
  domain/order.validation.ts
  lib/supabase/server.ts
  lib/supabase/client.ts
  lib/repositories/orders.repository.ts
  server/actions/order.actions.ts
  types/order.ts
  config/env.ts
```

Điều chỉnh nếu repo đã có quy ước `src/app` — giữ **một** cây `app` duy nhất theo Next.js.

---

## 9. Checklist PR (rút gọn)

- [ ] Không hard-code URL/key Supabase ngoài `config/env`.
- [ ] Mutation đi qua một lớp repository hoặc action.
- [ ] RLS không bị bypass ở client bằng service role.
- [ ] Tên file/trùng với export chính (tree-shaking friendly).
- [ ] Lint + typecheck pass.

---

## 10. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|--------|
| 0.1 | 2026-03-30 | Khởi tạo quy tắc Next.js + MVC mapping |
