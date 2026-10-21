-- V4__add_danh_muc_tables.sql
-- Mục tiêu:
--   1. Chuẩn hóa 3 danh mục (Khoa, Ngành, Lớp) + Khóa học thành bảng riêng có mã định danh.
--   2. Thay các cột VARCHAR `khoa`, `nganh`, `lop`, `khoa_nam_nhap_hoc` trong `sinhvien`
--      bằng cột FK *_id, mất đi phụ thuộc so sánh text khi import cascade.
--   3. Backfill dữ liệu danh mục từ các giá trị VARCHAR hiện có; mỗi giá trị
--      text được chuyển thành một record danh mục có mã tự sinh.
--
-- Quy ước 11 sinh viên -> tìm đúng:
--   MSSV  -> lop_id  -> nganh_id -> khoa_id
--                  \-> khoa_hoc_id
--
-- Thứ tự thực thi quan trọng vì FK:
--   1. Tạo bảng `khoa` (không phụ thuộc).
--   2. Tạo bảng `nganh` (FK -> khoa).
--   3. Tạo bảng `khoa_hoc` (không phụ thuộc).
--   4. Tạo bảng `lop` (FK -> nganh, khoa_hoc).
--   5. Thêm cột *_id vào `sinhvien` (nullable trước).
--   6. Backfill *_id từ text.
--   7. NOT NULL + FK sau khi đã chắc chắn backfill xong (giữ lookup an toàn cho từng dòng).
--   8. Bỏ các index không cần (idx_sinhvien_nganh, idx_sinhvien_lop) và thay bằng *_id.

-- =====================================================================
-- 1. TẠO BẢNG DANH MỤC
-- =====================================================================

CREATE TABLE khoa (
    id              SERIAL PRIMARY KEY,
    ma_khoa         VARCHAR(20) UNIQUE NOT NULL,
    ten_khoa        VARCHAR(150) NOT NULL,
    mo_ta           VARCHAR(500),
    dang_su_dung    BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat   TIMESTAMP
);
CREATE INDEX idx_khoa_ma_khoa ON khoa(ma_khoa);

CREATE TABLE nganh (
    id              SERIAL PRIMARY KEY,
    ma_nganh        VARCHAR(20) UNIQUE NOT NULL,
    ten_nganh       VARCHAR(150) NOT NULL,
    khoa_id         INT NOT NULL,
    mo_ta           VARCHAR(500),
    dang_su_dung    BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat   TIMESTAMP,
    CONSTRAINT fk_nganh_khoa FOREIGN KEY (khoa_id) REFERENCES khoa(id)
);
CREATE INDEX idx_nganh_ma_nganh ON nganh(ma_nganh);
CREATE INDEX idx_nganh_khoa_id ON nganh(khoa_id);

CREATE TABLE khoa_hoc (
    id              SERIAL PRIMARY KEY,
    ma_khoa_hoc     VARCHAR(20) UNIQUE NOT NULL,
    ten_khoa_hoc    VARCHAR(100) NOT NULL,
    nam_bat_dau     INT,
    nam_ket_thuc    INT,
    mo_ta           VARCHAR(500),
    dang_su_dung    BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat   TIMESTAMP
);
CREATE INDEX idx_khoa_hoc_ma ON khoa_hoc(ma_khoa_hoc);

CREATE TABLE lop (
    id              SERIAL PRIMARY KEY,
    ma_lop          VARCHAR(20) UNIQUE NOT NULL,
    ten_lop         VARCHAR(100) NOT NULL,
    nganh_id        INT NOT NULL,
    khoa_hoc_id     INT NOT NULL,
    mo_ta           VARCHAR(500),
    dang_su_dung    BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_tao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat   TIMESTAMP,
    CONSTRAINT fk_lop_nganh    FOREIGN KEY (nganh_id)    REFERENCES nganh(id),
    CONSTRAINT fk_lop_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id)
);
CREATE INDEX idx_lop_ma_lop ON lop(ma_lop);
CREATE INDEX idx_lop_nganh_id ON lop(nganh_id);
CREATE INDEX idx_lop_khoa_hoc_id ON lop(khoa_hoc_id);

-- =====================================================================
-- 2. THÊM CỘT FK VÀO `sinhvien` (nullable tạm thời để backfill an toàn)
-- =====================================================================

ALTER TABLE sinhvien ADD COLUMN khoa_id     INT;
ALTER TABLE sinhvien ADD COLUMN nganh_id    INT;
ALTER TABLE sinhvien ADD COLUMN lop_id      INT;
ALTER TABLE sinhvien ADD COLUMN khoa_hoc_id INT;

-- =====================================================================
-- 3. BACKFILL: trích danh mục từ các cột VARCHAR hiện có
--    - Mỗi giá trị text duy nhất (LOWER(TRIM(...))) -> 1 record danh mục.
--    - Mã tự sinh theo pattern: KHOA001, NGANH001, KHOAHOC001, LOP001.
-- =====================================================================

-- 3.1. Backfill `khoa`
INSERT INTO khoa (ma_khoa, ten_khoa)
SELECT
    'KHOA' || LPAD(ROW_NUMBER() OVER (ORDER BY MIN(ten))::TEXT, 2, '0'),
    ten
FROM (
    SELECT DISTINCT TRIM(khoa) AS ten
    FROM sinhvien
    WHERE khoa IS NOT NULL AND TRIM(khoa) <> ''
) src
GROUP BY ten;

-- 3.2. Backfill `khoa_hoc` từ `khoa_nam_nhap_hoc`
INSERT INTO khoa_hoc (ma_khoa_hoc, ten_khoa_hoc)
SELECT
    'KH' || LPAD(ROW_NUMBER() OVER (ORDER BY MIN(ten))::TEXT, 2, '0'),
    ten
FROM (
    SELECT DISTINCT TRIM(khoa_nam_nhap_hoc) AS ten
    FROM sinhvien
    WHERE khoa_nam_nhap_hoc IS NOT NULL AND TRIM(khoa_nam_nhap_hoc) <> ''
) src
GROUP BY ten;

-- 3.3. Backfill `nganh` (cần biết `khoa_id` tương ứng)
INSERT INTO nganh (ma_nganh, ten_nganh, khoa_id)
SELECT
    'NGANH' || LPAD(ROW_NUMBER() OVER (ORDER BY MIN(src.ten_nganh))::TEXT, 3, '0'),
    src.ten_nganh,
    k.id
FROM (
    SELECT DISTINCT TRIM(s.nganh) AS ten_nganh, TRIM(s.khoa) AS ten_khoa
    FROM sinhvien s
    WHERE s.nganh IS NOT NULL AND TRIM(s.nganh) <> ''
      AND s.khoa IS NOT NULL AND TRIM(s.khoa) <> ''
) src
JOIN khoa k ON k.ten_khoa = src.ten_khoa
GROUP BY src.ten_nganh, k.id;

-- 3.4. Backfill `lop` (cần `nganh_id`, `khoa_hoc_id`)
INSERT INTO lop (ma_lop, ten_lop, nganh_id, khoa_hoc_id)
SELECT
    'LOP' || LPAD(ROW_NUMBER() OVER (ORDER BY MIN(src.ten_lop))::TEXT, 3, '0'),
    src.ten_lop,
    n.id,
    kh.id
FROM (
    SELECT DISTINCT TRIM(s.lop) AS ten_lop,
                    TRIM(s.nganh) AS ten_nganh,
                    TRIM(s.khoa) AS ten_khoa,
                    TRIM(s.khoa_nam_nhap_hoc) AS ten_khoa_hoc
    FROM sinhvien s
    WHERE s.lop IS NOT NULL AND TRIM(s.lop) <> ''
      AND s.nganh IS NOT NULL AND TRIM(s.nganh) <> ''
      AND s.khoa IS NOT NULL AND TRIM(s.khoa) <> ''
      AND s.khoa_nam_nhap_hoc IS NOT NULL AND TRIM(s.khoa_nam_nhap_hoc) <> ''
) src
JOIN khoa k       ON k.ten_khoa        = src.ten_khoa
JOIN nganh n      ON n.ten_nganh       = src.ten_nganh AND n.khoa_id = k.id
JOIN khoa_hoc kh  ON kh.ten_khoa_hoc   = src.ten_khoa_hoc
GROUP BY src.ten_lop, n.id, kh.id;

-- 3.5. Backfill `sinhvien.khoa_id`, `nganh_id`, `lop_id`, `khoa_hoc_id`
UPDATE sinhvien s SET
    khoa_id     = k.id
FROM khoa k
WHERE s.khoa IS NOT NULL AND TRIM(s.khoa) <> ''
  AND k.ten_khoa = TRIM(s.khoa);

UPDATE sinhvien s SET
    khoa_hoc_id = kh.id
FROM khoa_hoc kh
WHERE s.khoa_nam_nhap_hoc IS NOT NULL AND TRIM(s.khoa_nam_nhap_hoc) <> ''
  AND kh.ten_khoa_hoc = TRIM(s.khoa_nam_nhap_hoc);

UPDATE sinhvien s SET
    nganh_id = n.id
FROM khoa k
JOIN nganh n ON n.khoa_id = k.id
WHERE s.nganh IS NOT NULL AND TRIM(s.nganh) <> ''
  AND s.khoa IS NOT NULL AND TRIM(s.khoa) <> ''
  AND k.ten_khoa = TRIM(s.khoa)
  AND n.ten_nganh = TRIM(s.nganh);

UPDATE sinhvien s SET
    lop_id = l.id
FROM khoa k
JOIN nganh n      ON n.khoa_id = k.id
JOIN khoa_hoc kh  ON true
JOIN lop l        ON l.nganh_id = n.id AND l.khoa_hoc_id = kh.id
WHERE s.lop IS NOT NULL AND TRIM(s.lop) <> ''
  AND s.nganh IS NOT NULL AND TRIM(s.nganh) <> ''
  AND s.khoa IS NOT NULL AND TRIM(s.khoa) <> ''
  AND s.khoa_nam_nhap_hoc IS NOT NULL AND TRIM(s.khoa_nam_nhap_hoc) <> ''
  AND k.ten_khoa = TRIM(s.khoa)
  AND n.ten_nganh = TRIM(s.nganh)
  AND kh.ten_khoa_hoc = TRIM(s.khoa_nam_nhap_hoc)
  AND l.ten_lop = TRIM(s.lop);

-- =====================================================================
-- 4. KIỂM TRA backfill (chỉ chạy khi debug; bỏ comment nếu cần)
-- =====================================================================
-- SELECT COUNT(*) AS sv_without_lop FROM sinhvien WHERE lop_id IS NULL;

-- =====================================================================
-- 5. KHÓA CHẶT: NOT NULL + FK CONSTRAINTS cho các cột FK đã backfill
--    Lưu ý: phải thực hiện sau khi đã chắc chắn mọi sinhvien đều có *_id.
-- =====================================================================

-- Nếu phát hiện sinhvien còn thiếu *_id, nên dừng migration tại đây và xử lý thủ công.
DO $$
DECLARE
    missing_lop INT;
    missing_nganh INT;
    missing_khoa INT;
    missing_kh INT;
BEGIN
    SELECT COUNT(*) INTO missing_lop   FROM sinhvien WHERE lop_id IS NULL;
    SELECT COUNT(*) INTO missing_nganh FROM sinhvien WHERE nganh_id IS NULL;
    SELECT COUNT(*) INTO missing_khoa  FROM sinhvien WHERE khoa_id IS NULL;
    SELECT COUNT(*) INTO missing_kh    FROM sinhvien WHERE khoa_hoc_id IS NULL;

    IF missing_lop > 0 OR missing_nganh > 0 OR missing_khoa > 0 OR missing_kh > 0 THEN
        RAISE EXCEPTION 'Backfill chưa xong: lop=%, nganh=%, khoa=%, khoa_hoc=%',
            missing_lop, missing_nganh, missing_khoa, missing_kh;
    END IF;
END
$$;

ALTER TABLE sinhvien ALTER COLUMN khoa_id     SET NOT NULL;
ALTER TABLE sinhvien ALTER COLUMN nganh_id    SET NOT NULL;
ALTER TABLE sinhvien ALTER COLUMN lop_id      SET NOT NULL;
ALTER TABLE sinhvien ALTER COLUMN khoa_hoc_id SET NOT NULL;

ALTER TABLE sinhvien
    ADD CONSTRAINT fk_sinhvien_khoa     FOREIGN KEY (khoa_id)     REFERENCES khoa(id),
    ADD CONSTRAINT fk_sinhvien_nganh    FOREIGN KEY (nganh_id)    REFERENCES nganh(id),
    ADD CONSTRAINT fk_sinhvien_lop      FOREIGN KEY (lop_id)      REFERENCES lop(id),
    ADD CONSTRAINT fk_sinhvien_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id);

-- =====================================================================
-- 6. INDEX mới phục vụ import cascade và truy vấn cây danh mục
-- =====================================================================
CREATE INDEX idx_sinhvien_lop_id      ON sinhvien(lop_id);
CREATE INDEX idx_sinhvien_nganh_id    ON sinhvien(nganh_id);
CREATE INDEX idx_sinhvien_khoa_id     ON sinhvien(khoa_id);
CREATE INDEX idx_sinhvien_khoa_hoc_id ON sinhvien(khoa_hoc_id);

-- =====================================================================
-- 7. BỎ CỘT VARCHAR cũ và index cũ (giữ schema gọn)
-- =====================================================================
DROP INDEX IF EXISTS idx_sinhvien_nganh;
DROP INDEX IF EXISTS idx_sinhvien_lop;
DROP INDEX IF EXISTS idx_sinhvien_khoanamnhaphoc;

ALTER TABLE sinhvien DROP COLUMN khoa;
ALTER TABLE sinhvien DROP COLUMN nganh;
ALTER TABLE sinhvien DROP COLUMN lop;
ALTER TABLE sinhvien DROP COLUMN khoa_nam_nhap_hoc;

-- =====================================================================
-- 8. GHI CHÚ CHO DEVELOPER
-- =====================================================================
-- Sau V4, cập nhật code:
--   - entity/SinhVien.java: bỏ field `khoa`, `nganh`, `lop`, `khoaNamNhapHoc` (VARCHAR)
--     và thêm field ManyToOne/Integer: `khoa`, `nganh`, `lop`, `khoaHoc`.
--   - Tạo entity mới: Khoa, Nganh, KhoaHoc, Lop + repository tương ứng.
--   - Cập nhật SinhVienExcelService: thay vì ghi text, lookup *_id theo mã/ten.
--   - Khi import cascade: gọi service khoa/nganh/lop trước, sinhvien sau.