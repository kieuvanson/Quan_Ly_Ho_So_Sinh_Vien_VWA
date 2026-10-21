package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class KhoaHocRequest {

    @NotBlank(message = "Tên khóa học không được để trống.")
    @Size(max = 100, message = "Tên khóa học tối đa 100 ký tự.")
    private String tenKhoaHoc;

    @Min(value = 1900, message = "Năm bắt đầu phải từ 1900 trở lên.")
    @Max(value = 2100, message = "Năm bắt đầu không quá 2100.")
    private Integer namBatDau;

    @Min(value = 1900, message = "Năm kết thúc phải từ 1900 trở lên.")
    @Max(value = 2100, message = "Năm kết thúc không quá 2100.")
    private Integer namKetThuc;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String moTa;

    private Boolean dangSuDung = true;

    public KhoaHocRequest() {}

    public KhoaHocRequest(String tenKhoaHoc, Integer namBatDau, Integer namKetThuc, String moTa, Boolean dangSuDung) {
        this.tenKhoaHoc = tenKhoaHoc;
        this.namBatDau = namBatDau;
        this.namKetThuc = namKetThuc;
        this.moTa = moTa;
        this.dangSuDung = dangSuDung;
    }

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
}
