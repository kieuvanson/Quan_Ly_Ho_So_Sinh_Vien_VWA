package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Danh mục Lớp sinh viên. Mỗi lớp thuộc đúng một {@code Nganh} và một {@code KhoaHoc}.
 *
 * Định danh logic: {@code (ten_lop, nganh_id, khoa_hoc_id)} — vì cùng tên lớp có
 * thể tồn tại ở hai ngành khác nhau (hiếm gặp nhưng V4 vẫn cho phép). Mã lớp
 * {@code ma_lop} là UNIQUE.
 *
 * Quy ước mã: {@code LOPxxx} (vd {@code LOP001}), sinh tự động bằng V4.
 */
@Entity
@Table(name = "lop")
public class Lop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_lop", length = 20, unique = true, nullable = false)
    private String maLop;

    @Column(name = "ten_lop", length = 100, nullable = false)
    private String tenLop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nganh_id", nullable = false)
    private Nganh nganh;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khoa_hoc_id", nullable = false)
    private KhoaHoc khoaHoc;

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

    public String getMaLop() { return maLop; }
    public void setMaLop(String maLop) { this.maLop = maLop; }

    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }

    public Nganh getNganh() { return nganh; }
    public void setNganh(Nganh nganh) { this.nganh = nganh; }

    public KhoaHoc getKhoaHoc() { return khoaHoc; }
    public void setKhoaHoc(KhoaHoc khoaHoc) { this.khoaHoc = khoaHoc; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
