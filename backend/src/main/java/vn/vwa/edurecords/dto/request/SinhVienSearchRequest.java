package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class SinhVienSearchRequest {

    private String keyword;
    private String trangThaiHocVu;
    private String nganh;
    private String lop;
    private String khoaNamNhapHoc;
    private String khoa;
    private String heDaoTao;

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 10;

    @Min(0)
    @Max(1)
    private int sortDirection = 0;

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

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public int getSortDirection() { return sortDirection; }
    public void setSortDirection(int sortDirection) { this.sortDirection = sortDirection; }

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
            || (heDaoTao != null && !heDaoTao.trim().isEmpty());
    }
}
