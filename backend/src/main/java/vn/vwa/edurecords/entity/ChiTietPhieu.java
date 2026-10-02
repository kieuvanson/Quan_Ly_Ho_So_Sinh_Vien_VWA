package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * CHITIETPHIEU — Bảng nối PhieuXuatHoSo ↔ HoSoGiayTo (N-N).
 * Mỗi dòng mô tả một giấy tờ cụ thể thuộc về một phiếu xuất.
 *
 * Khai báo bằng FK thuần (không @ManyToOne) để giữ pattern của HoSoGiayTo;
 * tránh lazy-load khi API danh sách chỉ cần aggregate count.
 */
@Entity
@Table(name = "chi_tiet_phieu")
public class ChiTietPhieu {

    @Id
    @Column(name = "ma_ct", length = 20)
    private String maCt;

    @Column(name = "ma_phieu", nullable = false, length = 20)
    private String maPhieu;

    @Column(name = "ma_ho_so", nullable = false, length = 20)
    private String maHoSo;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    public String getMaCt() { return maCt; }
    public void setMaCt(String maCt) { this.maCt = maCt; }

    public String getMaPhieu() { return maPhieu; }
    public void setMaPhieu(String maPhieu) { this.maPhieu = maPhieu; }

    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
}