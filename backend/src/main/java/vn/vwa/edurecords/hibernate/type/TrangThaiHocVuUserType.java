package vn.vwa.edurecords.hibernate.type;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Hibernate {@link UserType} dùng để map {@link TrangThaiHocVu} với PostgreSQL ENUM type {@code trangthaihocvu}.
 *
 * <h3>Vấn đề</h3>
 * Java enum constant name (ví dụ {@code ĐANG_HỌC}) khác giá trị literal trong DB
 * (ví dụ {@code "Đang học"}). Hibernate mặc định với
 * {@code @Enumerated(EnumType.STRING) + @JdbcTypeCode(SqlTypes.NAMED_ENUM)} sẽ gọi
 * {@code TrangThaiHocVu.valueOf(<dbValue>)} khi đọc từ DB — gây
 * {@code IllegalArgumentException} khi DB literal có dấu/khoảng trắng không khớp
 * Java identifier convention.
 *
 * <h3>Giải pháp</h3>
 * {@code UserType} này thay thế hoàn toàn cơ chế mapping mặc định: dùng
 * {@code getDisplayName()} làm nguồn sự thật duy nhất cho cả chiều Java → DB và
 * DB → Java. Java constant name giữ {@code UPPER_SNAKE_CASE}, DB literal giữ
 * nguyên tiếng Việt có dấu — mapping qua displayName là cầu nối.
 *
 * <h3>Cách dùng</h3>
 * <pre>
 * {@code
 * @Type(TrangThaiHocVuUserType.class)
 * @Column(name = "trang_thai_hoc_vu", nullable = false, columnDefinition = "trangthaihocvu")
 * private TrangThaiHocVu trangThaiHocVu = TrangThaiHocVu.ĐANG_HỌC;
 * }
 * </pre>
 */
public class TrangThaiHocVuUserType implements UserType<TrangThaiHocVu> {

    @Override
    public int getSqlType() {
        // JDBC code cho VARCHAR — driver PostgreSQL cast ngầm sang ENUM literal
        // khi setString vào cột có kiểu ENUM (xem User.role đã chạy OK cùng pattern).
        return Types.VARCHAR;
    }

    @Override
    public Class<TrangThaiHocVu> returnedClass() {
        return TrangThaiHocVu.class;
    }

    @Override
    public boolean equals(TrangThaiHocVu x, TrangThaiHocVu y) {
        return x == y;
    }

    @Override
    public int hashCode(TrangThaiHocVu x) {
        return Objects.hashCode(x);
    }

    @Override
    public TrangThaiHocVu deepCopy(TrangThaiHocVu value) {
        // Enum là immutable — không cần deep copy.
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(TrangThaiHocVu value) {
        return value == null ? null : value.name();
    }

    @Override
    public TrangThaiHocVu assemble(Serializable cached, Object owner) {
        if (cached == null) return null;
        String constantName = cached.toString();
        // Restore theo Java constant name (an toàn vì cached value đã là constant name).
        return TrangThaiHocVu.valueOf(constantName);
    }

    // ============================================================
    // Ghi vào PreparedStatement (Java enum -> JDBC VARCHAR)
    // ============================================================

    @Override
    public void nullSafeSet(PreparedStatement st, TrangThaiHocVu value, int index,
                            SharedSessionContractImplementor session)
            throws HibernateException, SQLException {
        if (value == null) {
            // Types.OTHER để driver không annotate OID varchar; PostgreSQL nhận NULL
            // trên cột ENUM (vẫn hợp lệ).
            st.setNull(index, Types.OTHER);
        } else {
            // Dùng setObject(..., Types.OTHER) thay vì setString():
            // - setString() ép JDBC type = VARCHAR, PostgreSQL báo lỗi cast ENUM = varchar.
            // - setObject(..., Types.OTHER) gửi raw String, driver PostgreSQL nhận diện
            //   đây là ENUM literal (vì columnDefinition = trangthaihocvu) và gán thẳng.
            st.setObject(index, value.getDisplayName(), Types.OTHER);
        }
    }

    // ============================================================
    // Đọc từ ResultSet (JDBC VARCHAR -> Java enum)
    // ============================================================

    @Override
    public TrangThaiHocVu nullSafeGet(ResultSet rs, int position,
                                      SharedSessionContractImplementor session,
                                      Object owner)
            throws HibernateException, SQLException {
        String dbValue = rs.getString(position);
        return fromDbString(dbValue);
    }

    /**
     * Map DB literal (tiếng Việt có dấu) sang Java enum constant.
     *
     * <p>Khớp theo {@code displayName} — nguồn sự thật duy nhất. KHÔNG dùng
     * {@code Enum.valueOf} vì Java constant name không trùng DB literal.</p>
     */
    private TrangThaiHocVu fromDbString(String dbValue) {
        if (dbValue == null) {
            return null;
        }
        for (TrangThaiHocVu e : TrangThaiHocVu.values()) {
            if (e.getDisplayName().equals(dbValue)) {
                return e;
            }
        }
        String validValues = Arrays.stream(TrangThaiHocVu.values())
            .map(TrangThaiHocVu::getDisplayName)
            .collect(Collectors.joining(", "));
        throw new HibernateException(
            "DB trả giá trị TrangThaiHocVu không xác định: \"" + dbValue
                + "\". Các giá trị hợp lệ: [" + validValues + "]");
    }
}
