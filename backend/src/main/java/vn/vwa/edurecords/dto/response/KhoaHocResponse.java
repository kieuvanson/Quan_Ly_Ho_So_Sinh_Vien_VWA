package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.KhoaHoc;

import java.time.LocalDateTime;

public class KhoaHocResponse {
    private Integer id;
    private String maKhoaHoc;
    private String tenKhoaHoc;
    private Integer namBatDau;
    private Integer namKetThuc;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    public KhoaHocResponse() {}

    public static KhoaHocResponse fromEntity(KhoaHoc kh) {
        KhoaHocResponse r = new KhoaHocResponse();
        r.id = kh.getId();
        r.maKhoaHoc = kh.getMaKhoaHoc();
        r.tenKhoaHoc = kh.getTenKhoaHoc();
        r.namBatDau = kh.getNamBatDau();
        r.namKetThuc = kh.getNamKetThuc();
        r.moTa = kh.getMoTa();
        r.dangSuDung = kh.getDangSuDung();
        r.ngayTao = kh.getNgayTao();
        r.ngayCapNhat = kh.getNgayCapNhat();
        return r;
    }

    // Getters
    public Integer getId() { return id; }
    public String getMaKhoaHoc() { return maKhoaHoc; }
    public String getTenKhoaHoc() { return tenKhoaHoc; }
    public Integer getNamBatDau() { return namBatDau; }
    public Integer getNamKetThuc() { return namKetThuc; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
}
