# VWA EduRecords — Backend API Reference

> Tài liệu hợp đồng API góc nhìn backend engineer. Đối với frontend, đọc bản
> chi tiết hơn ở [`/API.md`](../API.md).
>
> Khi thêm / sửa endpoint public, phải cập nhật **cả 2 file** trong cùng commit.

## 1. Trạng thái triển khai

| Module | Controller | Endpoints | Trạng thái |
|---|---|---|---|
| **Auth** | `AuthController` | 3 | ✅ Đã triển khai |
| Sinh viên (`/api/v1/students`) | — | — | 🔜 MVP |
| Hồ sơ giấy tờ | — | — | 🔜 MVP |
| Mượn — Trả — Rút | — | — | 🔜 MVP |
| Lịch sử & Audit | — | — | 🔜 MVP |

## 2. Stack

| | |
|---|---|
| Backend | Spring Boot `4.1.1`, Java 25, Maven Wrapper |
| Persistence | Spring Data JPA + H2 (dev) / PostgreSQL (prod) |
| Auth | JWT HS256, Redis revocation list |
| Cache / Revocation | Redis (`localhost:6379` mặc định) |
| Validation | Jakarta Bean Validation |
| Error handling | `@RestControllerAdvice` tập trung → `ErrorResponse` thống nhất |
| Rate limit | In-memory sliding window cho `/login` (5/60s/IP) |
| Audit | SLF4J logger `AUDIT` |

## 3. Quy ước

### URL
- Base: `/api`
- Module Auth dùng `/api/auth/**` (legacy, không có version)
- Module nghiệp vụ dùng `/api/v1/<resource>` (versioned)

### HTTP status

| Status | Dùng khi |
|---|---|
| `200 OK` | Read / update thành công |
| `201 Created` | Tạo resource mới |
| `204 No Content` | Thành công, không có body (ít dùng) |
| `400 Bad Request` | Validate fail, JSON lỗi, param sai |
| `401 Unauthorized` | Token sai / hết hạn / bị thu hồi |
| `403 Forbidden` | Đúng token nhưng thiếu quyền |
| `404 Not Found` | Resource không tồn tại |
| `409 Conflict` | Vi phạm business rule / trạng thái |
| `429 Too Many Requests` | Rate limit |
| `500 Internal Server Error` | Lỗi ngoài dự kiến (đã log stack trace) |

### Response envelope

| Thành công | Lỗi |
|---|---|
| `ApiResponse<T>` (`success=true`, `data`) | `ErrorResponse` (`success=false`, `code`, `errors[]` optional) |

Xem chi tiết payload ở [`/API.md` §1](../API.md#1-response-thống-nhất).

### Error codes

Enum-like string ổn định. Đăng ký mã mới phải cập nhật docs.

| Nhóm | Codes |
|---|---|
| Auth | `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `INSUFFICIENT_ROLE`, `MISSING_REFRESH_TOKEN`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REVOKED`, `USER_NOT_FOUND` |
| Request | `VALIDATION_ERROR`, `MALFORMED_JSON`, `MISSING_PARAMETER`, `INVALID_PARAMETER` |
| System | `UNAUTHORIZED`, `FORBIDDEN`, `ENDPOINT_NOT_FOUND`, `METHOD_NOT_ALLOWED`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR` |

## 4. Endpoints đã triển khai

### 4.1. `POST /api/auth/login`

| | |
|---|---|
| Controller | `AuthController#login` |
| Service | `AuthService#login` |
| Auth | Public (rate-limited 5/60s/IP) |
| Body | `LoginRequest(username, password)` |
| Response | `ApiResponse<AuthResponse>` + `Set-Cookie: refresh_token` |
| Side effects | Tạo family ID mới, ghi `AUDIT` event=LOGIN |
| Errors | `VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `ACCOUNT_DISABLED` (401), `INSUFFICIENT_ROLE` (401), `TOO_MANY_REQUESTS` (429) |

### 4.2. `POST /api/auth/refresh`

| | |
|---|---|
| Controller | `AuthController#refresh` |
| Service | `AuthService#refresh` |
| Auth | Cookie `refresh_token` hoặc body `RefreshTokenRequest` |
| Response | `ApiResponse<AuthResponse>` + `Set-Cookie` rotated |
| Side effects | Revoke old `jti` trong Redis, cấp cặp mới với cùng `fid`, ghi `AUDIT` event=REFRESH |
| Errors | `MISSING_REFRESH_TOKEN` (401), `INVALID_REFRESH_TOKEN` (401), `REFRESH_TOKEN_REVOKED` (401), `USER_NOT_FOUND` (401), `ACCOUNT_DISABLED` (401), `INSUFFICIENT_ROLE` (401) |

### 4.3. `POST /api/auth/logout`

| | |
|---|---|
| Controller | `AuthController#logout` |
| Service | `AuthService#logout` |
| Auth | Optional (luôn trả 200) |
| Response | `ApiResponse<Void>` + clear cookie |
| Side effects | Revoke `jti` + `fid` trong Redis, ghi `AUDIT` event=LOGOUT |

## 5. Endpoints dự kiến (chưa triển khai)

> Khi bắt đầu implement, chuyển từng endpoint xuống §4 với đầy đủ thông tin.

Xem chi tiết ở [`/API.md` §5](../API.md#5-endpoints--dự-kiến-mvp-chưa-có).

## 6. Token management (Redis)

Key schema:

```
revoked:jti:<jti>           -> "1"   TTL = thời gian còn lại của refresh token
revoked:family:<familyId>   -> "1"   TTL = refresh token TTL
```

Service: `TokenRevocationService`. Được inject vào `AuthService` để:
- Sau refresh: revoke `jti` cũ
- Sau logout: revoke `jti` + `fid`
- Khi phát hiện reuse: revoke toàn bộ `fid`

JWT signing key = SHA-256(`app.security.jwt.secret`), luôn 32 bytes dù secret ngắn.

## 7. Checklist khi thêm endpoint mới

- [ ] Tạo controller theo layer, không trả entity JPA
- [ ] Dùng DTO riêng cho request / response
- [ ] `@Valid` cho body, validate kiểu dữ liệu
- [ ] Business rule ở Service, throw `ApiException` / subclass
- [ ] `@Transactional` ở ranh giới use case
- [ ] Ghi `AUDIT` nếu thao tác nhạy cảm (thay đổi trạng thái, quyền)
- [ ] Thêm test Service (rule + nhánh lỗi) và test Controller (status, validation)
- [ ] Cập nhật cả `/API.md` và `backend/API.md`
- [ ] Chạy `.\mvnw.cmd test` pass

## 8. Tài liệu liên quan

- [`/API.md`](../API.md) — API doc cho frontend (chi tiết, ví dụ curl, axios)
- [`AGENTS.md`](../AGENTS.md) (root) — tổng quan dự án
- [`backend/AGENTS.md`](AGENTS.md) — backend engineering guide
- `backend/.env.example` — biến môi trường
