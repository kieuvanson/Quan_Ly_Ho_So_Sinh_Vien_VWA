package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LichSuNopRequest {

    @NotBlank(message = "Mã hồ sơ không được để trống")
    @Size(max = 20, message = "Mã hồ sơ không quá 20 ký tự")
    private String maHoSo;

    @NotBlank(message = "MSSV không được để trống")
    @Size(max = 20, message = "MSSV không quá 20 ký tự")
    private String mssv;

    @NotBlank(message = "Hành động không được để trống")
    @Size(max = 50, message = "Hành động không quá 50 ký tự")
    private String hanhDong;

    private String trangThaiCu;
    private String trangThaiMoi;

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    private String ghiChu;

    @Size(max = 100, message = "Người thực hiện không quá 100 ký tự")
    private String nguoiThucHien;

    // Constructors
    public LichSuNopRequest() {}

    public LichSuNopRequest(String maHoSo, String mssv, String hanhDong,
                            String trangThaiCu, String trangThaiMoi, String ghiChu, String nguoiThucHien) {
        this.maHoSo = maHoSo;
        this.mssv = mssv;
        this.hanhDong = hanhDong;
        this.trangThaiCu = trangThaiCu;
        this.trangThaiMoi = trangThaiMoi;
        this.ghiChu = ghiChu;
        this.nguoiThucHien = nguoiThucHien;
    }

    // Getters and Setters
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
}
