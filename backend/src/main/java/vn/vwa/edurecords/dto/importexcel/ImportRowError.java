package vn.vwa.edurecords.dto.importexcel;

import java.util.List;

/**
 * Lỗi từng dòng trong quá trình preview / confirm.
 *
 * <p>Dùng cho cả 2 mode: {@code ImportMode.SINH_VIEN}, {@code ImportMode.HO_SO_GIAY_TO},
 * {@code ImportMode.GOP}. Field {@link #loaiDong} cho biết dòng đó thuộc loại nào
 * trong file gộp ("SV" hoặc "HS"), null nếu mode đơn.</p>
 */
public class ImportRowError {

    /** Tên sheet chứa dòng lỗi. */
    private String sheet;

    /** Số dòng thực tế trong file Excel (1-based, tính cả dòng header). */
    private int dong;

    /** Loại dòng trong sheet: "SV" hoặc "HS" (chỉ áp dụng cho mode GOP). */
    private String loaiDong;

    /** MSSV đọc được tại dòng này (null nếu không đọc được). */
    private String mssv;

    /** Mô tả trường đang gặp lỗi (VD: "Ngày sinh", "Tên khoa"). Có thể null. */
    private String truong;

    /** Danh sách thông báo lỗi (cộng dồn nhiều lỗi nếu dòng đó vi phạm nhiều rule). */
    private List<String> lyDo;

    public ImportRowError() {}

    public ImportRowError(String sheet, int dong, String loaiDong, String mssv,
                          String truong, List<String> lyDo) {
        this.sheet = sheet;
        this.dong = dong;
        this.loaiDong = loaiDong;
        this.mssv = mssv;
        this.truong = truong;
        this.lyDo = lyDo;
    }

    public String getSheet() { return sheet; }
    public void setSheet(String sheet) { this.sheet = sheet; }

    public int getDong() { return dong; }
    public void setDong(int dong) { this.dong = dong; }

    public String getLoaiDong() { return loaiDong; }
    public void setLoaiDong(String loaiDong) { this.loaiDong = loaiDong; }

    public String getMssv() { return mssv; }
    public void setMssv(String mssv) { this.mssv = mssv; }

    public String getTruong() { return truong; }
    public void setTruong(String truong) { this.truong = truong; }

    public List<String> getLyDo() { return lyDo; }
    public void setLyDo(List<String> lyDo) { this.lyDo = lyDo; }
}
