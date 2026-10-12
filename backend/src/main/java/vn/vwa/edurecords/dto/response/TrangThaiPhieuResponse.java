package vn.vwa.edurecords.dto.response;

/**
 * Response body cho danh sách trạng thái phiếu xuất hồ sơ.
 * Chỉ đọc — giá trị được định nghĩa cố định trong PostgreSQL ENUM `trangthaiphieu`.
 *
 * Các giá trị ENUM trong database:
 * 'Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đang mượn', 'Đã trả', 'Quá hạn', 'Hoàn tất'.
 */
public class TrangThaiPhieuResponse {

    private String ma;
    private String ten;
    private String moTa;
    private String mauHienThi;

    public TrangThaiPhieuResponse() {}

    public TrangThaiPhieuResponse(String ma, String ten, String moTa, String mauHienThi) {
        this.ma = ma;
        this.ten = ten;
        this.moTa = moTa;
        this.mauHienThi = mauHienThi;
    }

    /**
     * Tạo response từ giá trị ENUM string của PostgreSQL.
     */
    public static TrangThaiPhieuResponse fromValue(String value) {
        return switch (value) {
            case "Chờ duyệt" -> new TrangThaiPhieuResponse("CHO_DUYET", value,
                    "Phiếu đang chờ cán bộ phê duyệt", "secondary");
            case "Đã duyệt" -> new TrangThaiPhieuResponse("DA_DUYET", value,
                    "Phiếu đã được phê duyệt, sẵn sàng xuất hồ sơ", "primary");
            case "Từ chối" -> new TrangThaiPhieuResponse("TU_CHOI", value,
                    "Phiếu bị từ chối không được xuất hồ sơ", "danger");
            case "Đang mượn" -> new TrangThaiPhieuResponse("DANG_MUON", value,
                    "Hồ sơ đang được mượn tạm thời bên ngoài", "warning");
            case "Đã trả" -> new TrangThaiPhieuResponse("DA_TRA", value,
                    "Hồ sơ đã được trả về kho sau khi mượn", "info");
            case "Quá hạn" -> new TrangThaiPhieuResponse("QUA_HAN", value,
                    "Hồ sơ mượn đã quá hạn trả quy định", "danger");
            case "Hoàn tất" -> new TrangThaiPhieuResponse("HOAN_TAT", value,
                    "Phiếu rút hồ sơ đã hoàn tất, hồ sơ đã được giao", "success");
            default -> new TrangThaiPhieuResponse("UNKNOWN", value,
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
