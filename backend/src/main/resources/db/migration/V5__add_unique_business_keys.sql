-- V5__add_unique_business_keys.sql
-- Mục tiêu:
--   1. Đảm bảo business key UNIQUE ở tầng DB cho các danh mục & sinh viên.
--   2. Backup cho logic chống trùng ở service — nếu application bug bỏ qua
--      lookup, DB vẫn ném lỗi và bảo vệ tính toàn vẹn dữ liệu.
--   3. Không thay đổi cấu trúc bảng, chỉ thêm ràng buộc.
--
-- Trước khi chạy migration, dữ liệu hiện tại đã được verify sạch (0 dup) bằng:
--   SELECT COUNT(*) - COUNT(DISTINCT email) FROM sinhvien;                        -- 0
--   SELECT COUNT(*) - COUNT(DISTINCT ten_khoa) FROM khoa;                       -- 0
--   SELECT COUNT(*) - COUNT(DISTINCT (ten_nganh, khoa_id)) FROM nganh;           -- 0
--   SELECT COUNT(*) - COUNT(DISTINCT ten_khoa_hoc) FROM khoa_hoc;                -- 0
--   SELECT COUNT(*) - COUNT(DISTINCT (ten_lop, nganh_id, khoa_hoc_id)) FROM lop;-- 0
--
-- Quy tắc đặt tên constraint: uq_<table>_<column(s)> để dễ debug.

-- =====================================================================
-- 1. SINHVIEN: UNIQUE email
-- =====================================================================
-- Email NULL được phép (SV chưa cập nhật email). PostgreSQL cho phép nhiều
-- NULL trong UNIQUE constraint theo mặc định → đúng nghiệp vụ.
ALTER TABLE sinhvien
    ADD CONSTRAINT uq_sinhvien_email UNIQUE (email);

-- =====================================================================
-- 2. KHOA: UNIQUE ten_khoa
-- =====================================================================
ALTER TABLE khoa
    ADD CONSTRAINT uq_khoa_ten_khoa UNIQUE (ten_khoa);

-- =====================================================================
-- 3. NGANH: UNIQUE (ten_nganh, khoa_id)
-- =====================================================================
-- Vì tên ngành có thể trùng giữa hai khoa khác nhau, định danh logic là
-- cặp (ten_nganh, khoa_id). ma_nganh đã UNIQUE riêng ở V4.
ALTER TABLE nganh
    ADD CONSTRAINT uq_nganh_ten_khoa UNIQUE (ten_nganh, khoa_id);

-- =====================================================================
-- 4. KHOA_HOC: UNIQUE ten_khoa_hoc
-- =====================================================================
ALTER TABLE khoa_hoc
    ADD CONSTRAINT uq_khoa_hoc_ten UNIQUE (ten_khoa_hoc);

-- =====================================================================
-- 5. LOP: UNIQUE (ten_lop, nganh_id, khoa_hoc_id)
-- =====================================================================
-- Lớp "CNTT-2023.1" ở hai ngành khác nhau hoặc hai khóa khác nhau được coi
-- là hai bản ghi khác nhau → định danh logic là bộ 3. ma_lop đã UNIQUE riêng.
ALTER TABLE lop
    ADD CONSTRAINT uq_lop_ten_nganh_khoahoc UNIQUE (ten_lop, nganh_id, khoa_hoc_id);

-- =====================================================================
-- 6. INDEX bổ sung (giúp query lookup nhanh hơn khi filter)
-- =====================================================================
-- Cột FK đã có index từ V4; chỉ thêm index cho các cột UNIQUE nếu chưa tự sinh.
-- PostgreSQL tự tạo index cho UNIQUE constraint nên KHÔNG cần CREATE INDEX
-- thủ công cho các cột trên.

-- =====================================================================
-- 7. GHI CHÚ CHO DEVELOPER
-- =====================================================================
-- - Service đã check tồn tại trước khi tạo (findByTenXxx, findByMaXxx), nhưng
--   DB constraint là lớp bảo vệ cuối cùng — nếu có race condition hoặc service
--   bug, DB vẫn từ chối insert.
-- - Khi import Excel trùng (vd hai dòng cùng mã khoa), service đã loại dòng
--   thứ 2 bằng Set seenMssv / seenCccd. Với danh mục, Excel cùng tên khoa
--   → dùng entity đã tồn tại (findOrCreate), không sinh thêm.
-- - generateMaKhoa() trong DanhMucService vẫn dùng count()+1 — chưa sửa vì
--   mã là UNIQUE và DB sẽ throw nếu trùng, nhưng nên refactor sang MAX()+1
--   trong giai đoạn sau để tránh throw nhiều lần.