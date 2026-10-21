package vn.vwa.edurecords.dto.importexcel;

import java.util.HashMap;
import java.util.Map;

/**
 * Snapshot dữ liệu đã đọc + validate cho 1 dòng trong sheet.
 *
 * <p>Đây là dạng trung tính (Map&lt;String, Object&gt;) để:
 * <ul>
 *   <li>Tránh phải tạo nhiều class DTO con theo từng mode.</li>
 *   <li>Lưu được cả thông tin resolve FK (Integer id) lẫn raw text.</li>
 *   <li>Dễ serialize qua Redis (Map&lt;String, Object&gt; tương thích Jackson).</li>
 * </ul>
 * </p>
 *
 * <p>Các key chuẩn theo mode:</p>
 *
 * <h4>{@code ImportMode.SINH_VIEN}</h4>
 * <ul>
 *   <li>{@code mssv}, {@code hoTen}, {@code ngaySinh}, {@code gioiTinh}, {@code cccd},</li>
 *   <li>{@code sdt}, {@code email}, {@code queQuan},</li>
 *   <li>{@code khoaId}, {@code nganhId}, {@code lopId}, {@code khoaHocId},</li>
 *   <li>{@code heDaoTao}, {@code trangThaiHocVu}.</li>
 * </ul>
 *
 * <h4>{@code ImportMode.HO_SO_GIAY_TO}</h4>
 * <ul>
 *   <li>{@code mssv} (bắt buộc phải tồn tại trong DB),</li>
 *   <li>{@code maLoai} (FK → {@code LOAIGIAYTO.MALOAI}),</li>
 *   <li>{@code tenLoai} (tên giấy tờ - enrich từ cache, dùng để hiển thị ở UI),</li>
 *   <li>{@code batBuoc} (Boolean - cờ bắt buộc, enrich từ cache, dùng để hiển thị badge),</li>
 *   <li>{@code trangThaiNop} (enum: "Chưa nộp"/"Đã nộp"/"Thiếu"/"Không hợp lệ"),</li>
 *   <li>{@code banGocBanSao} (enum: "Bản gốc"/"Bản sao"),</li>
 *   <li>{@code fileDinhKem}, {@code viTriLuuKho}.</li>
 * </ul>
 *
 * <h4>{@code ImportMode.GOP}</h4>
 * <p>Thêm {@code loaiDong} = "SV" hoặc "HS" để phân biệt dòng thuộc bảng nào.</p>
 */
public class PreviewRowData {

    /** Số dòng thực tế trong file (1-based). */
    private int dong;

    /** Loại dòng: "SV" / "HS" (chỉ dùng cho mode GOP). */
    private String loaiDong;

    /** Dữ liệu dòng (key theo schema mô tả ở class Javadoc). */
    private Map<String, Object> data = new HashMap<>();

    public PreviewRowData() {}

    public PreviewRowData(int dong, String loaiDong) {
        this.dong = dong;
        this.loaiDong = loaiDong;
    }

    public int getDong() { return dong; }
    public void setDong(int dong) { this.dong = dong; }

    public String getLoaiDong() { return loaiDong; }
    public void setLoaiDong(String loaiDong) { this.loaiDong = loaiDong; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public void put(String key, Object value) {
        if (data == null) data = new HashMap<>();
        data.put(key, value);
    }

    public Object get(String key) {
        return data == null ? null : data.get(key);
    }

    public String getString(String key) {
        Object v = get(key);
        return v == null ? null : v.toString();
    }
}
