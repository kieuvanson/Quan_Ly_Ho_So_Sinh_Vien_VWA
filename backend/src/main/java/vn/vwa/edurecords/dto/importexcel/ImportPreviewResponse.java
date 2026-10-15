package vn.vwa.edurecords.dto.importexcel;

import java.util.ArrayList;
import java.util.List;

/**
 * Response cho endpoint POST /api/ho-so-giay-to/import/preview.
 *
 * <p>Trả về kết quả preview của toàn bộ file Excel (1 hoặc nhiều sheet). Nếu có
 * bất kỳ sheet nào lỗi (fail-fast), trả về {@link #failFast} = true cùng thông
 * tin sheet/dòng lỗi đầu tiên — frontend hiển thị và yêu cầu user sửa file.</p>
 *
 * <h4>Luồng xử lý</h4>
 * <ol>
 *   <li>Đọc tất cả sheet trong file.</li>
 *   <li>Mỗi sheet → resolve mode theo tên → validate từng dòng → thu thập lỗi.</li>
 *   <li>Nếu TẤT CẢ sheet đều hợp lệ → trả về {@link #token} để confirm.</li>
 *   <li>Nếu bất kỳ sheet nào có lỗi → fail-fast, KHÔNG tạo token.</li>
 * </ol>
 */
public class ImportPreviewResponse {

    /** True khi có ít nhất 1 dòng lỗi. Frontend KHÔNG cho confirm. */
    private boolean failFast;

    /** Sheet có lỗi đầu tiên (chỉ dùng khi {@link #failFast} = true). */
    private String sheetLoiDauTien;

    /** Dòng lỗi đầu tiên (chỉ dùng khi {@link #failFast} = true). */
    private int dongLoiDauTien;

    /** Tóm tắt lỗi (1 dòng) — chỉ dùng khi fail-fast. */
    private String summaryMessage;

    /** Token tạm để gọi /confirm (UUID). Null khi fail-fast. */
    private String token;

    /** Số sheet đã đọc. */
    private int tongSoSheet;

    /** Tổng dòng (tất cả sheet, chỉ dòng có dữ liệu). */
    private int tongSoDong;

    /** Tổng dòng hợp lệ (sẽ được ghi nếu confirm). */
    private int tongDongHopLe;

    /** Tổng dòng lỗi (tất cả sheet). */
    private int tongDongLoi;

    /** Chi tiết từng sheet. */
    private List<SheetPreview> theoSheet = new ArrayList<>();

    public ImportPreviewResponse() {}

    // ===== Factory =====

    /**
     * Tạo response thành công (có thể confirm).
     */
    public static ImportPreviewResponse success(String token, List<SheetPreview> sheets) {
        ImportPreviewResponse r = new ImportPreviewResponse();
        r.failFast = false;
        r.token = token;
        r.theoSheet = sheets;
        r.tongSoSheet = sheets.size();
        for (SheetPreview s : sheets) {
            r.tongSoDong += s.getTongDong();
            r.tongDongHopLe += s.getDongHopLe();
            r.tongDongLoi += s.getDongLoi();
        }
        return r;
    }

    /**
     * Tạo response fail-fast (không cho confirm, yêu cầu sửa file).
     */
    public static ImportPreviewResponse failFast(String sheet, int dong,
                                                 String summary, List<SheetPreview> sheets) {
        ImportPreviewResponse r = new ImportPreviewResponse();
        r.failFast = true;
        r.sheetLoiDauTien = sheet;
        r.dongLoiDauTien = dong;
        r.summaryMessage = summary;
        r.theoSheet = sheets;
        r.tongSoSheet = sheets.size();
        for (SheetPreview s : sheets) {
            r.tongSoDong += s.getTongDong();
            r.tongDongHopLe += s.getDongHopLe();
            r.tongDongLoi += s.getDongLoi();
        }
        return r;
    }

    // ===== Getters/Setters =====

    public boolean isFailFast() { return failFast; }
    public void setFailFast(boolean failFast) { this.failFast = failFast; }

    public String getSheetLoiDauTien() { return sheetLoiDauTien; }
    public void setSheetLoiDauTien(String sheetLoiDauTien) { this.sheetLoiDauTien = sheetLoiDauTien; }

    public int getDongLoiDauTien() { return dongLoiDauTien; }
    public void setDongLoiDauTien(int dongLoiDauTien) { this.dongLoiDauTien = dongLoiDauTien; }

    public String getSummaryMessage() { return summaryMessage; }
    public void setSummaryMessage(String summaryMessage) { this.summaryMessage = summaryMessage; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public int getTongSoSheet() { return tongSoSheet; }
    public void setTongSoSheet(int tongSoSheet) { this.tongSoSheet = tongSoSheet; }

    public int getTongSoDong() { return tongSoDong; }
    public void setTongSoDong(int tongSoDong) { this.tongSoDong = tongSoDong; }

    public int getTongDongHopLe() { return tongDongHopLe; }
    public void setTongDongHopLe(int tongDongHopLe) { this.tongDongHopLe = tongDongHopLe; }

    public int getTongDongLoi() { return tongDongLoi; }
    public void setTongDongLoi(int tongDongLoi) { this.tongDongLoi = tongDongLoi; }

    public List<SheetPreview> getTheoSheet() { return theoSheet; }
    public void setTheoSheet(List<SheetPreview> theoSheet) { this.theoSheet = theoSheet; }
}
