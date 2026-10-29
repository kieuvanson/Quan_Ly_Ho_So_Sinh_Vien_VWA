-- =============================================================================
-- V8__fix_dirty_audit_actor.sql
-- Mục tiêu: Sửa dữ liệu audit_log bị nhiễm bởi lỗi truyền tham số sai.
--
-- Ngữ cảnh:
--   Trước đây AuditService.log(...) được gọi với 7 tham số, trong đó tham số
--   thứ 7 là `nguoiThucHien`. Vài chỗ gọi nhầm đưa nội dung mô tả/ghi chú
--   (VD: "Xóa sinh viên qua bulk delete (họ tên: ...)") vào tham số này, khiến
--   cột `nguoi_thuc_hien` chứa dữ liệu mô tả thay vì username cán bộ.
--
-- Thay đổi:
--   1. Backup các bản ghi bị nhiễm vào audit_log_backup_v8 (giữ nguyên lịch sử).
--   2. Chuẩn hoá `nguoi_thuc_hien` về giá trị hợp lệ.
--   3. Với bản ghi BULK_DELETE_SINHVIEN: đưa nội dung mô tả (họ tên, trạng thái)
--      sang `gia_tri_moi` để không mất thông tin nghiệp vụ.
--
-- Lưu ý: KHÔNG xóa bất kỳ bản ghi audit nào — nguyên tắc "không ghi đè dữ liệu cũ".
-- =============================================================================

-- ============================================================
-- BƯỚC 1: BACKUP CÁC BẢN GHI BỊ NHIỄM
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log_backup_v8 AS
SELECT *
FROM audit_log
WHERE nguoi_thuc_hien IS NOT NULL
  AND nguoi_thuc_hien NOT IN (SELECT username FROM users)
  AND nguoi_thuc_hien <> 'system';

-- ============================================================
-- BƯỚC 2: BULK_DELETE_SINHVIEN — chuyển mô tả vào gia_tri_moi
-- ============================================================
UPDATE audit_log a
SET nguoi_thuc_hien = 'system',
    gia_tri_moi = COALESCE(NULLIF(a.gia_tri_moi, ''), a.nguoi_thuc_hien)
WHERE a.hanh_dong = 'BULK_DELETE_SINHVIEN'
  AND a.nguoi_thuc_hien IS NOT NULL
  AND a.nguoi_thuc_hien NOT IN (SELECT username FROM users);

-- ============================================================
-- BƯỚC 3: CÁC HÀNH ĐỘNG KHÁC (bulk update trạng thái, ...)
--   Giữ nội dung mô tả trong gia_tri_moi nếu chưa có, đặt actor về 'system'.
-- ============================================================
UPDATE audit_log a
SET nguoi_thuc_hien = 'system',
    gia_tri_moi = COALESCE(NULLIF(a.gia_tri_moi, ''), a.nguoi_thuc_hien)
WHERE a.nguoi_thuc_hien IS NOT NULL
  AND a.nguoi_thuc_hien NOT IN (SELECT username FROM users)
  AND a.nguoi_thuc_hien <> 'system';

-- ============================================================
-- BƯỚC 4: CHUẨN HOÁ HÀNH ĐỘNG của lich_su_nop về dạng có dấu
--   Backend cũ ghi "Tao ho so"/"Cap nhat trang thai" (không dấu) trong khi
--   frontend/DB dùng tiếng Việt có dấu. Chuẩn hoá cho nhất quán.
-- ============================================================
UPDATE lich_su_nop SET hanh_dong = 'Tạo hồ sơ'        WHERE hanh_dong = 'Tao ho so';
UPDATE lich_su_nop SET hanh_dong = 'Cập nhật trạng thái' WHERE hanh_dong = 'Cap nhat trang thai';
UPDATE lich_su_nop SET hanh_dong = 'Nộp giấy tờ'       WHERE hanh_dong = 'Nop giay to';
UPDATE lich_su_nop SET hanh_dong = 'Hủy nộp'            WHERE hanh_dong = 'Huy nop';
UPDATE lich_su_nop SET hanh_dong = 'Đánh dấu thiếu'     WHERE hanh_dong = 'Danh dau thieu';
UPDATE lich_su_nop SET hanh_dong = 'Bổ sung đầy đủ'     WHERE hanh_dong = 'Bo sung day du';
UPDATE lich_su_nop SET hanh_dong = 'Đánh dấu không hợp lệ' WHERE hanh_dong = 'Danh mau khong hop le';
UPDATE lich_su_nop SET hanh_dong = 'Hợp lệ trở lại'     WHERE hanh_dong = 'Hop le tro lai';

-- ============================================================
-- BƯỚC 5: THÊM INDEX cho lọc theo người thực hiện
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_nguoithuchien
    ON audit_log (nguoi_thuc_hien);

CREATE INDEX IF NOT EXISTS idx_lich_su_nop_nguoithuchien
    ON lich_su_nop (nguoi_thuc_hien);
