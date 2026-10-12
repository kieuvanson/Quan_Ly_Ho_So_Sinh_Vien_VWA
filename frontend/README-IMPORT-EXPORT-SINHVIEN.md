# Hướng dẫn Import / Export Excel — Trang Danh sách sinh viên

> Tài liệu dành cho **người dùng cuối** (chuyên viên đào tạo - tuyển sinh, role `ADMIN`).
> Mục tiêu: hướng dẫn cách tạo file Excel đúng định dạng để import vào hệ thống,
> cũng như cách đọc file xuất ra từ hệ thống.

---

## 1. Hai chức năng, hai nút

Trên trang **Danh sách hồ sơ sinh viên** có 2 nút ở góc phải thanh công cụ:

| Nút | Chức năng |
|---|---|
| **Import** | Upload file Excel để thêm mới / cập nhật hàng loạt sinh viên |
| **Export** | Tải file Excel chứa danh sách sinh viên (đúng filter đang hiển thị) |

Ngoài ra trong modal Import có nút **Tải file mẫu** để lấy template chuẩn.

---

## 2. Cấu trúc file Excel

### 2.1. Thứ tự cột bắt buộc

File Excel (định dạng `.xlsx`) phải có **đúng 14 cột theo thứ tự** sau ở dòng header.
Tên cột phải khớp 100% (kể cả dấu và khoảng trắng) — hệ thống nhận diện theo **vị trí cột**, không phải tên.

| # | Tên cột (header) | Bắt buộc? | Ghi chú |
|---|---|---|---|
| 1 | `MSSV` | ✅ Bắt buộc | Khóa chính. Nếu đã tồn tại → cập nhật. Nếu chưa có → tạo mới. Tối đa 20 ký tự. |
| 2 | `Họ tên` | ✅ Bắt buộc | Tối đa 150 ký tự. |
| 3 | `Ngày sinh` | Tùy chọn | Hỗ trợ: `dd/MM/yyyy`, `yyyy-MM-dd`, hoặc ô định dạng ngày Excel. |
| 4 | `Giới tính` | Tùy chọn | Tối đa 10 ký tự (VD: `Nam`, `Nữ`). |
| 5 | `CCCD` | Tùy chọn | Phải **duy nhất** trong hệ thống. Tối đa 20 ký tự. |
| 6 | `SĐT` | Tùy chọn | Tối đa 20 ký tự. |
| 7 | `Email` | Tùy chọn | Tối đa 100 ký tự. |
| 8 | `Quê quán` | Tùy chọn | Tối đa 255 ký tự. |
| 9 | `Ngành` | Tùy chọn | Tối đa 100 ký tự. |
| 10 | `Lớp` | Tùy chọn | Tối đa 20 ký tự. |
| 11 | `Khóa` | Tùy chọn | Tối đa 50 ký tự. |
| 12 | `Khóa nhập học` | Tùy chọn | Tối đa 50 ký tự. |
| 13 | `Hệ đào tạo` | Tùy chọn | Tối đa 50 ký tự. |
| 14 | `Trạng thái học vụ` | Tùy chọn | Phải là **đúng một** trong: `Đang học`, `Bảo lưu`, `Đình chỉ`, `Tốt nghiệp`, `Đã rút hồ sơ`. Nếu bỏ trống → mặc định `Đang học`. |

### 2.2. Dòng header

- **Dòng 1 (nếu có):** có thể là dòng hướng dẫn (bắt đầu bằng từ "Hướng dẫn") — sẽ được bỏ qua.
- **Dòng header tiếp theo:** chứa tên cột (theo bảng trên) — sẽ được bỏ qua.
- **Dòng dữ liệu:** bắt đầu từ đây.

> **Mẹo:** Bấm **Tải file mẫu** trong modal Import sẽ tải về file có sẵn cấu trúc đúng + 1 dòng ví dụ — bạn chỉ cần xóa dòng ví dụ và điền dữ liệu thật.

### 2.3. Quy tắc dữ liệu

| Quy tắc | Chi tiết |
|---|---|
| Dòng trống | Được bỏ qua tự động. |
| MSSV trống | Dòng bị **báo lỗi**, không import. |
| Họ tên trống | Dòng bị **báo lỗi**, không import. |
| MSSV trùng với dòng khác trong cùng file | Báo lỗi trùng MSSV trong file (chỉ dòng xuất hiện sau được coi là hợp lệ nếu trùng DB). |
| Trạng thái học vụ không hợp lệ | Bỏ qua giá trị này, mặc định `Đang học`. |
| Ngày sinh không parse được | Bỏ qua, để trống. |
| CCCD trùng với SV khác trong hệ thống | Báo lỗi dòng. |

### 2.4. Ví dụ file mẫu

| MSSV | Họ tên | Ngày sinh | Giới tính | CCCD | SĐT | Email | Quê quán | Ngành | Lớp | Khóa | Khóa nhập học | Hệ đào tạo | Trạng thái học vụ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B23DCCN001 | Nguyễn Văn A | 2005-01-15 | Nam | 079205001234 | 0912345678 | a@example.com | Hà Nội | Công nghệ thông tin | CNTT-2023.1 | K23 | 2023 | Chính quy | Đang học |
| B23DCCN002 | Trần Thị B | 15/03/2005 | Nữ | 079205002345 | 0987654321 | b@example.com | TP. HCM | Công nghệ thông tin | CNTT-2023.1 | K23 | 2023 | Chính quy | Đang học |

---

## 3. Cách tạo file Excel từ đầu (Microsoft Excel / Google Sheets)

### Cách 1: Dùng file mẫu (khuyến nghị)

1. Đăng nhập vào hệ thống → vào **Danh sách hồ sơ sinh viên**.
2. Bấm nút **Import** ở thanh công cụ.
3. Trong modal Import, bấm **Tải file mẫu** → file `mau-import-sinh-vien.xlsx` được tải về.
4. Mở file bằng Excel / Google Sheets / WPS.
5. Xóa dòng ví dụ (dòng thứ 3).
6. Điền dữ liệu sinh viên vào các dòng tiếp theo, **giữ nguyên dòng header (dòng 2) và các cột**.
7. Lưu lại (định dạng `.xlsx`).
8. Quay lại modal Import → **chọn file** → bấm **Import**.

### Cách 2: Tự tạo file từ đầu

1. Mở Excel / Google Sheets → tạo workbook mới.
2. Dòng 1 (tùy chọn): ghi hướng dẫn, ví dụ: *"Hướng dẫn: import sinh viên — giữ nguyên header ở dòng dưới"* — hệ thống sẽ tự bỏ qua dòng này.
3. Dòng 2: ghi đúng 14 header theo thứ tự ở mục 2.1.
4. Dòng 3 trở đi: điền dữ liệu.
5. Lưu file với định dạng `.xlsx` (không dùng `.xls` cũ nếu Excel cho phép).

### Cách 3: Export từ hệ thống rồi chỉnh sửa

1. Trên trang **Danh sách hồ sơ**, áp dụng filter nếu cần.
2. Bấm **Export** → file Excel được tải về với cùng cấu trúc 14 cột.
3. Mở file, thêm / sửa dữ liệu → lưu lại.
4. Import lại bằng nút **Import** (hệ thống sẽ cập nhật theo MSSV).

---

## 4. Cách Import

1. Vào **Danh sách hồ sơ sinh viên**.
2. Bấm **Import**.
3. Modal mở ra → bấm **chọn file** (hoặc kéo thả) — chỉ chấp nhận `.xlsx` / `.xls`.
4. Bấm **Import**.
5. Hệ thống xử lý và hiển thị **kết quả**:
   - **Tổng thành công** — số dòng đã import thành công.
   - **Thêm mới** — số sinh viên mới được tạo.
   - **Cập nhật** — số sinh viên đã có sẵn được cập nhật.
   - **Lỗi** — số dòng bị bỏ qua, kèm **danh sách chi tiết lỗi theo số dòng**.
6. Danh sách sinh viên trên trang sẽ **tự reload** sau khi import.

### 4.1. Lỗi thường gặp & cách xử lý

| Lỗi hiển thị | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Thiếu MSSV.` | Dòng đó không có giá trị MSSV. | Điền MSSV vào dòng đó. |
| `Thiếu họ tên.` | Cột Họ tên bị bỏ trống. | Điền họ tên. |
| `Lỗi đọc dòng: ...` | Định dạng ô bị lỗi (VD: ngày sinh không parse). | Sửa định dạng ô đó, import lại. |

### 4.2. Quy tắc upsert

- MSSV **chưa tồn tại** trong DB → tạo mới, `ngayTao` = thời điểm hiện tại.
- MSSV **đã tồn tại** trong DB → cập nhật các trường: họ tên, ngày sinh, giới tính, CCCD, SĐT, email, quê quán, ngành, lớp, khóa, khóa nhập học, hệ đào tạo, trạng thái học vụ. `ngayCapNhat` được tự động cập nhật.

> ⚠️ Import là thao tác **ghi đè**. Hãy kiểm tra kỹ file trước khi import, đặc biệt với MSSV đã tồn tại.

---

## 5. Cách Export

1. Trên trang **Danh sách hồ sơ sinh viên**, **áp dụng các bộ lọc** nếu muốn (từ khóa, ngành, khóa, lớp, trạng thái...).
2. Bấm **Export** → file Excel được tải về với tên `danh-sach-sinh-vien-<timestamp>.xlsx`.
3. File chứa **toàn bộ kết quả theo filter** hiện tại (không giới hạn trang hiển thị).

### 5.1. Phạm vi Export

| Phạm vi | Mô tả |
|---|---|
| **Toàn bộ kết quả lọc** (mặc định) | Tối đa 10.000 dòng. Nếu dữ liệu lớn hơn, hãy áp dụng filter để thu hẹp. |
| Chỉ trang hiện tại | Có thể tích hợp thêm tuỳ chọn nếu cần. Hiện tại mặc định lấy toàn bộ kết quả lọc. |

---

## 6. Checklist trước khi Import

- [ ] File đúng định dạng `.xlsx` hoặc `.xls`.
- [ ] Dòng header đúng 14 cột theo thứ tự (xem mục 2.1).
- [ ] Tất cả dòng có dữ liệu đều có MSSV và Họ tên.
- [ ] MSSV không trùng nhau giữa các dòng trong file.
- [ ] CCCD (nếu có) không trùng với sinh viên khác đã có trong hệ thống.
- [ ] Trạng thái học vụ (nếu có) nằm trong 5 giá trị cho phép.
- [ ] Ngày sinh (nếu có) đúng định dạng `dd/MM/yyyy` hoặc `yyyy-MM-dd`, hoặc ô định dạng ngày Excel.
- [ ] File dung lượng < 10 MB.

---

## 7. Câu hỏi thường gặp

**Tôi không thấy nút Import / Export?**
Bạn cần đăng nhập bằng tài khoản có role `ADMIN`. Role `STAFF` chỉ xem được thông tin của chính mình.

**Import báo lỗi toàn bộ dòng?**
Kiểm tra lại dòng header có đúng 14 cột theo thứ tự chưa. Hệ thống đọc theo vị trí cột, không theo tên.

**Import thành công nhưng không thấy sinh viên mới trên trang?**
Trang sẽ tự reload sau khi import. Nếu vẫn không thấy, kiểm tra bộ lọc đang áp dụng (có thể đang lọc theo trạng thái / ngành khiến sinh viên mới không hiển thị).

**File Excel của tôi mở bằng WPS / Numbers có tương thích không?**
Có, miễn lưu đúng định dạng `.xlsx`.

**Import có tạo lịch sử / audit không?**
Hiện tại import chỉ cập nhật thông tin sinh viên. Việc ghi lịch sử thay đổi trạng thái học vụ cần thực hiện qua API riêng (xem `AGENTS.md` mục Quy tắc nghiệp vụ).

**Tôi muốn thay đổi cấu trúc cột?**
Liên hệ đội phát triển — việc thêm/bớt cột cần cập nhật cả backend lẫn tài liệu này.

---

## 8. Liên kết hữu ích

- `AGENTS.md` (root) — tổng quan dự án, quy tắc nghiệp vụ.
- `API.md` — hợp đồng API đầy đủ, bao gồm 3 endpoint Excel mới (mục 5.x).
- Trang chức năng: `frontend/src/pages/TrangDanhSachHoSo.tsx`.
- Service Excel backend: `backend/.../service/SinhVienExcelService.java`.

---

# PHẦN 2 — Hướng dẫn Import/Export Danh mục (Khoa → Ngành → Khóa học → Lớp)

> **Phạm vi:** Trang **Cài đặt** → 4 tab **Khoa / Ngành / Khóa học / Lớp**. Mỗi tab có 3 nút: **Thêm mới**, **Import**, **Export**.

---

## 9. Tại sao phải Import theo THỨ TỰ?

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

## 10. Bước 1/4 — Import KHOA

### 10.1. Cấu trúc file Excel

File `.xlsx` có **2 cột** theo đúng thứ tự (hệ thống đọc theo **vị trí cột**, không theo tên):

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên khoa` | ✅ Bắt buộc | Tối đa 150 ký tự. **Không được trùng** với khoa đã có. |
| 2 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. Có thể để trống. |

### 10.2. Ví dụ

| Tên khoa | Mô tả |
|---|---|
| Khoa Công nghệ thông tin | Khoa chuyên ngành CNTT và các ngành liên quan |
| Khoa Kinh tế | Khoa đào tạo các ngành kinh tế, quản trị |
| Khoa Ngoại ngữ | Khoa đào tạo tiếng Anh, Trung, Nhật |

### 10.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa. |
| `Khoa 'X' đã tồn tại.` | Tên khoa trùng với khoa đã có trong DB. | Đổi tên khác, hoặc bỏ qua dòng này. |

### 10.4. Cách import

1. Vào **Cài đặt** → tab **Khoa**.
2. Bấm nút **Import** ở thanh công cụ.
3. Modal mở → bấm **Tải file mẫu** để tải file `mau-import-khoa.xlsx` với 2 cột `Tên khoa`, `Mô tả`.
4. Mở file, **giữ nguyên dòng header**, điền dữ liệu từ dòng 3.
5. Lưu file `.xlsx` → upload lại → bấm **Import**.
6. Hệ thống báo: tổng dòng, thêm mới, lỗi (nếu có).

---

## 11. Bước 2/4 — Import NGÀNH

### 11.1. Cấu trúc file Excel

File `.xlsx` có **3 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên ngành` | ✅ Bắt buộc | Tối đa 150 ký tự. |
| 2 | `Tên khoa` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên khoa đã import ở Bước 1 (so sánh không phân biệt hoa/thường, bỏ khoảng trắng đầu/cuối). |
| 3 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 11.2. Ví dụ

| Tên ngành | Tên khoa | Mô tả |
|---|---|---|
| Công nghệ thông tin | Khoa Công nghệ thông tin | Ngành CNTT chuyên về phần mềm |
| Trí tuệ nhân tạo | Khoa Công nghệ thông tin | Ngành AI, Machine Learning |
| Quản trị kinh doanh | Khoa Kinh tế | Ngành QTKD chuyên ngành |

### 11.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên ngành không được để trống.` | Cột Tên ngành bị bỏ trống. | Điền tên ngành. |
| `Tên khoa không được để trống.` | Cột Tên khoa bị bỏ trống. | Điền tên khoa (xem bước 1). |
| `Khoa 'X' không tồn tại. Vui lòng tạo Khoa trước.` | Tên khoa trong file **chưa có** trong DB. | Về tab Khoa → import Khoa đó trước. |
| `Ngành 'X' đã tồn tại trong khoa 'Y'.` | Cùng (tên ngành, tên khoa) đã có. | Đổi tên ngành khác, hoặc bỏ dòng. |

### 11.4. ⚠️ Lưu ý quan trọng: Tên khoa phải khớp chính xác

Hệ thống tìm khoa bằng **so sánh chuỗi** (case-insensitive, trim khoảng trắng). Nếu trong DB là `Khoa Công nghệ thông tin` mà trong file ghi `CNTT` → **không tìm thấy**.

**Mẹo:** Bấm **Export** ở tab Khoa trước → copy chính xác cột `Tên khoa` → paste vào file import Ngành.

---

## 12. Bước 3/4 — Import KHÓA HỌC (Khóa năm học)

### 12.1. Cấu trúc file Excel

File `.xlsx` có **4 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên khóa năm học` | ✅ Bắt buộc | Tối đa 100 ký tự. **Không trùng** với khóa đã có. |
| 2 | `Năm bắt đầu` | Tùy chọn | Phải là **số nguyên** (VD: 2024). |
| 3 | `Năm kết thúc` | Tùy chọn | Phải là **số nguyên** ≥ Năm bắt đầu. |
| 4 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 12.2. Ví dụ

| Tên khóa năm học | Năm bắt đầu | Năm kết thúc | Mô tả |
|---|---|---|---|
| Khóa 14 (2026–2030) | 2026 | 2030 | Sinh viên nhập học năm 2026 |
| Khóa 13 (2025–2029) | 2025 | 2029 | Sinh viên nhập học năm 2025 |

### 12.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên khóa học không được để trống.` | Cột tên bị trống. | Điền tên khóa. |
| `Năm bắt đầu phải là số.` | Ghi text như "2024" nhưng format cell là text. | Đổi format cell thành Number nguyên. |
| `Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.` | `namKetThuc < namBatDau`. | Sửa lại năm. |
| `Khóa học 'X' đã tồn tại.` | Trùng tên. | Đổi tên khác. |

---

## 13. Bước 4/4 — Import LỚP

### 13.1. Cấu trúc file Excel

File `.xlsx` có **4 cột** theo đúng thứ tự:

| # | Header (dòng 2) | Bắt buộc? | Quy tắc |
|---|---|---|---|
| 1 | `Tên lớp` | ✅ Bắt buộc | Tối đa 100 ký tự. |
| 2 | `Tên ngành` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên ngành đã import ở Bước 2. |
| 3 | `Tên khoa năm học` | ✅ Bắt buộc | Phải **trùng khớp 100%** với tên khóa học đã import ở Bước 3. |
| 4 | `Mô tả` | Tùy chọn | Tối đa 500 ký tự. |

### 13.2. Ví dụ

| Tên lớp | Tên ngành | Tên khoa năm học | Mô tả |
|---|---|---|---|
| CNTT-2026.1 | Công nghệ thông tin | Khóa 14 (2026–2030) | Lớp chất lượng cao |
| AI-2025.2 | Trí tuệ nhân tạo | Khóa 13 (2025–2029) | Lớp AI nâng cao |

### 13.3. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Tên lớp không được để trống.` | Cột Tên lớp trống. | Điền tên. |
| `Khoa 'X' không tồn tại. Vui lòng tạo Khoa trước.` | Ngành đang reference tới Khoa chưa có. | Import Khoa trước (Bước 1). |
| `Ngành 'X' không tồn tại trong khoa 'Y'. Vui lòng tạo Ngành trước.` | Tên ngành trong file chưa có trong DB. | Import Ngành trước (Bước 2). |
| `Khóa năm học 'X' không tồn tại. Vui lòng tạo Khóa năm học trước.` | Tên khóa học trong file chưa có. | Import Khóa học trước (Bước 3). |
| `Lớp 'X' đã tồn tại trong ngành 'Y' khóa 'Z'.` | Trùng (tên lớp, ngành, khóa học). | Đổi tên lớp khác. |

### 13.4. Mẹo tránh lỗi chính tả

1. Bấm **Export** ở tab **Ngành** → copy chính xác cột `Tên ngành` → paste vào cột `Tên ngành` của file Lớp.
2. Tương tự với tab **Khóa học** → copy cột `Tên khóa năm học` → paste vào file Lớp.
3. Như vậy sẽ khớp 100%, không sợ lệch 1 ký tự.

---

## 14. Checklist trước khi Import danh mục

- [ ] Đã import xong **Khoa** (Bước 1) trước.
- [ ] Đã kiểm tra tab **Khoa** hiển thị đúng các khoa vừa tạo.
- [ ] File Excel dùng đúng **header** theo bảng ở từng bước.
- [ ] **Tên khoa / Tên ngành / Tên khóa học** trong file khớp chính xác với DB (copy từ file Export nếu cần).
- [ ] Không trộn dòng trống xen kẽ.
- [ ] File dung lượng < 5 MB, định dạng `.xlsx`.

---

## 15. Quy trình tổng hợp (end-to-end)

```
1. Tab Khoa      → Import khoa.xlsx      → ✅ Thành công
2. Tab Ngành     → Import nganh.xlsx     → ✅ Thành công  
3. Tab Khóa học  → Import khoa-hoc.xlsx  → ✅ Thành công
4. Tab Lớp       → Import lop.xlsx       → ✅ Thành công
5. Tab Sinh viên → Import sinh-vien.xlsx → ✅ Thành công (tham khảo Phần 1)
```

> Nếu bất kỳ bước nào fail toàn bộ, **dừng lại** và kiểm tra:
> 1. File header có đúng số cột theo thứ tự không?
> 2. Dữ liệu trong file có khớp với DB không?
> 3. Trong file có dòng nào bị trống hoàn toàn không?
> 4. Kết quả import có hiển thị **danh sách lỗi theo dòng** không? Đọc kỹ thông báo lỗi.

---

**Phiên bản tài liệu:** 1.1 — bổ sung Phần 2 (Import/Export Danh mục theo thứ tự cascade).