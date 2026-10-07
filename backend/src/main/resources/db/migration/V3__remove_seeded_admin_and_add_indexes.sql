-- V3__remove_seeded_admin_and_add_indexes.sql
-- Mục tiêu:
--   1. Gỡ tài khoản quản trị đã seed kèm mật khẩu hash trong V2.
--      Mật khẩu hash nằm trong git là bí mật bị lộ vĩnh viễn; file migration đã
--      chạy nên không sửa V2 (checksum), phải tạo migration mới.
--   2. Bổ sung index phục vụ truy vấn tần suất cao.

-- ===== 1. Gỡ tài khoản seed =====
-- Chỉ xoá những tài khoản được seed ở V2 (không có nghiệp vụ nào phụ thuộc).
-- Tài khoản tạo sau này qua API sẽ không bị đụng tới.
--
-- Lưu ý: nếu môi trường dev của bạn cần giữ lại tài khoản này để test, hãy
-- tạo lại tài khoản qua AdminBootstrap (biến môi trường APP_ADMIN_*) thay vì
-- dựa vào seed.
DELETE FROM users WHERE username = 'Phamthuylinh';

-- ===== 2. Index phục vụ nghiệp vụ =====
-- Kiểm tra phiếu chưa trả của 1 sinh viên: dùng trong rule "không cho rút vĩnh
-- viễn khi còn phiếu Đang mượn/Quá hạn".
CREATE INDEX IF NOT EXISTS idx_phieuxuathoso_mssv_trangthai
    ON phieu_xuat_ho_so (mssv, trang_thai);

-- Scheduled job đánh dấu quá hạn: lọc theo loại phiếu + trạng thái + hạn trả.
CREATE INDEX IF NOT EXISTS idx_phieuxuathoso_quahan
    ON phieu_xuat_ho_so (loai_phieu, trang_thai, ngay_tra_du_kien);

-- Lọc danh sách theo khoá nhập học (đã có index ở V1) và theo hệ đào tạo.
CREATE INDEX IF NOT EXISTS idx_sinhvien_hedaotao
    ON sinhvien (he_dao_tao);

-- Lịch sử nộp theo MSSV, sắp xếp theo thời gian giảm dần.
CREATE INDEX IF NOT EXISTS idx_lichsunop_mssv_thoigian
    ON lich_su_nop (mssv, thoi_gian DESC);

-- Thống kê giấy tờ theo MSSV + trạng thái nộp.
CREATE INDEX IF NOT EXISTS idx_hosogiayto_mssv_trangthainop
    ON ho_so_giay_to (mssv, trang_thai_nop);
