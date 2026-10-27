package vn.vwa.edurecords.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Response DTO cho một bản ghi nhật ký hệ thống (bảng {@code audit_log}).
 *
 * <p>Ánh xạ 1-1 với các cột của {@code audit_log}, bổ sung thêm
 * {@code mssv} / {@code hoTenSinhVien} khi bản ghi tác động tới bảng
 * {@code sinhvien} (khoá chính của bản ghi là MSSV).</p>
 */
public class AuditLogResponse {

    private Long id;

    /** Hành động phát sinh (VD: CREATE_PHIEU, TRA_PHIEU, RUT_VINH_VIEN). */
    private String hanhDong;

    /** Tên bảng bị tác động (VD: phieu_xuat_ho_so, sinhvien). */
    private String bang;

    /** Khoá chính của bản ghi bị tác động (VD: mã phiếu, MSSV). */
    private String khoaChinh;

    /** Trường dữ liệu bị thay đổi (VD: trang_thai_hoc_vu). */
    private String truongThayDoi;

    /** Giá trị trước khi thay đổi (null nếu không có). */
    private String giaTriCu;

    /** Giá trị sau khi thay đổi (null nếu không có). */
    private String giaTriMoi;

    /** Username cán bộ thực hiện (null nếu do hệ thống tự ghi). */
    private String nguoiThucHien;

    private LocalDateTime thoiGian;

    /** MSSV sinh viên bị tác động — chỉ có khi {@link #bang} = "sinhvien". */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String mssv;

    /** Họ tên sinh viên bị tác động — chỉ có khi {@link #bang} = "sinhvien". */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String hoTenSinhVien;

    public AuditLogResponse() {}

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

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTenSinhVien() { return hoTenSinhVien; }
    public void setHoTenSinhVien(String hoTenSinhVien) { this.hoTenSinhVien = hoTenSinhVien; }
}
