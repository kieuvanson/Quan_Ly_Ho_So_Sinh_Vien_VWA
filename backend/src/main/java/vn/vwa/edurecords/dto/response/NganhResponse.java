package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.Nganh;

import java.time.LocalDateTime;

public class NganhResponse {
    private Integer id;
    private String maNganh;
    private String tenNganh;
    private KhoaSimple khoa; // Bắt buộc sau chuẩn hóa — không còn null
    private String moTa;
    private Boolean dangSuDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    public NganhResponse() {}

    public static NganhResponse fromEntity(Nganh nganh) {
        NganhResponse r = new NganhResponse();
        r.id = nganh.getId();
        r.maNganh = nganh.getMaNganh();
        r.tenNganh = nganh.getTenNganh();
        r.moTa = nganh.getMoTa();
        r.dangSuDung = nganh.getDangSuDung();
        r.ngayTao = nganh.getNgayTao();
        r.ngayCapNhat = nganh.getNgayCapNhat();
        // Sau chuẩn hóa: khoa luôn được set
        if (nganh.getKhoa() != null) {
            r.khoa = new KhoaSimple(nganh.getKhoa().getId(), nganh.getKhoa().getTenKhoa());
        }
        return r;
    }

    /**
     * Nested object chỉ chứa id + tenKhoa — chỉ set khi khoa != null.
     * Giữ lại để tương thích ngược với dữ liệu cũ có khoa_id.
     */
    public static class KhoaSimple {
        private Integer id;
        private String tenKhoa;

        public KhoaSimple() {}
        public KhoaSimple(Integer id, String tenKhoa) {
            this.id = id;
            this.tenKhoa = tenKhoa;
        }

        public Integer getId() { return id; }
        public String getTenKhoa() { return tenKhoa; }
    }

    // Getters
    public Integer getId() { return id; }
    public String getMaNganh() { return maNganh; }
    public String getTenNganh() { return tenNganh; }
    public KhoaSimple getKhoa() { return khoa; }
    public String getMoTa() { return moTa; }
    public Boolean getDangSuDung() { return dangSuDung; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
}
