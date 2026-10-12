# Hướng dẫn Import / Export Excel — Trang Danh sách sinh viên

> Tài liệu dành cho **người dùng cuối** (chuyên viên đào tạo - tuyển sinh, role `ADMIN`).
> Mục tiêu: hướng dẫn cách tạo file Excel đúng định dạng để import vào hệ thống,
> cũng như cách đọc file xuất ra từ hệ thống.
>
> **Phiên bản tài liệu:** 2.0 — cập nhật theo fail-fast mode (V7).
> Hệ thống sử dụng **2 bước (Preview → Confirm)** với chế độ **fail-fast**:
> nếu file Excel có lỗi ở bất kỳ dòng nào, hệ thống **dừng ngay** và yêu cầu
> người dùng sửa file trước khi import.

---

## 1. Hai chức năng, hai nút

Trên trang **Danh sách hồ sơ sinh viên** có 2 nút ở góc phải thanh công cụ:

| Nút | Chức năng |
|---|---|
| **Import** | Upload file Excel để **thêm mới** sinh viên (KHÔNG ghi đè dữ liệu cũ) |
| **Export** | Tải file Excel chứa danh sách sinh viên (đúng filter đang hiển thị) |

Ngoài ra trong modal Import có nút **Tải file mẫu** để lấy template chuẩn.

---

## 2. Quy trình Import 2 bước (Preview → Confirm)

Hệ thống dùng quy trình **2 bước** để đảm bảo an toàn dữ liệu:

```
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 1: UPLOAD + KIỂM TRA (PREVIEW)                         │
│  • User chọn file Excel                                      │
│  • Hệ thống quét từng dòng                                   │
│  • Nếu phát hiện lỗi ở DÒNG ĐẦU TIÊN → DỪNG NGAY            │
│  • Trả về: số dòng OK, số dòng lỗi, lỗi chi tiết             │
└──────────────────────────────────────────────────────────────┘
                              ↓ (chỉ khi không có lỗi)
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 2: XÁC NHẬN (CONFIRM)                                 │
│  • User nhấn "Xác nhận import"                               │
│  • Hệ thống ghi TẤT CẢ sinh viên hợp lệ vào DB              │
│  • Báo cáo kết quả cuối cùng                                 │
└──────────────────────────────────────────────────────────────┘
```

### Tại sao dùng fail-fast?

| Vấn đề (best-effort cũ) | Giải pháp (fail-fast) |
|---|---|
| Import 99 dòng OK, bỏ 1 dòng lỗi → user không biết thiếu gì | Dừng ngay tại dòng lỗi đầu tiên |
| Phải đọc cả danh sách lỗi để biết cần sửa gì | Thấy ngay dòng lỗi + lý do |
| Mất kiểm soát dữ liệu đã import | Đảm bảo toàn vẹn: chỉ import khi 100% OK |

---

## 3. Cấu trúc file Excel

### 3.1. Thứ tự cột bắt buộc

File Excel (định dạng `.xlsx`) phải có **đúng 14 cột theo thứ tự** sau ở dòng header.
Tên cột phải khớp 100% (kể cả dấu và khoảng trắng) — hệ thống nhận diện theo **vị trí cột**, không phải tên.

| # | Tên cột (header) | Bắt buộc? | Ghi chú |
|---|---|---|---|
| 1 | `MSSV` | ✅ Bắt buộc | Khóa chính. Tối đa 20 ký tự. |
| 2 | `Họ tên` | ✅ Bắt buộc | Tối đa 150 ký tự. |
| 3 | `Ngày sinh` | Tùy chọn | Hỗ trợ: `dd/MM/yyyy`, `yyyy-MM-dd`, hoặc ô định dạng ngày Excel. |
| 4 | `Giới tính` | Tùy chọn | Tối đa 10 ký tự (VD: `Nam`, `Nữ`). |
| 5 | `CCCD` | Tùy chọn | Phải **duy nhất** trong hệ thống. Tối đa 20 ký tự. |
| 6 | `SĐT` | Tùy chọn | Tối đa 20 ký tự. |
| 7 | `Email` | Tùy chọn | Tối đa 100 ký tự. |
| 8 | `Quê quán` | Tùy chọn | Tối đa 255 ký tự. |
| 9 | `Tên khoa` | Tùy chọn | Phải **trùng khớp** với tên khoa trong Cài đặt → tab Khoa. |
| 10 | `Tên ngành` | Tùy chọn | Phải **trùng khớp** với tên ngành trong Cài đặt → tab Ngành. |
| 11 | `Tên lớp` | Tùy chọn | Phải **trùng khớp** với tên lớp trong Cài đặt → tab Lớp. |
| 12 | `Tên khóa học` | Tùy chọn | Phải **trùng khớp** với tên khóa học trong Cài đặt → tab Khóa học. |
| 13 | `Hệ đào tạo` | Tùy chọn | Tối đa 50 ký tự. |
| 14 | `Trạng thái học vụ` | Tùy chọn | Phải là **đúng một** trong: `Đang học`, `Bảo lưu`, `Đình chỉ`, `Tốt nghiệp`, `Đã rút hồ sơ`. Nếu bỏ trống → mặc định `Đang học`. |

### 3.2. Dòng header

- **Dòng 1 (nếu có):** có thể là dòng hướng dẫn (bắt đầu bằng từ "Hướng dẫn") — sẽ được bỏ qua.
- **Dòng header tiếp theo:** chứa tên cột (theo bảng trên) — sẽ được bỏ qua.
- **Dòng dữ liệu:** bắt đầu từ đây.

> **Mẹo:** Bấm **Tải file mẫu** trong modal Import sẽ tải về file có sẵn cấu trúc đúng + 1 dòng ví dụ — bạn chỉ cần xóa dòng ví dụ và điền dữ liệu thật.

### 3.3. Ví dụ file mẫu

| MSSV | Họ tên | Ngày sinh | Giới tính | CCCD | SĐT | Email | Quê quán | Tên khoa | Tên ngành | Tên lớp | Tên khóa học | Hệ đào tạo | Trạng thái học vụ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B23DCCN001 | Nguyễn Văn A | 2005-01-15 | Nam | 079205001234 | 0912345678 | a@example.com | Hà Nội | Khoa CNTT | Công nghệ thông tin | CNTT-K23.1 | Khóa K23 (2023-2027) | Chính quy | Đang học |
| B23DCCN002 | Trần Thị B | 15/03/2005 | Nữ | 079205002345 | 0987654321 | b@example.com | TP. HCM | Khoa CNTT | Công nghệ thông tin | CNTT-K23.1 | Khóa K23 (2023-2027) | Chính quy | Đang học |

---

## 4. Cách Import từng bước

### Bước 1: Upload file

1. Vào **Danh sách hồ sơ sinh viên**.
2. Bấm **Import** ở thanh công cụ.
3. Modal mở ra → bấm **chọn file** (chỉ chấp nhận `.xlsx`).
4. Bấm **Kiểm tra file** (nút này thay cho nút Import cũ).

### Bước 2: Hệ thống quét (fail-fast)

Sau khi nhấn **Kiểm tra file**, có 2 kịch bản:

#### Kịch bản A: File có lỗi ở dòng N (fail-fast)
- Hệ thống **dừng quét** ngay tại dòng N.
- Hiển thị hộp thoại đỏ với thông tin:

  ```
  ⛔ Phát hiện lỗi ở dòng N (MSSV: B23DCCN005):
  • Không tìm thấy Khoa: 'Khoa ABC'. Vui lòng kiểm tra lại tên Khoa.
  
  👉 Mở file Excel, sửa dòng N và upload lại.
  ```

- **Không có dòng nào** được ghi vào database.
- User phải:
  1. Mở file Excel
  2. Sửa dòng N (điền đúng Tên khoa / Tên ngành / v.v.)
  3. Upload lại file đã sửa

#### Kịch bản B: Tất cả dòng đều hợp lệ
- Modal chuyển sang bước **Preview**.
- Hiển thị:
  - **Số dòng sẽ thêm mới**: N
  - **Tổng dòng**: N
  - Bảng chi tiết từng dòng (MSSV, Họ tên, đối chiếu danh mục)
- User nhấn **Xác nhận import (N)** để ghi vào DB.

### Bước 3: Xác nhận (Confirm)

- Hệ thống INSERT tất cả sinh viên hợp lệ vào DB.
- Trả về kết quả cuối cùng: số dòng thành công, số dòng lỗi (nếu có lỗi runtime).
- Danh sách sinh viên trên trang tự reload.

### Sơ đồ quy trình

```
Upload file → Kiểm tra
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   Có lỗi              Tất cả OK
   (fail-fast)              ↓
        ↓              Preview OK
   Sửa file          → Xác nhận import
   Upload lại              ↓
        ↓              Ghi DB
   Lặp lại                ↓
                   Kết quả cuối
```

---

## 5. Lỗi thường gặp & cách xử lý

| Lỗi hiển thị | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Thiếu MSSV.` | Cột 1 (MSSV) bị bỏ trống. | Điền MSSV. |
| `Thiếu họ tên.` | Cột 2 (Họ tên) bị bỏ trống. | Điền họ tên. |
| `Không tìm thấy Khoa: '...'.` | Tên khoa trong file chưa có trong Cài đặt → tab Khoa. | Vào Cài đặt → import Khoa trước. |
| `Không tìm thấy Ngành: '...'.` | Tên ngành chưa có hoặc sai chính tả. | Vào Cài đặt → import Ngành trước. |
| `MSSV 'X' đã tồn tại trong hệ thống.` | MSSV bị trùng với sinh viên đã có. | Đổi MSSV khác, hoặc xóa dòng này. |
| `CCCD 'X' đã thuộc sinh viên khác.` | CCCD trùng với SV khác. | Đổi CCCD khác. |
| `MSSV 'X' bị lặp trong cùng file.` | Có 2 dòng cùng MSSV. | Xóa 1 dòng. |
| `Trạng thái học vụ 'X' không hợp lệ.` | Không thuộc 5 giá trị cho phép. | Đổi thành `Đang học` / `Bảo lưu` / v.v. |

### Lỗi ở dòng nào sẽ hiển thị rõ trên giao diện

Ví dụ khi file có 5 dòng, dòng 3 lỗi:
```
Dòng | MSSV         | Họ tên        | Trạng thái | Thông tin
-----|--------------|---------------|------------|------------------
1    | B23DCCN001   | Nguyễn Văn A  | ✅ OK      | Khoa: CNTT | ...
2    | B23DCCN002   | Trần Thị B    | ✅ OK      | Khoa: CNTT | ...
3    | B23DCCN003   | Lê Văn C      | ⛔ LỖI     | Không tìm thấy Khoa: 'CNTT ABC'
                                                  → Vui lòng sửa dòng 3
```

> **Nguyên tắc:** Sửa xong dòng lỗi → upload lại file. Hệ thống sẽ quét lại từ đầu.

---

## 6. Quy tắc nghiệp vụ (sau V7)

- **KHÔNG ghi đè:** Nếu MSSV đã tồn tại → từ chối, báo lỗi (không update).
- **Fail-fast:** Nếu bất kỳ dòng nào lỗi → dừng toàn bộ, không lưu gì.
- **Validate đầy đủ:** Trước khi INSERT, kiểm tra:
  - MSSV không trống, hợp lệ
  - Họ tên không trống
  - Khoa / Ngành / Lớp / Khóa học phải tồn tại trong DB (nếu có điền)
  - CCCD không trùng SV khác
  - Trạng thái học vụ hợp lệ

> ⚠️ Import **KHÔNG phải upsert.** Nếu cần cập nhật SV đã có, dùng chức năng chỉnh sửa từng sinh viên (đang phát triển).

---

## 7. Cách Export

1. Trên trang **Danh sách hồ sơ sinh viên**, **áp dụng các bộ lọc** nếu muốn (từ khóa, ngành, khóa, lớp, trạng thái...).
2. Bấm **Export** → file Excel được tải về với tên `danh-sach-sinh-vien-<timestamp>.xlsx`.
3. File chứa **toàn bộ kết quả theo filter** hiện tại (không giới hạn trang hiển thị).

### Phạm vi Export

| Phạm vi | Mô tả |
|---|---|
| **Toàn bộ kết quả lọc** (mặc định) | Tối đa 10.000 dòng. Nếu dữ liệu lớn hơn, hãy áp dụng filter để thu hẹp. |

---

## 8. Checklist trước khi Import

- [ ] File đúng định dạng `.xlsx`.
- [ ] Dòng header đúng **14 cột** theo thứ tự (xem mục 3.1).
- [ ] Tất cả dòng có dữ liệu đều có **MSSV** và **Họ tên**.
- [ ] MSSV không trùng nhau giữa các dòng trong file.
- [ ] CCCD (nếu có) không trùng với sinh viên khác đã có trong hệ thống.
- [ ] **Tên khoa / Tên ngành / Tên lớp / Tên khóa học** (nếu có) phải trùng khớp 100% với DB.
- [ ] Trạng thái học vụ (nếu có) nằm trong 5 giá trị cho phép.
- [ ] Ngày sinh (nếu có) đúng định dạng `dd/MM/yyyy` hoặc `yyyy-MM-dd`, hoặc ô định dạng ngày Excel.
- [ ] File dung lượng < 10 MB.
- [ ] Đã import xong **Khoa / Ngành / Lớp / Khóa học** trong Cài đặt (nếu file có thông tin danh mục).

---

## 9. Câu hỏi thường gặp

**Tại sao tôi không thấy nút "Import" trực tiếp?**
Từ V7, hệ thống dùng quy trình 2 bước. Bước 1 là **Kiểm tra file** (preview), bước 2 là **Xác nhận import** (confirm). Điều này giúp bạn thấy lỗi trước khi ghi vào DB.

**File tôi có 100 dòng, dòng 5 lỗi — tôi phải làm sao?**
1. Sửa dòng 5 trong file Excel.
2. Upload lại file đã sửa.
3. Hệ thống quét lại từ đầu, nếu hết lỗi → cho phép import.

**Import fail-fast nghĩa là gì?**
Nghĩa là hệ thống **dừng ngay** khi gặp lỗi đầu tiên và **không import bất kỳ dòng nào** (kể cả dòng OK phía trước). Mục đích: buộc người dùng sửa file sạch trước khi import.

**Tôi không thấy sinh viên mới trên trang sau khi import?**
Trang sẽ tự reload sau khi import. Nếu vẫn không thấy, kiểm tra bộ lọc đang áp dụng (có thể đang lọc theo trạng thái / ngành khiến sinh viên mới không hiển thị).

**Tôi muốn cập nhật sinh viên đã có (đổi khoa, ngành, ...)?**
Hiện tại import **chỉ thêm mới**. Để cập nhật, dùng chức năng chỉnh sửa từng sinh viên (đang phát triển).

**File Excel của tôi mở bằng WPS / Numbers có tương thích không?**
Có, miễn lưu đúng định dạng `.xlsx`.

**Import có tạo lịch sử / audit không?**
Hiện tại import chỉ tạo mới sinh viên. Việc ghi lịch sử thay đổi trạng thái học vụ cần thực hiện qua API riêng (xem `AGENTS.md` mục Quy tắc nghiệp vụ).

---

## 10. Liên kết hữu ích

- `AGENTS.md` (root) — tổng quan dự án, quy tắc nghiệp vụ.
- `API.md` — hợp đồng API đầy đủ, bao gồm 3 endpoint Excel.
- Trang chức năng: `frontend/src/pages/TrangDanhSachHoSo.tsx`.
- Service Excel backend: `backend/.../service/SinhVienExcelService.java`.
- Service import: `backend/.../service/SinhVienImportService.java`.

---

# PHẦN 2 — Hướng dẫn Import/Export Danh mục (Khoa → Ngành → Khóa học → Lớp)

> **Phạm vi:** Trang **Cài đặt** → 4 tab **Khoa / Ngành / Khóa học / Lớp**. Mỗi tab có 3 nút: **Thêm mới**, **Import**, **Export**.

---

## 11. Tại sao phải Import theo THỨ TỰ?

Vì các danh mục có **quan hệ phụ thuộc** trong database:

```
Khoa (độc lập)            ← Bước 1
  └── Ngành (cần Khoa)     ← Bước 2
Khóa học (độc lập)        ← Bước 3
  └── Lớp (cần Ngành + Khóa học)  ← Bước 4
```

Nếu import sai thứ tự (VD: import Lớp trước khi chưa có Ngành), hệ thống sẽ **báo lỗi từng dòng** — dòng nào thiếu danh mục cha sẽ bị bỏ qua.

> ⚠️ **Nguyên tắc vàng:** Import theo đúng thứ tự 1 → 2 → 3 → 4. Không được nhảy cóc.

---

## 12. Bước 1/4 — Import KHOA

### 12.1. Cấu trúc file Excel

File `.xlsx` có **2 cột** theo đúng thứ tự (hệ thống đọc theo **vị trí cột**, không theo tên):

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên khoa` | ✅ Bắt buộc | Tối đa 150 ký tự. **Không được trùng** với khoa đã có. |
| 2 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. Có thể để trống. |

### 12.2. Ví dụ

| Tên khoa | Mô tả |
|---|---|
| Khoa Công nghệ thông tin | Khoa chuyên ngành CNTT và các ngành liên quan |
| Khoa Kinh tế | Khoa đào tạo các ngành kinh tế, quản trị |
| Khoa Ngoại ngữ | Khoa đào tạo tiếng Anh, Trung, Nhật |

### 12.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa. |
| `Khoa 'X' đã tồn tại.` | Tên khoa trùng với khoa đã có trong DB. | Đổi tên khác, hoặc bỏ qua dòng này. |

### 12.4. Cách import

1. Vào **Cài đặt** → tab **Khoa**.
2. Bấm nút **Import** ở thanh công cụ.
3. Modal mở → bấm **Tải file mẫu** để tải file `mau-import-khoa.xlsx` với 2 cột `Tên khoa`, `Mô tả`.
4. Mở file, **giữ nguyên dòng header**, điền dữ liệu từ dòng 3.
5. Lưu file `.xlsx` → upload lại → bấm **Import**.
6. Hệ thống báo: tổng dòng, thêm mới, lỗi (nếu có).

---

## 13. Bước 2/4 — Import NGÀNH

### 13.1. Cấu trúc file Excel

File `.xlsx` có **3 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên ngành` | ✅ Bắt buộc | Tối đa 150 ký tự. |
| 2 | `Tên khoa` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên khoa đã import ở Bước 1 (so sánh không phân biệt hoa/thường, bỏ khoảng trắng đầu/cuối). |
| 3 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 13.2. Ví dụ

| Tên ngành | Tên khoa | Mô tả |
|---|---|---|
| Công nghệ thông tin | Khoa Công nghệ thông tin | Ngành CNTT chuyên về phần mềm |
| Trí tuệ nhân tạo | Khoa Công nghệ thông tin | Ngành AI, Machine Learning |
| Quản trị kinh doanh | Khoa Kinh tế | Ngành QTKD chuyên ngành |

### 13.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên ngành không được để trống.` | Cột Tên ngành bị bỏ trống. | Điền tên ngành. |
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa (xem bước 1). |
| `Khoa 'X' không tồn tại. Vui lòng tạo Khoa trước.` | Tên khoa trong file **chưa có** trong DB. | Về tab Khoa → import Khoa đó trước. |
| `Ngành 'X' đã tồn tại trong khoa 'Y'.` | Cùng (tên ngành, tên khoa) đã có. | Đổi tên ngành khác, hoặc bỏ dòng. |

### 13.4. ⚠️ Lưu ý quan trọng: Tên khoa phải khớp chính xác

Hệ thống tìm khoa bằng **so sánh chuỗi** (case-insensitive, trim khoảng trắng). Nếu trong DB là `Khoa Công nghệ thông tin` mà trong file ghi `CNTT` → **không tìm thấy**.

**Mẹo:** Bấm **Export** ở tab Khoa trước → copy chính xác cột `Tên khoa` → paste vào file import Ngành.

---

## 14. Bước 3/4 — Import KHÓA HỌC (Khóa năm học)

### 14.1. Cấu trúc file Excel

File `.xlsx` có **4 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên khóa năm học` | ✅ Bắt buộc | Tối đa 100 ký tự. **Không trùng** với khóa đã có. |
| 2 | `Năm bắt đầu` | Tùy chọn | Phải là **số nguyên** (VD: 2024). |
| 3 | `Năm kết thúc` | Tùy chọn | Phải là **số nguyên** ≥ Năm bắt đầu. |
| 4 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 14.2. Ví dụ

| Tên khóa năm học | Năm bắt đầu | Năm kết thúc | Mô tả |
|---|---|---|---|
| Khóa 14 (2026–2030) | 2026 | 2030 | Sinh viên nhập học năm 2026 |
| Khóa 13 (2025–2029) | 2025 | 2029 | Sinh viên nhập học năm 2025 |

### 14.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khóa học không được để trống.` | Cột tên bị trống. | Điền tên khóa. |
| `Năm bắt đầu phải là số.` | Ghi text như "2024" nhưng format cell là text. | Đổi format cell thành Number nguyên. |
| `Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.` | `namKetThuc < namBatDau`. | Sửa lại năm. |
| `Khóa học 'X' đã tồn tại.` | Trùng tên. | Đổi tên khác. |

---

## 15. Bước 4/4 — Import LỚP

### 15.1. Cấu trúc file Excel

File `.xlsx` có **4 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên lớp` | ✅ Bắt buộc | Tối đa 100 ký tự. |
| 2 | `Tên ngành` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên ngành đã import ở Bước 2. |
| 3 | `Tên khoa năm học` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên khóa học đã import ở Bước 3. |
| 4 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 15.2. Ví dụ

| Tên lớp | Tên ngành | Tên khoa năm học | Mô tả |
|---|---|---|---|
| CNTT-2026.1 | Công nghệ thông tin | Khóa 14 (2026–2030) | Lớp chất lượng cao |
| AI-2025.2 | Trí tuệ nhân tạo | Khóa 13 (2025–2029) | Lớp AI nâng cao |

### 15.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên lớp không được để trống.` | Cột Tên lớp trống. | Điền tên. |
| `Khoa 'X' không tồn tại. Vui lòng tạo Khoa trước.` | Ngành đang reference tới Khoa chưa có. | Import Khoa trước (Bước 1). |
| `Ngành 'X' không tồn tại trong khoa 'Y'. Vui lòng tạo Ngành trước.` | Tên ngành trong file chưa có trong DB. | Import Ngành trước (Bước 2). |
| `Khóa năm học 'X' không tồn tại. Vui lòng tạo Khóa năm học trước.` | Tên khóa học trong file chưa có. | Import Khóa học trước (Bước 3). |
| `Lớp 'X' đã tồn tại trong ngành 'Y' khóa 'Z'.` | Trùng (tên lớp, ngành, khóa học). | Đổi tên lớp khác. |

### 15.4. Mẹo tránh lỗi chính tả

1. Bấm **Export** ở tab **Ngành** → copy chính xác cột `Tên ngành` → paste vào cột `Tên ngành` của file Lớp.
2. Tương tự với tab **Khóa học** → copy cột `Tên khóa năm học` → paste vào file Lớp.
3. Như vậy sẽ khớp 100%, không sợ lệch 1 ký tự.

---

## 16. Checklist trước khi Import danh mục

- [ ] Đã import xong **Khoa** (Bước 1) trước.
- [ ] Đã kiểm tra tab **Khoa** hiển thị đúng các khoa vừa tạo.
- [ ] File Excel dùng đúng **header** theo bảng ở từng bước.
- [ ] **Tên khoa / Tên ngành / Tên khóa học** trong file khớp chính xác với DB (copy từ file Export nếu cần).
- [ ] Không trộn dòng trống xen kẽ.
- [ ] File dung lượng < 5 MB, định dạng `.xlsx`.

---

## 17. Quy trình tổng hợp (end-to-end)

```
1. Tab Khoa      → Import khoa.xlsx      → ✅ Thành công
2. Tab Ngành     → Import nganh.xlsx     → ✅ Thành công  
3. Tab Khóa học  → Import khoa-hoc.xlsx  → ✅ Thành công
4. Tab Lớp       → Import lop.xlsx       → ✅ Thành công
5. Trang DSHS    → Import sinh-vien.xlsx → ✅ Thành công (theo 2 bước Preview → Confirm)
```

> Nếu bất kỳ bước nào fail, **dừng lại** và kiểm tra:
> 1. File header có đúng số cột theo thứ tự không?
> 2. Dữ liệu trong file có khớp với DB không?
> 3. Trong file có dòng nào bị trống hoàn toàn không?
> 4. Kết quả import có hiển thị **danh sách lỗi theo dòng** không? Đọc kỹ thông báo lỗi.

---

## 18. Xử lý lỗi khi xóa danh mục (V7)

Khi xóa Khoa / Ngành / Lớp / Khóa học, nếu còn sinh viên/lớp/ngành tham chiếu, hệ thống sẽ báo lỗi **chính xác** số lượng bị ảnh hưởng:

Ví dụ khi xóa Khoa:
```
⛔ Không thể xóa khoa vì đang được sử dụng bởi: 12 sinh viên và 2 ngành.
   Vui lòng xóa hoặc chuyển sang khoa khác trước.
```

Để xóa được Khoa, cần:
1. **Chuyển sinh viên** sang Khoa khác (qua import Excel sinh viên — sau V7)
2. **Xóa các ngành** thuộc Khoa đó
3. Thử xóa Khoa lại

**Tham khảo:** Script xóa dữ liệu cũ để reset: `assets/cleanup_old_data.sql` (CHỈ dùng trong dev/test).

---

**Phiên bản tài liệu:** 2.0 — cập nhật theo fail-fast mode (V7), thêm hướng dẫn 2 bước Preview/Confirm.
