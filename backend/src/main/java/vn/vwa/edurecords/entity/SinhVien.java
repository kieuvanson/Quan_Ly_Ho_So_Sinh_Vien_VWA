package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import java.time.LocalDateTime;

@Entity
@Table(name = "sinhvien")
public class SinhVien {

    @Id
    @Column(name = "mssv", length = 20)
    private String mssv;

    @Column(name = "ho_ten", nullable = false, length = 150)
    private String hoTen;

    @Column(name = "ngay_sinh")
    private LocalDateTime ngaySinh;

    @Column(name = "gioi_tinh", length = 10)
    private String gioiTinh;

    @Column(name = "cccd", length = 20, unique = true)
    private String cccd;

    @Column(name = "sdt", length = 20)
    private String sdt;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "que_quan", length = 255)
    private String queQuan;

    @Column(name = "nganh", length = 100)
    private String nganh;

    @Column(name = "lop", length = 20)
    private String lop;

    @Column(name = "khoa", length = 50)
    private String khoa;

    @Column(name = "khoa_nam_nhap_hoc", length = 50)
    private String khoaNamNhapHoc;

    @Column(name = "he_dao_tao", length = 50)
    private String heDaoTao;

    @Column(name = "trang_thai_hoc_vu", nullable = false)
    private TrangThaiHocVu trangThaiHocVu = TrangThaiHocVu.ĐANG_HỌC;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    // Getters and Setters
    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public LocalDateTime getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(LocalDateTime ngaySinh) { this.ngaySinh = ngaySinh; }

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

    public String getKhoaNamNhapHoc() { return khoaNamNhapHoc; }
    public void setKhoaNamNhapHoc(String khoaNamNhapHoc) { this.khoaNamNhapHoc = khoaNamNhapHoc; }

    public String getHeDaoTao() { return heDaoTao; }
    public void setHeDaoTao(String heDaoTao) { this.heDaoTao = heDaoTao; }

    public TrangThaiHocVu getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu) { this.trangThaiHocVu = trangThaiHocVu; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }
}
