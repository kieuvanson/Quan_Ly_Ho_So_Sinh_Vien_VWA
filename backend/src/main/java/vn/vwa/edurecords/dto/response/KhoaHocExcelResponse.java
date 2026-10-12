package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.KhoaHoc;
import java.time.LocalDateTime;

/**
 * Response DTO cho KhoaHoc — dùng trong export Excel.
 */
public class KhoaHocExcelResponse {
    private String maKhoaHoc;
    private String tenKhoaHoc;
    private Integer namBatDau;
    private Integer namKetThuc;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;

    public KhoaHocExcelResponse() {}

    public static KhoaHocExcelResponse fromEntity(KhoaHoc entity) {
        KhoaHocExcelResponse r = new KhoaHocExcelResponse();
        r.maKhoaHoc = entity.getMaKhoaHoc();
        r.tenKhoaHoc = entity.getTenKhoaHoc();
        r.namBatDau = entity.getNamBatDau();
        r.namKetThuc = entity.getNamKetThuc();
        r.moTa = entity.getMoTa();
        r.dangSuDung = entity.getDangSuDung();
        r.ngayTao = entity.getNgayTao();
        return r;
    }

    public String getMaKhoaHoc() { return maKhoaHoc; }
    public String getTenKhoaHoc() { return tenKhoaHoc; }
    public Integer getNamBatDau() { return namBatDau; }
    public Integer getNamKetThuc() { return namKetThuc; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
}
