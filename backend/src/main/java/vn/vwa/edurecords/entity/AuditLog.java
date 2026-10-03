package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AUDIT_LOG — Bảng audit ghi nhận mọi thay đổi trên hồ sơ / phiếu.
 * Theo AGENTS.md mục 5: "Mọi thay đổi trạng thái phiếu hoặc hồ sơ
 * phải ghi Lịch sử & Audit, không ghi đè dữ liệu cũ".
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Hành động phát sinh (CREATE_PHIEU, TRA_PHIEU, RUT_VINH_VIEN, DUYET_PHIEU, ...) */
    @Column(name = "hanh_dong", nullable = false, length = 50)
    private String hanhDong;

    /** Tên bảng bị tác động (vd: phieu_xuat_ho_so, sinhvien, ho_so_giay_to) */
    @Column(name = "bang", nullable = false, length = 50)
    private String bang;

    /** Khóa chính của record bị tác động (vd: maPhieu, mssv) */
    @Column(name = "khoa_chinh", length = 100)
    private String khoaChinh;

    /** Trường dữ liệu thay đổi (vd: trang_thai, trang_thai_hoc_vu) */
    @Column(name = "truong_thay_doi", length = 100)
    private String truongThayDoi;

    /** Giá trị trước khi thay đổi (TEXT để chứa mọi kiểu) */
    @Column(name = "gia_tri_cu", columnDefinition = "TEXT")
    private String giaTriCu;

    /** Giá trị sau khi thay đổi */
    @Column(name = "gia_tri_moi", columnDefinition = "TEXT")
    private String giaTriMoi;

    /** Username cán bộ thực hiện (lấy từ SecurityContext) */
    @Column(name = "nguoi_thuc_hien", length = 100)
    private String nguoiThucHien;

    @Column(name = "thoi_gian", nullable = false)
    private LocalDateTime thoiGian = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String hanhDong, String bang, String khoaChinh, String truongThayDoi,
                    String giaTriCu, String giaTriMoi, String nguoiThucHien) {
        this.hanhDong = hanhDong;
        this.bang = bang;
        this.khoaChinh = khoaChinh;
        this.truongThayDoi = truongThayDoi;
        this.giaTriCu = giaTriCu;
        this.giaTriMoi = giaTriMoi;
        this.nguoiThucHien = nguoiThucHien;
        this.thoiGian = LocalDateTime.now();
    }

    // Getters / Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getHanhDong() { return hanhDong; }
    public void setHanhDong(String hanhDong) { this.hanhDong = hanhDong; }

    public String getBang() { return bang; }
    public void setBang(String bang) { this.bang = bang; }

    public String getKhoaChinh() { return khoaChinh; }
    public void setKhoaChinh(String khoaChinh) { this.khoaChinh = khoaChinh; }

    public String getTruongThayDoi() { return truongThayDoi; }
    public void setTruongThayDoi(String truongThayDoi) { this.truongThayDoi = truongThayDoi; }

    public String getGiaTriCu() { return giaTriCu; }
    public void setGiaTriCu(String giaTriCu) { this.giaTriCu = giaTriCu; }

    public String getGiaTriMoi() { return giaTriMoi; }
    public void setGiaTriMoi(String giaTriMoi) { this.giaTriMoi = giaTriMoi; }

    public String getNguoiThucHien() { return nguoiThucHien; }
    public void setNguoiThucHien(String nguoiThucHien) { this.nguoiThucHien = nguoiThucHien; }

    public LocalDateTime getThoiGian() { return thoiGian; }
    public void setThoiGian(LocalDateTime thoiGian) { this.thoiGian = thoiGian; }
}