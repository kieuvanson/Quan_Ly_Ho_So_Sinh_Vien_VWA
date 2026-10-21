-- =============================================================================
-- V7__normalize_khoa_khoahoc_model.sql
-- Mục tiêu: Chuẩn hóa mô hình Khoa chuyên môn và Khóa năm học
-- 
-- Ngữ cảnh:
--   Bảng khoa hiện lưu "K14" (niên khóa) thay vì khoa chuyên môn.
--   Bảng khoa_hoc trống. Bảng nganh có khoa_id=NULL.
--
-- Thay đổi:
--   1. Backup dữ liệu hiện tại
--   2. Sửa khoa(K14) → Khoa Công nghệ thông tin (khoa chuyên môn)
--   3. Tạo dữ liệu mẫu cho khoa_hoc (niên khóa)
--   4. Update nganh.khoa_id để link đến khoa chuyên môn
--   5. Verify kết quả
-- =============================================================================

-- ============================================================
-- BƯỚC 1: BACKUP DỮ LIỆU HIỆN TẠI
-- ============================================================
CREATE TABLE IF NOT EXISTS khoa_backup_v7 AS 
SELECT * FROM khoa WHERE id = 4;

CREATE TABLE IF NOT EXISTS nganh_backup_v7 AS 
SELECT * FROM nganh WHERE khoa_id IS NULL;

-- ============================================================
-- BƯỚC 2: SỬA DỮ LIỆU khoa - CHUYỂN TỪ "K14" SANG KHOA CHUYÊN MÔN
-- ============================================================
UPDATE khoa 
SET 
    ten_khoa = 'Khoa Công nghệ thông tin',
    mo_ta = 'Khoa chuyên ngành Công nghệ thông tin và các ngành liên quan'
WHERE id = 4 AND ma_khoa = 'KHOA01';

-- ============================================================
-- BƯỚC 3: TẠO DỮ LIỆU MẪU CHO khoa_hoc (NIÊN KHÓA)
-- LƯU Ý: Năm bắt đầu/kết thúc cần được xác nhận với nghiệp vụ
-- ============================================================
INSERT INTO khoa_hoc (ma_khoa_hoc, ten_khoa_hoc, nam_bat_dau, nam_ket_thuc, dang_su_dung, ngay_tao)
VALUES 
    -- Khóa 14: Sinh viên nhập học năm 2026, kết thúc 2030
    ('KH14', 'Khóa 14 (2026–2030)', 2026, 2030, true, CURRENT_TIMESTAMP),
    -- Khóa 13: Sinh viên nhập học năm 2025, kết thúc 2029
    ('KH13', 'Khóa 13 (2025–2029)', 2025, 2029, true, CURRENT_TIMESTAMP),
    -- Khóa 12: Sinh viên nhập học năm 2024, kết thúc 2028
    ('KH12', 'Khóa 12 (2024–2028)', 2024, 2028, true, CURRENT_TIMESTAMP),
    -- Khóa 11: Sinh viên nhập học năm 2023, kết thúc 2027
    ('KH11', 'Khóa 11 (2023–2027)', 2023, 2027, true, CURRENT_TIMESTAMP);

-- ============================================================
-- BƯỚC 4: UPDATE nganh.khoa_id ĐỂ LINK ĐẾN KHOA CHUYÊN MÔN
-- ============================================================
UPDATE nganh 
SET khoa_id = 4
WHERE id = 6 AND ten_nganh = 'CNTT';

-- ============================================================
-- BƯỚC 5: VERIFY KẾT QUẢ
-- ============================================================
-- Kiểm tra khoa đã được sửa
SELECT 'khoa' as tbl, id, ma_khoa, ten_khoa FROM khoa;

-- Kiểm tra khoa_hoc đã được tạo
SELECT 'khoa_hoc' as tbl, id, ma_khoa_hoc, ten_khoa_hoc, nam_bat_dau, nam_ket_thuc FROM khoa_hoc ORDER BY nam_bat_dau DESC;

-- Kiểm tra nganh đã được link
SELECT 'nganh' as tbl, id, ma_nganh, ten_nganh, khoa_id FROM nganh;

-- ============================================================
-- ROLLBACK (nếu cần)
-- ============================================================
-- -- Xóa dữ liệu khoa_hoc mới
-- DELETE FROM khoa_hoc WHERE ma_khoa_hoc IN ('KH14', 'KH13', 'KH12', 'KH11');
-- 
-- -- Bỏ link nganh
-- UPDATE nganh SET khoa_id = NULL WHERE id = 6;
-- 
-- -- Khôi phục khoa
-- UPDATE khoa SET ten_khoa = 'K14', mo_ta = 'Khóa 14' WHERE id = 4;
