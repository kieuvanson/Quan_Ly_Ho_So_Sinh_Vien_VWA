package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Khoa;

import java.time.LocalDateTime;

/**
 * Response DTO cho Khoa.
 * Tách riêng với entity để kiểm soát trường trả về qua API.
 */
public class KhoaResponse {
    private Integer id;
    private String maKhoa;
    private String tenKhoa;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    public KhoaResponse() {}

    public static KhoaResponse fromEntity(Khoa khoa) {
        KhoaResponse r = new KhoaResponse();
        r.id = khoa.getId();
        r.maKhoa = khoa.getMaKhoa();
        r.tenKhoa = khoa.getTenKhoa();
        r.moTa = khoa.getMoTa();
        r.dangSuDung = khoa.getDangSuDung();
        r.ngayTao = khoa.getNgayTao();
        r.ngayCapNhat = khoa.getNgayCapNhat();
        return r;
    }

    // Getters
    public Integer getId() { return id; }
    public String getMaKhoa() { return maKhoa; }
    public String getTenKhoa() { return tenKhoa; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
}
