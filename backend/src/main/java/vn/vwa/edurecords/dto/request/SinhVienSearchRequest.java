package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.util.List;

/**
 * Filter request cho {@code GET /api/sinh-vien}.
 *
 * <p>Sau V4, các filter {@code nganh} / {@code lop} / {@code khoa} /
 * {@code khoaNamNhapHoc} chuyển từ text (VARCHAR) sang {@code *_id} (Integer)
 * trỏ về bảng danh mục. Controller chịu trách nhiệm resolve từ text/ma sang id
 * trước khi gọi service (vd nhận "CNTT" → id=2).</p>
 *
 * <p>Nếu client cũ vẫn gửi String, controller sẽ fallback parse an toàn; null
 * nghĩa là không filter.</p>
 */
public class SinhVienSearchRequest {

    private String keyword;
    private String trangThaiHocVu;

    /** Mã hoặc tên ngành — controller sẽ resolve sang {@code Integer id}. */
    private String nganh;
    /** Mã hoặc tên lớp — controller sẽ resolve sang {@code Integer id}. */
    private String lop;
    /** Tên khóa nhập học — controller sẽ resolve sang {@code Integer id}. */
    private String khoaNamNhapHoc;
    /** Mã hoặc tên khoa — controller sẽ resolve sang {@code Integer id}. */
    private String khoa;

    private String heDaoTao;

    /** ID đã được controller resolve sẵn (ưu tiên dùng, bỏ qua String). */
    private Integer nganhId;
    private Integer lopId;
    private Integer khoaHocId;
    private Integer khoaId;

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 10;

    @Min(0)
    @Max(1)
    private int sortDirection = 0;

    /**
     * Phạm vi dữ liệu xuất Excel.
     * <ul>
     *   <li>{@code filtered} (mặc định): toàn bộ kết quả theo filter hiện tại.</li>
     *   <li>{@code page}: chỉ trang hiện tại.</li>
     *   <li>{@code selected}: chỉ những MSSV đã chọn trên UI ({@link #selectedMssvs}).</li>
     * </ul>
     */
    private String scope = "filtered";

    /**
     * Danh sách MSSV được chọn — chỉ dùng khi {@link #scope} = "selected".
     * Có thể nhận ở dạng nhiều param {@code ?mssv=A&mssv=B} (Spring bind List<String>)
     * hoặc một param {@code ?mssvs=A,B,C} (CSV — service tự split).
     */
    private List<String> selectedMssvs;

    public SinhVienSearchRequest() {}

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(String trangThaiHocVu) { this.trangThaiHocVu = trangThaiHocVu; }

    public String getNganh() { return nganh; }
    public void setNganh(String nganh) { this.nganh = nganh; }

    public String getLop() { return lop; }
    public void setLop(String lop) { this.lop = lop; }

    public String getKhoaNamNhapHoc() { return khoaNamNhapHoc; }
    public void setKhoaNamNhapHoc(String khoaNamNhapHoc) { this.khoaNamNhapHoc = khoaNamNhapHoc; }

    public String getKhoa() { return khoa; }
    public void setKhoa(String khoa) { this.khoa = khoa; }

    public String getHeDaoTao() { return heDaoTao; }
    public void setHeDaoTao(String heDaoTao) { this.heDaoTao = heDaoTao; }

    public Integer getNganhId() { return nganhId; }
    public void setNganhId(Integer nganhId) { this.nganhId = nganhId; }

    public Integer getLopId() { return lopId; }
    public void setLopId(Integer lopId) { this.lopId = lopId; }

    public Integer getKhoaHocId() { return khoaHocId; }
    public void setKhoaHocId(Integer khoaHocId) { this.khoaHocId = khoaHocId; }

    public Integer getKhoaId() { return khoaId; }
    public void setKhoaId(Integer khoaId) { this.khoaId = khoaId; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public int getSortDirection() { return sortDirection; }
    public void setSortDirection(int sortDirection) { this.sortDirection = sortDirection; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public List<String> getSelectedMssvs() { return selectedMssvs; }
    public void setSelectedMssvs(List<String> selectedMssvs) { this.selectedMssvs = selectedMssvs; }

    public boolean hasKeyword() {
        return keyword != null && !keyword.trim().isEmpty();
    }

    public boolean hasAnyFilter() {
        return hasKeyword()
            || (trangThaiHocVu != null && !trangThaiHocVu.trim().isEmpty())
            || (nganh != null && !nganh.trim().isEmpty())
            || (lop != null && !lop.trim().isEmpty())
            || (khoaNamNhapHoc != null && !khoaNamNhapHoc.trim().isEmpty())
            || (khoa != null && !khoa.trim().isEmpty())
            || (heDaoTao != null && !heDaoTao.trim().isEmpty())
            || nganhId != null || lopId != null || khoaHocId != null || khoaId != null;
    }
}
