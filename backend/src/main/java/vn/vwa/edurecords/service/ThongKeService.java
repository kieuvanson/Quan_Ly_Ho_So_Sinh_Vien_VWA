package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.response.ThongKeHoSoResponse;
import vn.vwa.edurecords.dto.response.ThongKeMuonTraResponse;
import vn.vwa.edurecords.dto.response.ThongKeNganhResponse;
import vn.vwa.edurecords.dto.response.ThongKeNganhResponse.NganhItem;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service xử lý các API thống kê tổng hợp cho trang Báo cáo - Thống kê.
 * 
 * <p>Sau V4, bảng sinhvien không còn cột VARCHAR nganh/khoa/lop/khoa_nam_nhap_hoc.
 * Các trường này được thay bằng FK *_id (nganh_id, khoa_hoc_id...).
 * Cần JOIN với bảng danh mục để lấy tên.</p>
 */
@Service
public class ThongKeService {

    private static final Logger log = LoggerFactory.getLogger(ThongKeService.class);

    private final JdbcTemplate jdbcTemplate;
    private final SinhVienRepository sinhVienRepository;

    public ThongKeService(JdbcTemplate jdbcTemplate, SinhVienRepository sinhVienRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.sinhVienRepository = sinhVienRepository;
    }

    /**
     * Thống kê sinh viên theo ngành, có filter theo khóa học.
     *
     * <p>Quy tắc (sau V4 - schema mới):
     * <ul>
     *   <li>Đếm sinh viên theo tên ngành từ bảng nganh (JOIN qua sinhvien.nganh_id).</li>
     *   <li>Nếu có khoaHocId → filter theo sinhvien.khoa_hoc_id.</li>
     *   <li>Tỷ lệ tính trên tổng sinh viên trong phạm vi lọc hiện tại.</li>
     *   <li>Tổng hệ thống luôn = tổng tất cả sinh viên (không filter).</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public ThongKeNganhResponse thongKeSinhVienTheoNganh(Integer khoaHocId) {
        log.info("Thống kê sinh viên theo ngành, khoaHocId={}", khoaHocId);

        // Tổng sinh viên trong phạm vi lọc
        String countInScopeSql;
        List<Object> countParams = new ArrayList<>();
        if (khoaHocId != null) {
            countInScopeSql = "SELECT COUNT(*) FROM sinhvien WHERE khoa_hoc_id = ?";
            countParams.add(khoaHocId);
        } else {
            countInScopeSql = "SELECT COUNT(*) FROM sinhvien";
        }
        long tongSoTrongLoc = jdbcTemplate.queryForObject(countInScopeSql, Long.class, countParams.toArray());

        // Tổng hệ thống (luôn = toàn bộ sinh viên)
        long tongSoHeThong = sinhVienRepository.count();

        // Query thống kê theo ngành - JOIN với bảng nganh (schema mới sau V4)
        String sql;
        List<Object> params = new ArrayList<>();
        if (khoaHocId != null) {
            sql = """
                SELECT n.ten_nganh, COUNT(*) as so_luong
                FROM sinhvien s
                JOIN nganh n ON s.nganh_id = n.id
                WHERE s.khoa_hoc_id = ?
                GROUP BY n.ten_nganh
                ORDER BY so_luong DESC
                """;
            params.add(khoaHocId);
        } else {
            sql = """
                SELECT n.ten_nganh, COUNT(*) as so_luong
                FROM sinhvien s
                JOIN nganh n ON s.nganh_id = n.id
                GROUP BY n.ten_nganh
                ORDER BY so_luong DESC
                """;
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());

        List<NganhItem> nganhItems = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String tenNganh = (String) row.get("ten_nganh");
            long soLuong = ((Number) row.get("so_luong")).longValue();
            double tyLe = 0.0;
            if (tongSoTrongLoc > 0) {
                tyLe = BigDecimal.valueOf(soLuong * 100.0 / tongSoTrongLoc)
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            nganhItems.add(new NganhItem(tenNganh, tenNganh, soLuong, tyLe));
        }

        log.info("Thống kê ngành: {} ngành, tổng trong loc={}, tổng hệ thống={}",
                nganhItems.size(), tongSoTrongLoc, tongSoHeThong);

        return new ThongKeNganhResponse(nganhItems, tongSoTrongLoc, tongSoHeThong);
    }

    /**
     * Thống kê hồ sơ toàn hệ thống.
     *
     * <p>Quy tắc nghiệp vụ:
     * <ul>
     *   <li>Chỉ 8 giấy tờ bắt buộc (GT01-GT08) được tính vào điều kiện "đầy đủ".</li>
     *   <li>Trạng thái hợp lệ để tính là "Đã nộp".</li>
     *   <li>Hồ sơ "đầy đủ" = sinh viên có đủ 8/8 giấy tờ bắt buộc với trạng thái "Đã nộp".</li>
     *   <li>Hồ sơ "còn thiếu" = sinh viên còn thiếu ít nhất 1 giấy tờ bắt buộc.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public ThongKeHoSoResponse thongKeHoSo() {
        log.info("Thống kê hồ sơ toàn hệ thống");

        // Tổng sinh viên
        long tongSoSinhVien = sinhVienRepository.count();

        // Đếm sinh viên có đủ 8 giấy tờ bắt buộc với trạng thái "Đã nộp"
        // Đếm số loại giấy tờ bắt buộc "Đã nộp" theo MSSV, lọc những SV có đủ 8 loại
        String sql = """
            SELECT COUNT(DISTINCT mssv) as so_sv_day_du
            FROM ho_so_giay_to
            WHERE ma_loai IN ('GT01', 'GT02', 'GT03', 'GT04', 'GT05', 'GT06', 'GT07', 'GT08')
              AND trang_thai_nop = CAST('Đã nộp' AS trangthainop)
              AND mssv IN (
                SELECT mssv
                FROM ho_so_giay_to
                WHERE ma_loai IN ('GT01', 'GT02', 'GT03', 'GT04', 'GT05', 'GT06', 'GT07', 'GT08')
                GROUP BY mssv
                HAVING COUNT(*) = 8
              )
            """;

        Long hoSoDayDu = jdbcTemplate.queryForObject(sql, Long.class);
        if (hoSoDayDu == null) hoSoDayDu = 0L;

        // Hồ sơ còn thiếu = tổng - đầy đủ
        long hoSoConThieu = tongSoSinhVien - hoSoDayDu;
        if (hoSoConThieu < 0) hoSoConThieu = 0;

        log.info("Thống kê hồ sơ: tongSo={}, dayDu={}, conThieu={}",
                tongSoSinhVien, hoSoDayDu, hoSoConThieu);

        return new ThongKeHoSoResponse(tongSoSinhVien, hoSoDayDu, hoSoConThieu, 8);
    }

    /**
     * Thống kê mượn/trả hồ sơ toàn hệ thống.
     *
     * <p>Quy tắc:
     * <ul>
     *   <li>Chỉ đếm phiếu "Mượn tạm thời" (loai_phieu = 'Mượn tạm thời').</li>
     *   <li>Đang mượn: trang_thai = 'Đang mượn'.</li>
     *   <li>Đã trả: trang_thai = 'Đã trả'.</li>
     *   <li>Quá hạn: trang_thai = 'Quá hạn'.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public ThongKeMuonTraResponse thongKeMuonTra() {
        log.info("Thống kê mượn/trả hồ sơ");

        // Đang mượn
        String sqlDangMuon = """
            SELECT COUNT(*) FROM phieu_xuat_ho_so
            WHERE loai_phieu = CAST('Mượn tạm thời' AS loaiphieu)
              AND trang_thai = CAST('Đang mượn' AS trangthaiphieu)
            """;
        Long dangMuon = jdbcTemplate.queryForObject(sqlDangMuon, Long.class);
        if (dangMuon == null) dangMuon = 0L;

        // Đã trả
        String sqlDaTra = """
            SELECT COUNT(*) FROM phieu_xuat_ho_so
            WHERE loai_phieu = CAST('Mượn tạm thời' AS loaiphieu)
              AND trang_thai = CAST('Đã trả' AS trangthaiphieu)
            """;
        Long daTra = jdbcTemplate.queryForObject(sqlDaTra, Long.class);
        if (daTra == null) daTra = 0L;

        // Quá hạn
        String sqlQuaHan = """
            SELECT COUNT(*) FROM phieu_xuat_ho_so
            WHERE loai_phieu = CAST('Mượn tạm thời' AS loaiphieu)
              AND trang_thai = CAST('Quá hạn' AS trangthaiphieu)
            """;
        Long quaHan = jdbcTemplate.queryForObject(sqlQuaHan, Long.class);
        if (quaHan == null) quaHan = 0L;

        log.info("Thống kê mượn/trả: dangMuon={}, daTra={}, quaHan={}", dangMuon, daTra, quaHan);

        return new ThongKeMuonTraResponse(dangMuon, daTra, quaHan);
    }
}
