package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO cho Ngành.
 * Sau chuẩn hóa: khoaId là BẮT BUỘC - Ngành phải thuộc một Khoa chuyên môn.
 */
public class NganhRequest {

    @NotNull(message = "Khoa không được để trống.")
    private Integer khoaId;

    @NotBlank(message = "Tên ngành không được để trống.")
    @Size(max = 150, message = "Tên ngành tối đa 150 ký tự.")
    private String tenNganh;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự.")
    private String moTa;

    private Boolean dangSuDung = true;

    public NganhRequest() {}

    public NganhRequest(Integer khoaId, String tenNganh, String moTa, Boolean dangSuDung) {
        this.khoaId = khoaId;
        this.tenNganh = tenNganh;
        this.moTa = moTa;
        this.dangSuDung = dangSuDung;
    }

    public Integer getKhoaId() { return khoaId; }
    public void setKhoaId(Integer khoaId) { this.khoaId = khoaId; }

    public String getTenNganh() { return tenNganh; }
    public void setTenNganh(String tenNganh) { this.tenNganh = tenNganh; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public Boolean getDangSuDung() { return dangSuDung; }
    public void setDangSuDung(Boolean dangSuDung) { this.dangSuDung = dangSuDung; }
}
