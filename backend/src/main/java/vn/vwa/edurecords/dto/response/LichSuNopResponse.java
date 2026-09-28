package vn.vwa.edurecords.dto.response;

import java.time.LocalDateTime;

public class LichSuNopResponse {

    private String maLog;
    private String maHoSo;
    private String mssv;
    private String hoTenSinhVien;
    private String tenGiayTo;
    private String hanhDong;
    private String trangThaiCu;
    private String trangThaiMoi;
    private String ghiChu;
    private String nguoiThucHien;
    private LocalDateTime thoiGian;

    // Constructors
    public LichSuNopResponse() {}

    public LichSuNopResponse(String maLog, String maHoSo, String mssv, String hoTenSinhVien,
                             String tenGiayTo, String hanhDong, String trangThaiCu,
                             String trangThaiMoi, String ghiChu, String nguoiThucHien,
                             LocalDateTime thoiGian) {
        this.maLog = maLog;
        this.maHoSo = maHoSo;
        this.mssv = mssv;
        this.hoTenSinhVien = hoTenSinhVien;
        this.tenGiayTo = tenGiayTo;
        this.hanhDong = hanhDong;
        this.trangThaiCu = trangThaiCu;
        this.trangThaiMoi = trangThaiMoi;
        this.ghiChu = ghiChu;
        this.nguoiThucHien = nguoiThucHien;
        this.thoiGian = thoiGian;
    }

    // Getters and Setters
    public String getMaLog() { return maLog; }
    public void setMaLog(String maLog) { this.maLog = maLog; }

    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTenSinhVien() { return hoTenSinhVien; }
    public void setHoTenSinhVien(String hoTenSinhVien) { this.hoTenSinhVien = hoTenSinhVien; }

    public String getTenGiayTo() { return tenGiayTo; }
    public void setTenGiayTo(String tenGiayTo) { this.tenGiayTo = tenGiayTo; }

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
