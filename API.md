# VWA EduRecords — API Contract (Frontend)

> Hợp đồng API giữa Backend (`Spring Boot 4.1.1`) và Frontend.
> Tài liệu này **đồng bộ với source code** trong `backend/src/main/java/vn/vwa/edurecords/`.
> Khi thêm / sửa endpoint, cập nhật file này **cùng commit** với code API.

---

## 0. Quick Start cho Frontend

| Item | Giá trị |
|---|---|
| **Base URL (dev)** | `http://localhost:8081` |
| **Content-Type** | `application/json; charset=UTF-8` |
| **Auth header** | `Authorization: Bearer <accessToken>` (cho mọi request trừ `/api/auth/**`) |
| **Refresh token** | HttpOnly Secure Cookie `refresh_token` (browser tự gửi) |
| **CORS allowed origins** | `http://localhost:3000`, `http://localhost:5173` (mặc định dev) |

```text
Frontend chỉ cần quan tâm:
  1. POST /api/auth/login    → nhận accessToken (body) + cookie tự set
  2. Gắn Authorization header cho mọi API protected
  3. Khi 401 → gọi POST /api/auth/refresh (cookie tự gửi)
  4. POST /api/auth/logout   → xoá session
```

---

## 1. Response thống nhất

### 1.1. Thành công — `ApiResponse<T>`

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Mô tả ngắn (tiếng Việt)",
  "data": { /* payload tuỳ endpoint, có thể null */ },
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

### 1.2. Lỗi — `ErrorResponse`

```json
{
  "success": false,
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Tên đăng nhập hoặc mật khẩu không đúng",
  "errors": null,
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

Khi lỗi validate, `errors` là **mảng field-level**:

```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    { "field": "username", "message": "Tên đăng nhập không được để trống" },
    { "field": "password", "message": "Mật khẩu phải có độ dài từ 6 đến 100 ký tự" }
  ],
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

> **Quy ước frontend**: dùng `code` để phân nhánh logic, KHÔNG parse `message`.

### 1.3. HTTP status semantics

| Status | Ý nghĩa | Frontend xử lý |
|---|---|---|
| `200 OK` | Thành công | Dùng `data` |
| `201 Created` | Tạo resource thành công | Dùng `data` |
| `400 Bad Request` | Validate fail / JSON lỗi | Hiển thị `errors[]` hoặc `message` |
| `401 Unauthorized` | Sai / hết hạn token | Thử refresh 1 lần → fail thì logout |
| `403 Forbidden` | Không đủ quyền | Hiển thị "Bạn không có quyền" |
| `404 Not Found` | Endpoint / resource không tồn tại | "Không tìm thấy" |
| `409 Conflict` | Vi phạm nghiệp vụ (trạng thái) | Hiển thị `code` + `message`, không retry |
| `429 Too Many Requests` | Rate limit | Đọc `Retry-After`, disable form tương ứng |
| `500 Internal Server Error` | Lỗi server | "Lỗi hệ thống, thử lại sau" |

---

## 2. Security & cơ chế bảo vệ

### 2.1. JWT (HS256)

| Claim | Mô tả |
|---|---|
| `iss` | `vwa-edurecords` |
| `sub` | User ID (UUID) |
| `jti` | Token ID (UUID) — dùng để revoke trong Redis |
| `fid` | Family ID — nhóm chuỗi refresh của 1 phiên |
| `type` | `access` hoặc `refresh` |
| `role` | `ADMIN` (chỉ role duy nhất ở MVP) |
| `username` | Tên đăng nhập |
| `iat`, `exp` | Issued / Expiration (epoch seconds) |

| Token | TTL | Default | Truyền qua |
|---|---|---|---|
| Access | 1 giờ | `APP_SECURITY_JWT_ACCESS_TOKEN_TTL=PT1H` | `Authorization: Bearer <token>` |
| Refresh | 7 ngày | `APP_SECURITY_JWT_REFRESH_TOKEN_TTL=P7D` | Cookie `refresh_token` (HttpOnly) |

### 2.2. Refresh token rotation + reuse detection

```
Mỗi lần /api/auth/refresh:
  1. Verify chữ ký JWT, type=refresh, chưa hết hạn
  2. Check Redis xem jti đã bị revoke chưa
     ├─ Có  → REUSE DETECTED → revoke TOÀN BỘ family → yêu cầu login lại
     └─ Không → cấp cặp mới, mark jti cũ là revoked (TTL = expiry)
```

### 2.3. Cookie `refresh_token`

| Thuộc tính | Dev | Prod |
|---|---|---|
| `HttpOnly` | ✓ | ✓ |
| `Secure` | false | true |
| `SameSite` | `Lax` | `Lax` |
| `Path` | `/api/auth` | `/api/auth` |
| `Max-Age` | = refresh TTL (giây) | = refresh TTL (giây) |

> Frontend **không được** đọc / ghi cookie này — browser tự quản lý.
> Cần `withCredentials: true` (axios) hoặc `credentials: 'include'` (fetch) cho mọi request tới `/api/auth/refresh` và `/api/auth/logout`.

### 2.4. Security headers (mọi response)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Cache-Control: no-store, no-cache, must-revalidate, private   (/api/auth/**)
Pragma: no-cache                                                (/api/auth/**)
Strict-Transport-Security: max-age=31536000; includeSubDomains  (HTTPS only)
```

### 2.5. Rate limit cho `/api/auth/login`

- **Ngưỡng**: 5 attempts / 60 giây / IP (configurable qua env)
- **Vượt ngưỡng** → HTTP 429 + header `Retry-After: <giây>`
- Chỉ áp dụng cho `POST /api/auth/login`, không ảnh hưởng API khác

### 2.6. Audit log

Mọi login / refresh / logout (thành công và thất bại) được ghi qua logger `AUDIT` với format:

```
event=LOGIN|REFRESH|LOGOUT  username=...  ip=...  success=true|false  reason=...  timestamp=...
```

---

## 3. Endpoints — Module Auth

### 3.1. `POST /api/auth/login`

Xác thực username/password. Cấp accessToken (body) + set cookie refresh_token. Tạo **family ID mới** → mỗi login là một phiên độc lập.

**Auth yêu cầu:** Public (không cần token).

**Request body:**

| Field | Type | Required | Ràng buộc |
|---|---|---|---|
| `username` | string | ✓ | 3–50 ký tự |
| `password` | string | ✓ | 6–100 ký tự |

```json
{
  "username": "Phamthuylinh",
  "password": "03102004"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "7c1f4e2a-3b50-4d11-9a92-1f6c0a5e9b21",
      "username": "Phamthuylinh",
      "hoTen": "Phạm Thùy Linh",
      "email": null,
      "role": "ADMIN"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
      "refreshToken": null,
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  },
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

> `data.token.refreshToken` luôn `null` — token nằm trong cookie, không trong body.

**Response header:**

```
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiJ9...; Path=/api/auth; HttpOnly; Max-Age=604800; SameSite=Lax
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | username/password vi phạm Size/NotBlank |
| 400 | `MALFORMED_JSON` | Body không phải JSON |
| 401 | `INVALID_CREDENTIALS` | Username không tồn tại HOẶC password sai |
| 401 | `ACCOUNT_DISABLED` | `isActive=false` |
| 401 | `INSUFFICIENT_ROLE` | Role không phải `ADMIN` |
| 429 | `TOO_MANY_REQUESTS` | Rate limit (kèm `Retry-After`) |

**Ví dụ 401:**

```json
{
  "success": false,
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Tên đăng nhập hoặc mật khẩu không đúng",
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

**Ví dụ 429:**

```json
{
  "success": false,
  "status": 429,
  "code": "TOO_MANY_REQUESTS",
  "message": "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 47 giây",
  "timestamp": "2026-09-23T10:30:00.123Z"
}
```

Header kèm theo: `Retry-After: 47`

---

### 3.2. `POST /api/auth/refresh`

Đổi refresh token lấy cặp accessToken/refreshToken mới (rotation). Phát hiện reuse → revoke toàn bộ family.

**Auth yêu cầu:** Cần cookie `refresh_token` còn hiệu lực. Có thể truyền qua body nếu không dùng cookie.

**Request body** _(optional — ưu tiên cookie)_:

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `200 OK`:** (giống `/login`)

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Làm mới token thành công",
  "data": {
    "user": { "id": "...", "username": "...", "hoTen": "...", "email": null, "role": "ADMIN" },
    "token": { "accessToken": "...NEW...", "refreshToken": null, "tokenType": "Bearer", "expiresIn": 3600 }
  },
  "timestamp": "2026-09-23T11:30:00.123Z"
}
```

**Set-Cookie**: `refresh_token=...NEW...; Path=/api/auth; HttpOnly; Max-Age=604800; SameSite=Lax`

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body có `refreshToken` rỗng |
| 401 | `MISSING_REFRESH_TOKEN` | Không có cookie lẫn body |
| 401 | `INVALID_REFRESH_TOKEN` | Sai chữ ký, hết hạn, không phải loại refresh |
| 401 | `REFRESH_TOKEN_REVOKED` | Đã logout hoặc **phát hiện reuse** |
| 401 | `ACCOUNT_DISABLED` | User bị vô hiệu |
| 401 | `INSUFFICIENT_ROLE` | Role đã đổi khác `ADMIN` |
| 401 | `USER_NOT_FOUND` | User trong token không còn |

---

### 3.3. `POST /api/auth/logout`

Thu hồi refresh token hiện tại, xoá cookie, kết thúc phiên.

**Auth yêu cầu:** Không bắt buộc (vẫn trả 200 ngay cả khi token không hợp lệ, để tránh lộ thông tin).

**Request body** _(optional — ưu tiên cookie)_:

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Đăng xuất thành công",
  "data": null,
  "timestamp": "2026-09-23T12:30:00.123Z"
}
```

**Set-Cookie**: `refresh_token=; Path=/api/auth; HttpOnly; Max-Age=0` (xoá ngay)

---

## 4. Endpoints — Đã triển khai

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Đăng nhập |
| `POST` | `/api/auth/refresh` | Cookie/Body refresh_token | Làm mới access token |
| `POST` | `/api/auth/logout` | Optional | Đăng xuất, thu hồi refresh token |

> Hiện tại chỉ có module Auth. Các module nghiệp vụ (Sinh viên, Hồ sơ, Mượn-Trả, Audit) sẽ được bổ sung theo từng commit. Frontend **không tự gọi** endpoint chưa có ở đây.

---

## 5. Endpoints — Dự kiến MVP (CHƯA có)

> **Cảnh báo**: các endpoint dưới đây là định hướng, **chưa tồn tại**. Frontend không được gọi cho tới khi thấy chúng chuyển sang mục §4.

### 5.1. Danh sách hồ sơ sinh viên

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/students` | Danh sách, tìm kiếm, lọc, phân trang |
| `GET` | `/api/v1/students/{mssv}` | Tóm tắt hồ sơ một sinh viên |
| `POST` | `/api/v1/students` | Tạo hồ sơ sinh viên |
| `PATCH` | `/api/v1/students/{mssv}` | Cập nhật một phần thông tin |

### 5.2. Hồ sơ giấy tờ

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/students/{mssv}/documents` | Danh sách giấy tờ |
| `PATCH` | `/api/v1/documents/{maHoSo}/submission-status` | Tick/bỏ tick nộp giấy (kèm audit `LICHSUNOP`) |
| `GET` | `/api/v1/documents/{maHoSo}/submission-history` | Lịch sử nộp/bổ sung |
| `POST` | `/api/v1/documents/{maHoSo}/attachment` | Upload file đính kèm |

### 5.3. Mượn — Trả — Rút hồ sơ

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/v1/loans` | Tạo phiếu Mượn tạm thời |
| `POST` | `/api/v1/loans/{maPhieu}/return` | Ghi nhận trả |
| `GET` | `/api/v1/loans` | Tra cứu phiếu mượn/trả |
| `POST` | `/api/v1/withdrawals` | Tạo phiếu Rút hồ sơ vĩnh viễn (toàn bộ) |
| `POST` | `/api/v1/withdrawals/{maPhieu}/complete` | Hoàn tất rút, khóa chỉnh sửa |

### 5.4. Lịch sử & Audit

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/audits` | Tra cứu theo hồ sơ / phiếu / thời gian |
| `GET` | `/api/v1/students/{mssv}/audits` | Toàn bộ audit của 1 sinh viên |

---

## 6. Bảng mã lỗi tham chiếu nhanh

| HTTP | Code | Ý nghĩa | Frontend gợi ý |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Sai ràng buộc field | Hiển thị `errors[]` |
| 400 | `MALFORMED_JSON` | Body không phải JSON | "Body không hợp lệ" |
| 400 | `MISSING_PARAMETER` | Thiếu query/path param | "Thiếu tham số X" |
| 400 | `INVALID_PARAMETER` | Sai kiểu dữ liệu param | "Tham số X sai định dạng" |
| 401 | `UNAUTHORIZED` | Không có token | Gọi refresh → fail thì logout |
| 401 | `INVALID_CREDENTIALS` | Sai username/password | "Sai tài khoản hoặc mật khẩu" |
| 401 | `ACCOUNT_DISABLED` | Tài khoản bị khoá | "Tài khoản đã bị vô hiệu hoá" |
| 401 | `INSUFFICIENT_ROLE` | Role không đủ quyền | "Tài khoản không có quyền truy cập" |
| 401 | `MISSING_REFRESH_TOKEN` | Không có refresh token | Redirect về /login |
| 401 | `INVALID_REFRESH_TOKEN` | Token sai / hết hạn | Redirect về /login |
| 401 | `REFRESH_TOKEN_REVOKED` | Đã bị thu hồi / reuse | Redirect về /login |
| 401 | `USER_NOT_FOUND` | User không còn tồn tại | Redirect về /login |
| 403 | `FORBIDDEN` | Không đủ quyền | "Bạn không có quyền" |
| 404 | `ENDPOINT_NOT_FOUND` | URL sai | "API không tồn tại" |
| 405 | `METHOD_NOT_ALLOWED` | Sai HTTP method | "Phương thức không hỗ trợ" |
| 429 | `TOO_MANY_REQUESTS` | Rate limit | Disable form, đếm ngược `Retry-After` |
| 500 | `INTERNAL_ERROR` | Lỗi hệ thống | "Lỗi hệ thống, thử lại sau" |

---

## 7. Luồng sử dụng mẫu cho Frontend

### 7.1. Login flow

```text
[UI] User nhập username + password
  ↓
[FE] POST /api/auth/login  (Content-Type: application/json)
  ↓
[BE] Verify → trả 200 + Set-Cookie: refresh_token
  ↓
[FE] Lưu data.token.accessToken vào memory (KHÔNG localStorage)
       Lưu data.user để hiển thị
       Cookie refresh_token tự động được browser lưu
  ↓
[FE] Redirect về dashboard
```

### 7.2. Auto-refresh khi access token hết hạn

```text
[FE] GET /api/whatever  (Authorization: Bearer <expired-accessToken>)
  ↓
[BE] 401 UNAUTHORIZED
  ↓
[FE] Interceptor bắt 401 → gọi POST /api/auth/refresh (cookie tự gửi)
  ↓
[BE] Trả 200 + accessToken mới + cookie mới
  ↓
[FE] Cập nhật accessToken trong memory
       Retry request ban đầu với accessToken mới
  ↓
[Nếu refresh fail với 401]
[FE] Redirect về /login
```

### 7.3. Logout flow

```text
[UI] User click "Đăng xuất"
  ↓
[FE] POST /api/auth/logout (cookie tự gửi)
  ↓
[BE] Revoke refresh token + clear cookie
  ↓
[FE] Xoá accessToken khỏi memory → Redirect /login
```

### 7.4. Ví dụ axios config (React/Vue)

```javascript
// axios instance
const api = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,  // BẮT BUỘC cho refresh/logout
});

// Request interceptor: gắn accessToken
api.interceptors.request.use((config) => {
  const token = memoryStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh khi 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/api/auth/refresh'); // cookie tự gửi
        memoryStore.setAccessToken(data.data.token.accessToken);
        original.headers.Authorization = `Bearer ${data.data.token.accessToken}`;
        return api(original);
      } catch {
        memoryStore.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Test nhanh bằng curl

```bash
# 1. Login — lưu cookie vào cookies.txt
curl -i -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Phamthuylinh","password":"03102004"}' \
  -c cookies.txt

# 2. Refresh — gửi cookie từ file
curl -i -X POST http://localhost:8081/api/auth/refresh \
  -b cookies.txt -c cookies.txt

# 3. Logout
curl -i -X POST http://localhost:8081/api/auth/logout \
  -b cookies.txt -c cookies.txt
```

---

## 9. Quy tắc cho Frontend

- **Không lưu `accessToken` vào localStorage / sessionStorage** — chỉ giữ trong memory (state / ref). Token có thể bị XSS đánh cắp nếu lưu persistent storage.
- **Bật `withCredentials: true`** cho mọi request tới backend (axios) hoặc `credentials: 'include'` (fetch).
- **Không tự đổi `Refresh-Token`** ở client — đó là server-side rotation.
- **Không parse `message`** để phân nhánh logic — dùng `code`.
- **Không retry** với status `400`, `409`, `429` — chỉ retry `5xx` tối đa 1 lần.
- **Không tự suy đoán kết quả** thay đổi trạng thái (tick giấy, tạo phiếu...) — luôn chờ response từ backend để cập nhật UI.
- **Mọi endpoint protected cần `Authorization: Bearer <token>`**, trừ `/api/auth/**`.

---

## 10. Tài liệu liên quan

- `AGENTS.md` (root) — tổng quan dự án, ERD, business rules
- `backend/AGENTS.md` — engineering guide cho backend
- `backend/.env.example` — danh sách biến môi trường
- `backend/scripts/run-dev.ps1` — script chạy app
- `backend/scripts/test-api.ps1` — script test tự động
