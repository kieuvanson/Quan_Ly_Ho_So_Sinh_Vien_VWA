package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Khoa;
import java.time.LocalDateTime;

/**
 * Response DTO cho Khoa — dùng trong export Excel.
 */
public class KhoaExcelResponse {
    private String maKhoa;
    private String tenKhoa;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;

    public KhoaExcelResponse() {}

    public static KhoaExcelResponse fromEntity(Khoa entity) {
        KhoaExcelResponse r = new KhoaExcelResponse();
        r.maKhoa = entity.getMaKhoa();
        r.tenKhoa = entity.getTenKhoa();
        r.moTa = entity.getMoTa();
        r.dangSuDung = entity.getDangSuDung();
        r.ngayTao = entity.getNgayTao();
        return r;
    }

    public String getMaKhoa() { return maKhoa; }
    public String getTenKhoa() { return tenKhoa; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
}
