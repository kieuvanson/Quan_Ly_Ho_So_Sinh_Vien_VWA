package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Danh mục Ngành đào tạo. Ngành là danh mục độc lập, không bắt buộc
 * thuộc về Khoa (sau V6).
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
     * FK {@code nganh.khoa_id} → {@code khoa.id}.
     * Sau V6, trường này là NULL được (tùy chọn), không bắt buộc.
     * Vẫn giữ để tương thích ngược và cho phép link ngành với khoa nếu cần.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khoa_id", nullable = true)
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
