package vn.vwa.edurecords.entity.enums;

import java.util.Arrays;

/**
 * Enum mapping cho PostgreSQL ENUM type `trangthaihocvu`.
 * Giá trị của enum PHẢI khớp CHÍNH XÁC với giá trị trong database:
 * - 'Đang học'
 * - 'Bảo lưu'
 * - 'Đình chỉ'
 * - 'Tốt nghiệp'
 * - 'Đã rút hồ sơ'
 */
public enum TrangThaiHocVu {
    ĐANG_HỌC("Đang học"),
    BẢO_LƯU("Bảo lưu"),
    ĐÌNH_CHỈ("Đình chỉ"),
    TỐT_NGHIỆP("Tốt nghiệp"),
    ĐÃ_RÚT_HỒ_SƠ("Đã rút hồ sơ");

    private final String displayName;

    TrangThaiHocVu(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Tìm enum theo displayName (giá trị tiếng Việt trong database).
     * VD: fromDisplayName("Đang học") -> ĐANG_HỌC
     */
    public static TrangThaiHocVu fromDisplayName(String displayName) {
        return Arrays.stream(values())
            .filter(e -> e.displayName.equals(displayName))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                "Không tìm thấy TrangThaiHocVu với displayName: " + displayName
            ));
    }

    /**
     * Kiểm tra displayName có hợp lệ không.
     */
    public static boolean isValid(String displayName) {
        return Arrays.stream(values())
            .anyMatch(e -> e.displayName.equals(displayName));
    }
}
