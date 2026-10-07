package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loai_giay_to")
public class LoaiGiayTo {

    @Id
    @Column(name = "ma_loai", length = 10)
    private String maLoai;

    @Column(name = "ten_giay_to", nullable = false, length = 200)
    private String tenGiayTo;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @Column(name = "bat_buoc", nullable = false)
    private Boolean batBuoc = false;

    @Column(name = "dang_su_dung", nullable = false)
    private Boolean dangSuDung = true;

    @Column(name = "thu_tu_hien_thi")
    private Integer thuTuHienThi = 0;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    // Getters and Setters
    public String getMaLoai() { return maLoai; }
    public void setMaLoai(String maLoai) { this.maLoai = maLoai; }

    public String getTenGiayTo() { return tenGiayTo; }
    public void setTenGiayTo(String tenGiayTo) { this.tenGiayTo = tenGiayTo; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getBatBuoc() { return batBuoc; }
    public void setBatBuoc(Boolean batBuoc) { this.batBuoc = batBuoc; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }

    public Integer getThuTuHienThi() { return thuTuHienThi; }
    public void setThuTuHienThi(Integer thuTuHienThi) { this.thuTuHienThi = thuTuHienThi; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
}
