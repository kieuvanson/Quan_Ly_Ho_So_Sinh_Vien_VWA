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
| `role` | `ADMIN` hoặc `STAFF` |
| `username` | Tên đăng nhập |
| `mssv` | Mã số sinh viên (chỉ có với STAFF, nullable) |
| `iat`, `exp` | Issued / Expiration (epoch seconds) |

| Token | TTL | Default | Truyền qua |
|---|---|---|---|
| Access | 1 giờ | `PT1H` | `Authorization: Bearer <token>` |
| Refresh | 7 ngày | `P7D` | Cookie `refresh_token` (HttpOnly) |

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
| `Path` | `/api/auth/refresh` | `/api/auth/refresh` |
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

### 3.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Đăng nhập |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản mới |
| `POST` | `/api/auth/refresh` | Cookie | Làm mới token |
| `POST` | `/api/auth/logout` | Optional | Đăng xuất |
| `POST` | `/api/auth/encode-password` | Public | Encode password (utility) |

---

### 3.1. `POST /api/auth/login`

Xác thực username/password. Cấp accessToken (body) + set cookie refresh_token.

**Auth yêu cầu:** Public (không cần token).

**Request body:**

| Field | Type | Required | Ràng buộc |
|---|---|---|---|
| `username` | string | ✓ | 3–50 ký tự |
| `password` | string | ✓ | 6–100 ký tự |

```json
{
  "username": "Kieuvanson",
  "password": "332003"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "user": {
      "id": 2,
      "username": "Kieuvanson",
      "hoTen": "Quan Tri Vien",
      "email": "admin@vwa.edu.vn",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-09-26T00:59:37.468223",
      "updatedAt": null
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
      "refreshToken": null,
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  },
  "timestamp": "2026-09-26T15:51:45.038Z"
}
```

**Response header:**

```
Set-Cookie: refresh_token=eyJhbGciOiJIUzM4NCJ9...; Path=/api/auth/refresh; HttpOnly; Max-Age=604800; SameSite=Lax
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | username/password vi phạm Size/NotBlank |
| 400 | `MALFORMED_JSON` | Body không phải JSON |
| 401 | `INVALID_CREDENTIALS` | Username không tồn tại HOẶC password sai |
| 401 | `ACCOUNT_DISABLED` | `isActive=false` |
| 429 | `TOO_MANY_REQUESTS` | Rate limit (kèm `Retry-After`) |

**Ví dụ test:**

```bash
curl -i -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Kieuvanson","password":"332003"}' \
  -c cookies.txt
```

---

### 3.2. `POST /api/auth/register`

Đăng ký tài khoản mới cho Staff.

**Auth yêu cầu:** Public (không cần token).

**Request body:**

| Field | Type | Required | Ràng buộc |
|---|---|---|---|
| `username` | string | ✓ | 3–50 ký tự, unique |
| `password` | string | ✓ | 6–100 ký tự |
| `hoTen` | string | ✓ | Tên người dùng |
| `email` | string | ✓ | Email hợp lệ |
| `mssv` | string | | MSSV gán cho Staff (nếu có) |

```json
{
  "username": "nvbinh",
  "password": "332003",
  "hoTen": "Nguyen Van Binh",
  "email": "binh.nv@vwa.edu.vn",
  "mssv": "B23DCCN001"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "status": 201,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "user": {
      "id": 3,
      "username": "nvbinh",
      "hoTen": "Nguyen Van Binh",
      "email": "binh.nv@vwa.edu.vn",
      "role": "STAFF",
      "isActive": true,
      "mssv": "B23DCCN001",
      "createdAt": "2026-09-28T10:00:00.000000"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
      "refreshToken": null,
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  },
  "timestamp": "2026-09-28T10:00:00.000Z"
}
```

**Set-Cookie**: `refresh_token=...; Path=/api/auth/refresh; HttpOnly; Max-Age=604800; SameSite=Lax`

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |
| 400 | `USERNAME_EXISTS` | Username đã tồn tại |
| 400 | `EMAIL_EXISTS` | Email đã được sử dụng |
| 400 | `MSSV_NOT_FOUND` | MSSV không tồn tại (nếu cung cấp) |

**Ví dụ test:**

```bash
curl -i -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"nvbinh","password":"332003","hoTen":"Nguyen Van Binh","email":"binh.nv@vwa.edu.vn","mssv":"B23DCCN001"}' \
  -c cookies.txt
```

---

### 3.3. `POST /api/auth/refresh`

Đổi refresh token lấy cặp accessToken/refreshToken mới (rotation).

**Auth yêu cầu:** Cần cookie `refresh_token` còn hiệu lực.

**Request body** _(optional — ưu tiên cookie)_:

```json
{ "refreshToken": "eyJhbGciOiJIUzM4NCJ9..." }
```

**Response `200 OK`:** (giống `/login`)

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Làm mới token thành công",
  "data": {
    "user": { "id": 2, "username": "Kieuvanson", "hoTen": "Quan Tri Vien", "email": "admin@vwa.edu.vn", "role": "ADMIN" },
    "token": { "accessToken": "...NEW...", "refreshToken": null, "tokenType": "Bearer", "expiresIn": 3600 }
  },
  "timestamp": "2026-09-26T16:30:00.123Z"
}
```

**Set-Cookie**: `refresh_token=...NEW...; Path=/api/auth/refresh; HttpOnly; Max-Age=604800; SameSite=Lax`

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 401 | `NO_REFRESH_TOKEN` | Không có cookie lẫn body |
| 401 | `INVALID_REFRESH_TOKEN` | Sai chữ ký, hết hạn, không phải loại refresh |
| 401 | `REFRESH_TOKEN_REVOKED` | Đã logout hoặc **phát hiện reuse** |

**Ví dụ test:**

```bash
curl -i -X POST http://localhost:8081/api/auth/refresh \
  -b cookies.txt -c cookies.txt
```

---

### 3.4. `POST /api/auth/logout`

Thu hồi refresh token hiện tại, xoá cookie, kết thúc phiên.

**Auth yêu cầu:** Không bắt buộc.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Đăng xuất thành công",
  "data": { "message": "Logged out successfully" },
  "timestamp": "2026-09-26T17:30:00.123Z"
}
```

**Set-Cookie**: `refresh_token=; Path=/api/auth/refresh; HttpOnly; Max-Age=0`

**Ví dụ test:**

```bash
curl -i -X POST http://localhost:8081/api/auth/logout \
  -H "Authorization: Bearer <token>" \
  -b cookies.txt -c cookies.txt
```

---

### 3.5. `POST /api/auth/encode-password`

Utility endpoint để encode password thành BCrypt hash.

**Auth yêu cầu:** Public.

**Request body:**

```json
{ "password": "332003" }
```

**Response `200 OK`:**

```json
{
  "bcryptHash": "$2a$10$..."
}
```

**Ví dụ test:**

```bash
curl -X POST http://localhost:8081/api/auth/encode-password \
  -H "Content-Type: application/json" \
  -d '{"password":"332003"}'
```

---

## 4. Endpoints — Module User

### 4.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/users/me` | ADMIN, STAFF | Thông tin người dùng hiện tại |
| `GET` | `/api/users` | ADMIN | Danh sách tất cả người dùng (chưa triển khai) |

---

### 4.1. `GET /api/users/me`

Lấy thông tin cá nhân của người dùng đang đăng nhập.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "id": 2,
    "username": "Kieuvanson",
    "hoTen": "Quan Tri Vien",
    "email": "admin@vwa.edu.vn",
    "role": "ADMIN",
    "isActive": true,
    "mssv": null,
    "createdAt": "2026-09-26T00:59:37.468223",
    "updatedAt": null
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 401 | `UNAUTHORIZED` | Không có token |
| 404 | `NOT_FOUND` | Không tìm thấy user |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/users/me \
  -H "Authorization: Bearer <token>"
```

---

### 4.2. `GET /api/users`

Lấy danh sách tất cả người dùng.

**Auth yêu cầu:** `ADMIN`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Tính năng đang phát triển",
  "data": null,
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

> Hiện tại chưa triển khai đầy đủ.

---

## 5. Endpoints — Module Sinh Viên

### 5.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/sinh-vien/me` | STAFF | Thông tin sinh viên của Staff đang đăng nhập |
| `GET` | `/api/sinh-vien` | ADMIN, STAFF | Danh sách sinh viên (tìm kiếm, lọc) |
| `GET` | `/api/sinh-vien/{mssv}` | ADMIN, STAFF | Chi tiết một sinh viên |
| `GET` | `/api/sinh-vien/stats` | ADMIN | Thống kê tổng quan sinh viên |
| `GET` | `/api/sinh-vien/export` | ADMIN | Xuất danh sách sinh viên ra file Excel (.xlsx) |
| `GET` | `/api/sinh-vien/import-template` | ADMIN | Tải file Excel mẫu để import |
| `POST` | `/api/sinh-vien/import` | ADMIN | Import sinh viên từ file Excel (multipart) |
| `POST` | `/api/sinh-vien` | ADMIN | Tạo sinh viên mới (chưa triển khai) |
| `PUT` | `/api/sinh-vien/{mssv}` | ADMIN | Cập nhật sinh viên (chưa triển khai) |
| `DELETE` | `/api/sinh-vien/{mssv}` | ADMIN | Xóa sinh viên (chưa triển khai) |

> **Hướng dẫn người dùng cho Import/Export:** xem `frontend/README-IMPORT-EXPORT-SINHVIEN.md`.

---

### 5.1. `GET /api/sinh-vien/me`

Lấy thông tin sinh viên của chính Staff đang đăng nhập.

**Auth yêu cầu:** `STAFF`. Tài khoản Staff phải có `mssv` được gán.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "mssv": "B23DCCN001",
    "hoTen": "Nguyễn Văn An",
    "ngaySinh": "2005-03-15T00:00:00",
    "gioiTinh": "Nam",
    "cccd": "079205001234",
    "sdt": "0912345678",
    "email": "an.nv_b23dccn001@vwa.edu.vn",
    "queQuan": "TP. HCM",
    "nganh": "Công nghệ thông tin",
    "lop": "D23CQCN01-N",
    "khoa": "Khoa CNTT",
    "khoaNamNhapHoc": "2023-2024",
    "heDaoTao": "Chính quy",
    "trangThaiHocVu": "Đang học",
    "ngayTao": "2026-09-26T00:51:30.618768",
    "ngayCapNhat": null
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 401 | `UNAUTHORIZED` | Không có token |
| 403 | `NO_MSSV` | Tài khoản Staff chưa được gán MSSV |
| 404 | `NOT_FOUND` | Không tìm thấy sinh viên |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/sinh-vien/me \
  -H "Authorization: Bearer <token>"
```

---

### 5.2. `GET /api/sinh-vien`

Danh sách sinh viên, hỗ trợ tìm kiếm, lọc và phân trang.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem toàn bộ danh sách với filter
- **STAFF**: chỉ xem thông tin của chính mình

**Query parameters:**

| Param | Type | Mô tả |
|---|---|---|
| `keyword` | string | Tìm kiếm theo họ tên hoặc MSSV (LIKE) |
| `trangThaiHocVu` | string | Lọc theo trạng thái: `Đang học`, `Tốt nghiệp`, `Bảo lưu`, `Đình chỉ`, `Đã rút hồ sơ` |
| `nganh` | string | Lọc theo tên ngành |
| `lop` | string | Lọc theo lớp |
| `khoaNamNhapHoc` | string | Lọc theo khóa/năm nhập học (VD: `2023-2024`) |
| `khoa` | string | Lọc theo khoa |
| `heDaoTao` | string | Lọc theo hệ đào tạo |
| `page` | int | Số trang, bắt đầu từ 0. Default: `0` |
| `size` | int | Số phần tử/trang. Default: `10`, Max: `100` |
| `sortDirection` | int | `0` = mới nhất trước, `1` = cũ nhất trước. Default: `0` |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "data": [
      {
        "mssv": "B23DCCN001",
        "hoTen": "Nguyễn Văn An",
        "ngaySinh": "2005-03-15T00:00:00",
        "gioiTinh": "Nam",
        "cccd": "079205001234",
        "sdt": "0912345678",
        "email": "an.nv_b23dccn001@vwa.edu.vn",
        "queQuan": "TP. HCM",
        "nganh": "Công nghệ thông tin",
        "lop": "D23CQCN01-N",
        "khoa": "Khoa CNTT",
        "khoaNamNhapHoc": "2023-2024",
        "heDaoTao": "Chính quy",
        "trangThaiHocVu": "Đang học",
        "ngayTao": "2026-09-26T00:51:30.618768",
        "ngayCapNhat": null
      }
    ],
    "page": {
      "page": 0,
      "size": 10,
      "totalElements": 4,
      "totalPages": 1,
      "first": true,
      "last": true
    }
  },
  "timestamp": "2026-09-26T15:52:16.220Z"
}
```

**Ví dụ test:**

```bash
# ADMIN: Lấy tất cả
curl -X GET http://localhost:8081/api/sinh-vien \
  -H "Authorization: Bearer <token>"

# ADMIN: Phân trang
curl -X GET "http://localhost:8081/api/sinh-vien?page=0&size=2" \
  -H "Authorization: Bearer <token>"

# ADMIN: Tìm theo từ khóa
curl -X GET "http://localhost:8081/api/sinh-vien?keyword=An" \
  -H "Authorization: Bearer <token>"

# ADMIN: Lọc theo trạng thái
curl -X GET "http://localhost:8081/api/sinh-vien?trangThaiHocVu=%C4%90ang%20h%E1%BB%8Dc" \
  -H "Authorization: Bearer <token>"

# STAFF: Tự động chỉ xem chính mình
curl -X GET http://localhost:8081/api/sinh-vien \
  -H "Authorization: Bearer <token_staff>"
```

---

### 5.3. `GET /api/sinh-vien/{mssv}`

Lấy thông tin chi tiết một sinh viên.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem bất kỳ sinh viên nào
- **STAFF**: chỉ xem chính mình

**Path parameters:**

| Param | Type | Mô tả |
|---|---|---|
| `mssv` | string | Mã số sinh viên (khóa chính) |

**Response `200 OK`:** payload giống mảng 1 phần tử ở `GET /api/sinh-vien`.

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 401 | `UNAUTHORIZED` | Không có token |
| 403 | `FORBIDDEN` | STAFF cố xem sinh viên khác |
| 404 | `NOT_FOUND` | Không tồn tại sinh viên |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/sinh-vien/B23DCCN001 \
  -H "Authorization: Bearer <token>"
```

---

### 5.4. `GET /api/sinh-vien/stats`

Thống kê tổng quan về số lượng sinh viên theo từng trạng thái học vụ.

**Auth yêu cầu:** `ADMIN` only.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "tongSoSinhVien": 4,
    "dangHoc": 2,
    "totNghiep": 1,
    "baoLuu": 1,
    "dinhChi": 0,
    "daRutHoSo": 0
  },
  "timestamp": "2026-09-26T15:52:38.221Z"
}
```

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/sinh-vien/stats \
  -H "Authorization: Bearer <token>"
```

---

### 5.5. `GET /api/sinh-vien/export`

Xuất danh sách sinh viên ra file `.xlsx`, áp dụng **đúng các filter** như `GET /api/sinh-vien`.

**Auth yêu cầu:** `ADMIN` only.

**Query parameters:** giống `GET /api/sinh-vien`, thêm:

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `scope` | string | `filtered` | `filtered` = toàn bộ kết quả lọc (tối đa 10.000 dòng), `page` = chỉ trang hiện tại |

**Response:** file `.xlsx` với `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` và `Content-Disposition: attachment; filename="danh-sach-sinh-vien-<timestamp>.xlsx"`.

**Cấu trúc file Excel (14 cột, theo đúng thứ tự):**

| # | Header | Mô tả |
|---|---|---|
| 1 | MSSV | Mã số sinh viên |
| 2 | Họ tên | |
| 3 | Ngày sinh | Định dạng `dd/MM/yyyy` |
| 4 | Giới tính | |
| 5 | CCCD | |
| 6 | SĐT | |
| 7 | Email | |
| 8 | Quê quán | |
| 9 | Ngành | |
| 10 | Lớp | |
| 11 | Khóa | |
| 12 | Khóa nhập học | |
| 13 | Hệ đào tạo | |
| 14 | Trạng thái học vụ | `Đang học` / `Bảo lưu` / `Đình chỉ` / `Tốt nghiệp` / `Đã rút hồ sơ` |

**Ví dụ test:**

```bash
# Toàn bộ kết quả lọc (mặc định)
curl -o danh-sach-sinh-vien.xlsx \
  -X GET "http://localhost:8081/api/sinh-vien/export?keyword=An&nganh=C%C3%B4ng%20ngh%E1%BB%87%20th%C3%B4ng%20tin" \
  -H "Authorization: Bearer <token>"

# Chỉ trang hiện tại
curl -o danh-sach-trang-1.xlsx \
  -X GET "http://localhost:8081/api/sinh-vien/export?scope=page&page=0&size=10" \
  -H "Authorization: Bearer <token>"
```

---

### 5.6. `GET /api/sinh-vien/import-template`

Tải file Excel mẫu để người dùng chuẩn bị dữ liệu import. File chứa dòng hướng dẫn, header đúng 14 cột, và 1 dòng ví dụ.

**Auth yêu cầu:** `ADMIN` only.

**Response:** file `mau-import-sinh-vien.xlsx`.

**Ví dụ test:**

```bash
curl -o mau-import-sinh-vien.xlsx \
  -X GET http://localhost:8081/api/sinh-vien/import-template \
  -H "Authorization: Bearer <token>"
```

---

### 5.7. `POST /api/sinh-vien/import`

Upload file `.xlsx` để **thêm mới** / **cập nhật** sinh viên hàng loạt theo MSSV.

**Auth yêu cầu:** `ADMIN` only.

**Request:** `multipart/form-data` với field `file` (`.xlsx` hoặc `.xls`, tối đa ~10 MB).

**Quy tắc xử lý từng dòng:**

| Điều kiện | Kết quả |
|---|---|
| Dòng trống | Bỏ qua |
| `MSSV` trống hoặc `Họ tên` trống | Dòng bị **báo lỗi**, không import |
| `Trạng thái học vụ` không hợp lệ | Bỏ qua giá trị, mặc định `Đang học` |
| `Ngày sinh` không parse được | Bỏ qua, để trống |
| `MSSV` **chưa có** trong DB | Tạo mới |
| `MSSV` **đã có** trong DB | Cập nhật (giữ `ngayTao`, cập nhật `ngayCapNhat`) |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "successCount": 5,
    "failureCount": 1,
    "insertedCount": 3,
    "updatedCount": 2,
    "errors": [
      { "rowNumber": 7, "message": "Thiếu MSSV." }
    ]
  },
  "timestamp": "2026-10-01T23:50:00.000Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `BAD_REQUEST` | File rỗng hoặc không đúng `.xlsx` / `.xls` |
| 500 | `IMPORT_FAILED` | Lỗi parse Excel |

**Ví dụ test:**

```bash
curl -X POST http://localhost:8081/api/sinh-vien/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@danh-sach-sinh-vien.xlsx"
```

---

### 5.8. `POST /api/sinh-vien`

Tạo sinh viên mới.

**Auth yêu cầu:** `ADMIN`.

> **Hiện tại chưa triển khai** — trả placeholder.

**Response `200 OK`** (placeholder):

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Tính năng đang phát triển",
  "data": null,
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

---

### 5.9. `PUT /api/sinh-vien/{mssv}`

Cập nhật toàn bộ thông tin sinh viên.

**Auth yêu cầu:** `ADMIN`.

> **Hiện tại chưa triển khai** — trả placeholder.

**Response `200 OK`** (placeholder): giống `POST /api/sinh-vien`.

---

### 5.10. `DELETE /api/sinh-vien/{mssv}`

Xóa sinh viên khỏi hệ thống.

**Auth yêu cầu:** `ADMIN`.

> **Hiện tại chưa triển khai** — trả placeholder.

**Response `200 OK`** (placeholder): giống `POST /api/sinh-vien`.

---

## 6. Endpoints — Module Loại Giấy Tờ

### 6.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/loai-giay-to` | ADMIN, STAFF | Danh sách loại giấy tờ đang sử dụng |
| `GET` | `/api/loai-giay-to/bat-buoc` | ADMIN, STAFF | Danh sách loại giấy tờ bắt buộc |
| `GET` | `/api/loai-giay-to/{maLoai}` | ADMIN, STAFF | Chi tiết một loại giấy tờ |
| `GET` | `/api/loai-giay-to/stats` | ADMIN, STAFF | Thống kê số lượng loại giấy tờ |

---

### 6.1. `GET /api/loai-giay-to`

Lấy danh sách tất cả loại giấy tờ đang sử dụng, sắp xếp theo thứ tự hiển thị.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": [
    {
      "maLoai": "GT01",
      "tenGiayTo": "Giấy khai sinh",
      "moTa": null,
      "batBuoc": true,
      "dangSuDung": true,
      "thuTuHienThi": 1,
      "ngayTao": "2026-09-26T00:00:00"
    },
    {
      "maLoai": "GT02",
      "tenGiayTo": "CMND/CCCD",
      "moTa": null,
      "batBuoc": true,
      "dangSuDung": true,
      "thuTuHienThi": 2,
      "ngayTao": "2026-09-26T00:00:00"
    }
  ],
  "timestamp": "2026-09-26T15:52:16.220Z"
}
```

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/loai-giay-to \
  -H "Authorization: Bearer <token>"
```

---

### 6.2. `GET /api/loai-giay-to/bat-buoc`

Lấy danh sách loại giấy tờ **bắt buộc** (8 loại).

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response:** giống `GET /api/loai-giay-to`, nhưng chỉ trả về các loại có `batBuoc: true`.

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/loai-giay-to/bat-buoc \
  -H "Authorization: Bearer <token>"
```

---

### 6.3. `GET /api/loai-giay-to/{maLoai}`

Lấy chi tiết một loại giấy tờ theo mã.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Path parameters:**

| Param | Type | Mô tả |
|---|---|---|
| `maLoai` | string | Mã loại giấy tờ (VD: `GT01`) |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "maLoai": "GT01",
    "tenGiayTo": "Giấy khai sinh",
    "moTa": null,
    "batBuoc": true,
    "dangSuDung": true,
    "thuTuHienThi": 1,
    "ngayTao": "2026-09-26T00:00:00"
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Không tồn tại loại giấy tờ |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/loai-giay-to/GT01 \
  -H "Authorization: Bearer <token>"
```

---

### 6.4. `GET /api/loai-giay-to/stats`

Thống kê số lượng loại giấy tờ.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "tongSoLoai": 13,
    "soLoaiBatBuoc": 8
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/loai-giay-to/stats \
  -H "Authorization: Bearer <token>"
```

---

## 7. Endpoints — Module Hồ Sơ Giấy Tờ

### 7.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/ho-so-giay-to` | ADMIN, STAFF | Danh sách hồ sơ theo MSSV |
| `GET` | `/api/ho-so-giay-to/{maHoSo}` | ADMIN, STAFF | Chi tiết một hồ sơ |
| `GET` | `/api/ho-so-giay-to/stats` | ADMIN, STAFF | Thống kê giấy tờ theo MSSV |
| `POST` | `/api/ho-so-giay-to` | ADMIN | Tạo hồ sơ giấy tờ mới |
| `PUT` | `/api/ho-so-giay-to/{maHoSo}` | ADMIN | Cập nhật hồ sơ |
| `PATCH` | `/api/ho-so-giay-to/{maHoSo}/trang-thai` | ADMIN | Cập nhật trạng thái nộp |
| `DELETE` | `/api/ho-so-giay-to/{maHoSo}` | ADMIN | Xóa hồ sơ |

---

### 7.1. `GET /api/ho-so-giay-to`

Lấy danh sách hồ sơ giấy tờ theo MSSV.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem tất cả sinh viên (cần query theo `mssv`)
- **STAFF**: chỉ xem giấy tờ của chính mình

**Query parameters:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `mssv` | string | Có (ADMIN) / Không (STAFF) | Mã số sinh viên |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": [
    {
      "maHoSo": "HS001",
      "mssv": "B23DCCN001",
      "maLoai": "GT01",
      "tenGiayTo": "Giấy khai sinh",
      "trangThaiNop": "Đã nộp",
      "banGocBanSao": "Bản gốc",
      "fileDinhKem": null,
      "viTriLuuKho": "Kệ A1-01",
      "ghiChu": null,
      "ngayTao": "2026-09-26T00:51:30.618768",
      "ngayCapNhat": null
    }
  ],
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `MISSING_PARAM` | ADMIN không cung cấp `mssv` |
| 403 | `FORBIDDEN` | STAFF cố xem hồ sơ người khác |

**Ví dụ test:**

```bash
# ADMIN: Xem tất cả giấy tờ của một sinh viên
curl -X GET "http://localhost:8081/api/ho-so-giay-to?mssv=B23DCCN001" \
  -H "Authorization: Bearer <token>"

# STAFF: Tự động chỉ xem giấy tờ của mình (không cần mssv)
curl -X GET http://localhost:8081/api/ho-so-giay-to \
  -H "Authorization: Bearer <token_staff>"
```

---

### 7.2. `GET /api/ho-so-giay-to/{maHoSo}`

Lấy chi tiết một hồ sơ giấy tờ.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem bất kỳ hồ sơ nào
- **STAFF**: chỉ xem hồ sơ của chính mình

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "maHoSo": "HS001",
    "mssv": "B23DCCN001",
    "maLoai": "GT01",
    "tenGiayTo": "Giấy khai sinh",
    "trangThaiNop": "Đã nộp",
    "banGocBanSao": "Bản gốc",
    "fileDinhKem": null,
    "viTriLuuKho": "Kệ A1-01",
    "ghiChu": null,
    "ngayTao": "2026-09-26T00:51:30.618768",
    "ngayCapNhat": null
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 403 | `FORBIDDEN` | STAFF cố xem hồ sơ người khác |
| 404 | `NOT_FOUND` | Không tồn tại hồ sơ |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/ho-so-giay-to/HS001 \
  -H "Authorization: Bearer <token>"
```

---

### 7.3. `GET /api/ho-so-giay-to/stats`

Thống kê giấy tờ theo MSSV.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem thống kê của bất kỳ sinh viên nào
- **STAFF**: chỉ xem thống kê của chính mình

**Query parameters:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `mssv` | string | ✓ | Mã số sinh viên |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "mssv": "B23DCCN001",
    "tongSo": 13,
    "daNop": 5,
    "chuaNop": 6,
    "thieu": 1,
    "khongHopLe": 1
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Ví dụ test:**

```bash
curl -X GET "http://localhost:8081/api/ho-so-giay-to/stats?mssv=B23DCCN001" \
  -H "Authorization: Bearer <token>"
```

---

### 7.4. `POST /api/ho-so-giay-to`

Tạo hồ sơ giấy tờ mới.

**Auth yêu cầu:** `ADMIN` only.

**Request body:**

```json
{
  "trangThaiNop": "Chưa nộp",
  "banGocBanSao": null,
  "viTriLuuKho": "Kệ A1-01",
  "ghiChu": null
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `trangThaiNop` | string | ✓ | `Chưa nộp`, `Đã nộp`, `Thiếu`, `Không hợp lệ` |
| `banGocBanSao` | string | | `Bản gốc`, `Bản sao` |
| `viTriLuuKho` | string | | Vị trí lưu trữ |
| `ghiChu` | string | | Ghi chú |

**Response `201 Created`:**

```json
{
  "success": true,
  "status": 201,
  "code": "SUCCESS",
  "message": "Tạo hồ sơ giấy tờ thành công",
  "data": {
    "maHoSo": "HS014",
    "mssv": "B23DCCN001",
    "maLoai": "GT01",
    "tenGiayTo": "Giấy khai sinh",
    "trangThaiNop": "Chưa nộp",
    "banGocBanSao": null,
    "fileDinhKem": null,
    "viTriLuuKho": "Kệ A1-01",
    "ghiChu": null,
    "ngayTao": "2026-09-28T10:30:00.123456",
    "ngayCapNhat": null
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |
| 404 | `NOT_FOUND` | MSSV hoặc MaLoai không tồn tại |
| 409 | `ALREADY_EXISTS` | Đã tồn tại hồ sơ cho loại giấy tờ này |

**Ví dụ test:**

```bash
curl -X POST "http://localhost:8081/api/ho-so-giay-to?mssv=B23DCCN001&maLoai=GT01" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"trangThaiNop":"Chưa nộp","viTriLuuKho":"Kệ A1-01"}'
```

---

### 7.5. `PUT /api/ho-so-giay-to/{maHoSo}`

Cập nhật hồ sơ giấy tờ.

**Auth yêu cầu:** `ADMIN` only.

**Request body:**

```json
{
  "trangThaiNop": "Đã nộp",
  "banGocBanSao": "Bản gốc",
  "viTriLuuKho": "Kệ A2-05",
  "ghiChu": "Đã kiểm tra"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Cập nhật hồ sơ giấy tờ thành công",
  "data": {
    "maHoSo": "HS001",
    "mssv": "B23DCCN001",
    "maLoai": "GT01",
    "tenGiayTo": "Giấy khai sinh",
    "trangThaiNop": "Đã nộp",
    "banGocBanSao": "Bản gốc",
    "fileDinhKem": null,
    "viTriLuuKho": "Kệ A2-05",
    "ghiChu": "Đã kiểm tra",
    "ngayTao": "2026-09-26T00:51:30.618768",
    "ngayCapNhat": "2026-09-28T10:30:00.123456"
  },
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Không tồn tại hồ sơ |

**Ví dụ test:**

```bash
curl -X PUT http://localhost:8081/api/ho-so-giay-to/HS001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"trangThaiNop":"Đã nộp","banGocBanSao":"Bản gốc","viTriLuuKho":"Kệ A2-05"}'
```

---

### 7.6. `PATCH /api/ho-so-giay-to/{maHoSo}/trang-thai`

Cập nhật trạng thái nộp giấy tờ (tick/bỏ tick). **Tự động tạo bản ghi `LICHSUNOP`**.

**Auth yêu cầu:** `ADMIN` only.

**Path parameters:**

| Param | Type | Mô tả |
|---|---|---|
| `maHoSo` | string | Mã hồ sơ giấy tờ |

**Query parameters:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `trangThaiMoi` | string | ✓ | Trạng thái mới: `Chưa nộp`, `Đã nộp`, `Thiếu`, `Không hợp lệ` |
| `ghiChu` | string | | Ghi chú cho lịch sử |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "maHoSo": "HS001",
    "mssv": "B23DCCN001",
    "maLoai": "GT01",
    "tenGiayTo": "Giấy khai sinh",
    "trangThaiNop": "Đã nộp",
    "banGocBanSao": "Bản gốc",
    "fileDinhKem": null,
    "viTriLuuKho": "Kệ A1-01",
    "ghiChu": null,
    "ngayTao": "2026-09-26T00:51:30.618768",
    "ngayCapNhat": "2026-09-28T10:35:00.123456"
  },
  "timestamp": "2026-09-28T10:35:00.123Z"
}
```

> **Nghiệp vụ**: Mỗi lần cập nhật trạng thái sẽ tự động tạo bản ghi trong `LICHSUNOP`.

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Không tồn tại hồ sơ |
| 400 | `VALIDATION_ERROR` | Trạng thái không hợp lệ |

**Ví dụ test:**

```bash
# Tick "Đã nộp"
curl -X PATCH "http://localhost:8081/api/ho-so-giay-to/HS001/trang-thai?trangThaiMoi=%C4%90%C3%A3%20n%E1%BB%99p" \
  -H "Authorization: Bearer <token>"

# Tick "Thiếu" với ghi chú
curl -X PATCH "http://localhost:8081/api/ho-so-giay-to/HS001/trang-thai?trangThaiMoi=Thi%E1%BA%BFu&ghiChu=Thi%E1%BA%BFu%20trang%201" \
  -H "Authorization: Bearer <token>"
```

---

### 7.7. `DELETE /api/ho-so-giay-to/{maHoSo}`

Xóa hồ sơ giấy tờ.

**Auth yêu cầu:** `ADMIN` only.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Xóa hồ sơ giấy tờ thành công",
  "data": null,
  "timestamp": "2026-09-28T10:30:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Không tồn tại hồ sơ |

**Ví dụ test:**

```bash
curl -X DELETE http://localhost:8081/api/ho-so-giay-to/HS001 \
  -H "Authorization: Bearer <token>"
```

---

## 8. Endpoints — Module Lịch Sử Nộp

### 8.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/lich-su-nop` | ADMIN, STAFF | Lịch sử nộp theo MSSV (phân trang) |
| `GET` | `/api/lich-su-nop/ho-so/{maHoSo}` | ADMIN, STAFF | Lịch sử nộp theo mã hồ sơ |
| `GET` | `/api/lich-su-nop/{maLog}` | ADMIN, STAFF | Chi tiết một bản ghi lịch sử |

---

### 8.1. `GET /api/lich-su-nop`

Lấy lịch sử nộp giấy tờ theo MSSV.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.
- **ADMIN**: xem lịch sử của bất kỳ sinh viên nào
- **STAFF**: chỉ xem lịch sử của chính mình

**Query parameters:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `mssv` | string | ✓ | Mã số sinh viên |
| `page` | int | | Số trang. Default: `0` |
| `size` | int | | Số phần tử/trang. Default: `20` |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "content": [
      {
        "maLog": "LS001",
        "maHoSo": "HS001",
        "mssv": "B23DCCN001",
        "tenGiayTo": "Giấy khai sinh",
        "hanhDong": "Cập nhật trạng thái",
        "trangThaiCu": "Chưa nộp",
        "trangThaiMoi": "Đã nộp",
        "ghiChu": null,
        "nguoiThucHien": "Kieuvanson",
        "ngayThucHien": "2026-09-28T10:35:00.123456"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1,
    "first": true,
    "last": true
  },
  "timestamp": "2026-09-28T10:40:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 403 | `FORBIDDEN` | STAFF cố xem lịch sử người khác |

**Ví dụ test:**

```bash
curl -X GET "http://localhost:8081/api/lich-su-nop?mssv=B23DCCN001&page=0&size=10" \
  -H "Authorization: Bearer <token>"
```

---

### 8.2. `GET /api/lich-su-nop/ho-so/{maHoSo}`

Lấy lịch sử nộp giấy tờ theo mã hồ sơ.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": [
    {
      "maLog": "LS001",
      "maHoSo": "HS001",
      "mssv": "B23DCCN001",
      "tenGiayTo": "Giấy khai sinh",
      "hanhDong": "Cập nhật trạng thái",
      "trangThaiCu": "Chưa nộp",
      "trangThaiMoi": "Đã nộp",
      "ghiChu": null,
      "nguoiThucHien": "Kieuvanson",
      "ngayThucHien": "2026-09-28T10:35:00.123456"
    }
  ],
  "timestamp": "2026-09-28T10:40:00.123Z"
}
```

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/lich-su-nop/ho-so/HS001 \
  -H "Authorization: Bearer <token>"
```

---

### 8.3. `GET /api/lich-su-nop/{maLog}`

Lấy chi tiết một bản ghi lịch sử.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": {
    "maLog": "LS001",
    "maHoSo": "HS001",
    "mssv": "B23DCCN001",
    "tenGiayTo": "Giấy khai sinh",
    "hanhDong": "Cập nhật trạng thái",
    "trangThaiCu": "Chưa nộp",
    "trangThaiMoi": "Đã nộp",
    "ghiChu": null,
    "nguoiThucHien": "Kieuvanson",
    "ngayThucHien": "2026-09-28T10:35:00.123456"
  },
  "timestamp": "2026-09-28T10:40:00.123Z"
}
```

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Không tìm thấy bản ghi |

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/lich-su-nop/LS001 \
  -H "Authorization: Bearer <token>"
```

---

## 9. Endpoints — Module Phiếu Xuất Hồ Sơ (`/api/phieu-muon`)

> Phiếu dùng chung cho **Mượn tạm thời** và **Rút hồ sơ vĩnh viễn**, phân biệt qua `loaiPhieu`.
> Trạng thái ENUM: `Chờ duyệt` · `Đã duyệt` · `Từ chối` · `Đang mượn` · `Đã trả` · `Quá hạn` · `Hoàn tất`.

### 9.0. Bảng tổng hợp

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/phieu-muon/dang-muon` | Auth | Danh sách phiếu đang hoạt động (có phân trang) |
| `GET` | `/api/phieu-muon/lich-su` | Auth | Lịch sử mượn / trả (tất cả trạng thái) |
| `GET` | `/api/phieu-muon/by-mssv/{mssv}` | Auth | Phiếu đang hoạt động của 1 SV |
| `GET` | `/api/phieu-muon/{maPhieu}` | Auth | Chi tiết 1 phiếu |
| `POST` | `/api/phieu-muon` | ADMIN, STAFF | Tạo phiếu mới |
| `PUT` | `/api/phieu-muon/{maPhieu}/duyet` | ADMIN, STAFF | Duyệt phiếu |
| `PUT` | `/api/phieu-muon/{maPhieu}/tu-choi` | ADMIN, STAFF | Từ chối phiếu |
| `PUT` | `/api/phieu-muon/{maPhieu}/tra` | ADMIN, STAFF | Trả hồ sơ |

---

### 9.1. `GET /api/phieu-muon/dang-muon`

Lấy danh sách phiếu đang hoạt động (mặc định hiển thị cả `Chờ duyệt` + `Đang mượn` + `Quá hạn`, sắp xếp ưu tiên Quá hạn → Đang mượn → Chờ duyệt).

**Auth yêu cầu:** Có access token hợp lệ.

**Query parameters:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `keyword` | string | | Tìm theo mã phiếu / MSSV / họ tên / lý do |
| `trangThai` | string | | Lọc theo 1 trạng thái cụ thể (bỏ trống = lấy tất cả đang hoạt động) |
| `loaiHoSo` | string | | `Mượn tạm thời` / `Rút vĩnh viễn` |
| `page` | int | | Default `0` |
| `size` | int | | Default `10` |

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Lấy danh sách hồ sơ đang mượn thành công",
  "data": {
    "data": [
      {
        "maPhieu": "PM001",
        "mssv": "B23DCCN001",
        "hoTenSinhVien": "Nguyễn Văn An",
        "loaiPhieu": "Mượn tạm thời",
        "trangThai": "Đang mượn",
        "ngayMuon": "2026-10-01T00:00:00",
        "ngayTraDuKien": "2026-10-15T00:00:00",
        "ngayTraThucTe": null,
        "lyDo": "Xét duyệt hồ sơ",
        "ghiChu": null,
        "nguoiTao": "Kieuvanson",
        "ngayTao": "2026-10-01T09:00:00",
        "danhSachMaHoSo": ["HS001", "HS002"]
      }
    ],
    "page": { "page": 0, "size": 10, "totalElements": 8, "totalPages": 1, "first": true, "last": true }
  },
  "timestamp": "2026-10-03T17:00:00.000Z"
}
```

**Ví dụ test:**

```bash
# Mặc định: tất cả phiếu đang hoạt động
curl -X GET "http://localhost:8081/api/phieu-muon/dang-muon" \
  -H "Authorization: Bearer <token>"

# Lọc theo trạng thái
curl -X GET "http://localhost:8081/api/phieu-muon/dang-muon?trangThai=Ch%E1%BB%9D%20duy%E1%BB%87t" \
  -H "Authorization: Bearer <token>"
```

---

### 9.2. `GET /api/phieu-muon/lich-su`

Lấy lịch sử mượn / trả toàn hệ thống (không filter trạng thái mặc định — trả về tất cả).

**Auth yêu cầu:** Có access token hợp lệ.

**Query parameters:**

| Param | Type | Mô tả |
|---|---|---|
| `keyword` | string | Tìm theo mã phiếu / MSSV / họ tên / lý do |
| `trangThai` | string | Lọc theo trạng thái |
| `loaiHoSo` | string | `Mượn tạm thời` / `Rút vĩnh viễn` |
| `fromDate` | string | Từ ngày (`yyyy-MM-dd`) |
| `toDate` | string | Đến ngày (`yyyy-MM-dd`) |
| `page`, `size` | int | Phân trang |

**Response `200 OK`:** cùng shape với `dang-muon`.

**Ví dụ test:**

```bash
curl -X GET "http://localhost:8081/api/phieu-muon/lich-su?fromDate=2026-10-01&toDate=2026-10-31" \
  -H "Authorization: Bearer <token>"
```

---

### 9.3. `GET /api/phieu-muon/by-mssv/{mssv}`

Lấy danh sách phiếu **đang hoạt động** (Chờ duyệt / Đang mượn / Quá hạn) của 1 sinh viên cụ thể. Dùng cho trang chi tiết hồ sơ SV.

**Auth yêu cầu:** Có access token hợp lệ.

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Lấy danh sách phiếu đang hoạt động của sinh viên thành công",
  "data": [
    {
      "maPhieu": "PM005",
      "mssv": "B23DCCN001",
      "hoTenSinhVien": "Nguyễn Văn An",
      "loaiPhieu": "Mượn tạm thời",
      "trangThai": "Chờ duyệt",
      "ngayMuon": "2026-10-03T00:00:00",
      "ngayTraDuKien": "2026-10-10T00:00:00",
      "danhSachMaHoSo": ["HS001"]
    }
  ],
  "timestamp": "2026-10-03T17:00:00.000Z"
}
```

**Ví dụ test:**

```bash
curl -X GET http://localhost:8081/api/phieu-muon/by-mssv/B23DCCN001 \
  -H "Authorization: Bearer <token>"
```

---

### 9.4. `GET /api/phieu-muon/{maPhieu}`

Lấy chi tiết 1 phiếu.

**Auth yêu cầu:** Có access token hợp lệ.

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Mã phiếu không tồn tại |

---

### 9.5. `POST /api/phieu-muon`

Tạo phiếu mượn tạm thời / rút vĩnh viễn. Trạng thái khởi tạo = `Chờ duyệt`.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Request body:**

```json
{
  "mssv": "B23DCCN001",
  "loaiPhieu": "Mượn tạm thời",
  "ngayMuon": "2026-10-03",
  "ngayTraDuKien": "2026-10-17",
  "lyDo": "Cán bộ xét duyệt hồ sơ tốt nghiệp",
  "ghiChu": "Ưu tiên xử lý trước 10/10",
  "danhSachMaHoSo": ["HS001", "HS003", "HS007"]
}
```

| Field | Type | Required | Ràng buộc |
|---|---|---|---|
| `mssv` | string | ✓ | Phải tồn tại trong `SINHVIEN` |
| `loaiPhieu` | string | ✓ | `Mượn tạm thời` / `Rút vĩnh viễn` |
| `ngayMuon` | string | ✓ | ISO `yyyy-MM-dd` |
| `ngayTraDuKien` | string | | Bắt buộc với `Mượn tạm thời` |
| `lyDo` | string | ✓ | Không được trống |
| `ghiChu` | string | | |
| `danhSachMaHoSo` | string[] | ✓ | Danh sách `maHoSo` thuộc về SV |

**Quy tắc nghiệp vụ (enforce ở Service):**

- **Rút vĩnh viễn**: không cho tạo nếu còn phiếu Mượn `Đang mượn` chưa trả. Luôn áp dụng **toàn bộ** giấy tờ hiện có của SV (client không cần gửi `danhSachMaHoSo`).
- **Mượn tạm thời**: không cho tạo khi SV `trangThaiHocVu = 'Đã rút hồ sơ'`.
- Mỗi `maHoSo` chỉ xuất hiện trong 1 phiếu `Đang mượn` tại 1 thời điểm.

**Response `201 Created`:** payload `PhieuMuonResponse` (giống shape ở `GET`).

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu field / sai enum |
| 404 | `NOT_FOUND` | MSSV không tồn tại |
| 409 | (custom) | SV đang bị rút hồ sơ; còn phiếu mượn chưa trả; maHoSo đang nằm trong phiếu khác |

**Ví dụ test:**

```bash
curl -X POST http://localhost:8081/api/phieu-muon \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mssv": "B23DCCN001",
    "loaiPhieu": "Mượn tạm thời",
    "ngayMuon": "2026-10-03",
    "ngayTraDuKien": "2026-10-17",
    "lyDo": "Xét duyệt hồ sơ",
    "danhSachMaHoSo": ["HS001", "HS003"]
  }'
```

---

### 9.6. `PUT /api/phieu-muon/{maPhieu}/duyet`

Duyệt phiếu: `Chờ duyệt` → `Đang mượn` (Mượn tạm) hoặc `Hoàn tất` + cập nhật `TrangThaiHocVu = 'Đã rút hồ sơ'` (Rút vĩnh viễn).

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Response `200 OK`:** `ApiResponse<PhieuMuonResponse>` với `trangThai` mới.

**Lỗi có thể gặp:**

| Status | Code | Khi nào |
|---|---|---|
| 404 | `NOT_FOUND` | Mã phiếu không tồn tại |
| 409 | (custom) | Phiếu không ở trạng thái `Chờ duyệt` |

---

### 9.7. `PUT /api/phieu-muon/{maPhieu}/tu-choi`

Từ chối phiếu: `Chờ duyệt` → `Từ chối`. Lưu lý do vào `ghiChu`.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Request body (optional):**

```json
{ "lyDoTuChoi": "Thiếu giấy tờ bắt buộc HS001" }
```

**Response `200 OK`:** `ApiResponse<PhieuMuonResponse>`.

---

### 9.8. `PUT /api/phieu-muon/{maPhieu}/tra`

Trả hồ sơ: `Đang mượn` → `Đã trả` (Mượn tạm) hoặc `Hoàn tất` (Rút vĩnh viễn). Set `ngayTraThucTe = hôm nay`.

**Auth yêu cầu:** `ADMIN` hoặc `STAFF`.

**Request body (optional):**

```json
{ "ghiChu": "Trả đầy đủ 3/3 hồ sơ" }
```

**Response `200 OK`:** `ApiResponse<PhieuMuonResponse>`.

---

## 10. Bảng mã lỗi tham chiếu nhanh

| HTTP | Code | Ý nghĩa | Frontend gợi ý |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Sai ràng buộc field | Hiển thị `errors[]` |
| 400 | `MALFORMED_JSON` | Body không phải JSON | "Body không hợp lệ" |
| 400 | `MISSING_PARAMETER` | Thiếu query/path param | "Thiếu tham số X" |
| 400 | `MISSING_PARAM` | Thiếu tham số bắt buộc | "Thiếu tham số X" |
| 400 | `INVALID_PARAMETER` | Sai kiểu dữ liệu param | "Tham số X sai định dạng" |
| 400 | `USERNAME_EXISTS` | Username đã tồn tại | "Tên đăng nhập đã được sử dụng" |
| 400 | `EMAIL_EXISTS` | Email đã được sử dụng | "Email đã được sử dụng" |
| 400 | `MSSV_NOT_FOUND` | MSSV không tồn tại | "Mã số sinh viên không tồn tại" |
| 401 | `UNAUTHORIZED` | Không có token | Gọi refresh → fail thì logout |
| 401 | `INVALID_CREDENTIALS` | Sai username/password | "Sai tài khoản hoặc mật khẩu" |
| 401 | `ACCOUNT_DISABLED` | Tài khoản bị khoá | "Tài khoản đã bị vô hiệu hoá" |
| 401 | `INSUFFICIENT_ROLE` | Role không đủ quyền | "Tài khoản không có quyền truy cập" |
| 401 | `NO_REFRESH_TOKEN` | Không có refresh token | Redirect về /login |
| 401 | `INVALID_REFRESH_TOKEN` | Token sai / hết hạn | Redirect về /login |
| 401 | `REFRESH_TOKEN_REVOKED` | Đã bị thu hồi / reuse | Redirect về /login |
| 401 | `USER_NOT_FOUND` | User không còn tồn tại | Redirect về /login |
| 403 | `FORBIDDEN` | Không đủ quyền | "Bạn không có quyền" |
| 403 | `NO_MSSV` | Staff chưa được gán MSSV | "Tài khoản chưa được gán MSSV" |
| 404 | `ENDPOINT_NOT_FOUND` | URL sai | "API không tồn tại" |
| 404 | `NOT_FOUND` | Resource không tồn tại | "Không tìm thấy" |
| 405 | `METHOD_NOT_ALLOWED` | Sai HTTP method | "Phương thức không hỗ trợ" |
| 409 | `ALREADY_EXISTS` | Resource đã tồn tại | "Đã tồn tại" |
| 429 | `TOO_MANY_REQUESTS` | Rate limit | Disable form, đếm ngược `Retry-After` |
| 500 | `INTERNAL_ERROR` | Lỗi hệ thống | "Lỗi hệ thống, thử lại sau" |

---

## 11. Luồng sử dụng mẫu cho Frontend

### 11.1. Login flow

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

### 11.2. Register flow (Staff)

```text
[UI] Admin nhập thông tin Staff mới (username, password, hoTen, email, mssv)
  ↓
[FE] POST /api/auth/register
  ↓
[BE] Tạo user + gán mssv → trả 200 + cookie
  ↓
[FE] Lưu token + user info → redirect
```

### 11.3. Auto-refresh khi access token hết hạn

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

### 11.4. Logout flow

```text
[UI] User click "Đăng xuất"
  ↓
[FE] POST /api/auth/logout (cookie tự gửi)
  ↓
[BE] Revoke refresh token + clear cookie
  ↓
[FE] Xoá accessToken khỏi memory → Redirect /login
```

### 11.5. Ví dụ axios config (React/Vue)

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

## 11. Test nhanh bằng curl

```bash
# 1. Login — lưu cookie vào cookies.txt
curl -i -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Kieuvanson","password":"332003"}' \
  -c cookies.txt

# 2. Thông tin user hiện tại
curl -X GET http://localhost:8081/api/users/me \
  -H "Authorization: Bearer <token>"

# 3. Danh sách sinh viên
curl -X GET http://localhost:8081/api/sinh-vien \
  -H "Authorization: Bearer <token>"

# 4. Chi tiết sinh viên
curl -X GET http://localhost:8081/api/sinh-vien/B23DCCN001 \
  -H "Authorization: Bearer <token>"

# 5. Thống kê sinh viên
curl -X GET http://localhost:8081/api/sinh-vien/stats \
  -H "Authorization: Bearer <token>"

# 6. Tìm kiếm sinh viên
curl -X GET "http://localhost:8081/api/sinh-vien?keyword=An" \
  -H "Authorization: Bearer <token>"

# 7. Danh sách loại giấy tờ
curl -X GET http://localhost:8081/api/loai-giay-to \
  -H "Authorization: Bearer <token>"

# 8. Loại giấy tờ bắt buộc
curl -X GET http://localhost:8081/api/loai-giay-to/bat-buoc \
  -H "Authorization: Bearer <token>"

# 9. Thống kê loại giấy tờ
curl -X GET http://localhost:8081/api/loai-giay-to/stats \
  -H "Authorization: Bearer <token>"

# 10. Hồ sơ giấy tờ theo MSSV
curl -X GET "http://localhost:8081/api/ho-so-giay-to?mssv=B23DCCN001" \
  -H "Authorization: Bearer <token>"

# 11. Thống kê hồ sơ giấy tờ
curl -X GET "http://localhost:8081/api/ho-so-giay-to/stats?mssv=B23DCCN001" \
  -H "Authorization: Bearer <token>"

# 12. Tạo hồ sơ giấy tờ mới
curl -X POST "http://localhost:8081/api/ho-so-giay-to?mssv=B23DCCN001&maLoai=GT01" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"trangThaiNop":"Chưa nộp","viTriLuuKho":"Kệ A1-01"}'

# 13. Cập nhật trạng thái (tạo lịch sử)
curl -X PATCH "http://localhost:8081/api/ho-so-giay-to/HS001/trang-thai?trangThaiMoi=%C4%90%C3%A3%20n%E1%BB%99p" \
  -H "Authorization: Bearer <token>"

# 14. Lịch sử nộp theo MSSV
curl -X GET "http://localhost:8081/api/lich-su-nop?mssv=B23DCCN001" \
  -H "Authorization: Bearer <token>"

# 15. Lịch sử nộp theo mã hồ sơ
curl -X GET http://localhost:8081/api/lich-su-nop/ho-so/HS001 \
  -H "Authorization: Bearer <token>"

# 16. Refresh token — gửi cookie từ file
curl -i -X POST http://localhost:8081/api/auth/refresh \
  -b cookies.txt -c cookies.txt

# 17. Logout
curl -i -X POST http://localhost:8081/api/auth/logout \
  -b cookies.txt -c cookies.txt

# 18. Xuất danh sách sinh viên ra Excel (toàn bộ kết quả lọc)
curl -o danh-sach-sinh-vien.xlsx \
  -X GET "http://localhost:8081/api/sinh-vien/export?scope=filtered" \
  -H "Authorization: Bearer <token>"

# 19. Tải file Excel mẫu để import
curl -o mau-import-sinh-vien.xlsx \
  -X GET http://localhost:8081/api/sinh-vien/import-template \
  -H "Authorization: Bearer <token>"

# 20. Import sinh viên từ file Excel
curl -X POST http://localhost:8081/api/sinh-vien/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@danh-sach-sinh-vien.xlsx"
```

---

## 12. Quy tắc cho Frontend

- **Không lưu `accessToken` vào localStorage / sessionStorage** — chỉ giữ trong memory (state / ref). Token có thể bị XSS đánh cắp nếu lưu persistent storage.
- **Bật `withCredentials: true`** cho mọi request tới backend (axios) hoặc `credentials: 'include'` (fetch).
- **Không tự đổi `Refresh-Token`** ở client — đó là server-side rotation.
- **Không parse `message`** để phân nhánh logic — dùng `code`.
- **Không retry** với status `400`, `409`, `429` — chỉ retry `5xx` tối đa 1 lần.
- **Không tự suy đoán kết quả** thay đổi trạng thái (tick giấy, tạo phiếu...) — luôn chờ response từ backend để cập nhật UI.
- **Mọi endpoint protected cần `Authorization: Bearer <token>`**, trừ `/api/auth/**`.
- **STAFF chỉ xem dữ liệu của chính mình** — backend tự kiểm tra và trả 403 nếu cố truy cập người khác.

---

## 13. Tài liệu liên quan

- `AGENTS.md` (root) — tổng quan dự án, ERD, business rules
- `backend/AGENTS.md` — engineering guide cho backend
- `backend/API.md` — backend engineering reference
- `backend/.env.example` — danh sách biến môi trường
- `frontend/README-IMPORT-EXPORT-SINHVIEN.md` — hướng dẫn người dùng tạo file Excel cho trang Danh sách sinh viên
