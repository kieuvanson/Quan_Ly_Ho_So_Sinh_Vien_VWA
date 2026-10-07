-- bootstrap_flyway.sql
-- MỤC ĐÍCH: Bootstrap Flyway cho database đã có sẵn schema (apply thủ công bằng psql).
-- Chạy 1 LẦN DUY NHẤT khi DB đã tồn tại 8 bảng (audit_log, chi_tiet_phieu,
-- ho_so_giay_to, lich_su_nop, loai_giay_to, phieu_xuat_ho_so, sinhvien, users)
-- nhưng CHƯA có bảng flyway_schema_history.
--
-- SAU KHI CHẠY: restart backend (.\mvnw.cmd spring-boot:run) — Flyway sẽ thấy
-- V1, V2, V3 đã được đăng ký, chỉ apply V4 trở đi.
--
-- CÁCH CHẠY (chọn 1 trong 2):
--   1) Qua Docker:
--      docker compose exec -T postgres psql -U postgres -d vwa_edurecords < bootstrap_flyway.sql
--   2) Qua psql local (nếu PostgreSQL chạy trực tiếp trên máy):
--      psql -h localhost -p 5432 -U postgres -d vwa_edurecords -f bootstrap_flyway.sql

BEGIN;

-- 1) Tạo bảng flyway_schema_history theo schema chuẩn của Flyway 10+
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank    INT NOT NULL,
    version           VARCHAR(50),
    description       VARCHAR(200) NOT NULL,
    type              VARCHAR(20)  NOT NULL,
    script            VARCHAR(1000) NOT NULL,
    checksum          INT,
    installed_by      VARCHAR(100) NOT NULL,
    installed_on      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time    INT NOT NULL,
    success           BOOLEAN NOT NULL,
    PRIMARY KEY (installed_rank)
);
CREATE INDEX IF NOT EXISTS flyway_schema_history_s_idx ON flyway_schema_history (success);

-- 2) Insert V1, V2, V3 là "đã apply thành công".
--    Checksum NULL = Flyway sẽ không verify lại nội dung. Đây là cách an toàn
--    nhất khi DB đã tồn tại từ trước (baseline approach).
INSERT INTO flyway_schema_history
    (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES
    (1, '1', 'init schema',           'SQL', 'V1__init_schema.sql',                            NULL, 'bootstrap', CURRENT_TIMESTAMP, 0, TRUE),
    (2, '2', 'seed data',             'SQL', 'V2__seed_data.sql',                              NULL, 'bootstrap', CURRENT_TIMESTAMP, 0, TRUE),
    (3, '3', 'remove seeded admin',   'SQL', 'V3__remove_seeded_admin_and_add_indexes.sql',   NULL, 'bootstrap', CURRENT_TIMESTAMP, 0, TRUE)
ON CONFLICT (installed_rank) DO NOTHING;

-- 3) Verify
SELECT installed_rank, version, description, success, installed_by
FROM flyway_schema_history
ORDER BY installed_rank;

COMMIT;
