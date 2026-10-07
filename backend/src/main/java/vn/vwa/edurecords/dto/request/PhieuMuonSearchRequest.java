package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request params cho GET /api/phieu-muon/dang-muon
 * và GET /api/phieu-muon/lich-su
 * (Bind từ query string — không phải body).
 *
 * Filter:
 * - keyword: tìm theo maPhieu / mssv / hoTen sinh viên / lyDo (LIKE, không phân biệt hoa thường)
 * - trangThai: trạng thái phiếu. Mặc định 'Đang mượn' cho /dang-muon, optional cho /lich-su.
 * - loaiHoSo: 'Mượn tạm thời' | 'Rút vĩnh viễn'
 * - fromDate, toDate: filter theo ngayTao (yyyy-MM-dd). Chỉ dùng cho /lich-su.
 * - page/size: phân trang
 */
public class PhieuMuonSearchRequest {

    private String keyword;
    private String trangThai;
    private String loaiHoSo;
    private String fromDate;
    private String toDate;

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 10;

    public PhieuMuonSearchRequest() {}

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }

    public String getLoaiHoSo() { return loaiHoSo; }
    public void setLoaiHoSo(String loaiHoSo) { this.loaiHoSo = loaiHoSo; }

    public String getFromDate() { return fromDate; }
    public void setFromDate(String fromDate) { this.fromDate = fromDate; }

    public String getToDate() { return toDate; }
    public void setToDate(String toDate) { this.toDate = toDate; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public boolean hasKeyword() {
        return keyword != null && !keyword.trim().isEmpty();
    }
}