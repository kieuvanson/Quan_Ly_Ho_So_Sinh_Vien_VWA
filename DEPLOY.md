# Deploy demo: Vercel (frontend) + Railway (backend)

Tài liệu này hướng dẫn deploy bản demo lên **Vercel** (frontend) và **Railway** (backend),
dùng URL mặc định của nền tảng (không cần domain riêng).

> **Cảnh báo quan trọng — vấn đề cookie cross-site:**
> Khi frontend ở `*.vercel.app` và backend ở `*.up.railway.app`, hai site **khác domain gốc**.
> Refresh token được lưu trong cookie `HttpOnly` nên buộc phải dùng `SameSite=None` + `Secure=true`.
> Trình duyệt hiện đại (Chrome ở chế độ Privacy Sandbox) đang **chặn cookie third-party**, nên
> refresh token có thể **không được gửi** → người dùng bị đá ra khỏi phiên sau ~1 giờ.
>
> Triệu chứng: đăng nhập được, dùng được vài phút, rồi bị logout mà không báo lỗi.
>
> **Cách khắc phục tốt nhất:** dùng domain riêng trỏ subdomain cho cả hai
> (`app.vwa.edu.vn` + `api.vwa.edu.vn`) → cùng site → dùng `SameSite=Lax` an toàn.
> Xem mục "Nâng cấp lên domain riêng" ở cuối.

---

## 1. Chuẩn bị

| Thành phần | Yêu cầu |
|---|---|
| Backend (Railway) | Java 25, Docker — Railway build từ `backend/Dockerfile` |
| Frontend (Vercel) | Node 22+ — build từ `frontend/package.json` |
| Git | Code đã push lên GitHub (cả `frontend/` và `backend/`) |

Kiểm tra code đã push:

```powershell
git status
git ls-files frontend | Measure-Object -Line   # kỳ vọng: ~92 file
```

---

## 2. Deploy backend lên Railway (3 service)

### 2.1. Tạo project

1. Vào [railway.app/new](https://railway.app/new) → **Empty Project**.
2. Đặt tên project: `vwa-edurecords`.

### 2.2. Thêm PostgreSQL

1. **+ New** → **Database** → **PostgreSQL**.
2. Railway tự sinh biến `DATABASE_URL` — **không cần làm gì thêm**.
3. Vào tab **Variables** của service Postgres, ghi lại `POSTGRES_USER` / `POSTGRES_PASSWORD`
   (cần cho bước 2.5 nếu muốn set thủ công).

> **Lưu ý:** Postgres managed của Railway có persistent volume, dữ liệu **không mất** khi redeploy.

### 2.3. Thêm Redis

1. **+ New** → **Database** → **Redis**.
2. Railway tự sinh biến `REDIS_URL` (dạng `redis://default:xxx@host:port`).

> Redis **không phải** tuỳ chọn: backend dùng nó để lưu refresh token, thu hồi token,
> rate-limit đăng nhập và token import Excel. Thiếu Redis → mất phiên đăng nhập liên tục.

### 2.4. Thêm service Backend

1. **+ New** → **GitHub Repo** → chọn repo `Quan_Ly_Ho_So_Sinh_Vien_VWA`.
2. **Root Directory**: `backend`  ← *quan trọng*
3. Railway tự đọc `backend/railway.toml` (đã có sẵn) và `backend/Dockerfile`.

### 2.5. Set biến môi trường cho service Backend

Vào service Backend → tab **Variables** → thêm từng biến:

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `APP_SECURITY_JWT_SECRET` | *(chuỗi ngẫu nhiên ≥ 32 ký tự)* | **BẮT BUỘC**, tự sinh |
| `APP_SECURITY_CORS_ALLOWED_ORIGINS` | `https://<tên-frontend>.vercel.app` | URL frontend Vercel |
| `APP_SECURITY_COOKIE_SECURE` | `true` | Bắt buộc vì HTTPS |
| `APP_SECURITY_COOKIE_SAMESITE` | `None` | Bắt buộc vì khác site (xem cảnh báo) |
| `APP_ADMIN_USERNAME` | `admin` | Chỉ dùng khi bảng `users` còn trống |
| `APP_ADMIN_PASSWORD` | *(≥ 12 ký tự)* | Tài khoản demo |
| `APP_ADMIN_HO_TEN` | `Quản trị viên` | |
| `APP_ADMIN_EMAIL` | `admin@vwa.edu.vn` | |
| `JVM_XMX` | `1g` | Nếu Railway cấp ≤ 1GB RAM |

**Không cần set** `DATABASE_URL` / `REDIS_URL` / `PORT` — Railway tự inject qua
service reference. Backend đã được sửa để tự chuẩn hoá `DATABASE_URL`
(`postgres://...` → `jdbc:postgresql://...` + tách username/password).

Sau khi tạo Postgres + Redis, vào service Backend → **Variables** → **Reference** →
chọn `DATABASE_URL` và `REDIS_URL` từ service tương ứng (đảm bảo biến có sẵn).

Sinh JWT secret an toàn:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2.6. Deploy và kiểm tra

```powershell
# Theo dõi log build
railway logs --service backend

# Kiểm tra health (thay bằng domain thật)
curl https://<backend-domain>.up.railway.app/actuator/health
```

Kết quả mong đợi:

```json
{"status":"UP"}
```

**Quan trọng:** `management.endpoint.health.show-details=never` ở production nên response
chỉ có `status`. Nếu thấy `DOWN`, xem `railway logs` để biết component nào lỗi
(thường là `db` vì thiếu `DATABASE_URL`, hoặc `redis` vì thiếu `REDIS_URL`).

---

## 3. Deploy frontend lên Vercel

### 3.1. Import project

1. Vào [vercel.com/new](https://vercel.com/new) → **Add New** → **Project** → chọn repo GitHub.
2. **Root Directory**: `frontend`  ← *quan trọng*
3. Framework Preset: **Vite** (Vercel tự detect).

### 3.2. Set biến môi trường

Vào **Settings** → **Environment Variables** → thêm:

| Key | Value | Environments |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<backend-domain>.up.railway.app` | Production, Preview |

> `VITE_API_BASE_URL` là biến **build-time**. Đổi giá trị phải **rebuild** (Redeploy),
> sửa trong dashboard là không đủ.

### 3.3. Deploy

Bấm **Deploy**. Vercel chạy `npm run build` → output `dist/`.

Sau đó kiểm tra:

- Mở `https://<frontend-domain>.vercel.app` → thấy trang đăng nhập.
- Đăng nhập bằng `admin` / *(mật khẩu đã set)*.
- Điều hướng tới `/danh-sach-ho-so` rồi **F5** → phải vẫn hiện (nhờ `vercel.json` rewrite).

---

## 4. Kiểm tra tổng thể

| Mục | URL / cách kiểm tra |
|---|---|
| Health backend | `https://<backend>.up.railway.app/actuator/health` → `{"status":"UP"}` |
| Đăng nhập | `https://<frontend>.vercel.app` → `admin` / password |
| API chạy | Mở DevTools → Network → các request `/api/...` trả 200 |
| Refresh token | Đợi access token hết hạn (~1h) → vẫn đăng nhập (kiểm tra cookie `SameSite=None`) |

---

## 5. Nâng cấp lên domain riêng (khuyến nghị)

Giải quyết triệt để vấn đề cookie third-party:

1. Mua domain (VD: `vwa.edu.vn`) hoặc dùng domain hiện có.
2. Trỏ subdomain:
   - `app.vwa.edu.vn` → Vercel project (Settings → Domains)
   - `api.vwa.edu.vn` → Railway service (Settings → Networking → Custom Domain)
3. Đổi biến môi trường backend:
   - `APP_SECURITY_CORS_ALLOWED_ORIGINS=https://app.vwa.edu.vn`
   - `APP_SECURITY_COOKIE_SAMESITE=Lax`   ← đổi lại, an toàn hơn
   - `APP_SECURITY_COOKIE_SECURE=true`
4. Đổi `VITE_API_BASE_URL` trên Vercel → `https://api.vwa.edu.vn` → **Redeploy**.

Khi cả hai cùng domain gốc (`vwa.edu.vn`) → cookie `SameSite=Lax` được gửi bình thường
→ không còn phụ thuộc cookie third-party.

---

## 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `503` từ `/actuator/health` | Thiếu `DATABASE_URL` hoặc `REDIS_URL` | Tham chiếu biến từ service Postgres/Redis |
| `No suitable driver` | `DATABASE_URL` chưa được chuẩn hoá | Đã xử lý trong code; kiểm tra log có dòng "Đã chuẩn hoá DATABASE_URL" |
| `Flyway` báo lỗi migration | DB còn dữ liệu từ lần deploy trước | Xoá volume Postgres rồi deploy lại, hoặc `flyway repair` |
| CORS error trong console | `APP_SECURITY_CORS_ALLOWED_ORIGINS` chưa đúng | Đặt đúng URL frontend (có `https://`, không có dấu `/` cuối) |
| Đăng nhập được rồi bị logout sau ~1h | Cookie `SameSite=None` bị trình duyệt chặn | Dùng domain riêng (mục 5) hoặc chấp nhận giới hạn |
| F5 trên `/danh-sach-ho-so` ra 404 | Thiếu `vercel.json` rewrite | Kiểm tra `frontend/vercel.json` đã commit |
| Deploy frontend nhưng API vẫn trỏ localhost | `VITE_API_BASE_URL` chưa set hoặc chưa redeploy | Set env + **Redeploy** |

---

## 7. Ghi chú về môi trường demo

- **Dữ liệu trong DB là dữ liệu thật của dự án** — đừng nhập dữ liệu nhạy cảm.
- Nếu cần reset database: xoá volume của service Postgres trên Railway rồi deploy lại
  (Flyway sẽ chạy lại toàn bộ migration + seed).
- `APP_ADMIN_PASSWORD` chỉ có tác dụng khi bảng `users` còn trống. Xoá biến này
  sau lần đăng nhập đầu tiên.
- Giới hạn trial của Railway tính theo tổng resource: Postgres + Redis + Backend
  có thể vượt quota. Nếu bị giới hạn, dùng Postgres/Redis local qua Railway
  tunnel, hoặc chuyển sang VPS + `docker-compose.prod.yml` (config đã có sẵn trong repo).
