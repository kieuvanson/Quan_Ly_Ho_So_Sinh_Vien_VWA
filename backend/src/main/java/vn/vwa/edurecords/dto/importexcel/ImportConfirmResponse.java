package vn.vwa.edurecords.dto.importexcel;

import java.util.ArrayList;
import java.util.List;

/**
 * Response cho endpoint POST /api/ho-so-giay-to/import/confirm.
 *
 * <p>Sau khi ghi xong (transaction commit thành công) → trả về thống kê chi tiết
 * từng sheet. Nếu CÓ sheet nào ghi lỗi runtime (rất hiếm vì đã validate kỹ ở
 * preview), thống kê lỗi sẽ hiển thị để user xử lý thủ công.</p>
 */
public class ImportConfirmResponse {

    /** Token tương ứng (echo lại từ request để FE đối chiếu). */
    private String token;

    /** Tổng số sheet đã xử lý. */
    private int tongSoSheet;

    /** Tổng dòng được ghi vào DB (insert thành công). */
    private int tongThanhCong;

    /** Tổng dòng bị lỗi runtime (rất hiếm). */
    private int tongThatBai;

    /** Thời gian xử lý (ms) — dùng để debug hiệu năng. */
    private long thoiGianXuLyMs;

    /** Thống kê từng sheet. */
    private List<SheetConfirmStats> theoSheet = new ArrayList<>();

    /** Lỗi runtime (nếu có). */
    private List<String> errors = new ArrayList<>();

    public ImportConfirmResponse() {}

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public int getTongSoSheet() { return tongSoSheet; }
    public void setTongSoSheet(int tongSoSheet) { this.tongSoSheet = tongSoSheet; }

    public int getTongThanhCong() { return tongThanhCong; }
    public void setTongThanhCong(int tongThanhCong) { this.tongThanhCong = tongThanhCong; }

    public int getTongThatBai() { return tongThatBai; }
    public void setTongThatBai(int tongThatBai) { this.tongThatBai = tongThatBai; }

    public long getThoiGianXuLyMs() { return thoiGianXuLyMs; }
    public void setThoiGianXuLyMs(long thoiGianXuLyMs) { this.thoiGianXuLyMs = thoiGianXuLyMs; }

    public List<SheetConfirmStats> getTheoSheet() { return theoSheet; }
    public void setTheoSheet(List<SheetConfirmStats> theoSheet) { this.theoSheet = theoSheet; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    /**
     * Thống kê ghi cho 1 sheet.
     */
    public static class SheetConfirmStats {
        private String tenSheet;
        private ImportMode mode;
        private int tongDong;
        private int thanhCong;
        private int thatBai;
        private long thoiGianXuLyMs;

        public SheetConfirmStats() {}

        public SheetConfirmStats(String tenSheet, ImportMode mode,
                                 int tongDong, int thanhCong, int thatBai,
                                 long thoiGianXuLyMs) {
            this.tenSheet = tenSheet;
            this.mode = mode;
            this.tongDong = tongDong;
            this.thanhCong = thanhCong;
            this.thatBai = thatBai;
            this.thoiGianXuLyMs = thoiGianXuLyMs;
        }

        public String getTenSheet() { return tenSheet; }
        public void setTenSheet(String tenSheet) { this.tenSheet = tenSheet; }

        public ImportMode getMode() { return mode; }
        public void setMode(ImportMode mode) { this.mode = mode; }

        public int getTongDong() { return tongDong; }
        public void setTongDong(int tongDong) { this.tongDong = tongDong; }

        public int getThanhCong() { return thanhCong; }
        public void setThanhCong(int thanhCong) { this.thanhCong = thanhCong; }

        public int getThatBai() { return thatBai; }
        public void setThatBai(int thatBai) { this.thatBai = thatBai; }

        public long getThoiGianXuLyMs() { return thoiGianXuLyMs; }
        public void setThoiGianXuLyMs(long thoiGianXuLyMs) { this.thoiGianXuLyMs = thoiGianXuLyMs; }
    }
}
