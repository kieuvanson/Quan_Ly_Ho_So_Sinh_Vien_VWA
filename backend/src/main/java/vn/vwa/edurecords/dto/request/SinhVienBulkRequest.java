package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body cho các endpoint bulk của {@code /api/sinh-vien/bulk}.
 *
 * <p>Thiết kế gọn để dễ mở rộng cho nhiều loại thao tác hàng loạt:
 * cập nhật trạng thái học vụ, xóa an toàn, xuất Excel đã chọn.</p>
 *
 * <p>Danh sách MSSV giới hạn tối đa {@link #MAX_MSSVS} để chống
 * abuse / request quá nặng. Các endpoint nên kiểm tra {@code @Size} ở
 * controller hoặc service trước khi thao tác DB.</p>
 */
public class SinhVienBulkRequest {

    /** Giới hạn MSSV mỗi request bulk — phòng request quá nặng. */
    public static final int MAX_MSSVS = 500;

    @NotEmpty(message = "Danh sách MSSV không được rỗng.")
    @Size(max = MAX_MSSVS,
          message = "Mỗi lần chỉ xử lý tối đa " + MAX_MSSVS + " sinh viên.")
    private List<String> mssvList;

    /**
     * Trạng thái học vụ mới — chỉ dùng cho endpoint cập nhật trạng thái.
     * Để trống / null khi gọi endpoint xóa.
     */
    private String trangThaiHocVu;

    /**
     * Ghi chú — dùng cho audit log.
     */
    private String ghiChu;

    public SinhVienBulkRequest() {}

    public List<String> getMssvList() { return mssvList; }
    public void setMssvList(List<String> mssvList) { this.mssvList = mssvList; }

    public String getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(String trangThaiHocVu) { this.trangThaiHocVu = trangThaiHocVu; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}