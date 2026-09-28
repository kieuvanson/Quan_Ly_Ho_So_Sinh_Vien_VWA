-- V2__add_mssv_to_users.sql
-- Thêm cột mssv vào bảng users để link Staff với sinh viên tương ứng
-- Staff không phải là sinh viên, chỉ là nhân viên quản lý hồ sơ
-- Nhưng để đơn giản hóa, ta link Staff với 1 MSSV để họ có thể xem giấy tờ cá nhân (như một sinh viên thông thường)

ALTER TABLE users ADD COLUMN mssv VARCHAR(20);
ALTER TABLE users ADD CONSTRAINT fk_users_sinhvien FOREIGN KEY (mssv) REFERENCES sinhvien(mssv);

-- Cập nhật tài khoản Kieuvanson hiện tại (nếu có MSSV phù hợp)
-- Để null nếu account đó không gắn với sinh viên nào
