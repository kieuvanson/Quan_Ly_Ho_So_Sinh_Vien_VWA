package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Size;

public class HoSoGiayToRequest {

    private String trangThaiNop;

    private String banGocBanSao;

    @Size(max = 500, message = "File đính kèm không quá 500 ký tự")
    private String fileDinhKem;

    @Size(max = 100, message = "Vị trí lưu kho không quá 100 ký tự")
    private String viTriLuuKho;

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    private String ghiChu;

    // Constructors
    public HoSoGiayToRequest() {}

    // Getters and Setters
    public String getTrangThaiNop() { return trangThaiNop; }
    public void setTrangThaiNop(String trangThaiNop) { this.trangThaiNop = trangThaiNop; }

    public String getBanGocBanSao() { return banGocBanSao; }
    public void setBanGocBanSao(String banGocBanSao) { this.banGocBanSao = banGocBanSao; }

    public String getFileDinhKem() { return fileDinhKem; }
    public void setFileDinhKem(String fileDinhKem) { this.fileDinhKem = fileDinhKem; }

    public String getViTriLuuKho() { return viTriLuuKho; }
    public void setViTriLuuKho(String viTriLuuKho) { this.viTriLuuKho = viTriLuuKho; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}
