package vn.vwa.edurecords.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.LichSuNopResponse;
import vn.vwa.edurecords.service.LichSuNopService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lich-su-nop")
public class LichSuNopController {

    private final LichSuNopService lichSuNopService;

    public LichSuNopController(LichSuNopService lichSuNopService) {
        this.lichSuNopService = lichSuNopService;
    }

    /**
     * GET /api/lich-su-nop?mssv=XXX&page=0&size=20
     * Lấy lịch sử nộp theo MSSV (ADMIN).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getByMssv(
            @RequestParam String mssv,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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
     * Lấy lịch sử nộp theo mã hồ sơ (ADMIN).
     */
    @GetMapping("/ho-so/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LichSuNopResponse>>> getByMaHoSo(@PathVariable String maHoSo) {
        List<LichSuNopResponse> result = lichSuNopService.getByMaHoSo(maHoSo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/lich-su-nop/{maLog}
     * Lấy chi tiết một bản ghi lịch sử (ADMIN).
     */
    @GetMapping("/{maLog}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LichSuNopResponse>> getByMaLog(@PathVariable String maLog) {
        return lichSuNopService.getByMaLog(maLog)
                .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy bản ghi")));
    }
}