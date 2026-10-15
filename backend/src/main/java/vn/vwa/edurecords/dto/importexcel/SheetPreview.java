package vn.vwa.edurecords.dto.importexcel;

import java.util.ArrayList;
import java.util.List;

/**
 * Kết quả preview cho 1 sheet trong file Excel.
 *
 * <p>Mỗi sheet có thể là 1 trong 3 mode: SV / HS / GOP. Trong mode GOP, mỗi dòng
 * có thêm {@code loaiDong} để phân biệt "SV" hay "HS".</p>
 */
public class SheetPreview {

    /** Tên sheet trong file Excel. */
    private String tenSheet;

    /** Mode tương ứng sau khi nhận diện từ tên sheet. */
    private ImportMode mode;

    /** Tổng số dòng có dữ liệu (đã đọc được, không tính dòng trống/header). */
    private int tongDong;

    /** Số dòng sẽ được ghi nếu xác nhận. */
    private int dongHopLe;

    /** Số dòng bị lỗi. */
    private int dongLoi;

    /** Lỗi của từng dòng (chỉ dòng lỗi mới có entry). */
    private List<ImportRowError> danhSachLoi = new ArrayList<>();

    /** Snapshot từng dòng (chỉ chứa các trường cần thiết để ghi lại DB ở confirm). */
    private List<PreviewRowData> rows = new ArrayList<>();

    public SheetPreview() {}

    public SheetPreview(String tenSheet, ImportMode mode) {
        this.tenSheet = tenSheet;
        this.mode = mode;
    }

    public String getTenSheet() { return tenSheet; }
    public void setTenSheet(String tenSheet) { this.tenSheet = tenSheet; }

    public ImportMode getMode() { return mode; }
    public void setMode(ImportMode mode) { this.mode = mode; }

    public int getTongDong() { return tongDong; }
    public void setTongDong(int tongDong) { this.tongDong = tongDong; }

    public int getDongHopLe() { return dongHopLe; }
    public void setDongHopLe(int dongHopLe) { this.dongHopLe = dongHopLe; }

    public int getDongLoi() { return dongLoi; }
    public void setDongLoi(int dongLoi) { this.dongLoi = dongLoi; }

    public List<ImportRowError> getDanhSachLoi() { return danhSachLoi; }
    public void setDanhSachLoi(List<ImportRowError> danhSachLoi) { this.danhSachLoi = danhSachLoi; }

    public List<PreviewRowData> getRows() { return rows; }
    public void setRows(List<PreviewRowData> rows) { this.rows = rows; }
}
