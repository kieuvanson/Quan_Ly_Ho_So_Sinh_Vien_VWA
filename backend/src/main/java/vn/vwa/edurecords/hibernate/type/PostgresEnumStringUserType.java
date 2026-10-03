package vn.vwa.edurecords.hibernate.type;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Objects;

/**
 * Hibernate UserType generic map {@code String} ↔ PostgreSQL ENUM column.
 *
 * <h3>Mục đích</h3>
 * Dùng cho cột DB kiểu ENUM (vd {@code trangthainop}, {@code loaiban},
 * {@code loaiphieu}, {@code trangthaiphieu}) mà entity muốn giữ kiểu Java là
 * {@code String} (không phải enum Java). Lý do giữ String:
 * <ul>
 *   <li>Field này cũng được dùng trong DTO request/response (frontend gửi String tiếng Việt).</li>
 *   <li>Tránh phải tạo Java enum mới cho mỗi cột ENUM chỉ để vẽ map.</li>
 * </ul>
 *
 * <h3>Cách dùng</h3>
 * <pre>
 * {@code
 * @Type(PostgresEnumStringUserType.class)
 * @Column(name = "trang_thai_nop", nullable = false, columnDefinition = "trangthainop")
 * private String trangThaiNop = "Chưa nộp";
 * }
 * </pre>
 *
 * <h3>Tại sao cần class này</h3>
 * <ul>
 *   <li>Hibernate mặc định gọi {@code setString()} → JDBC type = VARCHAR
 *       → PostgreSQL báo: <em>"column X is of type Y but expression is of type character varying"</em>.</li>
 *   <li>{@code @JdbcTypeCode(SqlTypes.NAMED_ENUM)} chỉ dùng được với enum field,
 *       không phải String field.</li>
 *   <li>Giải pháp: {@code setObject(index, value, Types.OTHER)} gửi raw String qua
 *       driver PostgreSQL — driver sẽ nhận diện đây là ENUM literal (vì
 *       columnDefinition = enum) và không báo lỗi.</li>
 * </ul>
 */
public class PostgresEnumStringUserType implements UserType<String> {

    @Override
    public int getSqlType() {
        // KHÔNG dùng Types.VARCHAR — driver sẽ gửi kiểu VARCHAR. Dùng Types.OTHER
        // để driver xử lý theo columnDefinition (ENUM literal).
        return Types.OTHER;
    }

    @Override
    public Class<String> returnedClass() {
        return String.class;
    }

    @Override
    public boolean equals(String x, String y) {
        return Objects.equals(x, y);
    }

    @Override
    public int hashCode(String x) {
        return Objects.hashCode(x);
    }

    @Override
    public String deepCopy(String value) {
        return value; // String immutable
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(String value) {
        return value;
    }

    @Override
    public String assemble(Serializable cached, Object owner) {
        return cached == null ? null : cached.toString();
    }

    // ============================================================
    // Java -> JDBC (String literal -> ENUM column)
    // ============================================================

    @Override
    public void nullSafeSet(PreparedStatement st, String value, int index,
                            SharedSessionContractImplementor session)
            throws HibernateException, SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            // Dùng Types.OTHER + setObject(String) → driver PostgreSQL nhận diện
            // ENUM literal (đã khai báo columnDefinition), không ép VARCHAR.
            st.setObject(index, value, Types.OTHER);
        }
    }

    // ============================================================
    // JDBC -> Java (ENUM column -> String literal)
    // ============================================================

    @Override
    public String nullSafeGet(ResultSet rs, int position,
                              SharedSessionContractImplementor session,
                              Object owner)
            throws HibernateException, SQLException {
        return rs.getString(position);
    }
}