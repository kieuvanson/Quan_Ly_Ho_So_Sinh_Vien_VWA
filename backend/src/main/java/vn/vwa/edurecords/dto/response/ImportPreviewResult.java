package vn.vwa.edurecords.dto.response;

import java.util.List;

/**
 * Kết quả kiểm tra (preview) từng dòng Excel trước khi ghi.
 *
 * <p>Trả về thông tin đầy đủ để frontend hiển thị bảng preview gồm:
 * cột trạng thái, lý do lỗi và đối chiếu danh mục.</p>
 */
public class ImportPreviewResult {

    /** Tổng số dòng có dữ liệu (không tính dòng trống). */
    private int totalRows;

    /** Số dòng sẽ được ghi nếu xác nhận. */
    private int validRows;

    /** Số dòng bị lỗi / sẽ bị bỏ qua. */
    private int invalidRows;

    /** Số dòng trùng MSSV trong chính file Excel. */
    private int duplicateInFile;

    /** Kết quả chi tiết từng dòng. */
    private List<ImportRowPreview> rows;

    /** Tổng số sinh viên mới (MSSV chưa tồn tại). */
    private int newCount;

    /** Tổng số sinh viên bị trùng và sẽ bị bỏ qua (MSSV đã tồn tại). */
    private int duplicateCount;

    public ImportPreviewResult() {}

    public ImportPreviewResult(int totalRows, int validRows, int invalidRows,
                               int duplicateInFile, List<ImportRowPreview> rows,
                               int newCount, int duplicateCount) {
        this.totalRows = totalRows;
        this.validRows = validRows;
        this.invalidRows = invalidRows;
        this.duplicateInFile = duplicateInFile;
        this.rows = rows;
        this.newCount = newCount;
        this.duplicateCount = duplicateCount;
    }

    // Getters & setters
    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

    public int getValidRows() { return validRows; }
    public void setValidRows(int validRows) { this.validRows = validRows; }

    public int getInvalidRows() { return invalidRows; }
    public void setInvalidRows(int invalidRows) { this.invalidRows = invalidRows; }

    public int getDuplicateInFile() { return duplicateInFile; }
    public void setDuplicateInFile(int duplicateInFile) { this.duplicateInFile = duplicateInFile; }

    public List<ImportRowPreview> getRows() { return rows; }
    public void setRows(List<ImportRowPreview> rows) { this.rows = rows; }

    public int getNewCount() { return newCount; }
    public void setNewCount(int newCount) { this.newCount = newCount; }

    public int getDuplicateCount() { return duplicateCount; }
    public void setDuplicateCount(int duplicateCount) { this.duplicateCount = duplicateCount; }

    /**
     * Kết quả kiểm tra từng dòng Excel.
     */
    public static class ImportRowPreview {
        /** Số dòng thực tế trong file Excel (1-based). */
        private int excelRow;

        /** MSSV đã đọc được từ dòng đó (null nếu đọc lỗi). */
        private String mssv;

        /** Họ tên đã đọc được. */
        private String hoTen;

        /** Trạng thái dòng. */
        private RowStatus status;

        /** Tất cả lỗi (nếu có), phân cách bằng "; ". */
        private List<String> errors;

        /** Thông tin đối chiếu danh mục (nếu hợp lệ). */
        private DanhMucInfo danhMuc;

        public ImportRowPreview() {}

        public ImportRowPreview(int excelRow, String mssv, String hoTen,
                               RowStatus status, List<String> errors, DanhMucInfo danhMuc) {
            this.excelRow = excelRow;
            this.mssv = mssv;
            this.hoTen = hoTen;
            this.status = status;
            this.errors = errors;
            this.danhMuc = danhMuc;
        }

        // Getters & setters
        public int getExcelRow() { return excelRow; }
        public void setExcelRow(int excelRow) { this.excelRow = excelRow; }

        public String getMssv() { return mssv; }
        public void setMssv(String mssv) { this.mssv = mssv; }

        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }

        public RowStatus getStatus() { return status; }
        public void setStatus(RowStatus status) { this.status = status; }

        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }

        public DanhMucInfo getDanhMuc() { return danhMuc; }
        public void setDanhMuc(DanhMucInfo danhMuc) { this.danhMuc = danhMuc; }
    }

    /** Trạng thái dòng trong bảng preview. */
    public enum RowStatus {
        /** Sẽ được ghi khi xác nhận. */
        VALID,
        /** Bị lỗi dữ liệu — bỏ qua. */
        INVALID,
        /** MSSV đã tồn tại trong DB — bỏ qua (chế độ "chỉ thêm mới"). */
        DUPLICATE,
        /** Trùng MSSV trong chính file Excel. */
        DUPLICATE_IN_FILE
    }

    /**
     * Thông tin đối chiếu danh mục của một dòng hợp lệ.
     */
    public static class DanhMucInfo {
        private String khoaTen;
        private String khoaId;
        private String nganhTen;
        private String nganhId;
        private String lopTen;
        private String lopId;
        private String khoaHocTen;
        private String khoaHocId;

        public DanhMucInfo() {}

        public DanhMucInfo(String khoaTen, String khoaId, String nganhTen, String nganhId,
                           String lopTen, String lopId, String khoaHocTen, String khoaHocId) {
            this.khoaTen = khoaTen;
            this.khoaId = khoaId;
            this.nganhTen = nganhTen;
            this.nganhId = nganhId;
            this.lopTen = lopTen;
            this.lopId = lopId;
            this.khoaHocTen = khoaHocTen;
            this.khoaHocId = khoaHocId;
        }

        // Getters & setters
        public String getKhoaTen() { return khoaTen; }
        public void setKhoaTen(String khoaTen) { this.khoaTen = khoaTen; }

        public String getKhoaId() { return khoaId; }
        public void setKhoaId(String khoaId) { this.khoaId = khoaId; }

        public String getNganhTen() { return nganhTen; }
        public void setNganhTen(String nganhTen) { this.nganhTen = nganhTen; }

        public String getNganhId() { return nganhId; }
        public void setNganhId(String nganhId) { this.nganhId = nganhId; }

        public String getLopTen() { return lopTen; }
        public void setLopTen(String lopTen) { this.lopTen = lopTen; }

        public String getLopId() { return lopId; }
        public void setLopId(String lopId) { this.lopId = lopId; }

        public String getKhoaHocTen() { return khoaHocTen; }
        public void setKhoaHocTen(String khoaHocTen) { this.khoaHocTen = khoaHocTen; }

        public String getKhoaHocId() { return khoaHocId; }
        public void setKhoaHocId(String khoaHocId) { this.khoaHocId = khoaHocId; }
    }
}
