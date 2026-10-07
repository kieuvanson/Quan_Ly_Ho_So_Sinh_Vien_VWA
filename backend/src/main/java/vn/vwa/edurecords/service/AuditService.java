package vn.vwa.edurecords.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.vwa.edurecords.entity.AuditLog;
import vn.vwa.edurecords.repository.AuditLogRepository;

/**
 * Service ghi audit log mọi thay đổi nghiệp vụ.
 * Theo AGENTS.md mục 5: "Mọi thay đổi trạng thái phiếu hoặc hồ sơ
 * phải ghi Lịch sự & Audit, không ghi đè dữ liệu cũ."
 *
 * Pattern: gọi log() trong cùng transaction với thao tác ghi DB,
 * đảm bảo audit và dữ liệu nghiệp vụ commit cùng nhau.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /** Ghi 1 dòng audit — nguoiThucHien tự lấy từ SecurityContext. */
    public AuditLog log(String hanhDong, String bang, String khoaChinh,
                       String truongThayDoi, String giaTriCu, String giaTriMoi) {
        return log(hanhDong, bang, khoaChinh, truongThayDoi, giaTriCu, giaTriMoi, currentUsername());
    }

    /** Ghi 1 dòng audit với nguoiThucHien chỉ định (vd: scheduled job 'system'). */
    public AuditLog log(String hanhDong, String bang, String khoaChinh,
                       String truongThayDoi, String giaTriCu, String giaTriMoi,
                       String nguoiThucHien) {
        AuditLog log = new AuditLog(hanhDong, bang, khoaChinh, truongThayDoi,
                giaTriCu, giaTriMoi, nguoiThucHien);
        return auditLogRepository.save(log);
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return "system";
        }
        return auth.getName();
    }
}