package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LopRequest {

    @NotBlank(message = "Tên lớp không được để trống.")
    @Size(max = 100, message = "Tên lớp tối đa 100 ký tự.")
    private String tenLop;

    @NotNull(message = "Ngành ID không được để trống.")
    @Min(value = 1, message = "Ngành ID không hợp lệ.")
    private Integer nganhId;

    @NotNull(message = "Khóa học ID không được để trống.")
    @Min(value = 1, message = "Khóa học ID không hợp lệ.")
    private Integer khoaHocId;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String moTa;

    private Boolean dangSuDung = true;

    public LopRequest() {}

    public LopRequest(String tenLop, Integer nganhId, Integer khoaHocId, String moTa, Boolean dangSuDung) {
        this.tenLop = tenLop;
        this.nganhId = nganhId;
        this.khoaHocId = khoaHocId;
        this.moTa = moTa;
        this.dangSuDung = dangSuDung;
    }

    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }

    public Integer getNganhId() { return nganhId; }
    public void setNganhId(Integer nganhId) { this.nganhId = nganhId; }

    public Integer getKhoaHocId() { return khoaHocId; }
    public void setKhoaHocId(Integer khoaHocId) { this.khoaHocId = khoaHocId; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }
}
