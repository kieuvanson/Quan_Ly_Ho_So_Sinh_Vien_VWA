package vn.vwa.edurecords.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.service.LoaiGiayToService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loai-giay-to")
public class LoaiGiayToController {

    private final LoaiGiayToService loaiGiayToService;

    public LoaiGiayToController(LoaiGiayToService loaiGiayToService) {
        this.loaiGiayToService = loaiGiayToService;
    }

    /**
     * GET /api/loai-giay-to
     * Lấy danh sách tất cả loại giấy tờ đang sử dụng (ADMIN)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LoaiGiayTo>>> getAll() {
        List<LoaiGiayTo> result = loaiGiayToService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/loai-giay-to/bat-buoc
     * Lấy danh sách loại giấy tờ bắt buộc (ADMIN)
     */
    @GetMapping("/bat-buoc")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LoaiGiayTo>>> getAllBatBuoc() {
        List<LoaiGiayTo> result = loaiGiayToService.getAllActiveBatBuoc();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/loai-giay-to/{maLoai}
     * Lấy chi tiết một loại giấy tờ theo mã (ADMIN)
     */
    @GetMapping("/{maLoai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoaiGiayTo>> getByMaLoai(@PathVariable String maLoai) {
        return loaiGiayToService.getByMaLoai(maLoai)
                .map(lgt -> ResponseEntity.ok(ApiResponse.success(lgt)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy loại giấy tờ với mã: " + maLoai)));
    }

    /**
     * GET /api/loai-giay-to/stats
     * Thống kê số lượng loại giấy tờ (ADMIN)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("tongSoLoai", loaiGiayToService.countActive());
        stats.put("soLoaiBatBuoc", loaiGiayToService.countActiveBatBuoc());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
