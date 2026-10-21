package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class KhoaRequest {

    @NotBlank(message = "Tên khoa không được để trống.")
    @Size(max = 150, message = "Tên khoa tối đa 150 ký tự.")
    private String tenKhoa;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String moTa;

    private Boolean dangSuDung = true;

    public KhoaRequest() {}

    public KhoaRequest(String tenKhoa, String moTa, Boolean dangSuDung) {
        this.tenKhoa = tenKhoa;
        this.moTa = moTa;
        this.dangSuDung = dangSuDung;
    }

    public String getTenKhoa() { return tenKhoa; }
    public void setTenKhoa(String tenKhoa) { this.tenKhoa = tenKhoa; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }
}
