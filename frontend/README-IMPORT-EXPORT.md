# Hướng dẫn Import / Export Excel — VWA EduRecords

> Tài liệu dành cho **người dùng cuối** (chuyên viên đào tạo - tuyển sinh, role `ADMIN`).
> Mục tiêu: hướng dẫn **cách tạo file Excel đúng chuẩn** để import vào hệ thống, và cách đọc file xuất ra.
>
> **Phiên bản tài liệu:** 3.0 — hợp nhất toàn bộ hướng dẫn Import/Export:
> - **Phần A** — Import/Export **Sinh viên & Hồ sơ giấy tờ** (trang Danh sách hồ sơ sinh viên)
> - **Phần B** — Import/Export **Danh mục** (trang Cài đặt → 4 tab: Khoa, Ngành, Khóa học, Lớp)
>
> Hệ thống dùng quy trình **2 bước (Preview → Confirm)** với chế độ **fail-fast**:
> nếu file có lỗi ở bất kỳ dòng nào, hệ thống **dừng ngay** và yêu cầu sửa file trước khi import.

---

## Mục lục

### Phần A — Sinh viên & Hồ sơ giấy tờ

1. [Tổng quan chức năng](#a1-tổng-quan-chức-năng)
2. [Quy trình Import 2 bước (Preview → Confirm)](#a2-quy-trình-import-2-bước-preview--confirm)
3. [Đặt tên sheet — Quy tắc vàng](#a3-đặt-tên-sheet--quy-tắc-vàng)
4. [Cấu trúc file Excel theo từng chế độ](#a4-cấu-trúc-file-excel-theo-từng-chế-độ)
   - 4.1. Sheet `SV` — 14 cột (Sinh viên thuần)
   - 4.2. Sheet `HS` — 6 cột (Hồ sơ giấy tờ thuần)
   - 4.3. Sheet `SV+HS` — 10 cột (Gộp trong 1 sheet)
   - 4.4. File nhiều sheet — Kết hợp SV + HS trong 1 file
5. [Quy tắc nghiệp vụ](#a5-quy-tắc-nghiệp-vụ)
6. [Lỗi thường gặp & cách xử lý](#a6-lỗi-thường-gặp--cách-xử-lý-phần-a)
7. [Cách Export](#a7-cách-export)
8. [Hiệu năng & giới hạn](#a8-hiệu-năng--giới-hạn)
9. [API Endpoints](#a9-api-endpoints)
10. [Checklist trước khi Import](#a10-checklist-trước-khi-import-phần-a)

### Phần B — Danh mục (Cài đặt)

11. [Tại sao phải Import theo thứ tự?](#b1-tại-sao-phải-import-theo-thứ-tự)
12. [Bước 1/4 — Import KHOA](#b2-bước-14--import-khoa)
13. [Bước 2/4 — Import NGÀNH](#b3-bước-24--import-ngành)
14. [Bước 3/4 — Import KHÓA HỌC](#b4-bước-34--import-khóa-học)
15. [Bước 4/4 — Import LỚP](#b5-bước-44--import-lớp)
16. [Quy trình tổng hợp end-to-end](#b6-quy-trình-tổng-hợp-end-to-end)
17. [Checklist trước khi Import danh mục](#b7-checklist-trước-khi-import-danh-mục)
18. [Xử lý lỗi khi xóa danh mục](#b8-xử-lý-lỗi-khi-xóa-danh-mục)

---

# PHẦN A — Sinh viên & Hồ sơ giấy tờ

## A1. Tổng quan chức năng

Trên trang **Danh sách hồ sơ sinh viên** có 3 nút ở góc phải thanh công cụ:

| Nút | Chức năng |
|---|---|
| **Import** | Upload file Excel để thêm mới sinh viên và/hoặc hồ sơ giấy tờ (KHÔNG ghi đè). |
| **Export** | Tải file Excel chứa danh sách sinh viên (đúng filter đang hiển thị). |
| **Đặt lại** | Reset tất cả bộ lọc. |

Trong modal **Import** có nút **Tải file mẫu** để lấy file mẫu chuẩn.

### 3 chế độ import

Hệ thống tự động nhận diện chế độ theo **tên sheet** trong file Excel:

| Chế độ | Tên sheet hỗ trợ | Bảng dữ liệu ghi | Yêu cầu đặc biệt |
|---|---|---|---|
| **Sinh viên** | `SV`, `TT Sinh viên`, `SinhVien`, `Sinh viên` | `SINHVIEN` (thêm mới) | Có danh mục Khoa/Ngành/Lớp/Khóa học trong DB. |
| **Hồ sơ giấy tờ** | `HS`, `Hồ sơ giấy tờ`, `Ho so giay to`, `HoSoGiayTo` | `HOSOGIAYTO` (thêm mới) | **MSSV BẮT BUỘC đã tồn tại** trong DB. |
| **Gộp SV+HS** | `SV+HS`, `TT Sinh viên & Hồ sơ` | Cả 2 bảng (trong 1 sheet) | Có cột `Loại dòng` để phân biệt SV/HS. |

**Quan trọng:** 1 file có thể có **nhiều sheet**, mỗi sheet 1 chế độ. Hệ thống sẽ duyệt từng sheet và xử lý theo thứ tự.

---

## A2. Quy trình Import 2 bước (Preview → Confirm)

Hệ thống dùng quy trình **2 bước** để đảm bảo an toàn dữ liệu:

```
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 1: UPLOAD + KIỂM TRA (PREVIEW)                        │
│  • User chọn file Excel                                      │
│  • Hệ thống quét từng sheet, từng dòng                       │
│  • Nếu phát hiện lỗi ở dòng đầu tiên → DỪNG NGAY           │
│  • Trả về: số sheet, tổng dòng, sẽ ghi, lỗi chi tiết        │
└──────────────────────────────────────────────────────────────┘
                              ↓ (chỉ khi không có lỗi)
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 2: XÁC NHẬN (CONFIRM)                                 │
│  • User nhấn "Xác nhận import"                              │
│  • Mỗi sheet chạy 1 transaction riêng                       │
│  • Hệ thống ghi dữ liệu hợp lệ vào DB                      │
│  • Báo cáo kết quả cuối cùng theo từng sheet                │
└──────────────────────────────────────────────────────────────┘
```

### Tại sao dùng fail-fast?

| Vấn đề (cách cũ) | Giải pháp (fail-fast) |
|---|---|
| Import 99 dòng OK, bỏ 1 dòng lỗi → user không biết thiếu gì. | Dừng ngay tại dòng lỗi đầu tiên. |
| Phải đọc cả danh sách lỗi để biết cần sửa gì. | Thấy ngay dòng lỗi + lý do. |
| Mất kiểm soát dữ liệu đã import. | Đảm bảo toàn vẹn: chỉ import khi 100% OK. |

### Tại sao dùng quy trình 2 bước?

- **Bước 1 (Preview):** User thấy trước kết quả, phát hiện lỗi mà KHÔNG cần sửa DB.
- **Bước 2 (Confirm):** Chỉ khi preview OK mới ghi. Tránh import nhầm rồi rollback.

### Quy trình chi tiết

#### Bước 1: Upload file
1. Vào **Danh sách hồ sơ sinh viên**.
2. Bấm **Import** ở thanh công cụ.
3. Modal mở ra → bấm vào vùng upload để chọn file `.xlsx`.
4. Bấm **Tải file mẫu** (nếu cần) để lấy file mẫu có sẵn.
5. Bấm **Kiểm tra file**.

#### Bước 2: Hệ thống quét (fail-fast)

Sau khi nhấn **Kiểm tra file**, có 2 kịch bản:

**Kịch bản A: File có lỗi ở dòng N (fail-fast)**
- Hệ thống **dừng quét** ngay tại dòng lỗi đầu tiên.
- Hiển thị hộp thoại đỏ với thông tin:
  ```
  ⛔ Sheet "SV" lỗi ở dòng 3 (MSSV: B23DCCN003):
  • Không tìm thấy Khoa: 'Khoa ABC'. Vui lòng kiểm tra lại tên Khoa.
  
  👉 Mở file Excel, sửa dòng 3 và upload lại.
  ```
- **Không có dòng nào** được ghi vào database.
- User phải: sửa file Excel → upload lại.

**Kịch bản B: Tất cả dòng đều hợp lệ**
- Modal chuyển sang bước **Preview**.
- Hiển thị:
  - **Thống kê tổng**: số sheet, tổng dòng, sẽ ghi, lỗi.
  - **Tabs sheet**: chuyển tab để xem chi tiết từng sheet.
  - **Bảng lỗi** (nếu có trong 1 sheet nhưng sheet khác OK — sẽ không xảy ra vì fail-fast).
- User nhấn **Xác nhận import (N)** để ghi vào DB.

#### Bước 3: Xác nhận (Confirm)
- Mỗi sheet chạy **1 transaction riêng** → 1 sheet lỗi runtime không ảnh hưởng sheet khác.
- Hệ thống ghi dữ liệu vào DB (qua batch insert 500/lần).
- Trả về kết quả cuối cùng: thành công/thất bại từng sheet + thời gian xử lý.

---

## A3. Đặt tên sheet — Quy tắc vàng

### 3.1. Tại sao tên sheet quan trọng?

Hệ thống **nhận diện chế độ import theo tên sheet**, KHÔNG qua nội dung hay vị trí. Nếu đặt tên sai → hệ thống từ chối ngay từ bước kiểm tra.

### 3.2. Danh sách tên sheet được hỗ trợ

| Mode | Tên sheet chấp nhận |
|---|---|
| **Sinh viên** | `SV`, `TT Sinh viên`, `TT Sinh vien`, `SinhVien`, `Sinh viên` |
| **Hồ sơ giấy tờ** | `HS`, `Hồ sơ giấy tờ`, `Ho so giay to`, `HoSoGiayTo` |
| **Gộp** | `SV+HS`, `SV + HS`, `TT Sinh viên & Hồ sơ`, `Sinh vien va Ho so` |

**Quy tắc nhận diện:**
- **Không phân biệt HOA/thường**: `sv`, `Sv`, `SV` đều OK.
- **Có thể có hoặc không dấu**: `TT Sinh viên` = `TT Sinh vien`.
- **Khoảng trắng ở đầu/cuối**: tự động bỏ qua.
- **Khoảng trắng giữa các từ**: gộp lại 1 dấu cách.

### 3.3. Tên sheet KHÔNG được hỗ trợ

Nếu tên sheet không thuộc 3 nhóm trên → hệ thống sẽ báo lỗi:
```
Tên sheet 'DanhSachSV' không được hỗ trợ. 
Vui lòng đổi tên sheet thành một trong: SV, HS, SV+HS
```

**Khuyến nghị:** Luôn dùng 3 tên chuẩn `SV` / `HS` / `SV+HS` để tránh nhầm lẫn.

### 3.4. Đặt tên sheet trong Excel

Để đổi tên sheet trong Excel: nhấp đúp vào tab sheet ở dưới cùng → gõ tên mới → Enter.

**Hình minh họa (văn bản):**
```
┌─────────────────────────────────────────┐
│ [SV] [HS] [SV+HS]   ← tên sheet ở đây  │  ← tab sheet
├─────────────────────────────────────────┤
│ MSSV | Họ tên | ... | ← dữ liệu từng   │  ← nội dung sheet
│ B23..| Nguyễn | ... |    dòng           │
└─────────────────────────────────────────┘
```

---

## A4. Cấu trúc file Excel theo từng chế độ

> **Nguyên tắc chung:** Hệ thống đọc dữ liệu theo **vị trí cột (1-based)**, KHÔNG theo tên header. Vì vậy bạn có thể đặt tên header bằng tiếng Việt, tiếng Anh, hoặc bất kỳ — miễn **đúng thứ tự cột** như bảng dưới.

> **Dòng đầu tiên của sheet:** Nếu bắt đầu bằng từ "Hướng dẫn" (không phân biệt HOA/thường) → hệ thống tự bỏ qua và đọc từ dòng 2. Nếu dòng 1 là header → hệ thống đọc từ dòng 1.

---

### A4.1. Sheet `SV` — Sinh viên thuần (14 cột)

File có **1 sheet tên `SV`** chứa dữ liệu sinh viên. **14 cột theo đúng thứ tự** sau:

| # | Tên cột (gợi ý) | Bắt buộc? | Ghi chú chi tiết |
|---|---|---|---|
| 1 | `MSSV` | ✅ **Bắt buộc** | Khóa chính. Tối đa 20 ký tự. **Không trùng** trong file và trong DB. |
| 2 | `Họ tên` | ✅ **Bắt buộc** | Tối đa 150 ký tự. |
| 3 | `Ngày sinh` | ❌ Tùy chọn | Hỗ trợ: `dd/MM/yyyy`, `yyyy-MM-dd`, hoặc ô định dạng ngày Excel. |
| 4 | `Giới tính` | ❌ Tùy chọn | Tối đa 10 ký tự (VD: `Nam`, `Nữ`). |
| 5 | `CCCD` | ❌ Tùy chọn | Tối đa 20 ký tự. Phải **duy nhất** trong hệ thống. |
| 6 | `SĐT` | ❌ Tùy chọn | Tối đa 20 ký tự. |
| 7 | `Email` | ❌ Tùy chọn | Tối đa 100 ký tự. |
| 8 | `Quê quán` | ❌ Tùy chọn | Tối đa 255 ký tự. |
| 9 | `Tên khoa` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên khoa trong Cài đặt. |
| 10 | `Tên ngành` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên ngành trong Cài đặt. |
| 11 | `Tên lớp` | ✅ **Bắt buộc** | Phải thuộc (Ngành, Khóa học) đã chỉ định ở cột 10 và 12. |
| 12 | `Tên khóa học` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên khóa học trong Cài đặt. |
| 13 | `Hệ đào tạo` | ❌ Tùy chọn | Tối đa 50 ký tự (VD: `Chính quy`, `Liên thông`, `Tại chức`). |
| 14 | `Trạng thái học vụ` | ❌ Tùy chọn | Phải là **đúng một** trong: `Đang học`, `Bảo lưu`, `Đình chỉ`, `Tốt nghiệp`, `Đã rút hồ sơ`. Mặc định: `Đang học`. |

**Lưu ý quan trọng:**
- **Hệ thống đọc theo VỊ TRÍ cột**, không theo tên header. Bạn có thể đổi tên cột thoải mái (VD: dùng tiếng Anh `StudentID` thay cho `MSSV`), miễn **đúng thứ tự cột**.
- Các cột 9-12 (Khoa/Ngành/Lớp/Khóa học) so sánh **case-insensitive** (không phân biệt HOA/thường) và **trim khoảng trắng đầu/cuối**. Khoảng trắng giữa vẫn phải khớp.

**Ví dụ file mẫu (sheet `SV`):**

| # | A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Dòng header** | MSSV | Họ tên | Ngày sinh | Giới tính | CCCD | SĐT | Email | Quê quán | Tên khoa | Tên ngành | Tên lớp | Tên khóa học | Hệ đào tạo | Trạng thái học vụ |
| **Dòng dữ liệu 1** | B23DCCN001 | Nguyễn Văn A | 2005-01-15 | Nam | 079205001234 | 0912345678 | a@example.com | Hà Nội | Khoa Công nghệ thông tin | Công nghệ thông tin | CNTT-K23.1 | Khóa K23 (2023-2027) | Chính quy | Đang học |
| **Dòng dữ liệu 2** | B23DCCN002 | Trần Thị B | 15/03/2005 | Nữ | 079205002345 | 0987654321 | b@example.com | TP. HCM | Khoa Công nghệ thông tin | Công nghệ thông tin | CNTT-K23.1 | Khóa K23 (2023-2027) | Chính quy | Đang học |

---

### A4.2. Sheet `HS` — Hồ sơ giấy tờ thuần (6 cột)

File có **1 sheet tên `HS`** chứa dữ liệu giấy tờ cho sinh viên đã có. **6 cột theo đúng thứ tự**:

| # | Tên cột (gợi ý) | Bắt buộc? | Ghi chú chi tiết |
|---|---|---|---|
| 1 | `MSSV` | ✅ **Bắt buộc** | **BẮT BUỘC đã tồn tại trong DB.** Tối đa 20 ký tự. |
| 2 | `Mã loại giấy tờ` | ✅ **Bắt buộc** | Phải trùng với `LOAIGIAYTO.MALOAI` (xem bảng 13 mã bên dưới). Có thể ghi theo **Mã** (VD: `GT01`) hoặc **Tên giấy tờ** (VD: `Giấy khai sinh`) — hệ thống thử mã trước, nếu không có thì thử tên. |
| 3 | `Trạng thái nộp` | ✅ **Bắt buộc** | Phải là **đúng một** trong: `Chưa nộp`, `Đã nộp`, `Thiếu`, `Không hợp lệ`. Mặc định: `Chưa nộp`. |
| 4 | `Bản gốc/Bản sao` | ❌ Tùy chọn | Phải là **đúng một** trong: `Bản gốc`, `Bản sao`. |
| 5 | `File đính kèm` | ❌ Tùy chọn | Tối đa 500 ký tự. Đường dẫn hoặc URL file. |
| 6 | `Vị trí lưu kho` | ❌ Tùy chọn | Tối đa 100 ký tự. |

**Quy tắc quan trọng:**
- **MSSV BẮT BUỘC đã tồn tại trong hệ thống.** Nếu muốn thêm giấy tờ cho sinh viên chưa có → dùng **sheet `SV+HS`** (kết hợp tạo SV + HS trong 1 sheet).
- Mỗi cặp `(MSSV, Mã loại giấy tờ)` chỉ được có **1 dòng** trong cùng sheet (DB có unique constraint).

**Ví dụ file mẫu (sheet `HS`):**

| # | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| **Dòng header** | MSSV | Mã loại giấy tờ | Trạng thái nộp | Bản gốc/Bản sao | File đính kèm | Vị trí lưu kho |
| **Dòng dữ liệu 1** | B23DCCN001 | GT06 | Đã nộp | Bản sao | /uploads/cccd-b23dccn001.pdf | Kệ A1-001 |
| **Dòng dữ liệu 2** | B23DCCN001 | GT03 | Đã nộp | Bản gốc | /uploads/hocba-b23dccn001.pdf | Kệ A1-002 |
| **Dòng dữ liệu 3** | B23DCCN002 | GT06 | Thiếu | | | |

---

### A4.3. Sheet `SV+HS` — Gộp 2 loại dòng trong 1 sheet (10 cột)

File có **1 sheet tên `SV+HS`** chứa cả dòng SV và dòng HS. Phân biệt bằng cột `Loại dòng`.

**Cấu trúc 10 cột theo đúng thứ tự:**

| # | Tên cột (gợi ý) | Áp dụng cho | Bắt buộc? | Ghi chú chi tiết |
|---|---|---|---|---|
| 1 | `Loại dòng` | Cả SV và HS | ✅ **Bắt buộc** | Phải là `SV` hoặc `HS`. |
| 2 | `MSSV` | Cả SV và HS | ✅ **Bắt buộc** | Tối đa 20 ký tự. Với dòng HS, MSSV phải tồn tại trong DB (kể cả từ dòng SV phía trên trong cùng sheet). |
| 3 | `Họ tên` | Dòng SV | ✅ **Bắt buộc cho SV** | Tối đa 150 ký tự. Bỏ trống nếu là dòng HS. |
| 4 | `Tên khoa` | Dòng SV | ✅ **Bắt buộc cho SV** | Phải trùng khớp với tên khoa trong Cài đặt. |
| 5 | `Tên ngành` | Dòng SV | ✅ **Bắt buộc cho SV** | Phải trùng khớp với tên ngành trong Cài đặt. |
| 6 | `Tên lớp` | Dòng SV | ✅ **Bắt buộc cho SV** | Phải thuộc (Ngành, Khóa học) đã chỉ định. |
| 7 | `Tên khóa học` | Dòng SV | ✅ **Bắt buộc cho SV** | Phải trùng khớp với tên khóa học trong Cài đặt. |
| 8 | `Mã loại giấy tờ` | Dòng HS | ✅ **Bắt buộc cho HS** | Phải trùng với `LOAIGIAYTO.MALOAI` (xem bảng 13 mã) hoặc Tên giấy tờ. |
| 9 | `Trạng thái nộp` | Dòng HS | ✅ **Bắt buộc cho HS** | `Chưa nộp` / `Đã nộp` / `Thiếu` / `Không hợp lệ`. |
| 10 | `Bản gốc/Bản sao` | Dòng HS | ❌ Tùy chọn | `Bản gốc` / `Bản sao`. |

**Quy tắc quan trọng:**
- **Dòng SV cùng MSSV phải đặt TRƯỚC dòng HS** (nếu cùng MSSV) để hệ thống insert SV trước, sau đó insert HS tham chiếu.
- Dòng SV bị trùng MSSV trong DB → vẫn OK, hệ thống bỏ qua dòng SV (nhưng dòng HS vẫn tham chiếu tới SV đã có).
- Dòng HS tham chiếu MSSV chưa tồn tại → **lỗi fail-fast**.
- Hệ thống insert dòng SV trước (1 transaction), sau đó insert dòng HS (1 transaction riêng).

**Ví dụ file mẫu (sheet `SV+HS`):**

| # | A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|---|
| **Dòng header** | Loại dòng | MSSV | Họ tên | Tên khoa | Tên ngành | Tên lớp | Tên khóa học | Mã loại giấy tờ | Trạng thái nộp | Bản gốc/Bản sao |
| **Dòng 2 (SV)** | SV | B23DCCN002 | Trần Thị B | Khoa Công nghệ thông tin | Công nghệ thông tin | CNTT-K23.1 | Khóa K23 (2023-2027) | | | |
| **Dòng 3 (HS - SV mới ở trên)** | HS | B23DCCN002 | | | | | | GT06 | Đã nộp | Bản gốc |
| **Dòng 4 (HS - SV đã có sẵn)** | HS | B23DCCN001 | | | | | | GT03 | Đã nộp | Bản gốc |

---

### A4.4. File nhiều sheet — Kết hợp nhiều chế độ trong 1 file

Một file `.xlsx` có thể chứa **nhiều sheet**, mỗi sheet là 1 chế độ. Hệ thống duyệt từng sheet theo thứ tự và xử lý tuần tự.

**Ví dụ cấu trúc file tổng hợp:**

```
┌─────────────────────────────────────────────────────────────┐
│ File: "tong-hop-k23.xlsx"                                   │
├─────────────────────────────────────────────────────────────┤
│ Sheet 1: "SV"       (14 cột) - Danh sách sinh viên mới     │
│ Sheet 2: "HS"       (6 cột)  - Giấy tờ cho SV đã có       │
│ Sheet 3: "SV+HS"    (10 cột) - Thêm SV mới + giấy tờ      │
└─────────────────────────────────────────────────────────────┘
```

**Quy tắc xử lý:**
- Hệ thống đọc sheet 1 → validate → nếu lỗi → fail-fast, dừng.
- Nếu sheet 1 OK → đọc sheet 2 → validate → nếu lỗi → fail-fast, dừng (cả 2 chưa ghi).
- Nếu tất cả sheet OK → trả token → user confirm → mỗi sheet chạy 1 transaction riêng.

**Khuyến nghị:** Để đơn giản, nên dùng 1 file = 1 sheet (chỉ SV hoặc chỉ HS). Dùng nhiều sheet khi cần kết hợp nhiều loại dữ liệu.

---

## A5. Quy tắc nghiệp vụ

### A5.1. Chế độ Sinh viên (sheet `SV`)

- **Chỉ thêm mới**: MSSV đã tồn tại trong DB → lỗi, không ghi đè.
- **MSSV trùng trong file** → lỗi.
- **CCCD trùng với SV khác** trong DB → lỗi.
- **CCCD trùng trong file** → lỗi.
- **Khoa / Ngành / Lớp / Khóa học** phải tồn tại trong hệ thống (không tự tạo mới).
- **Lớp phải thuộc (Ngành, Khóa học)** đã chỉ định ở cùng dòng.
- **Trạng thái học vụ** nếu bỏ trống → mặc định `Đang học`.

### A5.2. Chế độ Hồ sơ giấy tờ (sheet `HS`)

- **MSSV BẮT BUỘC tồn tại trong hệ thống** — nếu không → lỗi, không lưu.
- Nếu muốn thêm giấy tờ cho SV chưa có → dùng **sheet `SV+HS`** (kết hợp tạo SV + HS).
- Mã loại giấy tờ phải tồn tại trong bảng `LOAIGIAYTO` (xem bảng 13 mã ở cuối tài liệu). Hệ thống tra theo mã trước, nếu không thấy thì tra theo tên.
- Trạng thái nộp / Loại bản phải thuộc giá trị cho phép.
- Cặp `(MSSV, Mã loại)` không được trùng trong file (DB có unique constraint).

### A5.3. Chế độ Gộp (sheet `SV+HS`)

- Trong cùng 1 sheet, dòng SV có thể thêm mới hoặc bỏ qua (nếu MSSV đã tồn tại trong DB).
- Dòng HS tham chiếu MSSV chưa tồn tại (kể cả từ dòng SV phía trên trong cùng sheet) → lỗi.
- Hệ thống sẽ insert dòng SV trước (1 transaction), sau đó insert dòng HS (1 transaction riêng) → đảm bảo FK thỏa mãn.

---

## A6. Lỗi thường gặp & cách xử lý (Phần A)

### A6.1. Lỗi về tên sheet

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên sheet 'XYZ' không được hỗ trợ` | Tên sheet không thuộc 3 nhóm `SV` / `HS` / `SV+HS`. | Đổi tên sheet (nhấp đúp vào tab sheet → gõ tên mới). |

### A6.2. Lỗi về dòng dữ liệu

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Thiếu MSSV.` | Cột 1 bị bỏ trống. | Điền MSSV. |
| `Thiếu họ tên.` (SV) | Cột 2 bị bỏ trống. | Điền họ tên. |
| `MSSV 'X' đã tồn tại trong hệ thống.` (SV) | MSSV trùng với SV đã có. | Đổi MSSV khác, hoặc xóa dòng này. |
| `MSSV 'X' không tồn tại trong hệ thống.` (HS) | Sheet HS yêu cầu MSSV đã có. | Dùng sheet `SV+HS` để thêm SV trước, hoặc import SV trước. |
| `MSSV 'X' bị lặp trong cùng file.` | Có 2 dòng cùng MSSV. | Xóa 1 dòng. |
| `CCCD 'X' đã thuộc sinh viên khác.` | CCCD trùng với SV khác trong DB. | Đổi CCCD khác. |
| `Không tìm thấy Khoa: '...'.` | Tên khoa chưa có trong DB. | Vào Cài đặt → tab Khoa → import Khoa trước. |
| `Không tìm thấy Ngành: '...'.` | Tên ngành chưa có trong DB. | Vào Cài đặt → tab Ngành → import Ngành trước. |
| `Không tìm thấy Lớp '...' thuộc Ngành '...' - Khóa '...'.` | Lớp chưa có, hoặc chưa gắn với (Ngành, Khóa) đúng. | Vào Cài đặt → tab Lớp → import Lớp trước. |
| `Không tìm thấy Loại giấy tờ với mã/tên: '...'.` | Mã loại không tồn tại. | Vào Cài đặt → Loại giấy tờ → kiểm tra mã. |
| `Trạng thái nộp 'X' không hợp lệ.` | Không thuộc 4 giá trị. | Đổi thành `Chưa nộp` / `Đã nộp` / `Thiếu` / `Không hợp lệ`. |
| `Loại bản 'X' không hợp lệ.` | Không thuộc 2 giá trị. | Đổi thành `Bản gốc` / `Bản sao`. |
| `Trạng thái học vụ 'X' không hợp lệ.` | Không thuộc 5 giá trị. | Đổi thành `Đang học` / `Bảo lưu` / `Đình chỉ` / `Tốt nghiệp` / `Đã rút hồ sơ`. |
| `Loại dòng 'X' không hợp lệ.` (SV+HS) | Cột 1 không phải `SV` hoặc `HS`. | Sửa lại đúng `SV` hoặc `HS`. |

### A6.3. Lỗi về hệ thống

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Token không hợp lệ hoặc đã hết hạn.` | Quá 5 phút giữa preview và confirm. | Preview lại file. |
| `File vượt quá giới hạn 10 MB.` | File quá lớn. | Chia nhỏ file. |
| `Tổng số dòng vượt quá 10000.` | Quá nhiều dòng. | Chia nhỏ file. |
| `Chỉ chấp nhận file .xlsx.` | File không đúng định dạng. | Lưu lại dưới dạng `.xlsx` (không phải `.xls` hay `.csv`). |

---

## A7. Cách Export

1. Trên trang **Danh sách hồ sơ sinh viên**, **áp dụng các bộ lọc** nếu muốn (từ khóa, ngành, khóa, lớp, trạng thái...).
2. Bấm **Export** → file Excel được tải về với tên `danh-sach-sinh-vien-<timestamp>.xlsx`.
3. File chứa **toàn bộ kết quả theo filter** hiện tại (không giới hạn trang hiển thị).

### Phạm vi Export

| Phạm vi | Mô tả |
|---|---|
| **Toàn bộ kết quả lọc** (mặc định) | Tối đa 10.000 dòng. Nếu dữ liệu lớn hơn, hãy áp dụng filter để thu hẹp. |

---

## A8. Hiệu năng & giới hạn

Hệ thống được tối ưu cho file **10.000 dòng**:

| Chỉ số | Giá trị |
|---|---|
| **Giới hạn kích thước file** | 10 MB |
| **Giới hạn dòng tổng** (mọi sheet) | 10.000 |
| **Batch insert** | 500 dòng / lần qua JDBC `batchUpdate` |
| **Transaction** | 1 transaction / sheet (1 sheet lỗi không ảnh hưởng sheet khác) |
| **Cache danh mục** | Load 1 lần vào HashMap (O(1) lookup) |
| **Hibernate batch_size** | 500 |
| **Hibernate order_inserts** | true |
| **Token tạm** | Redis TTL 5 phút |

### Thời gian xử lý (ước tính)

| Quy mô | Thời gian preview | Thời gian confirm |
|---|---|---|
| 100 dòng / 1 sheet | < 1s | < 1s |
| 1.000 dòng / 1 sheet | 1-2s | 2-3s |
| 10.000 dòng / 1 sheet | 5-8s | 8-12s |
| 10.000 dòng / 3 sheet | 6-10s | 12-18s |

---

## A9. API Endpoints

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/ho-so-giay-to/import/preview` | Upload file → kiểm tra, trả về token nếu OK. |
| POST | `/api/ho-so-giay-to/import/confirm` | Xác nhận bằng token → ghi DB. |
| GET | `/api/ho-so-giay-to/import/mau` | Tải file mẫu (3 sheet: SV, HS, SV+HS). |

### Request: Preview

```
POST /api/ho-so-giay-to/import/preview
Content-Type: multipart/form-data
Body: file=@mau-import.xlsx
```

### Response: Preview thành công

```json
{
  "success": true,
  "data": {
    "failFast": false,
    "token": "uuid-temporary",
    "tongSoSheet": 2,
    "tongSoDong": 50,
    "tongDongHopLe": 48,
    "tongDongLoi": 2,
    "theoSheet": [
      {
        "tenSheet": "SV",
        "mode": "SINH_VIEN",
        "tongDong": 25,
        "dongHopLe": 25,
        "dongLoi": 0,
        "danhSachLoi": [],
        "rows": [...]
      }
    ]
  }
}
```

### Response: Preview fail-fast

```json
{
  "success": true,
  "data": {
    "failFast": true,
    "sheetLoiDauTien": "SV",
    "dongLoiDauTien": 3,
    "summaryMessage": "Sheet 'SV' lỗi ở dòng 3 (MSSV: B23DCCN003): Không tìm thấy Khoa: 'Khoa ABC'...",
    "theoSheet": [...]
  }
}
```

### Request: Confirm

```json
POST /api/ho-so-giay-to/import/confirm
Content-Type: application/json
{
  "token": "uuid-temporary"
}
```

### Response: Confirm

```json
{
  "success": true,
  "data": {
    "token": "uuid",
    "tongSoSheet": 2,
    "tongThanhCong": 48,
    "tongThatBai": 0,
    "thoiGianXuLyMs": 3245,
    "theoSheet": [
      {
        "tenSheet": "SV",
        "mode": "SINH_VIEN",
        "tongDong": 25,
        "thanhCong": 25,
        "thatBai": 0,
        "thoiGianXuLyMs": 1823
      }
    ],
    "errors": []
  }
}
```

---

## A10. Checklist trước khi Import (Phần A)

- [ ] File đúng định dạng `.xlsx`.
- [ ] Tên sheet thuộc 1 trong 3 nhóm: `SV` / `HS` / `SV+HS` (hoặc biến thể như `TT Sinh viên`, `Hồ sơ giấy tờ`).
- [ ] Header theo đúng **vị trí cột** (xem mục A4). Tên header có thể đặt tùy ý.
- [ ] Dòng đầu tiên (nếu là dòng hướng dẫn) phải bắt đầu bằng từ "Hướng dẫn" để hệ thống tự bỏ qua.
- [ ] Với sheet `SV`: đã chuẩn bị sẵn danh mục Khoa/Ngành/Lớp/Khóa học trong DB.
- [ ] Với sheet `HS`: đã import sinh viên trước (MSSV tồn tại).
- [ ] Với sheet `SV+HS`: dòng SV cùng MSSV đặt **trước** dòng HS.
- [ ] **Tên khoa / Tên ngành / Tên lớp / Tên khóa học** khớp 100% với DB (copy từ file Export nếu cần).
- [ ] Mã loại giấy tờ tồn tại trong bảng `LOAIGIAYTO`.
- [ ] Trạng thái nộp / Loại bản / Trạng thái học vụ thuộc giá trị cho phép.
- [ ] MSSV không trùng nhau giữa các dòng trong file.
- [ ] CCCD (nếu có) không trùng với sinh viên khác trong hệ thống.
- [ ] Tổng số dòng ≤ 10.000 và file ≤ 10 MB.

---

# PHẦN B — Danh mục (Khoa / Ngành / Khóa học / Lớp)

> **Phạm vi:** Trang **Cài đặt** → 4 tab **Khoa / Ngành / Khóa học / Lớp**. Mỗi tab có 3 nút: **Thêm mới**, **Import**, **Export**.

## B1. Tại sao phải Import theo thứ tự?

Vì các danh mục có **quan hệ phụ thuộc** trong database:

```
Bước 1: Khoa (độc lập)
  ↓
Bước 2: Ngành (cần Khoa)
  ↓
Bước 3: Khóa học (độc lập)
  ↓
Bước 4: Lớp (cần Ngành + Khóa học)
```

Nếu import sai thứ tự (VD: import Lớp trước khi chưa có Ngành), hệ thống sẽ **báo lỗi từng dòng** — dòng nào thiếu danh mục cha sẽ bị bỏ qua.

> ⚠️ **Nguyên tắc vàng:** Import theo đúng thứ tự 1 → 2 → 3 → 4. Không được nhảy cóc.

---

## B2. Bước 1/4 — Import KHOA

### B2.1. Cấu trúc file Excel

File `.xlsx` có **2 cột theo đúng thứ tự** (hệ thống đọc theo **vị trí cột**, không theo tên):

| # | Tên cột (gợi ý) | Bắt buộc? | Quy tắc chi tiết |
|---|---|---|---|
| 1 | `Tên khoa` | ✅ **Bắt buộc** | Tối đa 150 ký tự. **Không được trùng** với khoa đã có. |
| 2 | `Mô tả` | ❌ Tùy chọn | Tối đa 500 ký tự. Có thể để trống. |

### B2.2. Ví dụ file mẫu (sheet "Khoa" hoặc tùy ý)

| Tên khoa | Mô tả |
|---|---|
| Khoa Công nghệ thông tin | Khoa chuyên ngành CNTT và các ngành liên quan |
| Khoa Kinh tế | Khoa đào tạo các ngành kinh tế, quản trị |
| Khoa Ngoại ngữ | Khoa đào tạo tiếng Anh, Trung, Nhật |

### B2.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa. |
| `Khoa 'X' đã tồn tại.` | Tên khoa trùng với khoa đã có trong DB. | Đổi tên khác, hoặc bỏ qua dòng này. |

### B2.4. Cách import

1. Vào **Cài đặt** → tab **Khoa**.
2. Bấm nút **Import** ở thanh công cụ.
3. Modal mở → bấm **Tải file mẫu** để tải file `mau-import-khoa.xlsx` với 2 cột `Tên khoa`, `Mô tả`.
4. Mở file, **giữ nguyên dòng header**, điền dữ liệu từ dòng 3.
5. Lưu file `.xlsx` → upload lại → bấm **Import**.
6. Hệ thống báo: tổng dòng, thêm mới, lỗi (nếu có).

---

## B3. Bước 2/4 — Import NGÀNH

### B3.1. Cấu trúc file Excel

File `.xlsx` có **3 cột theo đúng thứ tự**:

| # | Tên cột (gợi ý) | Bắt buộc? | Quy tắc chi tiết |
|---|---|---|---|
| 1 | `Tên ngành` | ✅ **Bắt buộc** | Tối đa 150 ký tự. |
| 2 | `Tên khoa` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên khoa đã import ở Bước 1 (so sánh không phân biệt hoa/thường, bỏ khoảng trắng đầu/cuối). |
| 3 | `Mô tả` | ❌ Tùy chọn | Tối đa 500 ký tự. |

### B3.2. Ví dụ

| Tên ngành | Tên khoa | Mô tả |
|---|---|---|
| Công nghệ thông tin | Khoa Công nghệ thông tin | Ngành CNTT chuyên về phần mềm |
| Trí tuệ nhân tạo | Khoa Công nghệ thông tin | Ngành AI, Machine Learning |
| Quản trị kinh doanh | Khoa Kinh tế | Ngành QTKD chuyên ngành |

### B3.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên ngành không được để trống.` | Cột Tên ngành bị bỏ trống. | Điền tên ngành. |
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa (xem bước 1). |
| `Khoa 'X' không tồn tại. Vui lòng tạo Khoa trước.` | Tên khoa trong file **chưa có** trong DB. | Về tab Khoa → import Khoa đó trước. |
| `Ngành 'X' đã tồn tại trong khoa 'Y'.` | Cùng (tên ngành, tên khoa) đã có. | Đổi tên ngành khác, hoặc bỏ dòng. |

### B3.4. ⚠️ Lưu ý quan trọng: Tên khoa phải khớp chính xác

Hệ thống tìm khoa bằng **so sánh chuỗi** (case-insensitive, trim khoảng trắng đầu/cuối). Nếu trong DB là `Khoa Công nghệ thông tin` mà trong file ghi `CNTT` → **không tìm thấy**.

**Mẹo:** Bấm **Export** ở tab Khoa trước → copy chính xác cột `Tên khoa` → paste vào file import Ngành.

---

## B4. Bước 3/4 — Import KHÓA HỌC

### B4.1. Cấu trúc file Excel

File `.xlsx` có **4 cột theo đúng thứ tự**:

| # | Tên cột (gợi ý) | Bắt buộc? | Quy tắc chi tiết |
|---|---|---|---|
| 1 | `Tên khóa năm học` | ✅ **Bắt buộc** | Tối đa 100 ký tự. **Không trùng** với khóa đã có. |
| 2 | `Năm bắt đầu` | ❌ Tùy chọn | Phải là **số nguyên** (VD: 2024). |
| 3 | `Năm kết thúc` | ❌ Tùy chọn | Phải là **số nguyên** ≥ Năm bắt đầu. |
| 4 | `Mô tả` | ❌ Tùy chọn | Tối đa 500 ký tự. |

### B4.2. Ví dụ

| Tên khóa năm học | Năm bắt đầu | Năm kết thúc | Mô tả |
|---|---|---|---|
| Khóa 14 (2026–2030) | 2026 | 2030 | Sinh viên nhập học năm 2026 |
| Khóa 13 (2025–2029) | 2025 | 2029 | Sinh viên nhập học năm 2025 |

### B4.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khóa học không được để trống.` | Cột tên bị trống. | Điền tên khóa. |
| `Năm bắt đầu phải là số.` | Ghi text như "2024" nhưng format cell là text. | Đổi format cell thành Number nguyên. |
| `Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.` | `namKetThuc < namBatDau`. | Sửa lại năm. |
| `Khóa học 'X' đã tồn tại.` | Trùng tên. | Đổi tên khác. |

---

## B5. Bước 4/4 — Import LỚP

### B5.1. Cấu trúc file Excel

File `.xlsx` có **4 cột theo đúng thứ tự**:

| # | Tên cột (gợi ý) | Bắt buộc? | Quy tắc chi tiết |
|---|---|---|---|
| 1 | `Tên lớp` | ✅ **Bắt buộc** | Tối đa 100 ký tự. |
| 2 | `Tên ngành` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên ngành đã import ở Bước 2. |
| 3 | `Tên khoa năm học` | ✅ **Bắt buộc** | Phải **trùng khớp 100%** với tên khóa học đã import ở Bước 3. |
| 4 | `Mô tả` | ❌ Tùy chọn | Tối đa 500 ký tự. |

### B5.2. Ví dụ

| Tên lớp | Tên ngành | Tên khoa năm học | Mô tả |
|---|---|---|---|
| CNTT-2026.1 | Công nghệ thông tin | Khóa 14 (2026–2030) | Lớp chất lượng cao |
| AI-2025.2 | Trí tuệ nhân tạo | Khóa 13 (2025–2029) | Lớp AI nâng cao |

### B5.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên lớp không được để trống.` | Cột Tên lớp trống. | Điền tên. |
| `Ngành 'X' không tồn tại. Vui lòng tạo Ngành trước.` | Tên ngành trong file chưa có trong DB. | Import Ngành trước (Bước 2). |
| `Khóa năm học 'X' không tồn tại. Vui lòng tạo Khóa năm học trước.` | Tên khóa học trong file chưa có. | Import Khóa học trước (Bước 3). |
| `Lớp 'X' đã tồn tại trong ngành 'Y' khóa 'Z'.` | Trùng (tên lớp, ngành, khóa học). | Đổi tên lớp khác. |

### B5.4. Mẹo tránh lỗi chính tả

1. Bấm **Export** ở tab **Ngành** → copy chính xác cột `Tên ngành` → paste vào cột `Tên ngành` của file Lớp.
2. Tương tự với tab **Khóa học** → copy cột `Tên khoa năm học` → paste vào file Lớp.
3. Như vậy sẽ khớp 100%, không sợ lệch 1 ký tự.

---

## B6. Quy trình tổng hợp end-to-end

```
Bước 1: Tab Khoa      → Import khoa.xlsx      → ✅ Thành công
Bước 2: Tab Ngành     → Import nganh.xlsx     → ✅ Thành công  
Bước 3: Tab Khóa học  → Import khoa-hoc.xlsx  → ✅ Thành công
Bước 4: Tab Lớp       → Import lop.xlsx       → ✅ Thành công
Bước 5: Trang DSHS    → Import sinh-vien-ho-so.xlsx → ✅ Thành công (theo 2 bước Preview → Confirm)
```

> Nếu bất kỳ bước nào fail, **dừng lại** và kiểm tra:
> 1. File header có đúng số cột theo thứ tự không?
> 2. Dữ liệu trong file có khớp với DB không?
> 3. Trong file có dòng nào bị trống hoàn toàn không?
> 4. Kết quả import có hiển thị **danh sách lỗi theo dòng** không? Đọc kỹ thông báo lỗi.

---

## B7. Checklist trước khi Import danh mục

- [ ] Đã import xong **Khoa** (Bước 1) trước.
- [ ] Đã kiểm tra tab **Khoa** hiển thị đúng các khoa vừa tạo.
- [ ] File Excel dùng đúng **vị trí cột** theo bảng ở từng bước.
- [ ] **Tên khoa / Tên ngành / Tên khóa học** trong file khớp chính xác với DB (copy từ file Export nếu cần).
- [ ] Không trộn dòng trống xen kẽ.
- [ ] File dung lượng < 5 MB, định dạng `.xlsx`.

---

## B8. Xử lý lỗi khi xóa danh mục

Khi xóa Khoa / Ngành / Lớp / Khóa học, nếu còn sinh viên/lớp/ngành tham chiếu, hệ thống sẽ báo lỗi **chính xác** số lượng bị ảnh hưởng:

Ví dụ khi xóa Khoa:
```
⛔ Không thể xóa khoa vì đang được sử dụng bởi: 12 sinh viên và 2 ngành.
   Vui lòng xóa hoặc chuyển sang khoa khác trước.
```

Để xóa được Khoa, cần:
1. **Chuyển sinh viên** sang Khoa khác (qua import Excel sinh viên).
2. **Xóa các ngành** thuộc Khoa đó.
3. Thử xóa Khoa lại.

---

# Phụ lục — Câu hỏi thường gặp (FAQ)

**Tại sao tôi không thấy nút "Import" trực tiếp?**
Hệ thống dùng quy trình 2 bước. Bước 1 là **Kiểm tra file** (preview), bước 2 là **Xác nhận import** (confirm). Điều này giúp bạn thấy lỗi trước khi ghi vào DB.

**File tôi có 100 dòng, dòng 5 lỗi — tôi phải làm sao?**
1. Sửa dòng 5 trong file Excel.
2. Upload lại file đã sửa.
3. Hệ thống quét lại từ đầu, nếu hết lỗi → cho phép import.

**Import fail-fast nghĩa là gì?**
Nghĩa là hệ thống **dừng ngay** khi gặp lỗi đầu tiên và **không import bất kỳ dòng nào** (kể cả dòng OK phía trước). Mục đích: buộc người dùng sửa file sạch trước khi import.

**Tôi muốn cập nhật sinh viên đã có (đổi khoa, ngành, ...)?**
Hiện tại import **chỉ thêm mới**. Để cập nhật, dùng chức năng chỉnh sửa từng sinh viên (đang phát triển).

**File Excel của tôi mở bằng WPS / Numbers / Google Sheets có tương thích không?**
Có, miễn lưu đúng định dạng `.xlsx`.

**Import có tạo lịch sử / audit không?**
- Với import hồ sơ giấy tờ (sheet `HS` / `SV+HS`): có — hệ thống tự động ghi 1 dòng `LICHSUNOP` với `hanh_dong = 'IMPORT_EXCEL'` cho mỗi hồ sơ được tạo.
- Với import sinh viên (sheet `SV`): chưa ghi audit (chỉ tạo mới sinh viên).

**Tôi không thấy sinh viên mới trên trang sau khi import?**
Trang sẽ tự reload sau khi import. Nếu vẫn không thấy, kiểm tra bộ lọc đang áp dụng (có thể đang lọc theo trạng thái / ngành khiến sinh viên mới không hiển thị).

**Tại sao response preview có thêm trường `tenLoai` và `batBuoc`?**
Khi gọi `/api/ho-so-giay-to/import/preview`, mỗi dòng HS trong mảng `rows[].data` được enrich thêm 2 trường từ `LOAIGIAYTO` cache:
- `tenLoai` (String) — tên đầy đủ (VD: `"Giấy khai sinh"`).
- `batBuoc` (Boolean) — cờ bắt buộc, dùng để hiển thị badge (đỏ = bắt buộc, xám = không bắt buộc).

Mục đích: frontend không cần query thêm `LOAIGIAYTO` để hiển thị preview. Import vẫn dùng `maLoai` (chính xác 100%).

Ví dụ 1 dòng HS trong response preview:
```json
{
  "mssv": "B23DCCN001",
  "maLoai": "GT01",
  "tenLoai": "Giấy khai sinh",
  "batBuoc": true,
  "trangThaiNop": "Đã nộp",
  "loaiBan": "Bản gốc"
}
```

---

# Phụ lục — Bảng 13 mã loại giấy tờ (`LOAIGIAYTO`)

> Hệ thống đang dùng bộ mã cố định `GT01`–`GT13` (seed trong `V2__seed_data.sql`). Import chỉ chấp nhận các mã dưới đây.

| Mã | Tên giấy tờ | Bắt buộc? | STT |
|---|---|---|---|
| `GT01` | Giấy khai sinh | ✅ Có | 1 |
| `GT02` | Bằng tốt nghiệp THPT | ✅ Có | 2 |
| `GT03` | Học bạ THPT | ✅ Có | 3 |
| `GT04` | Giấy xác nhận học lực | ✅ Có | 4 |
| `GT05` | Ảnh 3x4 | ✅ Có | 5 |
| `GT06` | CMND/CCCD | ✅ Có | 6 |
| `GT07` | Sổ khám sức khỏe | ✅ Có | 7 |
| `GT08` | Giấy xác nhận ưu tiên | ✅ Có | 8 |
| `GT09` | Giấy chuyển trường | ❌ Không | 9 |
| `GT10` | Bảng điểm các kỳ | ❌ Không | 10 |
| `GT11` | Giấy xác nhận hoàn thành nghĩa vụ quân sự | ❌ Không | 11 |
| `GT12` | Chứng chỉ ngoại ngữ | ❌ Không | 12 |
| `GT13` | Các giấy tờ khác | ❌ Không | 13 |

**Quy tắc "Đủ giấy tờ"**: Chỉ tính trên 8 giấy bắt buộc (GT01–GT08). 5 giấy còn lại (GT09–GT13) là tùy chọn, không tính vào "đủ".

**Mẹo ghi file Excel**: Ghi cột `Mã loại giấy tờ` theo mã (`GT01`, `GT06`...) để tra cứu chính xác 100%. Nếu muốn người dùng dễ đọc, có thể ghi theo tên — hệ thống vẫn chấp nhận (tra mã trước, fallback tên).

---

## Liên kết hữu ích

- `AGENTS.md` (root) — tổng quan dự án, quy tắc nghiệp vụ.
- `API.md` — hợp đồng API đầy đủ.
- Trang chức năng: `frontend/src/pages/TrangDanhSachHoSo.tsx`.
- Service import backend: `backend/.../service/HoSoGiayToImportService.java` (Phần A), `SinhVienImportService.java` (cũ).
- Service Excel backend: `backend/.../service/SinhVienExcelService.java`, `DanhMucExcelService.java`.

---

**Phiên bản tài liệu:** 3.1 — Sửa mã loại giấy tờ (`GT01`–`GT13`), thêm Phụ lục bảng 13 mã, FAQ về response preview enrich (`tenLoai`/`batBuoc`).
