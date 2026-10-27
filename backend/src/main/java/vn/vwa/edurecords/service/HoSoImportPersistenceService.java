package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.importexcel.PreviewRowData;
import vn.vwa.edurecords.dto.importexcel.SheetPreview;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service chịu trách nhiệm ghi dữ liệu import vào database.
 *
 * <p>Tách riêng khỏi HoSoGiayToImportService để đảm bảo Spring Proxy
 * bắt được @Transactional annotation (tránh self-invocation bypass).
 *
 * <h3>Quy tắc transaction</h3>
 * <ul>
 *   <li>Mỗi sheet SV hoặc HS chạy trong transaction riêng (REQUIRES_NEW).</li>
 *   <li>Sheet GOP chạy trong 1 transaction chung cho cả SV và HS
 *       (SV và HS phải cùng commit hoặc cùng rollback).</li>
 *   <li>Không query trong vòng lặp sau INSERT - dùng batch query.</li>
 * </ul>
 */
@Service
public class HoSoImportPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(HoSoImportPersistenceService.class);

    private final JdbcTemplate jdbcTemplate;

    public HoSoImportPersistenceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ============================================================
    // SHEET SV
    // ============================================================

    /**
     * Ghi 1 sheet SV vào bảng sinhvien.
     * Transaction riêng - nếu fail thì chỉ rollback sheet này.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public int insertSheetSV(SheetPreview sp) {
        if (sp.getRows().isEmpty()) return 0;

        String sql = """
            INSERT INTO sinhvien
                (mssv, ho_ten, ngay_sinh, gioi_tinh, cccd, sdt, email, que_quan,
                 khoa_id, nganh_id, lop_id, khoa_hoc_id, he_dao_tao, trang_thai_hoc_vu, ngay_tao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS trangthaihocvu), ?)
            """;

        List<PreviewRowData> rows = sp.getRows();
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PreviewRowData r = rows.get(i);
                ps.setString(1, r.getString("mssv"));
                ps.setString(2, r.getString("hoTen"));
                ps.setTimestamp(3, parseTimestamp(r.getString("ngaySinh")));
                setNullableString(ps, 4, r.getString("gioiTinh"));
                setNullableString(ps, 5, r.getString("cccd"));
                setNullableString(ps, 6, r.getString("sdt"));
                setNullableString(ps, 7, r.getString("email"));
                setNullableString(ps, 8, r.getString("queQuan"));
                ps.setInt(9, (Integer) r.get("khoaId"));
                ps.setInt(10, (Integer) r.get("nganhId"));
                ps.setInt(11, (Integer) r.get("lopId"));
                ps.setInt(12, (Integer) r.get("khoaHocId"));
                setNullableString(ps, 13, r.getString("heDaoTao"));
                ps.setString(14, r.getString("trangThaiHocVu"));
                ps.setTimestamp(15, Timestamp.valueOf(LocalDateTime.now()));
            }

            @Override
            public int getBatchSize() {
                return rows.size();
            }
        });

        log.info("Đã insert {} sinh viên vào sheet '{}'", rows.size(), sp.getTenSheet());
        return rows.size();
    }

    // ============================================================
    // SHEET HS
    // ============================================================

    /**
     * Ghi 1 sheet HS (hồ sơ giấy tờ) vào bảng ho_so_giay_to và lich_su_nop.
     * Transaction riêng - nếu fail thì chỉ rollback sheet này.
     *
     * <p>Sử dụng batch query thay vì query trong vòng lặp để:
     * <ul>
     *   <li>Tránh N+1 query (500 dòng = 500 query riêng)</li>
     *   <li>Tránh exception nếu dòng cuối không tìm thấy sau UPSERT</li>
     * </ul>
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public int insertSheetHS(SheetPreview sp) {
        if (sp.getRows().isEmpty()) return 0;

        List<PreviewRowData> rows = sp.getRows();
        List<String> maHoSoList = new ArrayList<>();
        List<LocalDateTime> nowList = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            maHoSoList.add(generateMaHoSo());
            nowList.add(LocalDateTime.now());
        }

        // 1. Đọc trạng thái CŨ của các hồ sơ sắp bị ghi đè.
        //    PHẢI đọc TRƯỚC khi UPSERT: sau UPSERT mọi dòng đã mang trạng thái
        //    mới, nên không còn phân biệt được TAO_MOI với CAP_NHAT.
        Map<String, String> oldTrangThaiMap = batchQueryTrangThaiCu(rows);

        // 2. UPSERT batch ho_so_giay_to
        String sqlHs = """
            INSERT INTO ho_so_giay_to
                (ma_ho_so, mssv, ma_loai, trang_thai_nop, ban_goc_ban_sao,
                 file_dinh_kem, vi_tri_luu_kho, ngay_tao)
            VALUES (?, ?, ?, CAST(? AS trangthainop), CAST(? AS loaiban), ?, ?, ?)
            ON CONFLICT (mssv, ma_loai) DO UPDATE SET
                trang_thai_nop = EXCLUDED.trang_thai_nop,
                ban_goc_ban_sao = EXCLUDED.ban_goc_ban_sao,
                file_dinh_kem = EXCLUDED.file_dinh_kem,
                vi_tri_luu_kho = EXCLUDED.vi_tri_luu_kho,
                ngay_cap_nhat = CURRENT_TIMESTAMP
            """;

        jdbcTemplate.batchUpdate(sqlHs, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PreviewRowData r = rows.get(i);
                ps.setString(1, maHoSoList.get(i));
                ps.setString(2, r.getString("mssv"));
                ps.setString(3, r.getString("maLoai"));
                ps.setString(4, r.getString("trangThaiNop"));
                if (r.get("loaiBan") == null) ps.setNull(5, java.sql.Types.VARCHAR);
                else ps.setString(5, r.getString("loaiBan"));
                ps.setString(6, r.getString("fileDinhKem"));
                ps.setString(7, r.getString("viTriLuuKho"));
                ps.setTimestamp(8, Timestamp.valueOf(nowList.get(i)));
            }

            @Override
            public int getBatchSize() {
                return rows.size();
            }
        });

        // 3. Batch query để lấy ma_ho_so THỰC TẾ (thay vì query trong vòng lặp)
        // Xây dựng câu query với tất cả cặp (mssv, ma_loai) trong 1 lần
        List<String> actualMaHoSoList = batchQueryMaHoSo(rows);

        // 4. Batch insert lich_su_nop dùng ma_ho_so THỰC TẾ
        batchInsertLichSuNop(rows, actualMaHoSoList, nowList, oldTrangThaiMap);

        log.info("Đã insert {} hồ sơ giấy tờ vào sheet '{}'", rows.size(), sp.getTenSheet());
        return rows.size();
    }

    /**
     * Ghi 1 sheet GOP: cả SV và HS trong cùng 1 transaction.
     * Nếu SV thành công nhưng HS fail → rollback cả 2.
     * Nếu SV fail → rollback, HS không được ghi.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public int insertSheetGOP(SheetPreview sp) {
        if (sp.getRows().isEmpty()) return 0;

        // Phân loại: SV và HS
        List<PreviewRowData> svRows = new ArrayList<>();
        List<PreviewRowData> hsRows = new ArrayList<>();
        for (PreviewRowData r : sp.getRows()) {
            if ("SV".equals(r.getLoaiDong())) svRows.add(r);
            else if ("HS".equals(r.getLoaiDong())) hsRows.add(r);
        }

        // 1. Insert SV trước (FK constraint: HS tham chiếu SV)
        if (!svRows.isEmpty()) {
            SheetPreview svSheet = new SheetPreview(sp.getTenSheet() + " (SV)", sp.getMode());
            svSheet.setRows(svRows);
            insertSheetSV(svSheet);
        }

        // 2. Insert HS (nếu có lỗi → rollback cả SV đã insert)
        if (!hsRows.isEmpty()) {
            SheetPreview hsSheet = new SheetPreview(sp.getTenSheet() + " (HS)", sp.getMode());
            hsSheet.setRows(hsRows);
            insertSheetHS(hsSheet);
        }

        log.info("Đã insert {} dòng GOP (SV={}, HS={}) vào sheet '{}'",
                sp.getRows().size(), svRows.size(), hsRows.size(), sp.getTenSheet());
        return sp.getRows().size();
    }

    // ============================================================
    // BATCH QUERY - TRÁNH N+1
    // ============================================================

    /**
     * Batch query để lấy ma_ho_so thực tế sau UPSERT.
     * Dùng 1 câu query với IN clause thay vì N câu query trong vòng lặp.
     *
     * <p>Ví dụ: 500 dòng → 1 query thay vì 500 query.
     */
    private List<String> batchQueryMaHoSo(List<PreviewRowData> rows) {
        if (rows.isEmpty()) return new ArrayList<>();

        // Xây dựng placeholders: (?,?), (?,?), ...
        StringBuilder placeholders = new StringBuilder();
        List<Object> params = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) placeholders.append(", ");
            placeholders.append("(?, ?)");
            params.add(rows.get(i).getString("mssv"));
            params.add(rows.get(i).getString("maLoai"));
        }

        String sql = "SELECT mssv, ma_loai, ma_ho_so FROM ho_so_giay_to " +
                "WHERE (mssv, ma_loai) IN (" + placeholders + ")";

        List<String> result = jdbcTemplate.query(sql,
                (ResultSetExtractor<List<String>>) rs -> {
                    // Map (mssv, ma_loai) → ma_ho_so
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    while (rs.next()) {
                        map.put(rs.getString("mssv") + "|" + rs.getString("ma_loai"),
                                rs.getString("ma_ho_so"));
                    }
                    // Trả về theo thứ tự rows
                    List<String> ordered = new ArrayList<>();
                    for (PreviewRowData r : rows) {
                        String key = r.getString("mssv") + "|" + r.getString("maLoai");
                        ordered.add(map.getOrDefault(key, null));
                    }
                    return ordered;
                },
                params.toArray());

        // Kiểm tra: nếu bất kỳ ma_ho_so nào null → có vấn đề với dữ liệu
        for (int i = 0; i < result.size(); i++) {
            if (result.get(i) == null) {
                log.warn("Không tìm thấy ma_ho_so cho dòng {}: mssv={}, maLoai={}",
                        i, rows.get(i).getString("mssv"), rows.get(i).getString("maLoai"));
            }
        }

        return result;
    }

    /**
     * Batch query lấy trạng thái CŨ của các hồ sơ giấy tờ sắp được ghi.
     *
     * <p>Phải gọi TRƯỚC khi UPSERT. Sau khi UPSERT, mọi dòng đã mang trạng
     * thái mới nên không thể phân biệt hồ sơ tạo mới (TAO_MOI) với hồ sơ bị
     * cập nhật (CAP_NHAT).
     *
     * <p>Key của map là {@code mssv|maLoai} — cặp khóa nghiệp vụ (unique
     * constraint {@code (mssv, ma_loai)}) — vì ma_ho_so có thể đổi khi
     * UPSERT ghi đè một hồ sơ đã tồn tại.
     *
     * <p>Hồ sơ không tồn tại thì không có trong map → trạng thái cũ = null →
     * hành động = TAO_MOI.
     */
    private Map<String, String> batchQueryTrangThaiCu(List<PreviewRowData> rows) {
        Map<String, String> oldTrangThaiMap = new HashMap<>();
        if (rows.isEmpty()) return oldTrangThaiMap;

        // Xây dựng placeholders: (?,?), (?,?), ...
        StringBuilder placeholders = new StringBuilder();
        List<Object> params = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) placeholders.append(", ");
            placeholders.append("(?, ?)");
            params.add(rows.get(i).getString("mssv"));
            params.add(rows.get(i).getString("maLoai"));
        }

        String sql = "SELECT mssv, ma_loai, trang_thai_nop::text FROM ho_so_giay_to " +
                "WHERE (mssv, ma_loai) IN (" + placeholders + ")";

        jdbcTemplate.query(sql, (ResultSetExtractor<Void>) rs -> {
            while (rs.next()) {
                oldTrangThaiMap.put(
                        rs.getString("mssv") + "|" + rs.getString("ma_loai"),
                        rs.getString("trang_thai_nop"));
            }
            return null;
        }, params.toArray());

        return oldTrangThaiMap;
    }

    // ============================================================
    // BATCH INSERT LICH SU NOP
    // ============================================================

    /**
     * Batch insert lich_su_nop (audit log).
     * Mỗi hồ sơ giấy tờ tạo 1 dòng log.
     *
     * @param oldTrangThaiMap trạng thái CŨ của hồ sơ, đọc TRƯỚC khi UPSERT.
     *                      Key là {@code mssv|maLoai}, value là trạng thái cũ
     *                      (null nghĩa là hồ sơ mới → hành động TAO_MOI).
     */
    private void batchInsertLichSuNop(List<PreviewRowData> rows, List<String> maHoSoList,
                                      List<LocalDateTime> nowList,
                                      Map<String, String> oldTrangThaiMap) {
        if (rows.isEmpty()) return;

        // Batch insert lich_su_nop
        String sql = """
            INSERT INTO lich_su_nop
                (ma_log, ma_ho_so, mssv, hanh_dong, trang_thai_cu, trang_thai_moi,
                 ghi_chu, nguoi_thuc_hien, thoi_gian)
            VALUES (?, ?, ?, ?, CAST(? AS trangthainop), CAST(? AS trangthainop), ?, ?, ?)
            """;

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PreviewRowData r = rows.get(i);
                String mssv = r.getString("mssv");
                String maLoai = r.getString("maLoai");
                String newTrangThai = r.getString("trangThaiNop");
                String maHoSo = maHoSoList.get(i);

                // Xác định hành động: TAO_MOI hay CAP_NHAT
                // oldTrangThaiMap được đọc TRƯỚC UPSERT, nên null nghĩa là
                // hồ sơ chưa tồn tại → tạo mới.
                String oldTrangThai = oldTrangThaiMap.get(mssv + "|" + maLoai);
                boolean isUpdate = oldTrangThai != null;
                String hanhDong = isUpdate ? "CAP_NHAT" : "TAO_MOI";

                ps.setString(1, generateMaLog());
                ps.setString(2, maHoSo != null ? maHoSo : "");
                ps.setString(3, mssv);
                ps.setString(4, hanhDong);
                if (oldTrangThai == null) ps.setNull(5, java.sql.Types.VARCHAR);
                else ps.setString(5, oldTrangThai);
                ps.setString(6, newTrangThai);
                ps.setString(7, isUpdate ? "Cập nhật từ Excel" : "Import từ Excel");
                ps.setString(8, "system");
                ps.setTimestamp(9, Timestamp.valueOf(nowList.get(i)));
            }

            @Override
            public int getBatchSize() {
                return rows.size();
            }
        });
    }

    // ============================================================
    // HELPER
    // ============================================================

    private Timestamp parseTimestamp(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            if (s.contains("/")) {
                String[] p = s.split("/");
                if (p.length == 3) {
                    int d = Integer.parseInt(p[0].trim());
                    int m = Integer.parseInt(p[1].trim());
                    int y = Integer.parseInt(p[2].trim());
                    return Timestamp.valueOf(LocalDateTime.of(y, m, d, 0, 0));
                }
            }
            return Timestamp.valueOf(LocalDateTime.parse(s));
        } catch (Exception ignored) {
            return null;
        }
    }

    private void setNullableString(PreparedStatement ps, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) ps.setNull(index, java.sql.Types.VARCHAR);
        else ps.setString(index, value);
    }

    private String generateMaHoSo() {
        long ms = System.currentTimeMillis() % 1_000_000_000_000L;
        return "HS" + ms + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String generateMaLog() {
        long ms = System.currentTimeMillis() % 1_000_000_000_000L;
        return "LOG" + ms + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
    }
}
