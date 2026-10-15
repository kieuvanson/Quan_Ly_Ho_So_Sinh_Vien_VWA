package vn.vwa.edurecords.dto.importexcel;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Helper nhận diện {@link ImportMode} từ tên sheet.
 *
 * <p>Cho phép người dùng đặt tên sheet tùy ý nhưng vẫn map đúng mode:</p>
 * <ul>
 *   <li>SV: "SV", "TT Sinh viên", "TT Sinh vien", "SinhVien", "Sinh Viên".</li>
 *   <li>HS: "HS", "Hồ sơ giấy tờ", "Ho so giay to", "HoSoGiayTo".</li>
 *   <li>GOP: "SV+HS", "TT Sinh viên &amp; Hồ sơ", "Sinh vien va Ho so".</li>
 * </ul>
 */
public final class ImportSheetNameResolver {

    private ImportSheetNameResolver() {}

    /**
     * Map tên sheet (sau khi trim + lowercase + gộp khoảng trắng) sang {@link ImportMode}.
     *
     * @param rawName tên sheet từ file Excel (giữ nguyên dấu).
     * @return {@link ImportMode} tương ứng, hoặc {@code null} nếu không nhận diện được.
     */
    public static ImportMode resolve(String rawName) {
        if (rawName == null) return null;
        String normalized = normalize(rawName);

        // === SV ===
        if (normalized.equals("sv")
                || normalized.equals("tt sinh vien")
                || normalized.equals("tt sinh vien")
                || normalized.equals("sinh vien")
                || normalized.equals("sinhvien")) {
            return ImportMode.SINH_VIEN;
        }

        // === HS ===
        if (normalized.equals("hs")
                || normalized.equals("ho so giay to")
                || normalized.equals("hosogiayto")) {
            return ImportMode.HO_SO_GIAY_TO;
        }

        // === GOP (SV+HS trong 1 sheet) ===
        if (normalized.equals("sv+hs")
                || normalized.equals("sv + hs")
                || normalized.equals("tt sinh vien & ho so")
                || normalized.equals("sinh vien va ho so")) {
            return ImportMode.GOP;
        }

        return null;
    }

    /**
     * Trả về danh sách tên sheet được hỗ trợ, dùng để hiển thị thông báo lỗi
     * khi user đặt tên sheet không hợp lệ.
     */
    public static List<String> supportedSheetNames() {
        List<String> names = new ArrayList<>();
        names.add("SV");
        names.add("HS");
        names.add("SV+HS");
        return names;
    }

    /**
     * Chuẩn hóa tên sheet: trim + lowercase + gộp khoảng trắng.
     * Bỏ dấu: giữ nguyên (đã so sánh literal ở trên).
     */
    private static String normalize(String s) {
        return s.trim().toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }
}
