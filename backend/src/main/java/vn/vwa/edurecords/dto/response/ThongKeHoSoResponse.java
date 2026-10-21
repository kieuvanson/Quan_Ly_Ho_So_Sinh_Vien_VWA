package vn.vwa.edurecords.dto.response;

/**
 * DTO response cho API thống kê hồ sơ toàn hệ thống.
 * 
 * <p>Endpoint: GET /api/thong-ke/ho-so</p>
 * 
 * <p>Quy tắc nghiệp vụ:
 * <ul>
 *   <li>Chỉ 8 giấy tờ bắt buộc (GT01-GT08) được tính vào điều kiện "đầy đủ".</li>
 *   <li>Trạng thái hợp lệ để tính là "Đã nộp".</li>
 *   <li>Hồ sơ "đầy đủ" = sinh viên có đủ 8/8 giấy tờ bắt buộc với trạng thái "Đã nộp".</li>
 *   <li>Hồ sơ "còn thiếu" = sinh viên còn thiếu ít nhất 1 giấy tờ bắt buộc.</li>
 * </ul>
 * </p>
 */
public class ThongKeHoSoResponse {

    private long tongSoSinhVien;
    private long hoSoDayDu;
    private long hoSoConThieu;
    private int soGiayToBatBuoc;

    public ThongKeHoSoResponse() {}

    public ThongKeHoSoResponse(long tongSoSinhVien, long hoSoDayDu, long hoSoConThieu, int soGiayToBatBuoc) {
        this.tongSoSinhVien = tongSoSinhVien;
        this.hoSoDayDu = hoSoDayDu;
        this.hoSoConThieu = hoSoConThieu;
        this.soGiayToBatBuoc = soGiayToBatBuoc;
    }

    public long getTongSoSinhVien() {
        return tongSoSinhVien;
    }

    public void setTongSoSinhVien(long tongSoSinhVien) {
        this.tongSoSinhVien = tongSoSinhVien;
    }

    public long getHoSoDayDu() {
        return hoSoDayDu;
    }

    public void setHoSoDayDu(long hoSoDayDu) {
        this.hoSoDayDu = hoSoDayDu;
    }

    public long getHoSoConThieu() {
        return hoSoConThieu;
    }

    public void setHoSoConThieu(long hoSoConThieu) {
        this.hoSoConThieu = hoSoConThieu;
    }

    public int getSoGiayToBatBuoc() {
        return soGiayToBatBuoc;
    }

    public void setSoGiayToBatBuoc(int soGiayToBatBuoc) {
        this.soGiayToBatBuoc = soGiayToBatBuoc;
    }
}
