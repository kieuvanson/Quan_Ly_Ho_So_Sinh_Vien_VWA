package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Request body cho POST /api/phieu-muon — tạo phiếu mượn / rút hồ sơ mới.
 *
 * Field bắt buộc:
 *  - mssv: sinh viên sở hữu phiếu
 *  - loaiPhieu: 'Mượn tạm thời' | 'Rút vĩnh viễn'
 *  - ngayMuon: ngày bắt đầu
 *  - ngayTraDuKien: hạn trả (bắt buộc với Mượn tạm thời; Rút vĩnh viễn có thể để null)
 *  - lyDo: lý do mượn / rút
 *  - danhSachMaHoSo: danh sách mã hồ sơ giấy tờ thuộc phiếu
 *
 * Không bắt buộc:
 *  - ghiChu: ghi chú thêm
 *  - trangThai: mặc định tạo phiếu mới ở 'Chờ duyệt' (xem service)
 */
public class PhieuMuonRequest {

    @NotBlank
    @Size(max = 20)
    private String mssv;

    @NotBlank
    @Size(max = 30)
    private String loaiPhieu; // 'Mượn tạm thời' | 'Rút vĩnh viễn'

    @NotNull
    private LocalDate ngayMuon;

    private LocalDate ngayTraDuKien;

    @NotBlank
    @Size(max = 500)
    private String lyDo;

    @Size(max = 500)
    private String ghiChu;

    /** Danh sách mã hồ sơ giấy tờ thuộc phiếu — bắt buộc >= 1 cho cả Mượn và Rút. */
    @NotNull
    @Size(min = 1, message = "Phải chọn ít nhất 1 hồ sơ giấy tờ")
    private List<String> danhSachMaHoSo;

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getLoaiPhieu() { return loaiPhieu; }
    public void setLoaiPhieu(String loaiPhieu) { this.loaiPhieu = loaiPhieu; }

    public LocalDate getNgayMuon() { return ngayMuon; }
    public void setNgayMuon(LocalDate ngayMuon) { this.ngayMuon = ngayMuon; }

    public LocalDate getNgayTraDuKien() { return ngayTraDuKien; }
    public void setNgayTraDuKien(LocalDate ngayTraDuKien) { this.ngayTraDuKien = ngayTraDuKien; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public List<String> getDanhSachMaHoSo() { return danhSachMaHoSo; }
    public void setDanhSachMaHoSo(List<String> danhSachMaHoSo) { this.danhSachMaHoSo = danhSachMaHoSo; }
}