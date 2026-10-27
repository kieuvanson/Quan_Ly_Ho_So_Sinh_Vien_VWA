package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.response.AuditLogResponse;
import vn.vwa.edurecords.entity.AuditLog;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.AuditLogRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service đọc nhật ký hệ thống ({@code audit_log}) cho màn hình "Lịch sử hoạt động".
 *
 * <p>Chỉ chứa thao tác ĐỌC. Việc ghi audit vẫn thuộc {@link AuditService} để
 * mọi luồng nghiệp vụ ghi chung một chỗ.</p>
 */
@Service
public class AuditLogQueryService {

    /** Tên bảng sinh viên — bản ghi audit loại này liên quan tới thay đổi thông tin SV. */
    public static final String BANG_SINHVIEN = "sinhvien";

    /** Tên bảng phiếu xuất hồ sơ. */
    public static final String BANG_PHIEU = "phieu_xuat_ho_so";

    private final AuditLogRepository auditLogRepository;
    private final SinhVienRepository sinhVienRepository;

    public AuditLogQueryService(AuditLogRepository auditLogRepository,
                                SinhVienRepository sinhVienRepository) {
        this.auditLogRepository = auditLogRepository;
        this.sinhVienRepository = sinhVienRepository;
    }

    /**
     * Lấy danh sách bản ghi audit đã lọc + phân trang.
     *
     * @param bang          tên bảng bị tác động (null = tất cả)
     * @param bangKhac      tên bảng cần LOẠI TRỪ (null = không loại trừ) —
     *                     dùng cho tab "Nhật ký hệ thống" để không trùng với
     *                     tab "Thay đổi thông tin sinh viên" (bang = 'sinhvien').
     * @param hanhDong      mã hành động (null = tất cả)
     * @param keyword       từ khoá (null/rỗng = bỏ qua)
     * @param nguoiThucHien username cán bộ thực hiện (null = tất cả)
     * @param fromDate      ngày bắt đầu yyyy-MM-dd (null = bỏ qua)
     * @param toDate        ngày kết thúc yyyy-MM-dd (null = bỏ qua)
     * @param page          trang 0-based
     * @param size          số bản ghi mỗi trang
     */
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String bang, String bangKhac, String hanhDong,
                                         String keyword, String nguoiThucHien,
                                         String fromDate, String toDate,
                                         int page, int size) {
        String b = trimToNull(bang);
        String bKhac = trimToNull(bangKhac);
        String h = trimToNull(hanhDong);
        String k = trimToNull(keyword);
        String user = trimToNull(nguoiThucHien);
        String from = trimToNull(fromDate);
        String to = trimToNull(toDate);

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));

        long total = auditLogRepository.countByFilters(b, bKhac, h, k, user, from, to);
        if (total == 0) {
            return new PageImpl<>(List.of(), PageRequest.of(safePage, safeSize), total);
        }

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<AuditLog> logs = auditLogRepository.findByFilters(b, bKhac, h, k, user, from, to, pageable);

        // Gom MSSV cần tra cứu tên sinh viên → 1 query cho tất cả bản ghi
        // (findAllById), tránh N+1 query khi hiển thị danh sách.
        Map<String, String> tenSinhVien = new HashMap<>();
        List<String> mssvList = logs.getContent().stream()
                .filter(l -> BANG_SINHVIEN.equals(l.getBang()))
                .map(AuditLog::getKhoaChinh)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .toList();
        if (!mssvList.isEmpty()) {
            sinhVienRepository.findAllById(mssvList)
                    .forEach(sv -> tenSinhVien.put(sv.getMssv(), sv.getHoTen()));
        }

        return logs.map(log -> toResponse(log, tenSinhVien));
    }

    /** Lấy chi tiết một bản ghi audit theo id. */
    @Transactional(readOnly = true)
    public Optional<AuditLogResponse> getById(Long id) {
        return auditLogRepository.findById(id).map(log -> {
            Map<String, String> tenSinhVien = new HashMap<>();
            if (BANG_SINHVIEN.equals(log.getBang()) && log.getKhoaChinh() != null) {
                sinhVienRepository.findById(log.getKhoaChinh())
                        .map(SinhVien::getHoTen)
                        .ifPresent(hoTen -> tenSinhVien.put(log.getKhoaChinh(), hoTen));
            }
            return toResponse(log, tenSinhVien);
        });
    }

    /** Ném 404 nếu không tìm thấy bản ghi. */
    @Transactional(readOnly = true)
    public AuditLogResponse requireById(Long id) {
        return getById(id).orElseThrow(() -> new ResourceNotFoundException(
                "AUDIT_LOG_NOT_FOUND", "Không tìm thấy bản ghi nhật ký hệ thống id=" + id));
    }

    private AuditLogResponse toResponse(AuditLog log, Map<String, String> tenSinhVien) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setHanhDong(log.getHanhDong());
        response.setBang(log.getBang());
        response.setKhoaChinh(log.getKhoaChinh());
        response.setTruongThayDoi(log.getTruongThayDoi());
        response.setGiaTriCu(log.getGiaTriCu());
        response.setGiaTriMoi(log.getGiaTriMoi());
        response.setNguoiThucHien(log.getNguoiThucHien());
        response.setThoiGian(log.getThoiGian());

        if (BANG_SINHVIEN.equals(log.getBang()) && log.getKhoaChinh() != null) {
            response.setMssv(log.getKhoaChinh());
            response.setHoTenSinhVien(tenSinhVien.get(log.getKhoaChinh()));
        }

        return response;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
