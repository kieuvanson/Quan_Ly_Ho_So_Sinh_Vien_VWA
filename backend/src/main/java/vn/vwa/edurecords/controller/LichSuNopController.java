package vn.vwa.edurecords.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.LichSuNopResponse;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.service.LichSuNopService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lich-su-nop")
@CrossOrigin(origins = "*")
public class LichSuNopController {

    private final LichSuNopService lichSuNopService;
    private final JwtService jwtService;

    public LichSuNopController(LichSuNopService lichSuNopService, JwtService jwtService) {
        this.lichSuNopService = lichSuNopService;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/lich-su-nop
     * Lấy lịch sử nộp theo MSSV
     * ADMIN: xem lịch sử của bất kỳ sinh viên nào
     * STAFF: chỉ xem lịch sử của chính mình
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getByMssv(
            @RequestParam String mssv,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        // STAFF: chỉ xem lịch sử của chính mình
        if ("STAFF".equals(role)) {
            if (!mssv.equals(mssvFromToken)) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "FORBIDDEN", "Bạn chỉ có thể xem lịch sử của chính mình"));
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<LichSuNopResponse> pageResult = lichSuNopService.getByMssv(mssv, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("content", pageResult.getContent());
        result.put("page", pageResult.getNumber());
        result.put("size", pageResult.getSize());
        result.put("totalElements", pageResult.getTotalElements());
        result.put("totalPages", pageResult.getTotalPages());
        result.put("first", pageResult.isFirst());
        result.put("last", pageResult.isLast());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/lich-su-nop/ho-so/{maHoSo}
     * Lấy lịch sử nộp theo mã hồ sơ giấy tờ
     */
    @GetMapping("/ho-so/{maHoSo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<LichSuNopResponse>>> getByMaHoSo(
            @PathVariable String maHoSo,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        List<LichSuNopResponse> result = lichSuNopService.getByMaHoSo(maHoSo);

        // STAFF: kiểm tra hồ sơ thuộc về mình
        if ("STAFF".equals(role)) {
            if (result.isEmpty()) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "FORBIDDEN", "Bạn không có quyền xem hồ sơ này"));
            }
            String firstMssv = result.get(0).getMssv();
            if (!firstMssv.equals(mssvFromToken)) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "FORBIDDEN", "Bạn chỉ có thể xem lịch sử của chính mình"));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/lich-su-nop/{maLog}
     * Lấy chi tiết một bản ghi lịch sử
     */
    @GetMapping("/{maLog}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<LichSuNopResponse>> getByMaLog(
            @PathVariable String maLog,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        // Lấy tất cả lịch sử để tìm bản ghi
        List<LichSuNopResponse> allHistory = lichSuNopService.getByMssvAll(mssvFromToken);

        // Tìm bản ghi cụ thể
        LichSuNopResponse found = allHistory.stream()
                .filter(r -> r.getMaLog().equals(maLog))
                .findFirst()
                .orElse(null);

        if (found == null) {
            return ResponseEntity.status(404).body(
                    ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy bản ghi"));
        }

        // STAFF: kiểm tra hồ sơ thuộc về mình
        if ("STAFF".equals(role) && !found.getMssv().equals(mssvFromToken)) {
            return ResponseEntity.status(403).body(
                    ApiResponse.error(403, "FORBIDDEN", "Bạn chỉ có thể xem lịch sử của chính mình"));
        }

        return ResponseEntity.ok(ApiResponse.success(found));
    }
}
