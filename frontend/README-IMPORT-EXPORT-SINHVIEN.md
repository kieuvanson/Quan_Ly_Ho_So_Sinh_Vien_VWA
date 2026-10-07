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

**Phiên bản tài liệu:** 1.0 — cập nhật cùng feature Import/Export Excel.