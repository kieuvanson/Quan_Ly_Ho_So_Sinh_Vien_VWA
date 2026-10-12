package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoaiGiayToRequest {

    @NotBlank(message = "Tên giấy tờ không được để trống.")
    @Size(max = 200, message = "Tên giấy tờ tối đa 200 ký tự.")
    private String tenGiayTo;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String moTa;

    private Boolean batBuoc = false;

    private Boolean dangSuDung = true;

    private Integer thuTuHienThi;

    public LoaiGiayToRequest() {}

    public LoaiGiayToRequest(String tenGiayTo, String moTa, Boolean batBuoc, Boolean dangSuDung, Integer thuTuHienThi) {
        this.tenGiayTo = tenGiayTo;
        this.moTa = moTa;
        this.batBuoc = batBuoc;
        this.dangSuDung = dangSuDung;
        this.thuTuHienThi = thuTuHienThi;
    }

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
}
