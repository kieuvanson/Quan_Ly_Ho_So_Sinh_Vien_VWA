package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Lop;

import java.time.LocalDateTime;

public class LopResponse {
    private Integer id;
    private String maLop;
    private String tenLop;
    private NganhSimple nganh;
    private KhoaHocSimple khoaHoc;
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    public LopResponse() {}

    public static LopResponse fromEntity(Lop lop) {
        LopResponse r = new LopResponse();
        r.id = lop.getId();
        r.maLop = lop.getMaLop();
        r.tenLop = lop.getTenLop();
        r.moTa = lop.getMoTa();
        r.dangSuDung = lop.getDangSuDung();
        r.ngayTao = lop.getNgayTao();
        r.ngayCapNhat = lop.getNgayCapNhat();
        if (lop.getNganh() != null) {
            r.nganh = new NganhSimple(lop.getNganh().getId(), lop.getNganh().getTenNganh());
        }
        if (lop.getKhoaHoc() != null) {
            r.khoaHoc = new KhoaHocSimple(
                    lop.getKhoaHoc().getId(),
                    lop.getKhoaHoc().getTenKhoaHoc(),
                    lop.getKhoaHoc().getNamBatDau(),
                    lop.getKhoaHoc().getNamKetThuc()
            );
        }
        return r;
    }

    public static class NganhSimple {
        private Integer id;
        private String tenNganh;

        public NganhSimple() {}
        public NganhSimple(Integer id, String tenNganh) {
            this.id = id;
            this.tenNganh = tenNganh;
        }

        public Integer getId() { return id; }
        public String getTenNganh() { return tenNganh; }
    }

    public static class KhoaHocSimple {
        private Integer id;
        private String tenKhoaHoc;
        private Integer namBatDau;
        private Integer namKetThuc;

        public KhoaHocSimple() {}
        public KhoaHocSimple(Integer id, String tenKhoaHoc, Integer namBatDau, Integer namKetThuc) {
            this.id = id;
            this.tenKhoaHoc = tenKhoaHoc;
            this.namBatDau = namBatDau;
            this.namKetThuc = namKetThuc;
        }

        public Integer getId() { return id; }
        public String getTenKhoaHoc() { return tenKhoaHoc; }
        public Integer getNamBatDau() { return namBatDau; }
        public Integer getNamKetThuc() { return namKetThuc; }
    }

    // Getters
    public Integer getId() { return id; }
    public String getMaLop() { return maLop; }
    public String getTenLop() { return tenLop; }
    public NganhSimple getNganh() { return nganh; }
    public KhoaHocSimple getKhoaHoc() { return khoaHoc; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
}
