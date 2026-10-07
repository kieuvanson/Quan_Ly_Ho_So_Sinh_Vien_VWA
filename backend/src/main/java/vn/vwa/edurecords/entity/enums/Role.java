package vn.vwa.edurecords.entity.enums;

/**
 * Vai trò người dùng. Giá trị PHẢI khớp CHÍNH XÁC với PostgreSQL ENUM `user_role`
 * khai báo trong V1__init_schema.sql: ('ADMIN', 'STAFF').
 */
public enum Role {
    /** Quản trị viên — toàn quyền, bao gồm quản lý tài khoản. */
    ADMIN,

    /** Chuyên viên đào tạo - tuyển sinh — thao tác nghiệp vụ hồ sơ. */
    STAFF
}
