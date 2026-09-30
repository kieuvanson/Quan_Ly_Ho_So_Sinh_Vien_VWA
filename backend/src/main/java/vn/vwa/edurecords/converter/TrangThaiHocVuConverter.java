package vn.vwa.edurecords.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

/**
 * Converter để map giữa Java enum TrangThaiHocVu và PostgreSQL ENUM 'trangthaihocvu'.
 * - Database lưu: 'Đang học', 'Bảo lưu', ...
 * - Java dùng: ĐANG_HỌC, BẢO_LƯU, ...
 */
@Converter(autoApply = true)
public class TrangThaiHocVuConverter implements AttributeConverter<TrangThaiHocVu, String> {

    @Override
    public String convertToDatabaseColumn(TrangThaiHocVu attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getDisplayName(); // ĐANG_HỌC -> "Đang học"
    }

    @Override
    public TrangThaiHocVu convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return TrangThaiHocVu.fromDisplayName(dbData); // "Đang học" -> ĐANG_HỌC
    }
}
