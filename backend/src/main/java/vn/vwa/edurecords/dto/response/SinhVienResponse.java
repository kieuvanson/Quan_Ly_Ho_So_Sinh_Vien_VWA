package vn.vwa.edurecords.dto.response;

import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

import java.time.LocalDateTime;

/**
 * DTO response cho SinhVien.
 * 
 * <p>Map đúng nghĩa nghiệp vụ:</p>
 * <ul>
 *   <li>{@code nganh}     = tên ngành từ danh mục</li>
 *   <li>{@code lop}       = tên lớp từ danh mục</li>
 *   <li>{@code khoa}     = số khóa (VD: "Khóa 23") extracted từ maKhoaHoc</li>
 *   <li>{@code khoaNamHoc} = năm học (VD: "2023–2024") từ namBatDau-namKetThuc</li>
 *   <li>{@code heDaoTao} = hệ đào tạo</li>
 *   <li>{@code trangThaiHocVu} = trạng thái học vụ (enum name)</li>
 * </ul>
 */
public class SinhVienResponse {

    private String mssv;
    private String hoTen;
    private String ngaySinh;
    private String gioiTinh;
    private String cccd;
    private String sdt;
    private String email;
    private String queQuan;
    private String nganh;
    private String lop;
    private String khoa;
    private String khoaNamHoc;
    private String heDaoTao;
    private String trangThaiHocVu;
    private String ngayTao;
    private String ngayCapNhat;

    public SinhVienResponse() {}

    /**
     * Factory method: tạo response từ entity SinhVien.
     */
    public static SinhVienResponse fromEntity(SinhVien sv) {
        if (sv == null) return null;
        
        SinhVienResponse r = new SinhVienResponse();
        r.setMssv(sv.getMssv());
        r.setHoTen(sv.getHoTen());
        r.setNgaySinh(sv.getNgaySinh() != null ? sv.getNgaySinh().toString() : null);
        r.setGioiTinh(sv.getGioiTinh());
        r.setCccd(sv.getCccd());
        r.setSdt(sv.getSdt());
        r.setEmail(sv.getEmail());
        r.setQueQuan(sv.getQueQuan());
        r.setHeDaoTao(sv.getHeDaoTao());
        
        // Map từ danh mục
        if (sv.getNganh() != null) {
            r.setNganh(sv.getNganh().getTenNganh());
        }
        if (sv.getLop() != null) {
            r.setLop(sv.getLop().getTenLop());
        }
        
        // Map khoa (số khóa) và khoaNamHoc (năm học) từ khoaHoc
        if (sv.getKhoaHoc() != null) {
            KhoaHoc kh = sv.getKhoaHoc();
            r.setKhoa(formatKhoa(kh.getMaKhoaHoc()));
            r.setKhoaNamHoc(formatKhoaNamHoc(kh));
        }
        
        // Map trạng thái học vụ (enum name)
        if (sv.getTrangThaiHocVu() != null) {
            r.setTrangThaiHocVu(sv.getTrangThaiHocVu().name());
        }
        
        r.setNgayTao(sv.getNgayTao() != null ? sv.getNgayTao().toString() : null);
        r.setNgayCapNhat(sv.getNgayCapNhat() != null ? sv.getNgayCapNhat().toString() : null);
        
        return r;
    }

    /**
     * Format số khóa từ maKhoaHoc.
     * VD: "KH23" → "Khóa 23"
     *     "KH14" → "Khóa 14"
     */
    private static String formatKhoa(String maKhoaHoc) {
        if (maKhoaHoc == null || maKhoaHoc.isBlank()) {
            return null;
        }
        // Extract số từ pattern "KHxx"
        if (maKhoaHoc.matches("^KH\\d+$")) {
            String soKhoa = maKhoaHoc.substring(2);
            return "Khóa " + soKhoa;
        }
        // Fallback: trả nguyên mã nếu không match pattern
        return maKhoaHoc;
    }

    /**
     * Format khóa năm học từ KhoaHoc.
     * VD: namBatDau=2023, namKetThuc=2024 → "2023–2024"
     */
    private static String formatKhoaNamHoc(KhoaHoc kh) {
        if (kh == null) return null;
        
        Integer namBatDau = kh.getNamBatDau();
        Integer namKetThuc = kh.getNamKetThuc();
        
        if (namBatDau != null && namKetThuc != null) {
            return namBatDau + "–" + namKetThuc;
        }
        if (namBatDau != null) {
            return String.valueOf(namBatDau);
        }
        // Fallback: dùng tenKhoaHoc nếu có
        return kh.getTenKhoaHoc();
    }

    // Getters and Setters
    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public String getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(String ngaySinh) { this.ngaySinh = ngaySinh; }

    public String getGioiTinh() { return gioiTinh; }
    public void setGioiTinh(String gioiTinh) { this.gioiTinh = gioiTinh; }

    public String getCccd() { return cccd; }
    public void setCccd(String cccd) { this.cccd = cccd; }

    public String getSdt() { return sdt; }
    public void setSdt(String sdt) { this.sdt = sdt; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getQueQuan() { return queQuan; }
    public void setQueQuan(String queQuan) { this.queQuan = queQuan; }

    public String getNganh() { return nganh; }
    public void setNganh(String nganh) { this.nganh = nganh; }

    public String getLop() { return lop; }
    public void setLop(String lop) { this.lop = lop; }

    public String getKhoa() { return khoa; }
    public void setKhoa(String khoa) { this.khoa = khoa; }

    public String getKhoaNamHoc() { return khoaNamHoc; }
    public void setKhoaNamHoc(String khoaNamHoc) { this.khoaNamHoc = khoaNamHoc; }

    public String getHeDaoTao() { return heDaoTao; }
    public void setHeDaoTao(String heDaoTao) { this.heDaoTao = heDaoTao; }

    public String getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(String trangThaiHocVu) { this.trangThaiHocVu = trangThaiHocVu; }

    public String getNgayTao() { return ngayTao; }
    public void setNgayTao(String ngayTao) { this.ngayTao = ngayTao; }

    public String getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(String ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
