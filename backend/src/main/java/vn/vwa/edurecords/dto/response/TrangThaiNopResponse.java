package vn.vwa.edurecords.dto.response;

/**
 * Response body cho danh sách trạng thái nộp giấy tờ.
 * Chỉ đọc — giá trị được định nghĩa cố định trong PostgreSQL ENUM `trangthainop`.
 *
 * Các giá trị ENUM trong database: 'Chưa nộp', 'Đã nộp', 'Thiếu', 'Không hợp lệ'.
 */
public class TrangThaiNopResponse {

    private String ma;
    private String ten;
    private String moTa;
    private String mauHienThi;

    public TrangThaiNopResponse() {}

    public TrangThaiNopResponse(String ma, String ten, String moTa, String mauHienThi) {
        this.ma = ma;
        this.ten = ten;
        this.moTa = moTa;
        this.mauHienThi = mauHienThi;
    }

    /**
     * Tạo response từ giá trị ENUM string của PostgreSQL.
     */
    public static TrangThaiNopResponse fromValue(String value) {
        return switch (value) {
            case "Chưa nộp" -> new TrangThaiNopResponse("CHUA_NOP", value,
                    "Giấy tờ chưa được sinh viên nộp", "secondary");
            case "Đã nộp" -> new TrangThaiNopResponse("DA_NOP", value,
                    "Giấy tờ đã được nộp và xác nhận bởi cán bộ", "success");
            case "Thiếu" -> new TrangThaiNopResponse("THIEU", value,
                    "Giấy tờ đã nộp nhưng thiếu hoặc không hợp lệ", "warning");
            case "Không hợp lệ" -> new TrangThaiNopResponse("KHONG_HOP_LE", value,
                    "Giấy tờ không hợp lệ, cần nộp lại", "danger");
            default -> new TrangThaiNopResponse("UNKNOWN", value,
                    "Trạng thái không xác định", "secondary");
        };
    }

    public String getMa() { return ma; }
    public void setMa(String ma) { this.ma = ma; }

    public String getTen() { return ten; }
    public void setTen(String ten) { this.ten = ten; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public String getMauHienThi() { return mauHienThi; }
    public void setMauHienThi(String mauHienThi) { this.mauHienThi = mauHienThi; }
}
