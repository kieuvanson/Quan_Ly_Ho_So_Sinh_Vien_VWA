# VWA EduRecords API

Tài liệu hợp đồng API giữa backend và frontend. Mỗi khi thêm hoặc thay đổi endpoint, phải cập nhật file này trong cùng commit với code API.

## 1. Trạng thái hiện tại

- Backend: Spring Boot `4.1.1`.
- Base URL local dự kiến: `http://localhost:8081`.
- Database: PostgreSQL `vwa_edurecords`.
- Hiện tại chưa có `@RestController` hoặc endpoint nghiệp vụ nào được triển khai.
- Frontend không được tự gọi các API trong phần “Dự kiến”; chỉ gọi API đã có trong phần “Đã triển khai”.
- Spring Security hiện đang bật mặc định. Request chưa có cấu hình xác thực phù hợp có thể nhận `401 Unauthorized`.

## 2. Quy ước chung

### HTTP method

| Method | Mục đích |
|---|---|
| `GET` | Đọc dữ liệu, không thay đổi dữ liệu |
| `POST` | Tạo tài nguyên hoặc thực hiện một command nghiệp vụ |
| `PUT` | Thay thế toàn bộ tài nguyên |
| `PATCH` | Cập nhật một phần tài nguyên |
| `DELETE` | Xóa tài nguyên, chỉ dùng khi nghiệp vụ cho phép |

### URL

- Dùng danh từ tài nguyên, chữ thường và kebab-case khi cần.
- Không dùng động từ trong URL thông thường: dùng `POST /api/students`, không dùng `/api/create-student`.
- Version API khi cần: `/api/v1/...`.
- ID đặt trong path: `/api/v1/students/{mssv}`.
- Query filter, sort và phân trang đặt trong query string.

### Response thành công

Response phải thống nhất theo use case. Ví dụ:

```json
{
  "data": {},
  "message": "Success"
}
```

Danh sách nên có metadata phân trang:

```json
{
  "data": [],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  }
}
```

### Response lỗi

```json
{
  "timestamp": "2026-09-21T10:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/students",
  "fieldErrors": {
    "mssv": "MSSV không được để trống"
  }
}
```

Frontend dùng `code` để xử lý logic; không dùng nội dung `message` để so sánh điều kiện.

### HTTP status bắt buộc

| Status | Ý nghĩa |
|---|---|
| `200 OK` | Đọc hoặc cập nhật thành công |
| `201 Created` | Tạo tài nguyên thành công |
| `204 No Content` | Thành công, không có body |
| `400 Bad Request` | Request sai format hoặc validation thất bại |
| `401 Unauthorized` | Chưa xác thực |
| `403 Forbidden` | Không có quyền |
| `404 Not Found` | Không tìm thấy tài nguyên |
| `409 Conflict` | Vi phạm trạng thái hoặc business rule |
| `500 Internal Server Error` | Lỗi server ngoài dự kiến |

## 3. API đã triển khai

Hiện chưa có API nào được triển khai.

| Method | Endpoint | Tác dụng | Trạng thái |
|---|---|---|---|
| - | - | Chưa có controller/endpoint nghiệp vụ | Chưa triển khai |

## 4. API dự kiến của MVP

Các API dưới đây là danh sách định hướng, chưa phải API có thể gọi. Khi triển khai thật, chuyển endpoint vào mục “API đã triển khai” và điền đầy đủ request/response.

### Danh sách hồ sơ sinh viên

| Method | Endpoint | Tác dụng |
|---|---|---|
| `GET` | `/api/v1/students` | Lấy danh sách hồ sơ, tìm kiếm, lọc và phân trang |
| `GET` | `/api/v1/students/{mssv}` | Xem tóm tắt hồ sơ một sinh viên |
| `POST` | `/api/v1/students` | Tạo hồ sơ sinh viên |
| `PATCH` | `/api/v1/students/{mssv}` | Cập nhật một phần thông tin sinh viên |

### Hồ sơ giấy tờ

| Method | Endpoint | Tác dụng |
|---|---|---|
| `GET` | `/api/v1/students/{mssv}/documents` | Lấy danh sách giấy tờ của sinh viên |
| `PATCH` | `/api/v1/documents/{maHoSo}/submission-status` | Tick/bỏ tick trạng thái nộp giấy tờ và tạo `LICHSUNOP` |
| `GET` | `/api/v1/documents/{maHoSo}/submission-history` | Xem lịch sử nộp/bổ sung giấy tờ |
| `POST` | `/api/v1/documents/{maHoSo}/attachment` | Thêm file đính kèm theo quy tắc upload |
+
### Mượn, trả và rút hồ sơ

| Method | Endpoint | Tác dụng |
|---|---|---|
| `POST` | `/api/v1/loans` | Tạo phiếu Mượn tạm thời |
| `POST` | `/api/v1/loans/{maPhieu}/return` | Ghi nhận trả hồ sơ mượn |
| `GET` | `/api/v1/loans` | Tra cứu phiếu mượn/trả |
| `POST` | `/api/v1/withdrawals` | Tạo phiếu Rút hồ sơ vĩnh viễn cho toàn bộ giấy tờ |
| `POST` | `/api/v1/withdrawals/{maPhieu}/complete` | Hoàn tất rút hồ sơ và khóa chỉnh sửa |
+
### Lịch sử và audit

| Method | Endpoint | Tác dụng |
|---|---|---|
| `GET` | `/api/v1/audits` | Tra cứu lịch sử thay đổi theo hồ sơ, phiếu hoặc thời gian |
| `GET` | `/api/v1/students/{mssv}/audits` | Xem toàn bộ audit của một sinh viên |
+
## 5. Quy tắc frontend phải biết

- Không xem `200` là thành công duy nhất; `201`, `204` cũng là response thành công hợp lệ.
- Với `409`, hiển thị lỗi nghiệp vụ từ `code`/`message`; không tự retry.
- Với `401`, đưa người dùng về luồng đăng nhập khi authentication được triển khai.
- Với `422` nếu sau này backend dùng status này cho validation, xử lý tương tự `400` và đọc `fieldErrors`.
- Không tự thay đổi trạng thái hồ sơ ở frontend để suy đoán kết quả; reload hoặc dùng response từ backend.
- Khi tick/bỏ tick giấy tờ, chỉ cập nhật UI sau khi API thành công vì backend phải tạo audit cùng transaction.
- Khi tạo phiếu Rút hồ sơ, frontend không gửi danh sách một phần để cố rút một số giấy tờ; backend sẽ áp dụng toàn bộ hồ sơ.
- Không lưu password, token hoặc dữ liệu hồ sơ nhạy cảm vào source code.

## 6. Template thêm API mới

Mỗi API mới phải được ghi theo mẫu sau:

```markdown
### [Tên chức năng]

- **Method:** `GET|POST|PUT|PATCH|DELETE`
- **Endpoint:** `/api/v1/...`
- **Trạng thái:** Đã triển khai | Chưa triển khai
- **Tác dụng:** API dùng để làm gì, nói rõ đối tượng bị ảnh hưởng.
- **Quyền yêu cầu:** Admin | Public | Chưa xác định
- **Business rules:** Liệt kê rule Service phải kiểm tra.

#### Request

```http
METHOD /api/v1/... HTTP/1.1
Content-Type: application/json
```

```json
{}
```

#### Response thành công

- **Status:** `200 OK`

```json
{}
```

#### Response lỗi

| Status | Code | Khi nào xảy ra |
|---|---|---|
| `400` | `...` | ... |
| `404` | `...` | ... |
| `409` | `...` | ... |
```

## 7. Checklist cập nhật API

- [ ] Controller, Service, Repository và DTO đã được tạo đúng layer.
- [ ] Request/response JSON trong tài liệu khớp với DTO thực tế.
- [ ] HTTP status và error code đã được thống nhất.
- [ ] Business rules được kiểm tra ở Service.
- [ ] Thay đổi trạng thái có audit nếu nghiệp vụ yêu cầu.
- [ ] Có test cho thành công, validation, not found và conflict.
- [ ] Frontend biết endpoint mới và cách xử lý lỗi.
- [ ] Đã chạy `cd backend; .\mvnw.cmd test`.
