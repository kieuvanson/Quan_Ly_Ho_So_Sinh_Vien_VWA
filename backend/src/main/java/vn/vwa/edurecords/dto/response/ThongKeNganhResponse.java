package vn.vwa.edurecords.dto.response;

import java.util.List;

/**
 * DTO response cho API thống kê sinh viên theo ngành.
 * 
 * <p>Endpoint: GET /api/thong-ke/sinh-vien-theo-nganh</p>
 */
public class ThongKeNganhResponse {

    private List<NganhItem> nganhList;
    private long tongSoTrongLoc;
    private long tongSoHeThong;

    public ThongKeNganhResponse() {}

    public ThongKeNganhResponse(List<NganhItem> nganhList, long tongSoTrongLoc, long tongSoHeThong) {
        this.nganhList = nganhList;
        this.tongSoTrongLoc = tongSoTrongLoc;
        this.tongSoHeThong = tongSoHeThong;
    }

    public List<NganhItem> getNganhList() {
        return nganhList;
    }

    public void setNganhList(List<NganhItem> nganhList) {
        this.nganhList = nganhList;
    }

    public long getTongSoTrongLoc() {
        return tongSoTrongLoc;
    }

    public void setTongSoTrongLoc(long tongSoTrongLoc) {
        this.tongSoTrongLoc = tongSoTrongLoc;
    }

    public long getTongSoHeThong() {
        return tongSoHeThong;
    }

    public void setTongSoHeThong(long tongSoHeThong) {
        this.tongSoHeThong = tongSoHeThong;
    }

    /**
     * Một dòng trong bảng thống kê theo ngành.
     */
    public static class NganhItem {
        private String tenNganh;
        private String nganh;
        private long soLuong;
        private double tyLePhanTram;

        public NganhItem() {}

        public NganhItem(String tenNganh, String nganh, long soLuong, double tyLePhanTram) {
            this.tenNganh = tenNganh;
            this.nganh = nganh;
            this.soLuong = soLuong;
            this.tyLePhanTram = tyLePhanTram;
        }

        public String getTenNganh() {
            return tenNganh;
        }

        public void setTenNganh(String tenNganh) {
            this.tenNganh = tenNganh;
        }

        public String getNganh() {
            return nganh;
        }

        public void setNganh(String nganh) {
            this.nganh = nganh;
        }

        public long getSoLuong() {
            return soLuong;
        }

        public void setSoLuong(long soLuong) {
            this.soLuong = soLuong;
        }

        public double getTyLePhanTram() {
            return tyLePhanTram;
        }

        public void setTyLePhanTram(double tyLePhanTram) {
            this.tyLePhanTram = tyLePhanTram;
        }
    }
}
