package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lich_su_nop")
public class LichSuNop {

    @Id
    @Column(name = "ma_log", length = 20)
    private String maLog;

    @Column(name = "ma_ho_so", nullable = false, length = 20)
    private String maHoSo;

    @Column(name = "mssv", nullable = false, length = 20)
    private String mssv;

    @Column(name = "hanh_dong", nullable = false, length = 50)
    private String hanhDong;

    @Column(name = "trang_thai_cu")
    private String trangThaiCu;

    @Column(name = "trang_thai_moi")
    private String trangThaiMoi;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "nguoi_thuc_hien", length = 100)
    private String nguoiThucHien;

    @Column(name = "thoi_gian", nullable = false)
    private LocalDateTime thoiGian = LocalDateTime.now();

    // Constructors
    public LichSuNop() {}

    public LichSuNop(String maLog, String maHoSo, String mssv, String hanhDong,
                     String trangThaiCu, String trangThaiMoi, String ghiChu, String nguoiThucHien) {
        this.maLog = maLog;
        this.maHoSo = maHoSo;
        this.mssv = mssv;
        this.hanhDong = hanhDong;
        this.trangThaiCu = trangThaiCu;
        this.trangThaiMoi = trangThaiMoi;
        this.ghiChu = ghiChu;
        this.nguoiThucHien = nguoiThucHien;
        this.thoiGian = LocalDateTime.now();
    }

    // Getters and Setters
    public String getMaLog() { return maLog; }
    public void setMaLog(String maLog) { this.maLog = maLog; }

    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHanhDong() { return hanhDong; }
    public void setHanhDong(String hanhDong) { this.hanhDong = hanhDong; }

    public String getTrangThaiCu() { return trangThaiCu; }
    public void setTrangThaiCu(String trangThaiCu) { this.trangThaiCu = trangThaiCu; }

    public String getTrangThaiMoi() { return trangThaiMoi; }
    public void setTrangThaiMoi(String trangThaiMoi) { this.trangThaiMoi = trangThaiMoi; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public String getNguoiThucHien() { return nguoiThucHien; }
    public void setNguoiThucHien(String nguoiThucHien) { this.nguoiThucHien = nguoiThucHien; }

    public LocalDateTime getThoiGian() { return thoiGian; }
    public void setThoiGian(LocalDateTime thoiGian) { this.thoiGian = thoiGian; }
}
