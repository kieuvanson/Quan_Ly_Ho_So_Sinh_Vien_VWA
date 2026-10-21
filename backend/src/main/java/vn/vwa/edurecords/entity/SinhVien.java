package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.hibernate.type.TrangThaiHocVuUserType;

import java.time.LocalDateTime;

/**
 * SinhVien aggregate root.
 *
 * <h3>Quan hệ danh mục (sau V4)</h3>
 * <ul>
 *   <li>{@link #khoa}     → {@code khoa(id)}    — đơn vị hành chính cấp cao</li>
 *   <li>{@link #nganh}    → {@code nganh(id)}   — thuộc về đúng 1 khoa</li>
 *   <li>{@link #lop}      → {@code lop(id)}     — thuộc về đúng 1 ngành + 1 khóa học</li>
 *   <li>{@link #khoaHoc}  → {@code khoa_hoc(id)}— niên khóa</li>
 * </ul>
 *
 * Trước V4 các trường này là VARCHAR (so sánh text). Sau V4, JPA mapping dùng
 * ManyToOne để tận dụng FK, index và lookup danh mục chuẩn hóa.
 *
 * <h3>Trạng thái học vụ</h3>
 * Vẫn dùng {@link TrangThaiHocVuUserType} để map PostgreSQL ENUM
 * {@code trangthaihocvu} ↔ Java enum. Tránh dùng {@code @Enumerated(EnumType.STRING)}
 * vì cột DB là ENUM literal chứ không phải varchar.
 */
@Entity
@Table(name = "sinhvien")
public class SinhVien {

    @Id
    @Column(name = "mssv", length = 20)
    private String mssv;

    @Column(name = "ho_ten", nullable = false, length = 150)
    private String hoTen;

    @Column(name = "ngay_sinh")
    private LocalDateTime ngaySinh;

    @Column(name = "gioi_tinh", length = 10)
    private String gioiTinh;

    @Column(name = "cccd", length = 20, unique = true)
    private String cccd;

    @Column(name = "sdt", length = 20)
    private String sdt;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "que_quan", length = 255)
    private String queQuan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khoa_id", nullable = false)
    private Khoa khoa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nganh_id", nullable = false)
    private Nganh nganh;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lop_id", nullable = false)
    private Lop lop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khoa_hoc_id", nullable = false)
    private KhoaHoc khoaHoc;

    @Column(name = "he_dao_tao", length = 50)
    private String heDaoTao;

    @Type(TrangThaiHocVuUserType.class)
    @Column(name = "trang_thai_hoc_vu", nullable = false, columnDefinition = "trangthaihocvu")
    private TrangThaiHocVu trangThaiHocVu = TrangThaiHocVu.ĐANG_HỌC;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    // Getters and Setters
    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public LocalDateTime getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(LocalDateTime ngaySinh) { this.ngaySinh = ngaySinh; }

    public String getGioiTinh() { return gioiTinh; }
    public void setGioiTinh(String gioiTinh) { this.gioiTinh = gioiTinh; }

    public String getCccd() { return cccd; }
    public void setCccd(String cccd) { this.cccd = cccd; }

    public String getSdt() { return sdt; }
    public void setSdt(String sdt) { this.sdt = sdt; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getQueQuan() { return queQuan; }
    public void setQueQuan(String queQuan) { this.queQuan = queQuan; }

    public Khoa getKhoa() { return khoa; }
    public void setKhoa(Khoa khoa) { this.khoa = khoa; }

    public Nganh getNganh() { return nganh; }
    public void setNganh(Nganh nganh) { this.nganh = nganh; }

    public Lop getLop() { return lop; }
    public void setLop(Lop lop) { this.lop = lop; }

    public KhoaHoc getKhoaHoc() { return khoaHoc; }
    public void setKhoaHoc(KhoaHoc khoaHoc) { this.khoaHoc = khoaHoc; }

    public String getHeDaoTao() { return heDaoTao; }
    public void setHeDaoTao(String heDaoTao) { this.heDaoTao = heDaoTao; }

    public TrangThaiHocVu getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu) { this.trangThaiHocVu = trangThaiHocVu; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
