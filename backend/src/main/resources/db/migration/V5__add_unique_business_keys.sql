-- V5__add_unique_business_keys.sql
-- Mục tiêu:
--   1. Đảm bảo business key UNIQUE ở tầng DB cho các danh mục & sinh viên.
--   2. Backup cho logic chống trùng ở service — nếu application bug bỏ qua
--      lookup, DB vẫn ném lỗi và bảo vệ tính toàn vẹn dữ liệu.
--   3. Không thay đổi cấu trúc bảng, chỉ thêm ràng buộc.
--
-- Sử dụng DO block để idempotent - bỏ qua nếu constraint đã tồn tại.

-- =====================================================================
-- 1. SINHVIEN: UNIQUE email
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_sinhvien_email'
    ) THEN
        -- Trước tiên, fix email trùng lặp (nếu có) bằng cách set NULL
        UPDATE sinhvien 
        SET email = NULL 
        WHERE email IN (
            SELECT email FROM sinhvien 
            WHERE email IS NOT NULL 
            GROUP BY email 
            HAVING COUNT(*) > 1
        );
        -- Sau đó thêm constraint
        ALTER TABLE sinhvien ADD CONSTRAINT uq_sinhvien_email UNIQUE (email);
    END IF;
END $$;

-- =====================================================================
-- 2. KHOA: UNIQUE ten_khoa
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_khoa_ten_khoa'
    ) THEN
        ALTER TABLE khoa ADD CONSTRAINT uq_khoa_ten_khoa UNIQUE (ten_khoa);
    END IF;
END $$;

-- =====================================================================
-- 3. NGANH: UNIQUE (ten_nganh, khoa_id)
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_nganh_ten_khoa'
    ) THEN
        ALTER TABLE nganh ADD CONSTRAINT uq_nganh_ten_khoa UNIQUE (ten_nganh, khoa_id);
    END IF;
END $$;

-- =====================================================================
-- 4. KHOA_HOC: UNIQUE ten_khoa_hoc
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_khoa_hoc_ten'
    ) THEN
        ALTER TABLE khoa_hoc ADD CONSTRAINT uq_khoa_hoc_ten UNIQUE (ten_khoa_hoc);
    END IF;
END $$;

-- =====================================================================
-- 5. LOP: UNIQUE (ten_lop, nganh_id, khoa_hoc_id)
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_lop_ten_nganh_khoahoc'
    ) THEN
        ALTER TABLE lop ADD CONSTRAINT uq_lop_ten_nganh_khoahoc UNIQUE (ten_lop, nganh_id, khoa_hoc_id);
    END IF;
END $$;
