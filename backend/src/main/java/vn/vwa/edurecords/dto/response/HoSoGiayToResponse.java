package vn.vwa.edurecords.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO cho HoSoGiayTo khi hiển thị trong modal chọn giấy tờ mượn.
 * Mở rộng entity bằng cách JOIN LoaiGiayTo để lấy tenGiayTo.
 */
public class HoSoGiayToResponse {

    private String maHoSo;
    private String mssv;
    private String maLoai;
    /** Tên đầy đủ của loại giấy tờ (JOIN từ LoaiGiayTo.tenGiayTo). */
    private String tenGiayTo;
    private String trangThaiNop;
    /** Bản gốc / Bản sao — có thể null nếu chưa được ghi nhận. */
    private String banGocBanSao;
    private String viTriLuuKho;
    private LocalDateTime ngayTao;

    public HoSoGiayToResponse() {}

    // Getters and Setters
    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getMaLoai() { return maLoai; }
    public void setMaLoai(String maLoai) { this.maLoai = maLoai; }

    public String getTenGiayTo() { return tenGiayTo; }
    public void setTenGiayTo(String tenGiayTo) { this.tenGiayTo = tenGiayTo; }

    public String getTrangThaiNop() { return trangThaiNop; }
    public void setTrangThaiNop(String trangThaiNop) { this.trangThaiNop = trangThaiNop; }

    public String getBanGocBanSao() { return banGocBanSao; }
    public void setBanGocBanSao(String banGocBanSao) { this.banGocBanSao = banGocBanSao; }

    public String getViTriLuuKho() { return viTriLuuKho; }
    public void setViTriLuuKho(String viTriLuuKho) { this.viTriLuuKho = viTriLuuKho; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
}
