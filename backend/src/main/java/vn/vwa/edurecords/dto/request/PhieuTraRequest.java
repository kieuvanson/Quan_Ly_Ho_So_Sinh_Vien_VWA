package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Request body cho PUT /api/phieu-muon/{maPhieu}/tra — trả hồ sơ.
 *
 * Field:
 *  - ghiChu: ghi chú khi trả (vd: "Đã kiểm tra đủ giấy tờ")
 *
 * Ngày trả thực tế lấy theo ngày hiện tại (server-side).
 */
public class PhieuTraRequest {

    @Size(max = 500)
    private String ghiChu;

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}