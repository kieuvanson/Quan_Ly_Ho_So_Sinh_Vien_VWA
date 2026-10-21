package vn.vwa.edurecords.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO cho PhieuXuatHoSo trong endpoint danh sách.
 * Gồm thông tin phiếu + danh sách maHoSo thuộc phiếu (để UI show preview
 * mà không cần gọi thêm API chi tiết).
 */
public class PhieuMuonResponse {

    private String maPhieu;
    private String mssv;
    private String hoTenSinhVien;
    private String loaiPhieu;
    private String trangThai;
    private String lyDo;
    private LocalDate ngayMuon;
    private LocalDate ngayTraDuKien;
    private LocalDate ngayTraThucTe;
    private String ghiChu;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    /** Danh sách mã hồ sơ giấy tờ thuộc phiếu (aggregate từ chi_tiet_phieu). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<String> danhSachMaHoSo;

    /** Số lượng giấy tờ trong phiếu (cho UI hiển thị badge). */
    private int soLuongHoSo;

    /** Tên lớp hành chính của sinh viên (lấy từ sinhvien.lop.tenLop). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String tenLop;

    /** Số điện thoại sinh viên. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String sdt;

    /** Ngày sinh sinh viên (format yyyy-MM-dd). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String ngaySinh;

    /** Giới tính sinh viên. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String gioiTinh;

    /** Tên ngành học của sinh viên. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String tenNganh;

    /** Tên khoa (đơn vị đào tạo) của sinh viên. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String tenKhoa;

    /** Niên khóa / khóa năm học (VD: "2023–2024"). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String khoaNamHoc;

    public PhieuMuonResponse() {}

    public String getMaPhieu() { return maPhieu; }
    public void setMaPhieu(String maPhieu) { this.maPhieu = maPhieu; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTenSinhVien() { return hoTenSinhVien; }
    public void setHoTenSinhVien(String hoTenSinhVien) { this.hoTenSinhVien = hoTenSinhVien; }

    public String getLoaiPhieu() { return loaiPhieu; }
    public void setLoaiPhieu(String loaiPhieu) { this.loaiPhieu = loaiPhieu; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public LocalDate getNgayMuon() { return ngayMuon; }
    public void setNgayMuon(LocalDate ngayMuon) { this.ngayMuon = ngayMuon; }

    public LocalDate getNgayTraDuKien() { return ngayTraDuKien; }
    public void setNgayTraDuKien(LocalDate ngayTraDuKien) { this.ngayTraDuKien = ngayTraDuKien; }

    public LocalDate getNgayTraThucTe() { return ngayTraThucTe; }
    public void setNgayTraThucTe(LocalDate ngayTraThucTe) { this.ngayTraThucTe = ngayTraThucTe; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public String getNguoiTao() { return nguoiTao; }
    public void setNguoiTao(String nguoiTao) { this.nguoiTao = nguoiTao; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }

    public List<String> getDanhSachMaHoSo() { return danhSachMaHoSo; }
    public void setDanhSachMaHoSo(List<String> danhSachMaHoSo) { this.danhSachMaHoSo = danhSachMaHoSo; }

    public int getSoLuongHoSo() { return soLuongHoSo; }
    public void setSoLuongHoSo(int soLuongHoSo) { this.soLuongHoSo = soLuongHoSo; }

    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }

    public String getSdt() { return sdt; }
    public void setSdt(String sdt) { this.sdt = sdt; }

    public String getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(String ngaySinh) { this.ngaySinh = ngaySinh; }

    public String getGioiTinh() { return gioiTinh; }
    public void setGioiTinh(String gioiTinh) { this.gioiTinh = gioiTinh; }

    public String getTenNganh() { return tenNganh; }
    public void setTenNganh(String tenNganh) { this.tenNganh = tenNganh; }

    public String getTenKhoa() { return tenKhoa; }
    public void setTenKhoa(String tenKhoa) { this.tenKhoa = tenKhoa; }

    public String getKhoaNamHoc() { return khoaNamHoc; }
    public void setKhoaNamHoc(String khoaNamHoc) { this.khoaNamHoc = khoaNamHoc; }
}