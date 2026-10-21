package vn.vwa.edurecords.dto.importexcel;

/**
 * Phân loại mode import theo tên sheet / số cột trong file Excel.
 *
 * <p>Quy ước nhận diệt (theo tên sheet, case-insensitive, bỏ khoảng trắng thừa):</p>
 * <ul>
 *   <li>{@link #SINH_VIEN} — tên sheet = "SV" / "TT Sinh viên" / "SinhVien".</li>
 *   <li>{@link #HO_SO_GIAY_TO} — tên sheet = "HS" / "Hồ sơ giấy tờ" / "HoSoGiayTo".</li>
 *   <li>{@link #GOP} — tên sheet = "SV+HS" / "TT Sinh viên &amp; Hồ sơ" (1 sheet có cả 2 loại dòng).</li>
 * </ul>
 *
 * <p>Nếu tên sheet không khớp bất kỳ alias nào → báo lỗi fail-fast, không cho upload.</p>
 */
public enum ImportMode {

    /** Chỉ import bảng {@code SINHVIEN} (1 sheet có 14 cột cố định). */
    SINH_VIEN,

    /** Chỉ import bảng {@code HOSOGIAYTO} (1 sheet có ~10 cột). Yêu cầu MSSV đã tồn tại. */
    HO_SO_GIAY_TO,

    /** Import gộp 1 sheet, có cột {@code Loại dòng} = "SV" hoặc "HS" để phân loại từng dòng. */
    GOP
}
