package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.service.HoSoGiayToService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ho-so-giay-to")
@CrossOrigin(origins = "*")
public class HoSoGiayToController {

    private final HoSoGiayToService hoSoGiayToService;
    private final JwtService jwtService;

    public HoSoGiayToController(HoSoGiayToService hoSoGiayToService, JwtService jwtService) {
        this.hoSoGiayToService = hoSoGiayToService;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/ho-so-giay-to
     * Lấy danh sách hồ sơ giấy tờ
     * ADMIN: xem tất cả sinh viên (query theo mssv)
     * STAFF: chỉ xem giấy tờ của chính mình
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<HoSoGiayTo>>> getAll(
            @RequestParam(required = false) String mssv,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        // STAFF: chỉ xem giấy tờ của chính mình
        if ("STAFF".equals(role)) {
            if (mssvFromToken == null || mssvFromToken.isEmpty()) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "NO_MSSV", "Tài khoản Staff chưa được gán MSSV. Liên hệ Admin."));
            }
            // Staff chỉ được xem giấy tờ của mình
            if (mssv != null && !mssv.equals(mssvFromToken)) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "FORBIDDEN", "Bạn chỉ có thể xem giấy tờ của chính mình"));
            }
            List<HoSoGiayTo> result = hoSoGiayToService.getByMssv(mssvFromToken);
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        // ADMIN: xem tất cả, có thể filter theo mssv
        if (mssv != null && !mssv.isEmpty()) {
            List<HoSoGiayTo> result = hoSoGiayToService.getByMssv(mssv);
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "MISSING_PARAM", "Thiếu tham số mssv"));
    }

    /**
     * GET /api/ho-so-giay-to/{maHoSo}
     * Chi tiết một hồ sơ giấy tờ
     * ADMIN: xem bất kỳ
     * STAFF: chỉ xem của chính mình
     */
    @GetMapping("/{maHoSo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> getByMaHoSo(
            @PathVariable String maHoSo,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        return hoSoGiayToService.getByMaHoSo(maHoSo)
                .map(hoSo -> {
                    // STAFF: kiểm tra hồ sơ thuộc về mình
                    if ("STAFF".equals(role) && !hoSo.getMssv().equals(mssvFromToken)) {
                        return ResponseEntity.status(403).body(
                                ApiResponse.<HoSoGiayTo>error(403, "FORBIDDEN", "Bạn chỉ có thể xem giấy tờ của chính mình"));
                    }
                    return ResponseEntity.ok(ApiResponse.success(hoSo));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy hồ sơ giấy tờ")));
    }

    /**
     * GET /api/ho-so-giay-to/stats
     * Thống kê giấy tờ theo mssv
     * ADMIN: xem thống kê của bất kỳ sinh viên nào
     * STAFF: chỉ xem thống kê của chính mình
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @RequestParam String mssv,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String role = jwtService.extractRole(token);
        String mssvFromToken = jwtService.extractMssv(token);

        // STAFF: chỉ xem thống kê của chính mình
        if ("STAFF".equals(role)) {
            if (!mssv.equals(mssvFromToken)) {
                return ResponseEntity.status(403).body(
                        ApiResponse.error(403, "FORBIDDEN", "Bạn chỉ có thể xem thống kê của chính mình"));
            }
        }

        List<HoSoGiayTo> hoSos = hoSoGiayToService.getByMssv(mssv);
        long total = hoSos.size();
        long daNop = hoSos.stream().filter(h -> "Đã nộp".equals(h.getTrangThaiNop())).count();
        long chuaNop = hoSos.stream().filter(h -> "Chưa nộp".equals(h.getTrangThaiNop())).count();
        long thieu = hoSos.stream().filter(h -> "Thiếu".equals(h.getTrangThaiNop())).count();
        long khongHopLe = hoSos.stream().filter(h -> "Không hợp lệ".equals(h.getTrangThaiNop())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("mssv", mssv);
        stats.put("tongSo", total);
        stats.put("daNop", daNop);
        stats.put("chuaNop", chuaNop);
        stats.put("thieu", thieu);
        stats.put("khongHopLe", khongHopLe);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/ho-so-giay-to
     * Tạo hồ sơ giấy tờ mới
     * Chỉ ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> create(
            @RequestParam String mssv,
            @RequestParam String maLoai,
            @Valid @RequestBody HoSoGiayToRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

        HoSoGiayTo created = hoSoGiayToService.create(mssv, maLoai, request, username);
        return ResponseEntity.ok(ApiResponse.success("Tạo hồ sơ giấy tờ thành công", created));
    }

    /**
     * PUT /api/ho-so-giay-to/{maHoSo}
     * Cập nhật hồ sơ giấy tờ
     * Chỉ ADMIN
     */
    @PutMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> update(
            @PathVariable String maHoSo,
            @RequestBody HoSoGiayToRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

        HoSoGiayTo updated = hoSoGiayToService.update(maHoSo, request, username);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ giấy tờ thành công", updated));
    }

    /**
     * PATCH /api/ho-so-giay-to/{maHoSo}/trang-thai
     * Cập nhật trạng thái nộp giấy tờ (tick/bỏ tick)
     * ADMIN: cập nhật bất kỳ giấy tờ nào
     */
    @PatchMapping("/{maHoSo}/trang-thai")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> capNhatTrangThai(
            @PathVariable String maHoSo,
            @RequestParam String trangThaiMoi,
            @RequestParam(required = false) String ghiChu,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

        HoSoGiayTo updated = hoSoGiayToService.capNhatTrangThaiNop(maHoSo, trangThaiMoi, ghiChu, username);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", updated));
    }

    /**
     * DELETE /api/ho-so-giay-to/{maHoSo}
     * Xóa hồ sơ giấy tờ
     * Chỉ ADMIN
     */
    @DeleteMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maHoSo) {
        hoSoGiayToService.delete(maHoSo);
        return ResponseEntity.ok(ApiResponse.success("Xóa hồ sơ giấy tờ thành công", (Void) null));
    }
}
