# VWA EduRecords — Backend API Reference

> Tài liệu hợp đồng API góc nhìn backend engineer. Đối với frontend, đọc bản
> chi tiết hơn ở [`/API.md`](../API.md) (kèm ví dụ curl/axios).
>
> **Khi thêm / sửa endpoint public, phải cập nhật cả 2 file trong cùng commit.**

---

## 1. Trạng thái triển khai

| Module | Controller | Endpoints | Trạng thái |
|---|---|---|---|
| **Auth** (`/api/auth`) | `AuthController` | 5 | ✅ Hoàn thiện |
| **User** (`/api/users`) | `UserController` | 2 | ✅ Hoàn thiện (`/me` + placeholder list) |
| **Sinh Viên** (`/api/sinh-vien`) | `SinhVienController` | 8 | ✅ Tìm kiếm / thống kê / export / import Excel. CRUD sinh viên còn là placeholder |
| **Loại Giấy Tờ** (`/api/loai-giay-to`) | `LoaiGiayToController` | 4 | ✅ Read-only (seed qua Flyway) |
| **Hồ Sơ Giấy Tờ** (`/api/ho-so-giay-to`) | `HoSoGiayToController` | 7 | ✅ Đầy đủ CRUD + cập nhật trạng thái (auto ghi `LICHSUNOP`) |
| **Lịch Sử Nộp** (`/api/lich-su-nop`) | `LichSuNopController` | 3 | ✅ Read-only (audit trail) |
| **Phiếu Xuất Hồ Sơ** (`/api/phieu-muon`) | `PhieuXuatHoSoController` | 8 | ✅ Mượn/Trả/Rút + Duyệt/Từ chối |

---

## 2. Stack

| Thành phần | Chi tiết |
|---|---|
| Backend | Spring Boot `4.1.1`, Java 25, Maven Wrapper |
| Persistence | Spring Data JPA + PostgreSQL 18 |
| Migration | Flyway (`backend/src/main/resources/db/migration`) |
| Auth | JWT HS256 (JJWT 0.12.6), Redis revocation list |
| Cache / Revocation | Redis 6379 |
| Validation | Jakarta Bean Validation |
| Error handling | `@RestControllerAdvice` → `ErrorResponse` thống nhất |
| Rate limit | In-memory sliding window cho `/login` (5 / 60s / IP) |
| Audit | SLF4J logger `AUDIT` |

---

## 3. Quy ước

### URL

- Base: `/api`
- Module Auth dùng `/api/auth/**`
- Module nghiệp vụ dùng `/api/<ten-module>` (chưa versioned theo `v1`)

### HTTP status

| Status | Dùng khi |
|---|---|
| `200 OK` | Read / update thành công |
| `201 Created` | Tạo resource mới |
| `400 Bad Request` | Validate fail, JSON lỗi, param sai |
| `401 Unauthorized` | Token sai / hết hạn / bị thu hồi |
| `403 Forbidden` | Đúng token nhưng thiếu quyền |
| `404 Not Found` | Resource không tồn tại |
| `409 Conflict` | Vi phạm business rule / trạng thái |
| `429 Too Many Requests` | Rate limit |
| `500 Internal Server Error` | Lỗi ngoài dự kiến |

### Response envelope

Mọi response (kể cả lỗi) đều dùng envelope thống nhất — xem chi tiết ở [`/API.md` §1](../API.md#1-response-thống-nhất).

| Thành công | Lỗi |
|---|---|
| `ApiResponse<T>` (`success=true`, `data`) | `ErrorResponse` (`success=false`, `code`, `errors[]` optional) |

### Authorization

- Dùng `@PreAuthorize("hasRole('ADMIN')")` hoặc `hasAnyRole('ADMIN', 'STAFF')` trên method controller.
- Hầu hết endpoint hiện tại yêu cầu `ADMIN`. Module Phiếu xuất hồ sơ cho phép cả `ADMIN` lẫn `STAFF`.
- STAFF có một số giới hạn nghiệp vụ (xem [`AGENTS.md`](../AGENTS.md)).

### Error codes

Enum-like string ổn định. Khi đăng ký mã mới, cập nhật docs.

| Nhóm | Codes |
|---|---|
| Auth | `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `INSUFFICIENT_ROLE`, `MISSING_REFRESH_TOKEN` / `NO_REFRESH_TOKEN`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REVOKED`, `USER_NOT_FOUND` |
| Request | `VALIDATION_ERROR`, `MALFORMED_JSON`, `MISSING_PARAMETER` / `MISSING_PARAM`, `INVALID_PARAMETER`, `NOT_FOUND`, `ALREADY_EXISTS`, `USERNAME_EXISTS`, `EMAIL_EXISTS`, `MSSV_NOT_FOUND` |
| System | `UNAUTHORIZED`, `FORBIDDEN`, `ENDPOINT_NOT_FOUND`, `METHOD_NOT_ALLOWED`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR` |

---

## 4. Module Auth (`/api/auth`)

> `AuthController` → `AuthService` → `TokenRevocationService` (Redis) → `UserRepository`
>
> Access token: HS256, TTL 1h, lưu `jti` (revocation) + `fid` (family) + `role`/`username`/`mssv` claims.
> Refresh token: TTL 7d, lưu HttpOnly cookie `refresh_token` (Path `/api/auth/refresh`).

### 4.1. `POST /api/auth/login`

| | |
|---|---|
| Auth | Public (rate-limited 5 / 60s / IP) |
| Body | `LoginRequest(username, password)` |
| Response | `ApiResponse<AuthResponse>` + `Set-Cookie: refresh_token` |
| Side effects | Tạo `fid` mới, ghi `AUDIT event=LOGIN` |
| Errors | `VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `ACCOUNT_DISABLED` (401), `INSUFFICIENT_ROLE` (401), `TOO_MANY_REQUESTS` (429) |

### 4.2. `POST /api/auth/register`

| | |
|---|---|
| Auth | Public (dùng để seed STAFF, gán `mssv` nếu muốn) |
| Body | `RegisterRequest(username, password, hoTen, email, mssv?)` |
| Response | `ApiResponse<AuthResponse>` + `Set-Cookie` |
| Side effects | Tạo user với role `STAFF` (mặc định), ghi `AUDIT event=REGISTER` |
| Errors | `VALIDATION_ERROR` (400), `USERNAME_EXISTS` (400), `EMAIL_EXISTS` (400), `MSSV_NOT_FOUND` (400) |

### 4.3. `POST /api/auth/refresh`

| | |
|---|---|
| Auth | Cookie `refresh_token` (ưu tiên) hoặc body `RefreshTokenRequest` |
| Response | `ApiResponse<AuthResponse>` + `Set-Cookie` rotated |
| Side effects | Revoke old `jti` trong Redis, cấp cặp token mới cùng `fid`, ghi `AUDIT event=REFRESH` |
| Errors | `MISSING_REFRESH_TOKEN` / `NO_REFRESH_TOKEN` (401), `INVALID_REFRESH_TOKEN` (401), `REFRESH_TOKEN_REVOKED` (401), `USER_NOT_FOUND` (401), `ACCOUNT_DISABLED` (401), `INSUFFICIENT_ROLE` (401) |

### 4.4. `POST /api/auth/logout`

| | |
|---|---|
| Auth | Optional (luôn trả 200) |
| Response | `ApiResponse<Map<String, String>>` + clear cookie |
| Side effects | Revoke `jti` + `fid` trong Redis, ghi `AUDIT event=LOGOUT` |

### 4.5. `POST /api/auth/encode-password`

| | |
|---|---|
| Auth | Public (utility dev) |
| Body | `{ "password": "..." }` |
| Response | Raw JSON `{ "bcryptHash": "$2a$10$..." }` (không qua envelope) |

---

## 5. Module User (`/api/users`)

> `UserController` → `UserRepository`

### 5.1. `GET /api/users/me`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<UserResponse>` |
| Errors | `UNAUTHORIZED` (401), `NOT_FOUND` (404) |

### 5.2. `GET /api/users`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | Placeholder `"Tính năng đang phát triển"` |

---

## 6. Module Sinh Viên (`/api/sinh-vien`)

> `SinhVienController` → `SinhVienService` → `SinhVienRepository` (Specification + native query)

### 6.1. `GET /api/sinh-vien`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `keyword`, `trangThaiHocVu`, `nganh`, `lop`, `khoaNamNhapHoc`, `khoa`, `heDaoTao`, `page`, `size`, `sortDirection` |
| Response | `ApiResponse<PagedResponse<List<SinhVien>>>` |
| Lỗi | 400 (trangThaiHocVu không cast được ENUM), 401, 403 |

**Chi tiết query param:**

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `keyword` | string | — | LIKE họ tên hoặc MSSV, không phân biệt hoa thường |
| `trangThaiHocVu` | string | — | Cần `CAST()` sang ENUM `trangthaihocvu` |
| `nganh` | string | — | Lọc theo ngành |
| `lop` | string | — | Lọc theo lớp |
| `khoaNamNhapHoc` | string | — | Lọc theo khóa/năm nhập học |
| `khoa` | string | — | Lọc theo khoa |
| `heDaoTao` | string | — | Lọc theo hệ đào tạo |
| `page` | int | `0` | Số trang (bắt đầu từ 0) |
| `size` | int | `10` | Số phần tử/trang (max 100) |
| `sortDirection` | int | `0` | `0` = mới nhất trước, `1` = cũ nhất trước |

> Tất cả filter áp dụng đồng thời (AND). Không có ưu tiên — mọi param cùng tham gia WHERE clause.

### 6.2. `GET /api/sinh-vien/{mssv}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<SinhVien>` — 200 nếu tìm thấy, 404 nếu không |
| Lỗi | 401, 403, 404 |

### 6.3. `GET /api/sinh-vien/stats`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<Map<String, Object>>` — keys: `tongSoSinhVien`, `dangHoc`, `totNghiep`, `baoLuu`, `dinhChi`, `daRutHoSo` |
| Lỗi | 401, 403 |

### 6.4. `GET /api/sinh-vien/export`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | (giống `GET /api/sinh-vien`) + `scope` ∈ {`filtered`, `page`} (default `filtered`, max 10 000 dòng) |
| Response | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="danh-sach-sinh-vien-<timestamp>.xlsx"` |
| File | 14 cột: MSSV, Họ tên, Ngày sinh, Giới tính, CCCD, SĐT, Email, Quê quán, Ngành, Lớp, Khóa, Khóa nhập học, Hệ đào tạo, Trạng thái học vụ |

### 6.5. `GET /api/sinh-vien/import-template`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | File `mau-import-sinh-vien.xlsx` (header 14 cột + 1 dòng ví dụ) |

### 6.6. `POST /api/sinh-vien/import`

| | |
|---|---|
| Auth | `ADMIN` |
| Body | `multipart/form-data`, field `file` (`.xlsx`/`.xls`, ≤ ~10 MB) |
| Quy tắc | Dòng trống bỏ qua. MSSV/ Họ tên trống → lỗi. Trạng thái không hợp lệ → mặc định `Đang học`. MSSV chưa có → tạo mới. MSSV đã có → cập nhật (giữ `ngayTao`) |
| Response | `ApiResponse<ImportResult>` — `{ successCount, failureCount, insertedCount, updatedCount, errors[] }` |
| Lỗi | 400 (`BAD_REQUEST` file rỗng/sai định dạng), 500 (`IMPORT_FAILED`) |

### 6.7. `POST /api/sinh-vien`, `PUT /api/sinh-vien/{mssv}`, `DELETE /api/sinh-vien/{mssv}`

> Hiện tại trả placeholder `"Tính năng đang phát triển"`. Khi triển khai sẽ chuyển sang dùng `SinhVienRequest` DTO + validate nghiệp vụ.

---

## 7. Module Loại Giấy Tờ (`/api/loai-giay-to`)

> `LoaiGiayToController` → `LoaiGiayToService` → `LoaiGiayToRepository`. Dữ liệu seed qua Flyway (`V2__seed_data.sql`), 13 loại (8 bắt buộc + 5 không bắt buộc).

### 7.1. `GET /api/loai-giay-to`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<List<LoaiGiayTo>>` (sắp xếp theo `thuTuHienThi`) |

### 7.2. `GET /api/loai-giay-to/bat-buoc`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<List<LoaiGiayTo>>` (chỉ loại `batBuoc = true`) |

### 7.3. `GET /api/loai-giay-to/{maLoai}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<LoaiGiayTo>` |
| Lỗi | 404 `NOT_FOUND` |

### 7.4. `GET /api/loai-giay-to/stats`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<{ tongSoLoai, soLoaiBatBuoc }>` |

---

## 8. Module Hồ Sơ Giấy Tờ (`/api/ho-so-giay-to`)

> `HoSoGiayToController` → `HoSoGiayToService` → `HoSoGiayToRepository`. Mỗi hồ sơ gắn với 1 SV (`mssv`) + 1 loại (`maLoai`).

### 8.1. `GET /api/ho-so-giay-to`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `mssv` (required) |
| Response | `ApiResponse<List<HoSoGiayTo>>` |

### 8.2. `GET /api/ho-so-giay-to/{maHoSo}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<HoSoGiayTo>` |
| Lỗi | 404 `NOT_FOUND` |

### 8.3. `GET /api/ho-so-giay-to/stats`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `mssv` (required) |
| Response | `ApiResponse<{ mssv, tongSo, daNop, chuaNop, thieu, khongHopLe }>` |

### 8.4. `POST /api/ho-so-giay-to`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `mssv`, `maLoai` (required) |
| Body | `HoSoGiayToRequest(trangThaiNop, banGocBanSao?, viTriLuuKho?, ghiChu?)` |
| Response | `ApiResponse<HoSoGiayTo>` (201) |
| Lỗi | 400 `VALIDATION_ERROR`, 404 `NOT_FOUND` (MSSV/maLoai), 409 `ALREADY_EXISTS` |

### 8.5. `PUT /api/ho-so-giay-to/{maHoSo}`

| | |
|---|---|
| Auth | `ADMIN` |
| Body | `HoSoGiayToRequest` |
| Response | `ApiResponse<HoSoGiayTo>` |
| Lỗi | 404 `NOT_FOUND` |

### 8.6. `PATCH /api/ho-so-giay-to/{maHoSo}/trang-thai`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `trangThaiMoi` (required: `Chưa nộp` / `Đã nộp` / `Thiếu` / `Không hợp lệ`), `ghiChu?` |
| Side effect | **Tự động tạo bản ghi `LICHSUNOP`** (audit trail) |
| Response | `ApiResponse<HoSoGiayTo>` |
| Lỗi | 400, 404 |

### 8.7. `DELETE /api/ho-so-giay-to/{maHoSo}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<Void>` |
| Lỗi | 404 `NOT_FOUND` |

---

## 9. Module Lịch Sử Nộp (`/api/lich-su-nop`)

> `LichSuNopController` → `LichSuNopService` → `LichSuNopRepository`. Bảng audit, chỉ INSERT, không UPDATE/DELETE.

### 9.1. `GET /api/lich-su-nop`

| | |
|---|---|
| Auth | `ADMIN` |
| Query | `mssv` (required), `page`, `size` (default 20) |
| Response | `ApiResponse<PagedResponse<List<LichSuNop>>>` |

### 9.2. `GET /api/lich-su-nop/ho-so/{maHoSo}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<List<LichSuNop>>` |

### 9.3. `GET /api/lich-su-nop/{maLog}`

| | |
|---|---|
| Auth | `ADMIN` |
| Response | `ApiResponse<LichSuNop>` |
| Lỗi | 404 `NOT_FOUND` |

---

## 10. Module Phiếu Xuất Hồ Sơ (`/api/phieu-muon`)

> `PhieuXuatHoSoController` → `PhieuXuatHoSoService` → `PhieuXuatHoSoRepository`. Dùng chung cho **Mượn tạm thời** và **Rút hồ sơ vĩnh viễn**; phân biệt qua `loaiPhieu`.
>
> Trạng thái ENUM: `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đang mượn`, `Đã trả`, `Quá hạn`, `Hoàn tất`.

### 10.1. `GET /api/phieu-muon/dang-muon`

| | |
|---|---|
| Auth | Authenticated (không yêu cầu role) |
| Query | `keyword?`, `trangThai?`, `loaiHoSo?`, `page` (default 0), `size` (default 10) |
| Mặc định | Khi `trangThai` rỗng → trả về **tất cả** phiếu đang hoạt động (`Chờ duyệt` + `Đang mượn` + `Quá hạn`) sắp xếp ưu tiên Quá hạn → Đang mượn → Chờ duyệt |
| Filter | Khi client gửi `trangThai` cụ thể → lọc theo giá trị đó (qua `findByFilters` cũ) |
| Response | `ApiResponse<PagedResponse<List<PhieuMuonResponse>>>` |

### 10.2. `GET /api/phieu-muon/lich-su`

| | |
|---|---|
| Auth | Authenticated |
| Query | `keyword?`, `trangThai?`, `loaiHoSo?`, `fromDate?`, `toDate?`, `page`, `size` |
| Response | `ApiResponse<PagedResponse<List<PhieuMuonResponse>>>` (tất cả trạng thái, kể cả đã đóng) |

### 10.3. `GET /api/phieu-muon/by-mssv/{mssv}`

| | |
|---|---|
| Auth | Authenticated |
| Response | `ApiResponse<List<PhieuMuonResponse>>` — các phiếu đang hoạt động của 1 SV (dùng cho trang chi tiết hồ sơ) |

### 10.4. `GET /api/phieu-muon/{maPhieu}`

| | |
|---|---|
| Auth | Authenticated |
| Response | `ApiResponse<PhieuMuonResponse>` |
| Lỗi | 404 `NOT_FOUND` |

### 10.5. `POST /api/phieu-muon`

| | |
|---|---|
| Auth | `ADMIN` hoặc `STAFF` |
| Body | `PhieuMuonRequest(mssv, loaiPhieu, ngayMuon, ngayTraDuKien?, lyDo, ghiChu?, danhSachMaHoSo[])` |
| Side effects | `nguoiTao` = user đang đăng nhập (lấy từ JWT). Trạng thái khởi tạo = `Chờ duyệt` |
| Ràng buộc | `Rút vĩnh viễn`: không cho tạo khi còn phiếu Mượn `Đang mượn` chưa trả; **luôn áp dụng toàn bộ** giấy tờ hiện có |
| Response | `ApiResponse<PhieuMuonResponse>` (201) |

### 10.6. `PUT /api/phieu-muon/{maPhieu}/duyet`

| | |
|---|---|
| Auth | `ADMIN` hoặc `STAFF` |
| Side effect | `Chờ duyệt` → `Đang mượn` (Mượn tạm) hoặc `Hoàn tất` + cập nhật `TrangThaiHocVu` = `Đã rút hồ sơ` (Rút vĩnh viễn) |
| Response | `ApiResponse<PhieuMuonResponse>` |

### 10.7. `PUT /api/phieu-muon/{maPhieu}/tu-choi`

| | |
|---|---|
| Auth | `ADMIN` hoặc `STAFF` |
| Body | `TuChoiRequest{ lyDoTuChoi? }` (optional) |
| Side effect | `Chờ duyệt` → `Từ chối` (lưu lý do vào `ghiChu`) |
| Response | `ApiResponse<PhieuMuonResponse>` |

### 10.8. `PUT /api/phieu-muon/{maPhieu}/tra`

| | |
|---|---|
| Auth | `ADMIN` hoặc `STAFF` |
| Body | `PhieuTraRequest{ ghiChu? }` (optional) |
| Side effect | `Đang mượn` → `Đã trả` (Mượn tạm) hoặc `Hoàn tất` (Rút vĩnh viễn). Set `ngayTraThucTe = hôm nay` |
| Response | `ApiResponse<PhieuMuonResponse>` |

---

## 11. Database entities (tham chiếu)

### 11.1. `SinhVien` — bảng `sinhvien`

| Field Java | Column DB | Type | Ghi chú |
|---|---|---|---|
| `mssv` | `mssv` | String | **PK** |
| `hoTen` | `ho_ten` | String | |
| `ngaySinh` | `ngay_sinh` | LocalDateTime | |
| `gioiTinh` | `gioi_tinh` | String | |
| `cccd` | `cccd` | String | unique |
| `sdt` | `sdt` | String | |
| `email` | `email` | String | |
| `queQuan` | `que_quan` | String | |
| `nganh` | `nganh` | String | |
| `lop` | `lop` | String | |
| `khoa` | `khoa` | String | |
| `khoaNamNhapHoc` | `khoa_nam_nhap_hoc` | String | |
| `heDaoTao` | `he_dao_tao` | String | |
| `trangThaiHocVu` | `trang_thai_hoc_vu` | String (DB ENUM `trangthaihocvu`) | `Đang học` / `Tốt nghiệp` / `Bảo lưu` / `Đình chỉ` / `Đã rút hồ sơ` |
| `ngayTao` | `ngay_tao` | LocalDateTime | |
| `ngayCapNhat` | `ngay_cap_nhat` | LocalDateTime | |

> Entity hiện được trả trực tiếp qua API. Khi cần format response riêng (che field, đổi tên), tách `SinhVienResponse` DTO.

### 11.2. `LoaiGiayTo` — bảng `loaigiayto`

`PK: maLoai` · `tenGiayTo` · `moTa` · `batBuoc` · `dangSuDung` · `thuTuHienThi` · `ngayTao`

### 11.3. `HoSoGiayTo` — bảng `hosogiayto`

`PK: maHoSo` · FK `mssv` → `sinhvien` · FK `maLoai` → `loaigiayto` · `trangThaiNop` · `banGocBanSao` · `fileDinhKem` · `viTriLuuKho` · `ghiChu` · `ngayTao` · `ngayCapNhat`

### 11.4. `LichSuNop` — bảng `lichsunop`

`PK: maLog` · FK `maHoSo` · `mssv` (denormalized để query nhanh) · `tenGiayTo` · `hanhDong` · `trangThaiCu` · `trangThaiMoi` · `ghiChu` · `nguoiThucHien` · `ngayThucHien`

### 11.5. `PhieuXuatHoSo` — bảng `phieu_xuat_ho_so`

`PK: maPhieu` · FK `mssv` · `loaiPhieu` (ENUM `Mượn tạm thời` / `Rút vĩnh viễn`) · `trangThai` (ENUM 7 giá trị) · `ngayMuon` · `ngayTraDuKien` · `ngayTraThucTe` · `lyDo` · `ghiChu` · `nguoiTao` · `ngayTao`

### 11.6. `ChiTietPhieu` — bảng `chitietphieu`

`PK: maCT` · FK `maPhieu` · FK `maHoSo` — many-to-many giữa phiếu và hồ sơ giấy tờ.

### 11.7. PostgreSQL ENUM types (đã định nghĩa trong `V1__init_schema.sql`)

```sql
CREATE TYPE trangthaihocvu AS ENUM ('Đang học', 'Bảo lưu', 'Đình chỉ', 'Tốt nghiệp', 'Đã rút hồ sơ');
CREATE TYPE trangthainop   AS ENUM ('Chưa nộp', 'Đã nộp', 'Thiếu', 'Không hợp lệ');
CREATE TYPE loaiban        AS ENUM ('Bản gốc', 'Bản sao');
CREATE TYPE loaiphieu      AS ENUM ('Mượn tạm thời', 'Rút vĩnh viễn');
CREATE TYPE trangthaiphieu AS ENUM ('Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đang mượn', 'Đã trả', 'Quá hạn', 'Hoàn tất');
CREATE TYPE user_role      AS ENUM ('ADMIN', 'STAFF');
```

> Native query với string param cần `CAST(:param AS <enum_type>)` — xem lỗi thường gặp trong `AGENTS.md` §11.

---

## 12. Token management (Redis)

Key schema:

```
revoked:jti:<jti>           → "1"   TTL = thời gian còn lại của refresh token
revoked:family:<familyId>   → "1"   TTL = refresh token TTL
```

Service: `TokenRevocationService`. Inject vào `AuthService`:
- Sau refresh: revoke `jti` cũ.
- Sau logout: revoke `jti` + `fid`.
- Khi phát hiện reuse (refresh token đã revoke được dùng lại): revoke **toàn bộ** `fid` → buộc login lại.

JWT signing key = SHA-256(`app.security.jwt.secret`), luôn 32 bytes dù secret ngắn.

---

## 13. Checklist khi thêm endpoint mới

- [ ] Tạo controller theo layer; **không trả entity JPA trực tiếp** (dùng DTO).
- [ ] `@Valid` cho body, validate kiểu dữ liệu + nghiệp vụ.
- [ ] Business rule ở `Service`, throw `ApiException` / subclass.
- [ ] `@Transactional` ở ranh giới use case; `readOnly = true` cho query.
- [ ] Ghi `AUDIT` nếu thao tác nhạy cảm (đổi trạng thái, quyền).
- [ ] Thêm test `Service` (rule + nhánh lỗi) và test `Controller` (status, validation).
- [ ] Cập nhật cả `/API.md` và `backend/API.md` trong **cùng commit**.
- [ ] Chạy `.\mvnw.cmd test` pass; tránh cast trực tiếp Java String ↔ PostgreSQL ENUM (xem AGENTS §11).
- [ ] Không commit artifact sinh ra trong `target/`.

---

## 14. Tài liệu liên quan

- [`/API.md`](../API.md) — API doc cho frontend (chi tiết, ví dụ curl, axios)
- [`AGENTS.md`](../AGENTS.md) (root) — tổng quan dự án, ERD, business rules
- [`backend/AGENTS.md`](AGENTS.md) — backend engineering guide
- `backend/.env.example` — danh sách biến môi trường
