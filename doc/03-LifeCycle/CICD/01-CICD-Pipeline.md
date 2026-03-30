**Tiêu đề**: Kế hoạch CI/CD — Next.js + Supabase  
**Doc-ID**: CICD-BH-001  
**Owner**: DevOps / Tech Lead  
**Phiên bản**: 0.1 **Trạng thái**: Draft **Cập nhật lần cuối**: 2026-03-30  
**Liên quan**: SRS, API, Data Model; hosting điển hình Vercel + Supabase Cloud

---

## 1. Mục tiêu

- **CI**: Mỗi push/PR chạy kiểm tra tĩnh, kiểm thử tự động (khi có), xác thực migration SQL (nếu dùng CLI).
- **CD**: Triển khai frontend lên môi trường **Preview** (theo nhánh/PR) và **Production** (nhánh `main`).
- **Tách bí mật**: Không commit `.env`; chỉ inject qua UI nhà cung cấp hoặc secrets store.

---

## 2. Kênh và môi trường

| Môi trường | Frontend | Supabase | Ghi chú |
|------------|----------|----------|---------|
| Local | `next dev` | Project dev hoặc local stack | File `.env.local`. |
| Preview | Vercel Preview | Cùng project dev hoặc project staging | Biến môi trường Preview trong Vercel. |
| Production | Vercel Production | Project production | URL/anon key production. |

**Metric mục tiêu pipeline CI**: thời gian hoàn thành job lint+test **≤ 10 phút** cho repo kích thước MVP (đo bằng báo cáo CI).

---

## 3. CI — các bước đề xuất (GitHub Actions)

1. **Checkout** mã nguồn.
2. **Setup Node** (phiên bản khớp `.nvmrc` hoặc `package.json` engines).
3. **Cài dependency**: `npm ci` (hoặc `pnpm install --frozen-lockfile`).
4. **Lint**: `npm run lint` (ESLint theo quy tắc dự án).
5. **Typecheck**: `npm run typecheck` hoặc `tsc --noEmit` nếu có script.
6. **Test**: `npm test` (khi có unit/e2e).
7. **Supabase** (nếu dùng CLI trong repo):
   - `supabase db lint` hoặc validate migration (tùy phiên bản CLI).
8. **Artifact**: không lưu `node_modules` lâu dài; cache theo key lockfile.

**Quality gate**: PR không merge nếu bước 4–6 fail.

---

## 4. CD — Next.js (Vercel)

1. Kết nối repo GitHub với Vercel.
2. **Production branch**: `main` (hoặc theo quy ước team).
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Preview**: mỗi PR nhận URL preview; trỏ tới Supabase dev/staging (không dùng production DB cho preview trừ khi có quy trình riêng đã phê duyệt).

**Metric deploy**: thời gian từ merge đến **URL production phản hồi 200** ≤ 15 phút (đo bằng webhook Vercel + health check).

---

## 5. CD — Database (Supabase)

1. **Migration**: SQL trong `supabase/migrations/`; áp dụng qua Supabase Dashboard SQL hoặc `supabase db push` / pipeline đã chốt.
2. **Thứ tự**: migrate DB **trước** hoặc **đồng bộ** với release frontend phụ thuộc thay đổi (breaking API).
3. **Backup**: bật Point-in-Time Recovery (PITR) trên production nếu gói Supabase hỗ trợ; ghi **RPO** mục tiêu trong runbook (ví dụ ≤ 24 giờ nếu chỉ daily backup).

---

## 6. Bảo mật pipeline

- Quét secret: **trufflehog** hoặc **gitleaks** trên CI (chặn commit khóa).
- `service_role` chỉ trong **GitHub Secrets** / Vercel **Server-only** env nếu có Server Actions cần bypass RLS (tránh nếu có thể).
- Branch protection: bắt buộc PR + CI pass trước merge.

---

## 7. OpenAPI / contract (tùy chọn)

- Nếu sinh OpenAPI từ PostgREST hoặc hand-write: thêm bước **lint OpenAPI** (`spectral` hoặc tương đương) trong CI.

---

## 8. Rollback

- **Frontend**: Promote deployment trước đó trên Vercel.
- **DB**: Rollforward bằng migration mới sửa lỗi; tránh `down` migration trên production trừ khi đã thử nghiệm.

---

## 9. Lịch sử thay đổi

| Phiên bản | Ngày | Mô tả |
|-----------|------|--------|
| 0.1 | 2026-03-30 | Khởi tạo kế hoạch CI/CD MVP |
