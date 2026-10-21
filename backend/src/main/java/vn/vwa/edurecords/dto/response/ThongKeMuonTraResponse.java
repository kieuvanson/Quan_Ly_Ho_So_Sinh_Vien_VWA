package vn.vwa.edurecords.dto.response;

/**
 * DTO response cho API thống kê mượn/trả hồ sơ toàn hệ thống.
 * 
 * <p>Endpoint: GET /api/thong-ke/muon-tra</p>
 * 
 * <p>Quy tắc tính:
 * <ul>
 *   <li>Đang mượn: phiếu có trạng thái "Đang mượn" (chỉ phiếu Mượn tạm thời).</li>
 *   <li>Đã trả: phiếu có trạng thái "Đã trả" (phiếu Mượn tạm thời đã hoàn tất).</li>
 *   <li>Quá hạn: phiếu có trạng thái "Quá hạn" (Mượn tạm thời đã quá hạn trả).</li>
 * </ul>
 * </p>
 */
public class ThongKeMuonTraResponse {

    private long dangMuon;
    private long daTra;
    private long quaHan;

    public ThongKeMuonTraResponse() {}

    public ThongKeMuonTraResponse(long dangMuon, long daTra, long quaHan) {
        this.dangMuon = dangMuon;
        this.daTra = daTra;
        this.quaHan = quaHan;
    }

    public long getDangMuon() {
        return dangMuon;
    }

    public void setDangMuon(long dangMuon) {
        this.dangMuon = dangMuon;
    }

    public long getDaTra() {
        return daTra;
    }

    public void setDaTra(long daTra) {
        this.daTra = daTra;
    }

    public long getQuaHan() {
        return quaHan;
    }

    public void setQuaHan(long quaHan) {
        this.quaHan = quaHan;
    }
}
