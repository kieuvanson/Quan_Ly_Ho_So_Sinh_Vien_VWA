-- V6__remove_nganh_khoa_dependency.sql
-- Mục tiêu: Ngành là danh mục độc lập, không phụ thuộc vào Khoa.
--
-- Ngữ cảnh:
--   Bảng `khoa` hiện tại dùng cho 2 mục đích:
--     1. `sinhvien.khoa_id` → khoa (đơn vị đào tạo - dùng tiếp)
--     2. `nganh.khoa_id`    → khoa (sai nghiệp vụ - BỎ)
--
-- Thay đổi:
--   1. Bỏ NOT NULL constraint trên nganh.khoa_id (cho phép NULL)
--   2. Bỏ FK constraint fk_nganh_khoa (nganh không còn phụ thuộc khoa)
--   3. Cột khoa_id trong nganh vẫn giữ lại để tương thích ngược
--      (cho phép import dữ liệu cũ có khoa_id, hoặc link tùy chọn sau này)
--
-- Tác động:
--   - Dữ liệu hiện có trong nganh.khoa_id: GIỮ NGUYÊN (không sửa)
--   - sinhvien.khoa_id: KHÔNG THAY ĐỔI
--   - nganh: tạo mới không cần khoa_id
--   - Frontend/Service: bỏ bắt buộc chọn Khoa khi thêm ngành

-- =====================================================================
-- 1. Bỏ FK constraint trên nganh.khoa_id
-- =====================================================================
-- Tên FK: fk_nganh_khoa (định nghĩa trong V4)
ALTER TABLE nganh DROP CONSTRAINT IF EXISTS fk_nganh_khoa;

-- =====================================================================
-- 2. Bỏ NOT NULL trên nganh.khoa_id
-- =====================================================================
ALTER TABLE nganh ALTER COLUMN khoa_id DROP NOT NULL;

-- =====================================================================
-- 3. Xóa index không còn cần cho FK (index trên khoa_id trong nganh)
-- =====================================================================
DROP INDEX IF EXISTS idx_nganh_khoa_id;
