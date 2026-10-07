package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import vn.vwa.edurecords.hibernate.type.PostgresEnumStringUserType;
import java.time.LocalDateTime;

@Entity
@Table(name = "ho_so_giay_to")
public class HoSoGiayTo {

    @Id
    @Column(name = "ma_ho_so", length = 20)
    private String maHoSo;

    @Column(name = "mssv", nullable = false, length = 20)
    private String mssv;

    @Column(name = "ma_loai", nullable = false, length = 10)
    private String maLoai;

    /**
     * Postgres ENUM `trangthainop`. Java là String; dùng UserType để driver
     * PostgreSQL nhận diện raw ENUM literal (không ép VARCHAR).
     */
    @Type(PostgresEnumStringUserType.class)
    @Column(name = "trang_thai_nop", nullable = false, columnDefinition = "trangthainop")
    private String trangThaiNop = "Chưa nộp";

    /**
     * Postgres ENUM `loaiban`. Java là String; dùng UserType để driver
     * PostgreSQL nhận diện raw ENUM literal (không ép VARCHAR).
     */
    @Type(PostgresEnumStringUserType.class)
    @Column(name = "ban_goc_ban_sao", columnDefinition = "loaiban")
    private String banGocBanSao;

    @Column(name = "file_dinh_kem", length = 500)
    private String fileDinhKem;

    @Column(name = "vi_tri_luu_kho", length = 100)
    private String viTriLuuKho;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    // Getters and Setters
    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getMaLoai() { return maLoai; }
    public void setMaLoai(String maLoai) { this.maLoai = maLoai; }

    public String getTrangThaiNop() { return trangThaiNop; }
    public void setTrangThaiNop(String trangThaiNop) { this.trangThaiNop = trangThaiNop; }

    public String getBanGocBanSao() { return banGocBanSao; }
    public void setBanGocBanSao(String banGocBanSao) { this.banGocBanSao = banGocBanSao; }

    public String getFileDinhKem() { return fileDinhKem; }
    public void setFileDinhKem(String fileDinhKem) { this.fileDinhKem = fileDinhKem; }

    public String getViTriLuuKho() { return viTriLuuKho; }
    public void setViTriLuuKho(String viTriLuuKho) { this.viTriLuuKho = viTriLuuKho; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
