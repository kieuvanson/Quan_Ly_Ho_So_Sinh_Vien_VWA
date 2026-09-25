-- V1__init_schema.sql
-- Database schema cho VWA EduRecords (MVP) - snake_case columns
-- Generated: 2026-09-26

-- ===== ENUM TYPES =====
CREATE TYPE trangthaihocvu AS ENUM ('Đang học', 'Bảo lưu', 'Đình chỉ', 'Tốt nghiệp', 'Đã rút hồ sơ');
CREATE TYPE trangthainop AS ENUM ('Chưa nộp', 'Đã nộp', 'Thiếu', 'Không hợp lệ');
CREATE TYPE loaiban AS ENUM ('Bản gốc', 'Bản sao');
CREATE TYPE loaiphieu AS ENUM ('Mượn tạm thời', 'Rút vĩnh viễn');
CREATE TYPE trangthaiphieu AS ENUM ('Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đang mượn', 'Đã trả', 'Quá hạn', 'Hoàn tất');

-- ===== Bảng USERS (Admin) =====
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    role user_role NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);

-- ===== Bảng SINHVIEN =====
CREATE TABLE sinhvien (
    mssv VARCHAR(20) PRIMARY KEY,
    ho_ten VARCHAR(150) NOT NULL,
    ngay_sinh TIMESTAMP,
    gioi_tinh VARCHAR(10),
    cccd VARCHAR(20) UNIQUE,
    sdt VARCHAR(20),
    email VARCHAR(100),
    que_quan VARCHAR(255),
    nganh VARCHAR(100),
    lop VARCHAR(20),
    khoa VARCHAR(50),
    khoa_nam_nhap_hoc VARCHAR(50),
    he_dao_tao VARCHAR(50),
    trang_thai_hoc_vu trangthaihocvu NOT NULL DEFAULT 'Đang học',
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP
);

CREATE INDEX idx_sinhvien_trangthai ON sinhvien(trang_thai_hoc_vu);
CREATE INDEX idx_sinhvien_nganh ON sinhvien(nganh);
CREATE INDEX idx_sinhvien_lop ON sinhvien(lop);
CREATE INDEX idx_sinhvien_khoanamnhaphoc ON sinhvien(khoa_nam_nhap_hoc);

-- ===== Bảng LOAIGIAYTO =====
CREATE TABLE loai_giay_to (
    ma_loai VARCHAR(10) PRIMARY KEY,
    ten_giay_to VARCHAR(200) NOT NULL,
    mo_ta VARCHAR(500),
    bat_buoc BOOLEAN NOT NULL DEFAULT FALSE,
    dang_su_dung BOOLEAN NOT NULL DEFAULT TRUE,
    thu_tu_hien_thi INT DEFAULT 0,
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== Bảng HOSOGIAYTO =====
CREATE TABLE ho_so_giay_to (
    ma_ho_so VARCHAR(20) PRIMARY KEY,
    mssv VARCHAR(20) NOT NULL,
    ma_loai VARCHAR(10) NOT NULL,
    trang_thai_nop trangthainop NOT NULL DEFAULT 'Chưa nộp',
    ban_goc_ban_sao loaiban,
    file_dinh_kem VARCHAR(500),
    vi_tri_luu_kho VARCHAR(100),
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP,
    CONSTRAINT fk_hosogiayto_sinhvien FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    CONSTRAINT fk_hosogiayto_loaigiayto FOREIGN KEY (ma_loai) REFERENCES loai_giay_to(ma_loai),
    CONSTRAINT uq_hosogiayto_mssv_maloai UNIQUE (mssv, ma_loai)
);

CREATE INDEX idx_hosogiayto_mssv ON ho_so_giay_to(mssv);
CREATE INDEX idx_hosogiayto_maloai ON ho_so_giay_to(ma_loai);
CREATE INDEX idx_hosogiayto_trangthainop ON ho_so_giay_to(trang_thai_nop);

-- ===== Bảng LICHSUNOP =====
CREATE TABLE lich_su_nop (
    ma_log VARCHAR(20) PRIMARY KEY,
    ma_ho_so VARCHAR(20) NOT NULL,
    mssv VARCHAR(20) NOT NULL,
    hanh_dong VARCHAR(50) NOT NULL,
    trang_thai_cu trangthainop,
    trang_thai_moi trangthainop,
    ghi_chu VARCHAR(500),
    nguoi_thuc_hien VARCHAR(100),
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lichsunop_hosogiayto FOREIGN KEY (ma_ho_so) REFERENCES ho_so_giay_to(ma_ho_so) ON DELETE CASCADE,
    CONSTRAINT fk_lichsunop_sinhvien FOREIGN KEY (mssv) REFERENCES sinhvien(mssv)
);

CREATE INDEX idx_lichsunop_mahoso ON lich_su_nop(ma_ho_so);
CREATE INDEX idx_lichsunop_mssv ON lich_su_nop(mssv);
CREATE INDEX idx_lichsunop_thoigian ON lich_su_nop(thoi_gian);

-- ===== Bảng PHIEUXUATHOSO =====
CREATE TABLE phieu_xuat_ho_so (
    ma_phieu VARCHAR(20) PRIMARY KEY,
    mssv VARCHAR(20) NOT NULL,
    loai_phieu loaiphieu NOT NULL,
    trang_thai trangthaiphieu NOT NULL DEFAULT 'Chờ duyệt',
    ly_do VARCHAR(500),
    ngay_muon DATE,
    ngay_tra_du_kien DATE,
    ngay_tra_thuc_te DATE,
    ghi_chu VARCHAR(500),
    nguoi_tao VARCHAR(100),
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP,
    CONSTRAINT fk_phieuxuathoso_sinhvien FOREIGN KEY (mssv) REFERENCES sinhvien(mssv)
);

CREATE INDEX idx_phieuxuathoso_mssv ON phieu_xuat_ho_so(mssv);
CREATE INDEX idx_phieuxuathoso_loaiphieu ON phieu_xuat_ho_so(loai_phieu);
CREATE INDEX idx_phieuxuathoso_trangthai ON phieu_xuat_ho_so(trang_thai);

-- ===== Bảng CHITIETPHIEU =====
CREATE TABLE chi_tiet_phieu (
    ma_ct VARCHAR(20) PRIMARY KEY,
    ma_phieu VARCHAR(20) NOT NULL,
    ma_ho_so VARCHAR(20) NOT NULL,
    ghi_chu VARCHAR(500),
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chitietphieu_phieuxuathoso FOREIGN KEY (ma_phieu) REFERENCES phieu_xuat_ho_so(ma_phieu) ON DELETE CASCADE,
    CONSTRAINT fk_chitietphieu_hosogiayto FOREIGN KEY (ma_ho_so) REFERENCES ho_so_giay_to(ma_ho_so),
    CONSTRAINT uq_chitietphieu_phieu_hoso UNIQUE (ma_phieu, ma_ho_so)
);

CREATE INDEX idx_chitietphieu_maphieu ON chi_tiet_phieu(ma_phieu);
CREATE INDEX idx_chitietphieu_mahoso ON chi_tiet_phieu(ma_ho_so);

-- ===== Bảng AUDIT_LOG =====
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    hanh_dong VARCHAR(50) NOT NULL,
    bang VARCHAR(50) NOT NULL,
    khoa_chinh VARCHAR(100),
    truong_thay_doi VARCHAR(100),
    gia_tri_cu TEXT,
    gia_tri_moi TEXT,
    nguoi_thuc_hien VARCHAR(100),
    thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_bang ON audit_log(bang);
CREATE INDEX idx_audit_log_khoachinh ON audit_log(khoa_chinh);
CREATE INDEX idx_audit_log_thoigian ON audit_log(thoi_gian);
