package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Nganh;
import java.time.LocalDateTime;

/**
 * Response DTO cho Nganh — dùng trong export Excel.
 * Sau V6: Ngành là danh mục độc lập, không còn cột Khoa.
 */
public class NganhExcelResponse {
    private String maNganh;
    private String tenNganh;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;

    public NganhExcelResponse() {}

    public static NganhExcelResponse fromEntity(Nganh entity) {
        NganhExcelResponse r = new NganhExcelResponse();
        r.maNganh = entity.getMaNganh();
        r.tenNganh = entity.getTenNganh();
        r.moTa = entity.getMoTa();
        r.dangSuDung = entity.getDangSuDung();
        r.ngayTao = entity.getNgayTao();
        return r;
    }

    public String getMaNganh() { return maNganh; }
    public String getTenNganh() { return tenNganh; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
}
