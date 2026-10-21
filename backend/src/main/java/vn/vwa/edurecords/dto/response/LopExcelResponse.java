package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Lop;
import java.time.LocalDateTime;

/**
 * Response DTO cho Lop — dùng trong export Excel.
 * Sau V6: bỏ cột Khoa (ngành không còn bắt buộc thuộc khoa).
 */
public class LopExcelResponse {
    private String maLop;
    private String tenLop;
    private String nganhTen;
    private String khoaHocNam; // "YYYY – YYYY" hoặc tên khóa
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;

    public LopExcelResponse() {}

    public static LopExcelResponse fromEntity(Lop entity) {
        LopExcelResponse r = new LopExcelResponse();
        r.maLop = entity.getMaLop();
        r.tenLop = entity.getTenLop();
        r.nganhTen = entity.getNganh() != null ? entity.getNganh().getTenNganh() : null;
        if (entity.getKhoaHoc() != null) {
            if (entity.getKhoaHoc().getNamBatDau() != null && entity.getKhoaHoc().getNamKetThuc() != null) {
                r.khoaHocNam = entity.getKhoaHoc().getNamBatDau() + " – " + entity.getKhoaHoc().getNamKetThuc();
            } else {
                r.khoaHocNam = entity.getKhoaHoc().getTenKhoaHoc();
            }
        }
        r.moTa = entity.getMoTa();
        r.dangSuDung = entity.getDangSuDung();
        r.ngayTao = entity.getNgayTao();
        return r;
    }

    public String getMaLop() { return maLop; }
    public String getTenLop() { return tenLop; }
    public String getNganhTen() { return nganhTen; }
    public String getKhoaHocNam() { return khoaHocNam; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
}
