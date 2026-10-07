package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Danh mục Ngành đào tạo. Mỗi ngành thuộc đúng một {@code Khoa} (FK {@code khoa_id}).
 *
 * Vì một khoa có thể có nhiều ngành trùng tên (vd: hai khoa đều có "Công nghệ
 * thông tin"), {@code ma_nganh} là UNIQUE nhưng {@code (ten_nganh, khoa_id)} mới
 * là định danh logic. Khi tìm ngành theo tên từ Excel, cần biết thêm khoa.
 *
 * Quy ước mã: {@code NGANHxxx} (vd {@code NGANH001}), sinh tự động bằng V4.
 */
@Entity
@Table(name = "nganh")
public class Nganh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_nganh", length = 20, unique = true, nullable = false)
    private String maNganh;

    @Column(name = "ten_nganh", length = 150, nullable = false)
    private String tenNganh;

    /**
     * FK {@code nganh.khoa_id} → {@code khoa.id}. EAGER vì API danh mục trả
     * {@code Nganh} cho frontend (cần tên khoa để render cascade dropdown) và
     * serialize ngoài transaction — lazy sẽ ném LazyInitializationException.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khoa_id", nullable = false)
    private Khoa khoa;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @Column(name = "dang_su_dung", nullable = false)
    private Boolean dangSuDung = true;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getMaNganh() { return maNganh; }
    public void setMaNganh(String maNganh) { this.maNganh = maNganh; }

    public String getTenNganh() { return tenNganh; }
    public void setTenNganh(String tenNganh) { this.tenNganh = tenNganh; }

    public Khoa getKhoa() { return khoa; }
    public void setKhoa(Khoa khoa) { this.khoa = khoa; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
