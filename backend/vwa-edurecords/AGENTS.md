# Backend Engineering Guide

Tài liệu này bổ sung cho `AGENTS.md` ở thư mục gốc. Phạm vi áp dụng là `backend/vwa-edurecords/`. Mục tiêu là giữ code dễ đọc, dễ kiểm thử, dễ thay đổi và đủ chắc chắn cho một hệ thống quản lý hồ sơ có dữ liệu audit.

## 1. Nguyên tắc làm việc

- Đọc code và test liên quan trước khi sửa; ưu tiên mở rộng pattern đang có thay vì tạo abstraction mới.
- Mỗi thay đổi phải có phạm vi nhỏ, có lý do rõ ràng và không trộn refactor không liên quan với thay đổi nghiệp vụ.
- Sửa đúng nguyên nhân gốc. Không dùng workaround che lỗi hoặc nuốt exception để làm request trông như thành công.
- Không giả định frontend, database schema, API hoặc package đã tồn tại nếu chưa thấy trong repo.
- Không commit file sinh ra trong `target/`, secret, mật khẩu, token hoặc dữ liệu hồ sơ thật.
- Tên code và cấu trúc phải giúp người mới đọc được luồng xử lý mà không cần đoán.

## 2. Kiến trúc bắt buộc

Dùng luồng một chiều:

```text
Controller -> Service -> Repository -> Entity
                  |
                  +-> Audit/Domain service khi nghiệp vụ yêu cầu
```

### Controller

- Chỉ đảm nhiệm HTTP: nhận request, binding DTO, gọi Service và trả response.
- Không viết truy vấn database, không thay đổi entity trực tiếp, không chứa business rule.
- Dùng DTO cho request/response; không trả JPA entity trực tiếp.
- Endpoint dùng danh từ tài nguyên, path chữ thường, HTTP method đúng ngữ nghĩa.
- Kiểm tra input hình thức bằng Bean Validation (`@Valid`, `@NotNull`, `@Size`, ...); kiểm tra nghiệp vụ ở Service.

### Service

- Là nơi duy nhất điều phối use case và kiểm tra business rules.
- Mỗi use case công khai nên có một phương thức rõ nghĩa, không tạo method quá tổng quát kiểu `process()` hoặc `handle()`.
- Dùng `@Transactional` ở ranh giới use case; thao tác thay đổi hồ sơ và ghi audit phải thuộc cùng transaction khi cần tính nguyên tử.
- Không trả entity mutable ra ngoài tầng Service nếu có nguy cơ bị sửa ngoài ý muốn.
- Khi trạng thái thay đổi, phải ghi lịch sử trước khi kết thúc use case; không cập nhật đè làm mất dấu vết cũ.

### Repository

- Chỉ phụ trách truy cập dữ liệu và truy vấn.
- Tên method phải mô tả điều kiện truy vấn; tránh query tùy tiện trong Service.
- Với danh sách lớn, luôn xem xét phân trang, sort và điều kiện lọc.
- Tránh N+1 query; dùng projection, fetch phù hợp hoặc query riêng khi có bằng chứng cần thiết.
- Không để repository chứa logic nghiệp vụ như quyết định hồ sơ đủ giấy tờ hay cho phép rút hồ sơ.

### Entity và DTO

- Entity phản ánh mô hình persistence; không dùng entity làm request/response contract.
- Không đưa `@Data` vào entity một cách máy móc vì `equals/hashCode/toString` có thể gây vòng lặp hoặc tải quan hệ ngoài ý muốn.
- Không expose quan hệ JPA lazy trực tiếp qua JSON.
- DTO response chỉ trả dữ liệu cần cho use case; không trả password, secret, đường dẫn nội bộ hoặc dữ liệu nhạy cảm không cần thiết.
- Enum dùng cho trạng thái có tập giá trị cố định; không rải string literal trạng thái khắp code.
- Tên class: `PascalCase`; method/biến: `camelCase`; hằng số: `UPPER_SNAKE_CASE`.
- Tên package viết thường, theo layer: `vn.vwa.edurecords.controller`, `.service`, `.repository`, `.entity`, `.dto`, `.exception`, `.config`.

## 3. Quy tắc nghiệp vụ VWA phải giữ

- “Đủ giấy tờ” chỉ tính 8 giấy tờ bắt buộc, STT 1-8 trong tổng số 13 loại; không tính 5 giấy tờ không bắt buộc.
- Mỗi lần thay đổi trạng thái nộp giấy tờ phải tạo bản ghi `LICHSUNOP`; không có đường cập nhật trạng thái nào được bỏ qua audit.
- Không tạo phiếu Mượn tạm thời cho hồ sơ đã `Đã rút hồ sơ`.
- Không hoàn tất Rút hồ sơ vĩnh viễn khi còn giấy tờ khác đang `Đang mượn` chưa trả.
- Rút hồ sơ vĩnh viễn áp dụng cho toàn bộ giấy tờ hiện có, không hỗ trợ rút một phần.
- Hoàn tất Rút hồ sơ phải khóa chỉnh sửa thông thường và đổi `TrangThaiHocVu` thành `Đã rút hồ sơ`.
- Mọi thay đổi trạng thái phiếu/hồ sơ phải có lịch sử; không xóa hoặc ghi đè dữ liệu audit cũ.
- Mượn tạm thời quá hạn phải được hệ thống chuyển tự động sang `Quá hạn`; người dùng không được tự sửa để né quy tắc.
- Không chỉ tin dữ liệu do client gửi; Service phải tải trạng thái hiện tại từ database và kiểm tra lại trước khi ghi.
- Các thao tác nhạy cảm phải xử lý cạnh tranh dữ liệu bằng transaction, điều kiện cập nhật hoặc locking phù hợp; không dựa vào kiểm tra ở UI.

## 4. Xử lý lỗi và API contract

- Dùng exception nghiệp vụ có tên rõ nghĩa, ví dụ `StudentNotFoundException`, `InvalidProfileStateException`, `BorrowingRuleViolationException`.
- Dùng `@RestControllerAdvice` tập trung để chuyển exception thành response nhất quán.
- Không trả stack trace, SQL, thông tin class hoặc secret cho client.
- Tối thiểu phân biệt:
  - `400 Bad Request`: request sai định dạng hoặc validation không hợp lệ.
  - `404 Not Found`: không tìm thấy tài nguyên.
  - `409 Conflict`: vi phạm trạng thái/nghiệp vụ hoặc xung đột dữ liệu.
  - `500 Internal Server Error`: lỗi ngoài dự kiến, phải được log phía server.
- Error response nên có mã lỗi ổn định, message an toàn và thông tin field validation nếu có.
- Message cho người dùng không được làm mất nguyên nhân kỹ thuật trong log; log phải đủ context nhưng không chứa dữ liệu cá nhân không cần thiết.
- Không dùng `catch (Exception)` để tiếp tục như chưa có lỗi. Chỉ catch khi có thể xử lý, bổ sung context hoặc chuyển sang exception có nghĩa.

## 5. Database và transaction

- Hiện repo mới có PostgreSQL dependency; chưa có JDBC config hoặc migration tool. Không tự tuyên bố schema đã tồn tại.
- Khi thêm schema, phải có migration/version rõ ràng; không phụ thuộc vào việc sửa tay database production.
- Không dùng `ddl-auto=create` hoặc `create-drop` cho môi trường có dữ liệu thật.
- Migration phải có khóa ngoại, unique constraint, index cho khóa tìm kiếm và các trạng thái được truy vấn thường xuyên.
- Không hard-code credential trong `application.properties`; dùng biến môi trường hoặc secret manager.
- Không thực hiện thao tác network/file/database dài trong transaction nếu có thể tách ra.
- Kiểm tra ranh giới transaction bằng test, đặc biệt khi cập nhật hồ sơ và ghi `LICHSUNOP`/audit cùng lúc.
- Tách entity persistence khỏi file đính kèm thực tế; lưu metadata và dùng storage abstraction khi triển khai upload.

## 6. Kiểm thử

Mỗi tính năng mới phải có test tương ứng với rủi ro:

- Unit test Service cho rule nghiệp vụ và các nhánh lỗi.
- Repository test cho query quan trọng, đặc biệt lọc trạng thái và phân trang.
- Controller test cho status code, validation, DTO và error response.
- Integration test cho transaction, audit và các luồng xuyên layer.
- Test phải kiểm tra cả trường hợp thành công, dữ liệu không tồn tại, trạng thái không hợp lệ và cạnh tranh nếu use case có rủi ro.
- Không làm test phụ thuộc thứ tự chạy, thời gian thực hoặc dữ liệu còn sót từ test khác.
- Không chỉ kiểm tra `verify(repository.save())`; phải kiểm tra kết quả và invariant nghiệp vụ.
- Khi sửa bug, thêm regression test tái hiện bug trước hoặc cùng lúc với bản sửa.

Ví dụ tên test nên mô tả hành vi:

```java
shouldCreateSubmissionHistoryWhenDocumentStatusChanges()
shouldRejectPermanentWithdrawalWhenAnotherDocumentIsBorrowed()
shouldMarkTemporaryBorrowAsOverdueAfterDueDate()
```

## 7. Quy tắc viết code sạch

- Method nên ngắn và có một trách nhiệm; tách logic phức tạp thành method/domain service có tên rõ nghĩa.
- Tránh lồng `if` sâu; dùng guard clause nhưng không che khuất luồng nghiệp vụ.
- Không tạo magic number/string cho trạng thái, loại phiếu hoặc số lượng giấy tờ bắt buộc; đặt tên bằng enum/hằng số có ngữ cảnh.
- Không copy-paste cùng một rule ở nhiều Service; đưa rule về một nơi có trách nhiệm rõ ràng.
- Ưu tiên immutable DTO, `final` cho dependency và dữ liệu không thay đổi.
- Constructor injection là mặc định; tránh field injection.
- Chỉ thêm Lombok khi làm code rõ hơn; không để annotation che mất behavior quan trọng.
- Comment giải thích “vì sao”, không lặp lại “code đang làm gì”. Xóa comment lỗi thời.
- Không tối ưu sớm. Chỉ thêm cache, async, batch hoặc abstraction khi có yêu cầu và test chứng minh hành vi.
- Không sửa API public, tên bảng, enum hoặc contract hiện có mà không đánh giá ảnh hưởng và cập nhật test.

## 8. Logging, bảo mật và dữ liệu cá nhân

- Log theo mức phù hợp: `INFO` cho sự kiện nghiệp vụ quan trọng, `WARN` cho tình huống bất thường có thể xử lý, `ERROR` cho lỗi cần điều tra.
- Log phải có mã hồ sơ/MSSV được che hoặc giới hạn theo chính sách; không log file upload, password, token hoặc toàn bộ dữ liệu cá nhân.
- Không đưa secret vào source, test fixture hoặc message exception.
- Kiểm tra quyền ở backend dù frontend đã ẩn nút; hiện MVP có một Admin nhưng không được coi UI là lớp bảo mật.
- Validate tên file, loại file, kích thước file và đường dẫn khi xử lý `FileDinhKem`; chống path traversal.
- Không xây query bằng nối chuỗi từ input; dùng Spring Data parameter binding.

## 9. Quy trình triển khai một task

1. Xác định use case, dữ liệu đầu vào/đầu ra, invariant và rule bị ảnh hưởng.
2. Đọc entity/repository/service/controller/test liên quan trước khi thiết kế.
3. Viết hoặc cập nhật test cho behavior cần có, nhất là rule và lỗi.
4. Implement theo luồng Controller → Service → Repository, giữ DTO tách biệt.
5. Kiểm tra transaction, audit, validation, error mapping và tác động backward compatibility.
6. Chạy format/lint nếu dự án đã cấu hình; hiện repo chưa có formatter/linter riêng.
7. Chạy kiểm tra tối thiểu:

```powershell
cd backend/vwa-edurecords
.\mvnw.cmd test
.\mvnw.cmd clean package
```

8. Xem lại diff, loại bỏ debug code, import thừa, log nhạy cảm và file sinh ra.
9. Tóm tắt thay đổi, test đã chạy và rủi ro còn lại trong pull request/response cuối.

## 10. Definition of Done cho backend

- Code compile thành công bằng Maven Wrapper.
- Test liên quan pass; test mới bao phủ behavior quan trọng và regression bug nếu có.
- Business rules được kiểm tra ở Service, không chỉ ở Controller/UI.
- Thay đổi trạng thái có audit theo đúng yêu cầu.
- DTO, validation, exception response và HTTP status nhất quán.
- Không có secret, debug code, query nối chuỗi hoặc log dữ liệu nhạy cảm.
- Không có thay đổi ngoài phạm vi task; migration/config được ghi rõ nếu có.
- Tài liệu hoặc endpoint contract được cập nhật khi behavior public thay đổi.
