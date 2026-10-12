package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.LoaiGiayTo;

import java.time.LocalDateTime;

/**
 * Response DTO cho LoaiGiayTo.
 * Tách riêng với entity để kiểm soát trường trả về qua API.
 */
public class LoaiGiayToResponse {
    private String maLoai;
    private String tenGiayTo;
    private String moTa;
    private Boolean batBuoc;
    private Boolean dangSuDung;
    private Integer thuTuHienThi;
    private LocalDateTime ngayTao;

    public LoaiGiayToResponse() {}

    public static LoaiGiayToResponse fromEntity(LoaiGiayTo entity) {
        LoaiGiayToResponse r = new LoaiGiayToResponse();
        r.maLoai = entity.getMaLoai();
        r.tenGiayTo = entity.getTenGiayTo();
        r.moTa = entity.getMoTa();
        r.batBuoc = entity.getBatBuoc();
        r.dangSuDung = entity.getDangSuDung();
        r.thuTuHienThi = entity.getThuTuHienThi();
        r.ngayTao = entity.getNgayTao();
        return r;
    }

    // Getters
    public String getMaLoai() { return maLoai; }
    public String getTenGiayTo() { return tenGiayTo; }
    public String getMoTa() { return moTa; }
    public Boolean getBatBuoc() { return batBuoc; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public Integer getThuTuHienThi() { return thuTuHienThi; }
    public LocalDateTime getNgayTao() { return ngayTao; }
}
