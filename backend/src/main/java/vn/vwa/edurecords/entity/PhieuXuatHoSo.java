package vn.vwa.edurecords.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PHIEUXUATHOSO — Phiếu xuất hồ sơ, dùng chung cho Mượn tạm thời và Rút vĩnh viễn.
 * Phân biệt qua {@code loaiPhieu}. Trạng thái phiếu lưu trong {@code trangThai}.
 *
 * Lưu ý quan hệ với SinhVien: dùng MSSV làm FK (PK của SinhVien), không có quan hệ
 * JPA @ManyToOne để tránh lazy-load không cần thiết trong API danh sách. Service sẽ
 * lookup SinhVien khi cần thông tin bổ sung.
 */
@Entity
@Table(name = "phieu_xuat_ho_so")
public class PhieuXuatHoSo {

    @Id
    @Column(name = "ma_phieu", length = 20)
    private String maPhieu;

    @Column(name = "mssv", nullable = false, length = 20)
    private String mssv;

    /** 'Mượn tạm thời' | 'Rút vĩnh viễn' — kiểu ENUM trong DB. */
    @Column(name = "loai_phieu", nullable = false)
    private String loaiPhieu;

    /**
     * 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối' | 'Đang mượn' | 'Đã trả' | 'Quá hạn' | 'Hoàn tất'.
     * Kiểu ENUM trong DB.
     */
    @Column(name = "trang_thai", nullable = false)
    private String trangThai = "Chờ duyệt";

    @Column(name = "ly_do", length = 500)
    private String lyDo;

    @Column(name = "ngay_muon")
    private LocalDate ngayMuon;

    @Column(name = "ngay_tra_du_kien")
    private LocalDate ngayTraDuKien;

    @Column(name = "ngay_tra_thuc_te")
    private LocalDate ngayTraThucTe;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    // ============================================================
    // Getters / Setters
    // ============================================================

    public String getMaPhieu() { return maPhieu; }
    public void setMaPhieu(String maPhieu) { this.maPhieu = maPhieu; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

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
}