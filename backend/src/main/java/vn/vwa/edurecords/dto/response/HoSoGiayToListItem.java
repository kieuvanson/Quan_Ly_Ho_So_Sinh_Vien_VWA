package vn.vwa.edurecords.dto.response;

import java.time.LocalDateTime;

/**
 * Row phẳng hiển thị trong bảng "Danh sách hồ sơ giấy tờ" trên frontend.
 *
 * <p>Đây là projection từ {@code ho_so_giay_to JOIN sinhvien JOIN loai_giay_to},
 * trả về đủ thông tin để hiển thị 1 dòng mà không cần N+1 lookup.</p>
 *
 * <p>Các trường từ {@code sinhvien} (hoTen, tenNganh, tenLop, tenKhoa) chỉ
 * dùng cho hiển thị — KHÔNG dùng làm khóa hay filter chính; khóa vẫn là
 * {@code ma_ho_so} và {@code mssv}.</p>
 */
public class HoSoGiayToListItem {

    /** Khóa chính của bảng {@code ho_so_giay_to}. */
    private String maHoSo;

    /** MSSV — FK sang {@code sinhvien}. */
    private String mssv;

    /** Mã loại giấy tờ — FK sang {@code loai_giay_to}. */
    private String maLoai;

    /** Tên loại giấy tờ (lookup từ {@code loai_giay_to.ten_giay_to}). */
    private String tenLoai;

    /** Loại giấy tờ có bắt buộc không (lookup). */
    private Boolean loaiBatBuoc;

    /** Trạng thái nộp hiện tại (Chưa nộp / Đã nộp / Thiếu / Không hợp lệ). */
    private String trangThaiNop;

    /** Bản gốc / Bản sao (nullable). */
    private String banGocBanSao;

    /** File đính kèm (URL hoặc tên file, nullable). */
    private String fileDinhKem;

    /** Vị trí lưu kho (nullable). */
    private String viTriLuuKho;

    /** Họ tên sinh viên (lookup từ {@code sinhvien.ho_ten}). */
    private String hoTen;

    /** Tên ngành (lookup từ {@code nganh.ten_nganh}). */
    private String tenNganh;

    /** Tên lớp (lookup từ {@code lop.ten_lop}). */
    private String tenLop;

    /** Tên khóa học (lookup từ {@code khoa_hoc.ten_khoa_hoc}). */
    private String tenKhoa;

    /** Trạng thái học vụ của sinh viên (Đang học, Bảo lưu, ...). */
    private String trangThaiHocVu;

    /** Ngày tạo hồ sơ giấy tờ. */
    private LocalDateTime ngayTao;

    /** Ngày cập nhật gần nhất. */
    private LocalDateTime ngayCapNhat;

    // ===== Getters / Setters =====
    public String getMaHoSo() { return maHoSo; }
    public void setMaHoSo(String maHoSo) { this.maHoSo = maHoSo; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getMaLoai() { return maLoai; }
    public void setMaLoai(String maLoai) { this.maLoai = maLoai; }

    public String getTenLoai() { return tenLoai; }
    public void setTenLoai(String tenLoai) { this.tenLoai = tenLoai; }

    public Boolean getLoaiBatBuoc() { return loaiBatBuoc; }
    public void setLoaiBatBuoc(Boolean loaiBatBuoc) { this.loaiBatBuoc = loaiBatBuoc; }

    public String getTrangThaiNop() { return trangThaiNop; }
    public void setTrangThaiNop(String trangThaiNop) { this.trangThaiNop = trangThaiNop; }

    public String getBanGocBanSao() { return banGocBanSao; }
    public void setBanGocBanSao(String banGocBanSao) { this.banGocBanSao = banGocBanSao; }

    public String getFileDinhKem() { return fileDinhKem; }
    public void setFileDinhKem(String fileDinhKem) { this.fileDinhKem = fileDinhKem; }

    public String getViTriLuuKho() { return viTriLuuKho; }
    public void setViTriLuuKho(String viTriLuuKho) { this.viTriLuuKho = viTriLuuKho; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public String getTenNganh() { return tenNganh; }
    public void setTenNganh(String tenNganh) { this.tenNganh = tenNganh; }

    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }

    public String getTenKhoa() { return tenKhoa; }
    public void setTenKhoa(String tenKhoa) { this.tenKhoa = tenKhoa; }

    public String getTrangThaiHocVu() { return trangThaiHocVu; }
    public void setTrangThaiHocVu(String trangThaiHocVu) {
        this.trangThaiHocVu = trangThaiHocVu;
    }

    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }

    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) {
        this.ngayCapNhat = ngayCapNhat;
    }
}
