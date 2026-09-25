-- V2__seed_data.sql
-- Dữ liệu mẫu cho VWA EduRecords (MVP)
-- Generated: 2026-09-26

-- ===== USERS =====
-- BCrypt hash cho password "03102004"
-- Hash: $2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6
INSERT INTO users (username, password_hash, ho_ten, email, role, is_active) VALUES
('Phamthuylinh', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'Phạm Thị Linh', 'phamthuylinh@vwa.edu.vn', 'ADMIN', true);

-- ===== LOAIGIAYTO (13 loại giấy tờ) =====
INSERT INTO loai_giay_to (ma_loai, ten_giay_to, bat_buoc, dang_su_dung, thu_tu_hien_thi) VALUES
('GT01', 'Giấy khai sinh', TRUE, TRUE, 1),
('GT02', 'Bằng tốt nghiệp THPT', TRUE, TRUE, 2),
('GT03', 'Học bạ THPT', TRUE, TRUE, 3),
('GT04', 'Giấy xác nhận học lực', TRUE, TRUE, 4),
('GT05', 'Ảnh 3x4', TRUE, TRUE, 5),
('GT06', 'CMND/CCCD', TRUE, TRUE, 6),
('GT07', 'Sổ khám sức khỏe', TRUE, TRUE, 7),
('GT08', 'Giấy xác nhận ưu tiên', TRUE, TRUE, 8),
('GT09', 'Giấy chuyển trường', FALSE, TRUE, 9),
('GT10', 'Bảng điểm các kỳ', FALSE, TRUE, 10),
('GT11', 'Giấy xác nhận hoàn thành nghĩa vụ quân sự', FALSE, TRUE, 11),
('GT12', 'Chứng chỉ ngoại ngữ', FALSE, TRUE, 12),
('GT13', 'Các giấy tờ khác', FALSE, TRUE, 13);

-- ===== SINHVIEN =====
INSERT INTO sinhvien (mssv, ho_ten, ngay_sinh, gioi_tinh, cccd, sdt, email, que_quan, nganh, lop, khoa, khoa_nam_nhap_hoc, he_dao_tao, trang_thai_hoc_vu) VALUES
('B23DCCN001', 'Nguyễn Văn An', '2005-03-15', 'Nam', '079205001234', '0912345678', 'an.nv_b23dccn001@vwa.edu.vn', 'TP. Hồ Chí Minh', 'Công nghệ thông tin', 'D23CQCN01-N', 'Khoa CNTT', '2023-2024', 'Chính quy', 'Đang học'),
('B23DCCN002', 'Trần Thị Bình', '2005-07-22', 'Nữ', '079205001235', '0912345679', 'binh.tt_b23dccn002@vwa.edu.vn', 'Bình Dương', 'Khoa học máy tính', 'D23CQCN02-N', 'Khoa CNTT', '2023-2024', 'Chính quy', 'Đang học'),
('B22DCCN003', 'Lê Minh Cường', '2004-11-08', 'Nam', '079205001236', '0912345680', 'cuong.lm_b22dccn003@vwa.edu.vn', 'Đồng Nai', 'An toàn thông tin', 'D22CQAT01-N', 'Khoa CNTT', '2022-2023', 'Chính quy', 'Bảo lưu'),
('B21DCCN004', 'Phạm Thị Dung', '2003-05-30', 'Nữ', '079205001237', '0912345681', 'dung.pt_b21dccn004@vwa.edu.vn', 'Bà Rịa Vũng Tàu', 'Công nghệ thông tin', 'D21CQCN03-N', 'Khoa CNTT', '2021-2022', 'Chính quy', 'Tốt nghiệp');

-- ===== HOSOGIAYTO =====
-- Sinh viên B23DCCN001 - An (Đang học)
INSERT INTO ho_so_giay_to (ma_ho_so, mssv, ma_loai, trang_thai_nop, ban_goc_ban_sao, vi_tri_luu_kho) VALUES
('HS001', 'B23DCCN001', 'GT01', 'Đã nộp', 'Bản gốc', 'Kệ A-01-01'),
('HS002', 'B23DCCN001', 'GT02', 'Đã nộp', 'Bản sao', 'Kệ A-01-02'),
('HS003', 'B23DCCN001', 'GT03', 'Đã nộp', 'Bản gốc', 'Kệ A-01-03'),
('HS004', 'B23DCCN001', 'GT04', 'Chưa nộp', NULL, NULL),
('HS005', 'B23DCCN001', 'GT05', 'Đã nộp', 'Bản gốc', 'Kệ A-01-04'),
('HS006', 'B23DCCN001', 'GT06', 'Đã nộp', 'Bản gốc', 'Kệ A-01-05'),
('HS007', 'B23DCCN001', 'GT07', 'Thiếu', NULL, NULL),
('HS008', 'B23DCCN001', 'GT08', 'Chưa nộp', NULL, NULL);

-- Sinh viên B23DCCN002 - Bình (Đang học)
INSERT INTO ho_so_giay_to (ma_ho_so, mssv, ma_loai, trang_thai_nop, ban_goc_ban_sao, vi_tri_luu_kho) VALUES
('HS009', 'B23DCCN002', 'GT01', 'Đã nộp', 'Bản gốc', 'Kệ A-02-01'),
('HS010', 'B23DCCN002', 'GT02', 'Đã nộp', 'Bản gốc', 'Kệ A-02-02'),
('HS011', 'B23DCCN002', 'GT03', 'Đã nộp', 'Bản sao', 'Kệ A-02-03'),
('HS012', 'B23DCCN002', 'GT04', 'Đã nộp', 'Bản sao', 'Kệ A-02-04'),
('HS013', 'B23DCCN002', 'GT05', 'Đã nộp', 'Bản gốc', 'Kệ A-02-05'),
('HS014', 'B23DCCN002', 'GT06', 'Đã nộp', 'Bản gốc', 'Kệ A-02-06'),
('HS015', 'B23DCCN002', 'GT07', 'Đã nộp', 'Bản sao', 'Kệ A-02-07'),
('HS016', 'B23DCCN002', 'GT08', 'Không hợp lệ', NULL, NULL);

-- Sinh viên B22DCCN003 - Cường (Bảo lưu)
INSERT INTO ho_so_giay_to (ma_ho_so, mssv, ma_loai, trang_thai_nop, ban_goc_ban_sao, vi_tri_luu_kho) VALUES
('HS017', 'B22DCCN003', 'GT01', 'Đã nộp', 'Bản gốc', 'Kệ B-01-01'),
('HS018', 'B22DCCN003', 'GT02', 'Đã nộp', 'Bản gốc', 'Kệ B-01-02'),
('HS019', 'B22DCCN003', 'GT03', 'Đã nộp', 'Bản gốc', 'Kệ B-01-03'),
('HS020', 'B22DCCN003', 'GT04', 'Đã nộp', 'Bản sao', 'Kệ B-01-04'),
('HS021', 'B22DCCN003', 'GT05', 'Đã nộp', 'Bản gốc', 'Kệ B-01-05'),
('HS022', 'B22DCCN003', 'GT06', 'Đã nộp', 'Bản gốc', 'Kệ B-01-06'),
('HS023', 'B22DCCN003', 'GT07', 'Chưa nộp', NULL, NULL),
('HS024', 'B22DCCN003', 'GT08', 'Chưa nộp', NULL, NULL);

-- Sinh viên B21DCCN004 - Dung (Tốt nghiệp)
INSERT INTO ho_so_giay_to (ma_ho_so, mssv, ma_loai, trang_thai_nop, ban_goc_ban_sao, vi_tri_luu_kho) VALUES
('HS025', 'B21DCCN004', 'GT01', 'Đã nộp', 'Bản gốc', 'Kệ C-01-01'),
('HS026', 'B21DCCN004', 'GT02', 'Đã nộp', 'Bản gốc', 'Kệ C-01-02'),
('HS027', 'B21DCCN004', 'GT03', 'Đã nộp', 'Bản sao', 'Kệ C-01-03'),
('HS028', 'B21DCCN004', 'GT04', 'Đã nộp', 'Bản sao', 'Kệ C-01-04'),
('HS029', 'B21DCCN004', 'GT05', 'Đã nộp', 'Bản gốc', 'Kệ C-01-05'),
('HS030', 'B21DCCN004', 'GT06', 'Đã nộp', 'Bản gốc', 'Kệ C-01-06'),
('HS031', 'B21DCCN004', 'GT07', 'Đã nộp', 'Bản sao', 'Kệ C-01-07'),
('HS032', 'B21DCCN004', 'GT08', 'Chưa nộp', NULL, NULL);

-- ===== LICHSUNOP =====
INSERT INTO lich_su_nop (ma_log, ma_ho_so, mssv, hanh_dong, trang_thai_cu, trang_thai_moi, ghi_chu, nguoi_thuc_hien) VALUES
('LS001', 'HS001', 'B23DCCN001', 'Nộp lần đầu', NULL, 'Đã nộp', 'Nộp bản gốc giấy khai sinh', 'Phamthuylinh'),
('LS002', 'HS002', 'B23DCCN001', 'Nộp lần đầu', NULL, 'Đã nộp', 'Nộp bản sao bằng tốt nghiệp THPT', 'Phamthuylinh'),
('LS003', 'HS003', 'B23DCCN001', 'Nộp lần đầu', NULL, 'Đã nộp', 'Nộp bản gốc học bạ THPT', 'Phamthuylinh'),
('LS004', 'HS004', 'B23DCCN001', 'Yêu cầu nộp', NULL, 'Chưa nộp', 'Yêu cầu bổ sung giấy xác nhận học lực', 'Phamthuylinh'),
('LS005', 'HS009', 'B23DCCN002', 'Nộp lần đầu', NULL, 'Đã nộp', 'Nộp đầy đủ hồ sơ', 'Phamthuylinh'),
('LS006', 'HS016', 'B23DCCN002', 'Cập nhật', 'Đã nộp', 'Không hợp lệ', 'Giấy xác nhận ưu tiên hết hạn', 'Phamthuylinh');

-- ===== PHIEUXUATHOSO =====
INSERT INTO phieu_xuat_ho_so (ma_phieu, mssv, loai_phieu, trang_thai, ly_do, ngay_muon, ngay_tra_du_kien, nguoi_tao) VALUES
('PX001', 'B23DCCN001', 'Mượn tạm thời', 'Đã duyệt', 'Sinh viên cần photo bản sao bằng tốt nghiệp để xin việc', '2024-01-15', '2024-01-25', 'Phamthuylinh'),
('PX002', 'B23DCCN002', 'Mượn tạm thời', 'Chờ duyệt', 'Cần xuất trình CCCD gốc để làm thủ tục', '2024-01-20', '2024-01-27', 'Phamthuylinh'),
('PX003', 'B21DCCN004', 'Rút vĩnh viễn', 'Hoàn tất', 'Sinh viên đã tốt nghiệp, rút hồ sơ về trường gốc', '2024-01-10', '2024-01-10', 'Phamthuylinh');

-- ===== CHITIETPHIEU =====
INSERT INTO chi_tiet_phieu (ma_ct, ma_phieu, ma_ho_so, ghi_chu) VALUES
('CT001', 'PX001', 'HS002', 'Rút bản sao bằng THPT, hẹn trả trong 10 ngày'),
('CT002', 'PX001', 'HS005', 'Rút 2 tấm ảnh 3x4 để dán hồ sơ xin việc'),
('CT003', 'PX002', 'HS014', 'Rút CCCD gốc để xác minh, hẹn trả sau 7 ngày'),
('CT004', 'PX003', 'HS025', 'Rút toàn bộ hồ sơ gốc theo yêu cầu sinh viên'),
('CT005', 'PX003', 'HS026', 'Rút bản gốc bằng tốt nghiệp THPT'),
('CT006', 'PX003', 'HS027', 'Rút học bạ THPT bản gốc'),
('CT007', 'PX003', 'HS028', 'Rút bản sao học bạ');
