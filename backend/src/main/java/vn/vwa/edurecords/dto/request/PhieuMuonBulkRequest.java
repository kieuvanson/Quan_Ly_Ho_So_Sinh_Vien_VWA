package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Request body cho bulk Mượn/Trả và Rút hồ sơ từ
 * {@code POST /api/phieu-muon/bulk}.
 *
 * <p>Field chung:</p>
 * <ul>
 *   <li>{@code mssvList} — danh sách MSSV sẽ tạo phiếu.</li>
 *   <li>{@code loaiPhieu} — {@code "Mượn tạm thời"} hoặc {@code "Rút vĩnh viễn"}.</li>
 *   <li>{@code ngayMuon} — ngày bắt đầu (bắt buộc).</li>
 *   <li>{@code ngayTraDuKien} — bắt buộc với Mượn tạm thời; với Rút vĩnh viễn có thể null.</li>
 *   <li>{@code lyDo} — lý do mượn / rút (bắt buộc).</li>
 *   <li>{@code ghiChu} — ghi chú thêm (tùy chọn).</li>
 *   <li>{@code danhSachMaHoSo} — danh sách mã hồ sơ áp dụng cho TẤT CẢ sinh viên
 *       trong lô. Với Mượn tạm thời: danh sách này được áp dụng cho mỗi SV; với
 *       Rút vĩnh viễn: nếu trống, service tự fill TOÀN BỘ giấy tờ của từng SV.</li>
 * </ul>
 *
 * <p>Quy tắc áp dụng cho từng SV:</p>
 * <ul>
 *   <li>Mượn tạm thời: chỉ lấy những hồ sơ thuộc về SV đó. Nếu SV không có
 *       bất kỳ hồ sơ nào trong danh sách gửi lên → trả về success=false với
 *       code {@code SV_KHONG_CO_HO_SO_TRONG_DANH_SACH}.</li>
 *   <li>Rút vĩnh viễn: nếu {@code danhSachMaHoSo} trống → lấy tất cả hồ sơ
 *       của SV. Nếu SV không có hồ sơ nào → success=false với
 *       {@code SV_KHONG_CO_HO_SO}.</li>
 *   <li>Mọi nghiệp vụ lỗi khác được trả qua từng kết quả con
 *       (best-effort, không chặn các SV khác).</li>
 * </ul>
 */
public class PhieuMuonBulkRequest {

    /**
     * Giới hạn số sinh viên mỗi lần bulk để chống request quá nặng.
     */
    public static final int MAX_MSSVS = 200;

    @NotEmpty(message = "Danh sách MSSV không được rỗng.")
    @Size(max = MAX_MSSVS,
          message = "Mỗi lần chỉ xử lý tối đa " + MAX_MSSVS + " sinh viên.")
    private List<String> mssvList;

    @NotBlank
    @Size(max = 30)
    private String loaiPhieu; // 'Mượn tạm thời' | 'Rút vĩnh viễn'

    @NotBlank
    private String ngayMuon; // yyyy-MM-dd

    private String ngayTraDuKien; // yyyy-MM-dd

    @NotBlank
    @Size(max = 500)
    private String lyDo;

    @Size(max = 500)
    private String ghiChu;

    /**
     * Danh sách mã hồ sơ áp dụng cho từng sinh viên. Có thể trống với
     * Rút vĩnh viễn (service tự fill toàn bộ).
     */
    private List<String> danhSachMaHoSo;

    public List<String> getMssvList() { return mssvList; }
    public void setMssvList(List<String> mssvList) { this.mssvList = mssvList; }

    public String getLoaiPhieu() { return loaiPhieu; }
    public void setLoaiPhieu(String loaiPhieu) { this.loaiPhieu = loaiPhieu; }

    public String getNgayMuon() { return ngayMuon; }
    public void setNgayMuon(String ngayMuon) { this.ngayMuon = ngayMuon; }

    public String getNgayTraDuKien() { return ngayTraDuKien; }
    public void setNgayTraDuKien(String ngayTraDuKien) { this.ngayTraDuKien = ngayTraDuKien; }

    public String getLyDo() { return lyDo; }
    public void setLyDo(String lyDo) { this.lyDo = lyDo; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public List<String> getDanhSachMaHoSo() { return danhSachMaHoSo; }
    public void setDanhSachMaHoSo(List<String> danhSachMaHoSo) { this.danhSachMaHoSo = danhSachMaHoSo; }
}