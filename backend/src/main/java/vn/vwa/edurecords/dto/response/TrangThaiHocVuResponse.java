package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

/**
 * Response body cho danh sách trạng thái học vụ.
 * Chỉ đọc — giá trị được định nghĩa cố định trong PostgreSQL ENUM.
 */
public class TrangThaiHocVuResponse {

    private String ma;
    private String ten;
    private String moTa;
    private String mauHienThi;

    public TrangThaiHocVuResponse() {}

    public TrangThaiHocVuResponse(String ma, String ten, String moTa, String mauHienThi) {
        this.ma = ma;
        this.ten = ten;
        this.moTa = moTa;
        this.mauHienThi = mauHienThi;
    }

    /**
     * Chuyển enum thành response với mô tả tiếng Việt cố định.
     */
    public static TrangThaiHocVuResponse fromEnum(TrangThaiHocVu e) {
        return switch (e) {
            case ĐANG_HỌC -> new TrangThaiHocVuResponse("ĐANG_HỌC", e.getDisplayName(),
                    "Sinh viên đang trong quá trình học tập", "primary");
            case BẢO_LƯU -> new TrangThaiHocVuResponse("BẢO_LƯU", e.getDisplayName(),
                    "Sinh viên tạm ngừng học tập có thời hạn", "warning");
            case ĐÌNH_CHỈ -> new TrangThaiHocVuResponse("ĐÌNH_CHỈ", e.getDisplayName(),
                    "Sinh viên bị tạm dừng học tập do vi phạm", "danger");
            case TỐT_NGHIỆP -> new TrangThaiHocVuResponse("TỐT_NGHIỆP", e.getDisplayName(),
                    "Sinh viên đã hoàn thành chương trình học", "success");
            case ĐÃ_RÚT_HỒ_SƠ -> new TrangThaiHocVuResponse("ĐÃ_RÚT_HỒ_SƠ", e.getDisplayName(),
                    "Hồ sơ đã được rút vĩnh viễn", "secondary");
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
