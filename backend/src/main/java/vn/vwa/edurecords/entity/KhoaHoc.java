package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Danh mục Khóa học (niên khóa, vd: "2023", "2024", "2021-2022").
 *
 * Là danh mục độc lập, không phụ thuộc khoa/ngành — một khóa học có thể chứa lớp
 * thuộc nhiều ngành khác nhau. Một {@code Lop} thuộc về đúng một {@code KhoaHoc}.
 *
 * Quy ước mã: {@code KHxx} (vd {@code KH01}), sinh tự động bằng V4 hoặc tay.
 *
 * Lưu ý: tên cột DB là {@code nam_bat_dau} / {@code nam_ket_thuc} (INT) — để
 * phục vụ thống kê / sort theo năm thay vì sort theo tên chuỗi.
 */
@Entity
@Table(name = "khoa_hoc")
public class KhoaHoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_khoa_hoc", length = 20, unique = true, nullable = false)
    private String maKhoaHoc;

    @Column(name = "ten_khoa_hoc", length = 100, nullable = false)
    private String tenKhoaHoc;

    @Column(name = "nam_bat_dau")
    private Integer namBatDau;

    @Column(name = "nam_ket_thuc")
    private Integer namKetThuc;

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

    public String getMaKhoaHoc() { return maKhoaHoc; }
    public void setMaKhoaHoc(String maKhoaHoc) { this.maKhoaHoc = maKhoaHoc; }

    public String getTenKhoaHoc() { return tenKhoaHoc; }
    public void setTenKhoaHoc(String tenKhoaHoc) { this.tenKhoaHoc = tenKhoaHoc; }

    public Integer getNamBatDau() { return namBatDau; }
    public void setNamBatDau(Integer namBatDau) { this.namBatDau = namBatDau; }

    public Integer getNamKetThuc() { return namKetThuc; }
    public void setNamKetThuc(Integer namKetThuc) { this.namKetThuc = namKetThuc; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
