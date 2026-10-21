package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Danh mục Khoa (đơn vị hành chính - học thuật cấp cao nhất trong trường).
 *
 * Sau V4, các cột VARCHAR `khoa` trong bảng `sinhvien` đã được thay bằng FK
 * {@code sinhvien.khoa_id} trỏ về bảng này. Một {@code Nganh} thuộc về đúng
 * một {@code Khoa}.
 *
 * Quy ước mã: {@code KHOAxx} (vd {@code KHOA01}), sinh tự động bằng V4 migration
 * hoặc tay qua API.
 */
@Entity
@Table(name = "khoa")
public class Khoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_khoa", length = 20, unique = true, nullable = false)
    private String maKhoa;

    @Column(name = "ten_khoa", length = 150, nullable = false)
    private String tenKhoa;

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

    public String getMaKhoa() { return maKhoa; }
    public void setMaKhoa(String maKhoa) { this.maKhoa = maKhoa; }

    public String getTenKhoa() { return tenKhoa; }
    public void setTenKhoa(String tenKhoa) { this.tenKhoa = tenKhoa; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
